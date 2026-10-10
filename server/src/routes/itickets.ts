import { Router } from "express";
import prisma from "../db";
import { requireAuth } from "../middleware/require-auth";
import { broadcastSSE } from "../lib/sse";
import { generateTextWithFallback } from "../lib/ai-model";
import { getInstagramRecipientId, sendInstagramDirectMessage } from "../lib/instagram";
import type { Prisma } from "../generated/prisma/client";

const router = Router();

function formatITicket(t: any) {
  return {
    id: t.id,
    channel: t.channel,
    username: t.username,
    displayName: t.displayName,
    subject: t.subject,
    avatar: t.avatar,
    customerDetails: {
      bio: t.bio,
      followerCount: t.followerCount,
      isVerified: t.isVerified,
      connectedSince: t.connectedSince,
      profileUrl: t.profileUrl,
    },
    category: t.category,
    priority: t.priority,
    status: t.status,
    aiStatus: t.aiStatus,
    aiConfidence: t.aiConfidence,
    aiSummary: t.aiSummary,
    suggestedReply: t.suggestedReply,
    sentiment: t.sentiment,
    unread: t.unread,
    assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
    lastMessage: t.lastMessage,
    lastMessageAt: t.lastMessageAt?.toISOString?.() ?? t.lastMessageAt,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
    updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
    escalationReason: t.escalationReason,
    messages: (t.messages ?? []).map((m: any) => ({
      id: m.id,
      ticketId: m.ticketId,
      senderType: m.senderType,
      senderName: m.senderName,
      senderUsername: m.senderUsername,
      senderAvatar: m.senderAvatar,
      text: m.text,
      timestamp: m.timestamp?.toISOString?.() ?? m.timestamp,
      isAiGenerated: m.isAiGenerated,
      aiConfidence: m.aiConfidence,
    })),
  };
}

// GET /api/i-tickets/stats - Aggregated stats for dashboard and header
router.get("/stats", async (_req, res) => {
  try {
    const totalITickets = await prisma.iTicket.count();
    const aiResolvedCount = await prisma.iTicket.count({
      where: { aiStatus: "ai_resolved" },
    });
    const awaitingReply = await prisma.iTicket.count({
      where: { aiStatus: "awaiting_reply" },
    });
    const escalated = await prisma.iTicket.count({
      where: { aiStatus: "escalated" },
    });
    const aiResolvedRate =
      totalITickets > 0 ? Math.round((aiResolvedCount / totalITickets) * 100) : 0;

    res.json({
      totalITickets,
      aiResolvedRate,
      awaitingReply,
      escalated,
      avgResponseTimeMinutes: 4.2,
    });
  } catch (error) {
    console.error("[i-Tickets] Failed to get stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/i-tickets - List tickets with filtering, search, sorting, and pagination
router.get("/", async (req, res) => {
  try {
    const {
      search,
      status,
      category,
      priority,
      aiStatus,
      unreadOnly,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      pageSize = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(pageSize), 10) || 10));
    const skip = (pageNum - 1) * take;

    const where: Prisma.ITicketWhereInput = {};

    if (status && status !== "all") {
      where.status = String(status);
    }
    if (category && category !== "all") {
      where.category = String(category);
    }
    if (priority && priority !== "all") {
      where.priority = String(priority);
    }
    if (aiStatus && aiStatus !== "all") {
      where.aiStatus = String(aiStatus);
    }
    if (unreadOnly === "true" || unreadOnly === true) {
      where.unread = true;
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { displayName: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { lastMessage: { contains: q, mode: "insensitive" } },
        { aiSummary: { contains: q, mode: "insensitive" } },
      ];
    }

    const order: Prisma.SortOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";
    let orderBy: Prisma.ITicketOrderByWithRelationInput = { createdAt: order };

    const sortField = String(sortBy);
    if (sortField === "createdAt") {
      orderBy = { createdAt: order };
    } else if (sortField === "lastMessageAt") {
      orderBy = { lastMessageAt: order };
    } else if (sortField === "subject") {
      orderBy = { subject: order };
    } else if (sortField === "displayName" || sortField === "sender") {
      orderBy = { displayName: order };
    } else if (sortField === "status") {
      orderBy = { status: order };
    } else if (sortField === "category") {
      orderBy = { category: order };
    } else if (sortField === "priority") {
      orderBy = { priority: order };
    }

    const [total, rows] = await Promise.all([
      prisma.iTicket.count({ where }),
      prisma.iTicket.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          assignedTo: { select: { id: true, name: true } },
          messages: { orderBy: { timestamp: "asc" } },
        },
      }),
    ]);

    res.json({
      tickets: rows.map(formatITicket),
      total,
      page: pageNum,
      pageSize: take,
    });
  } catch (error) {
    console.error("[i-Tickets] Failed to list tickets:", error);
    res.status(500).json({ error: "Failed to list i-tickets" });
  }
});

