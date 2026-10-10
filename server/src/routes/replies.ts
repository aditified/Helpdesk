import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import { validate } from "../lib/validate";
import { parseId } from "../lib/parse-id";
import { generateTextWithFallback } from "../lib/ai-model";
import { createReplySchema, polishReplySchema } from "core/schemas/replies.ts";
import prisma from "../db";
import { sendEmailJob } from "../lib/send-email";
import Sentry from "../lib/sentry";
import { Role } from "core/constants/role.ts";
import { broadcastSSE } from "../lib/sse";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const ticketId = parseId(req.params.ticketId);
  if (!ticketId) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (req.user.role === Role.agent && ticket.assignedToId !== req.user.id) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.reply.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });

  res.json({ replies });
});

router.post("/", requireAuth, async (req, res) => {
  const ticketId = parseId(req.params.ticketId);
  if (!ticketId) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const data = validate(createReplySchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (req.user.role === Role.agent && ticket.assignedToId !== req.user.id) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const reply = await prisma.reply.create({
    data: {
      body: data.body,
      senderType: "agent",
      ticketId,
      userId: req.user.id,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  broadcastSSE({
    type: "reply:created",
    data: {
      ticketId,
      replyId: reply.id,
      senderType: "agent",
      senderName: req.user.name,
      body: data.body,
    },
  });

  await sendEmailJob({
    to: ticket.senderEmail,
    subject: `Re: ${ticket.subject}`,
    body: data.body,
  });

  res.status(201).json(reply);
});

router.post("/summarize", requireAuth, async (req, res) => {
  try {
    const ticketId = parseId(req.params.ticketId);
    if (!ticketId) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (req.user.role === Role.agent && ticket.assignedToId !== req.user.id) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const replies = await prisma.reply.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true } } },
    });

    const conversation = replies
      .map((r) => {
        const sender =
          r.senderType === "agent" ? (r.user?.name ?? "Agent") : ticket.senderName;
        return `${sender}: ${r.body}`;
      })
      .join("\n\n");

    const { text } = await generateTextWithFallback({
      system:
        "You are a helpful assistant that summarizes support ticket conversations. " +
        "Provide a clear, concise summary that captures the customer's issue, any actions taken, and the current status. " +
        "Keep the summary to 2-4 sentences. Return only the summary with no preamble.",
      prompt:
        `Subject: ${ticket.subject}\n\n` +
        `Customer message:\n${ticket.body}\n\n` +
        (conversation ? `Conversation:\n${conversation}` : "No replies yet."),
    });

    res.json({ summary: text });
  } catch (error: any) {
    console.error("[Summarize] Error generating summary:", error?.message || error);
    Sentry.captureException(error, { tags: { route: "/summarize" } });

    if (
      error?.statusCode === 429 ||
      error?.message?.includes("quota") ||
      error?.message?.includes("rate limit")
    ) {
      res.status(429).json({
        error:
          "Gemini rate limit exceeded. The free tier allows 15 requests/min. Please wait ~30 seconds and click Summarize again.",
      });
      return;
    }

    res.status(500).json({ error: error?.message || "Failed to generate summary" });
  }
});

router.post("/polish", requireAuth, async (req, res) => {
  try {
    const ticketId = parseId(req.params.ticketId);
    if (!ticketId) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const data = validate(polishReplySchema, req.body, res);
    if (!data) return;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (req.user.role === Role.agent && ticket.assignedToId !== req.user.id) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const agentName = req.user.name;
    const customerName = ticket.senderName.split(" ")[0];

    const { text } = await generateTextWithFallback({
      system:
        "You are a helpful writing assistant for a customer support team. " +
        "Improve the given reply for clarity, professional tone, and grammar. " +
        "Preserve the original meaning and keep the response concise. " +
        "Return only the improved text with no preamble or explanation. " +
        `Address the customer by their name: ${customerName}. ` +
        `End the reply with a sign-off using the agent's name: ${agentName}, and include the link https://aditimaurya.com on its own line after the sign-off.`,
      prompt: data.body,
    });

    res.json({ body: text });
  } catch (error: any) {
    console.error("[Polish] Error polishing reply:", error?.message || error);
    Sentry.captureException(error, { tags: { route: "/polish" } });

    if (
      error?.statusCode === 429 ||
      error?.message?.includes("quota") ||
      error?.message?.includes("rate limit")
    ) {
      res.status(429).json({
        error:
          "Gemini rate limit exceeded. Please wait a moment and try again.",
      });
      return;
    }

    res.status(500).json({ error: error?.message || "Failed to polish reply" });
  }
});

export default router;
