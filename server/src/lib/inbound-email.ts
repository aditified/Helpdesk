import prisma from "../db";
import { sendClassifyJob } from "./classify-ticket";
import { sendAutoResolveJob } from "./auto-resolve-ticket";
import { AI_AGENT_ID } from "core/constants/ai-agent.ts";
import { inboundEmailSchema } from "core/schemas/tickets.ts";
import { broadcastSSE } from "./sse";
import Sentry from "./sentry";

export interface InboundEmailPayload {
  from: string;
  fromName?: string;
  subject: string;
  body: string;
  bodyHtml?: string;
}

export function stripSubjectPrefixes(subject: string): string {
  return subject.replace(/^(Re:\s*|Fwd:\s*)+/i, "").trim();
}

export function parseFromField(from: string): { email: string; name: string } {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1]!.trim() || match[2]!, email: match[2]! };
  }
  return { name: from.trim(), email: from.trim() };
}

export function extractPlainTextFromHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

export async function processInboundEmail(rawPayload: InboundEmailPayload) {
  // Normalize and validate input
  const normalizedFrom = parseFromField(rawPayload.from);
  const rawBody = rawPayload.body?.trim();
  const rawHtml = rawPayload.bodyHtml?.trim();

  // Ensure plain text body is populated (extract from HTML if plain text was not provided)
  const resolvedBody =
    rawBody || (rawHtml ? extractPlainTextFromHtml(rawHtml) : "") || "No content";

  const parsedData = inboundEmailSchema.safeParse({
    from: normalizedFrom.email,
    fromName: rawPayload.fromName || normalizedFrom.name || normalizedFrom.email,
    subject: rawPayload.subject?.trim() || "No Subject",
    body: resolvedBody,
    bodyHtml: rawHtml || undefined,
  });

  if (!parsedData.success) {
    console.warn("[Inbound Email] Validation failed:", parsedData.error.format());
    return { success: false, error: parsedData.error };
  }

  const data = parsedData.data;
  const normalizedSubject = stripSubjectPrefixes(data.subject);

  try {
    // Check for existing open ticket from same sender with matching subject
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        senderEmail: data.from,
        status: { notIn: ["resolved", "closed"] },
        subject: { equals: normalizedSubject, mode: "insensitive" },
      },
    });

    if (existingTicket) {
      const reply = await prisma.reply.create({
        data: {
          body: data.body,
          bodyHtml: data.bodyHtml ?? null,
          senderType: "customer",
          ticketId: existingTicket.id,
          userId: null,
        },
      });

      console.log(`[Inbound Email] Appended reply to ticket #${existingTicket.id} from ${data.from}`);
      broadcastSSE({
        type: "reply:created",
        data: {
          ticketId: existingTicket.id,
          replyId: reply.id,
          senderName: data.fromName,
          senderType: "customer",
          subject: existingTicket.subject,
        },
      });
      return { success: true, ticket: existingTicket, reply };
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject: normalizedSubject,
        body: data.body,
        bodyHtml: data.bodyHtml ?? null,
        senderName: data.fromName,
        senderEmail: data.from,
        assignedToId: AI_AGENT_ID,
      },
    });

    console.log(`[Inbound Email] Created new ticket #${ticket.id} from ${data.from}`);
    broadcastSSE({
      type: "ticket:created",
      data: {
        id: ticket.id,
        subject: ticket.subject,
        senderName: ticket.senderName,
        senderEmail: ticket.senderEmail,
        status: ticket.status,
      },
    });

    sendClassifyJob(ticket).catch((error) =>
      console.error(`Failed to enqueue classify job for ticket ${ticket.id}:`, error)
    );

    sendAutoResolveJob(ticket).catch((error) =>
      console.error(`Failed to enqueue auto-resolve job for ticket ${ticket.id}:`, error)
    );

    return { success: true, ticket };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: "processInboundEmail" },
    });
    console.error("[Inbound Email] Failed to process email:", error);
    throw error;
  }
}