// GET /api/i-tickets/:id - Get ticket by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.iTicket.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "i-Ticket not found" });
      return;
    }

    res.json(formatITicket(ticket));
  } catch (error) {
    console.error("[i-Tickets] Failed to get ticket:", error);
    res.status(500).json({ error: "Failed to get ticket" });
  }
});

// POST /api/i-tickets - Create a new i-ticket (and initial message) in PostgreSQL
router.post("/", async (req, res) => {
  try {
    const {
      username,
      displayName,
      subject,
      category = "other",
      priority = "medium",
      channel = "instagram_dm",
      message,
      bio,
      followerCount = 0,
      isVerified = false,
      profileUrl,
      avatar,
    } = req.body;

    if (!username || !displayName || !message) {
      res.status(400).json({ error: "username, displayName, and message are required" });
      return;
    }

    const now = new Date();
    const cleanMsg = String(message).trim();

    const created = await prisma.iTicket.create({
      data: {
        channel,
        username,
        displayName,
        subject: subject || cleanMsg.slice(0, 80),
        category,
        priority,
        status: "open",
        aiStatus: "awaiting_reply",
        unread: true,
        lastMessage: cleanMsg,
        lastMessageAt: now,
        bio: bio || null,
        followerCount: Number(followerCount) || 0,
        isVerified: Boolean(isVerified),
        profileUrl: profileUrl || null,
        avatar: avatar || "",
        messages: {
          create: {
            senderType: "customer",
            senderName: displayName,
            senderUsername: username,
            senderAvatar: avatar || null,
            text: cleanMsg,
            timestamp: now,
          },
        },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { timestamp: "asc" } },
      },
    });

    broadcastSSE({
      type: "ticket:created",
      data: { id: created.id, status: created.status },
    });

    res.status(201).json(formatITicket(created));
  } catch (error: any) {
    console.error("[i-Tickets] Failed to create ticket:", error);
    res.status(500).json({ error: "Failed to create ticket", details: error?.message || String(error) });
  }
});

// POST /api/i-tickets/:id/replies (or /messages) - Send agent or customer message
router.post(["/:id/replies", "/:id/messages"], async (req, res) => {
  try {
    const { id } = req.params;
    const {
      text,
      senderType = "agent",
      senderName = senderType === "agent" ? "Support Agent" : "Customer",
      senderUsername,
      senderAvatar,
      isAiGenerated = false,
      aiConfidence,
    } = req.body;

    if (!text || !String(text).trim()) {
      res.status(400).json({ error: "Message text is required" });
      return;
    }

    const ticket = await prisma.iTicket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: "i-Ticket not found" });
      return;
    }

    const now = new Date();
    const cleanText = text.trim();

    const message = await prisma.iTicketMessage.create({
      data: {
        ticketId: id,
        senderType,
        senderName,
        senderUsername: senderUsername || null,
        senderAvatar: senderAvatar || null,
        text: cleanText,
        timestamp: now,
        isAiGenerated: Boolean(isAiGenerated),
        aiConfidence: typeof aiConfidence === "number" ? aiConfidence : null,
      },
    });

    const ticketUpdateData: Prisma.ITicketUpdateInput = {
      lastMessage: cleanText,
      lastMessageAt: now,
    };

    if (senderType === "agent") {
      ticketUpdateData.aiStatus = "human_replied";
      ticketUpdateData.unread = false;
      if (ticket.status === "open") {
        ticketUpdateData.status = "processing";
      }
    } else if (senderType === "customer") {
      ticketUpdateData.unread = true;
      if (ticket.status === "resolved" || ticket.status === "closed") {
        ticketUpdateData.status = "open";
        ticketUpdateData.aiStatus = "awaiting_reply";
      }
    } else if (senderType === "ai") {
      ticketUpdateData.aiStatus = "ai_resolved";
    }

    const updated = await prisma.iTicket.update({
      where: { id },
      data: ticketUpdateData,
      include: {
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { timestamp: "asc" } },
      },
    });

    // Outbound Dispatch: Send message to customer's Instagram Direct DM
    let instagramDispatchResult = null;
    if (senderType === "agent" || senderType === "ai") {
      const recipientId = getInstagramRecipientId(ticket);
      if (recipientId) {
        instagramDispatchResult = await sendInstagramDirectMessage(
          recipientId,
          cleanText
        );
      }
    }

    broadcastSSE({
      type: "ticket:updated",
      data: {
        id: updated.id,
        status: updated.status,
        channel: "instagram",
        lastMessage: cleanText,
      },
    });

    res.status(201).json({
      id: message.id,
      ticketId: message.ticketId,
      senderType: message.senderType,
      senderName: message.senderName,
      senderUsername: message.senderUsername,
      senderAvatar: message.senderAvatar,
      text: message.text,
      timestamp: message.timestamp.toISOString(),
      isAiGenerated: message.isAiGenerated,
      aiConfidence: message.aiConfidence,
      instagramDispatch: instagramDispatchResult,
    });
  } catch (error) {
    console.error("[i-Tickets] Failed to send message/reply:", error);
    res.status(500).json({ error: "Failed to send message/reply" });
  }
});

// PATCH /api/i-tickets/:id - Update ticket properties
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, category, priority, aiStatus, aiSummary, assignedToId, unread } = req.body;

    const data: Prisma.ITicketUpdateInput = {};
    if (status !== undefined) data.status = status;
    if (category !== undefined) data.category = category;
    if (priority !== undefined) data.priority = priority;
    if (aiStatus !== undefined) data.aiStatus = aiStatus;
    if (aiSummary !== undefined) data.aiSummary = aiSummary;
    if (unread !== undefined) data.unread = unread;
    if (assignedToId !== undefined) {
      data.assignedTo = assignedToId ? { connect: { id: assignedToId } } : { disconnect: true };
    }

    const updated = await prisma.iTicket.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { timestamp: "asc" } },
      },
    });

    broadcastSSE({
      type: "ticket:updated",
      data: { id: updated.id, status: updated.status },
    });

    res.json(formatITicket(updated));
  } catch (error) {
    console.error("[i-Tickets] Failed to update ticket:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

// POST /api/i-tickets/:id/summarize - Summarize i-ticket conversation using AI
router.post("/:id/summarize", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.iTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { timestamp: "asc" } } },
    });
    if (!ticket) {
      res.status(404).json({ error: "i-Ticket not found" });
      return;
    }

    const conversation = (ticket.messages || [])
      .map((m) => `${m.senderName} (${m.senderType}): ${m.text}`)
      .join("\n\n");

    let summaryText = "";
    try {
      const { text } = await generateTextWithFallback({
        system:
          "You are a helpful assistant that summarizes support conversations on Instagram Direct. " +
          "Provide a clear, concise summary that captures the customer's issue, any actions taken, and the current status. " +
          "Keep the summary to 2-4 sentences. Return only the summary with no preamble.",
        prompt:
          `Subject: ${ticket.subject || "Instagram DM"}\n` +
          `Customer: ${ticket.displayName} (@${ticket.username})\n` +
          `Category: ${ticket.category}\n\n` +
          (conversation ? `Conversation:\n${conversation}` : `Initial message: ${ticket.lastMessage}`),
      });
      summaryText = text;
    } catch {
      // Fallback summary if AI service is offline or rate limited
      summaryText = `Customer @${ticket.username} inquired regarding ${ticket.category.replace(/_/g, " ")}. The inquiry has ${ticket.messages.length} message(s) and is currently marked as ${ticket.status}.`;
    }

    await prisma.iTicket.update({
      where: { id },
      data: { aiSummary: summaryText },
    });

    res.json({ summary: summaryText });
  } catch (error: any) {
    console.error("[i-Tickets] Failed to summarize:", error);
    res.status(500).json({ error: error?.message || "Failed to summarize ticket" });
  }
});

// POST /api/i-tickets/:id/polish - Polish draft reply using AI
router.post("/:id/polish", async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!body || !String(body).trim()) {
      res.status(400).json({ error: "Reply body is required" });
      return;
    }

    const ticket = await prisma.iTicket.findUnique({ where: { id } });
    const customerName = ticket ? ticket.displayName.split(" ")[0] : "there";

    let polished = "";
    try {
      const { text } = await generateTextWithFallback({
        system:
          "You are a helpful writing assistant for a customer support team responding to Instagram Direct messages. " +
          "Improve the given reply for clarity, friendly professional tone, and grammar. " +
          "Preserve the original meaning and keep the response concise. " +
          "Return only the improved text with no preamble or explanation. " +
          `Address the customer as ${customerName}. End the reply with a polite sign-off from Support Team.`,
        prompt: body,
      });
      polished = text;
    } catch {
      const trimmed = body.trim();
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      polished = `Hi ${customerName},\n\n${capitalized}\n\nBest regards,\nSupport Team`;
    }

    res.json({ body: polished });
  } catch (error: any) {
    console.error("[i-Tickets] Failed to polish reply:", error);
    res.status(500).json({ error: error?.message || "Failed to polish reply" });
  }
});

// POST /api/i-tickets/:id/suggest-reply - Generate AI suggested reply
router.post("/:id/suggest-reply", async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.iTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { timestamp: "asc" } } },
    });
    if (!ticket) {
      res.status(404).json({ error: "i-Ticket not found" });
      return;
    }

    const customerName = ticket.displayName.split(" ")[0];
    const conversation = (ticket.messages || [])
      .map((m) => `${m.senderName}: ${m.text}`)
      .join("\n\n");

    let suggestedText = "";
    try {
      const { text } = await generateTextWithFallback({
        system:
          "You are an AI support assistant for a university/helpdesk answering Instagram Direct inquiries. " +
          "Draft a warm, polite, and helpful suggested reply resolving the customer's question or guiding them to next steps. " +
          `Address the customer as ${customerName}. Keep the reply concise and professional. Return only the suggested reply text.`,
        prompt:
          `Subject: ${ticket.subject}\n` +
          `Category: ${ticket.category}\n` +
          `Conversation:\n${conversation || ticket.lastMessage}`,
      });
      suggestedText = text;
    } catch {
      suggestedText =
        ticket.suggestedReply ||
        `Hi ${customerName}, thanks for reaching out! Regarding your inquiry on ${ticket.category.replace(/_/g, " ")}, our support team is actively reviewing your request and will provide full details shortly.`;
    }

    await prisma.iTicket.update({
      where: { id },
      data: { suggestedReply: suggestedText },
    });

    res.json({ suggestedReply: suggestedText });
  } catch (error: any) {
    console.error("[i-Tickets] Failed to suggest reply:", error);
    res.status(500).json({ error: error?.message || "Failed to suggest reply" });
  }
});

export default router;
