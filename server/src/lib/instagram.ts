import crypto from "crypto";
import prisma from "../db";
import { broadcastSSE } from "./sse";

export interface InstagramProfile {
  name: string;
  username: string;
  avatar: string;
}

export interface InstagramSendResult {
  success: boolean;
  messageId?: string;
  recipientId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Returns current Instagram connection configuration from environment variables
 */
export function getInstagramConfig() {
  const pageAccessToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || "";
  const pageId = process.env.INSTAGRAM_PAGE_ID || "";
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || "helpdesk_instagram_verify_token";
  const appSecret = process.env.INSTAGRAM_APP_SECRET || "";

  return {
    pageAccessToken,
    pageId,
    verifyToken,
    appSecret,
    isConfigured: Boolean(pageAccessToken),
  };
}

/**
 * Extracts the Instagram-scoped User ID (IGSID) from an iTicket.
 * Checks for stored IGSID tags in bio, profile URL, or numeric usernames.
 */
export function getInstagramRecipientId(ticket: {
  bio?: string | null;
  username: string;
  profileUrl?: string | null;
}): string | null {
  if (ticket.bio) {
    const match = ticket.bio.match(/IGSID:([0-9a-zA-Z_]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Check if username itself is an Instagram Scoped User ID (pure numeric)
  if (/^\d{8,25}$/.test(ticket.username)) {
    return ticket.username;
  }

  // Check profileUrl if it contains numeric id
  if (ticket.profileUrl) {
    const match = ticket.profileUrl.match(/id=(\d+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Fallback to username if non-empty
  if (ticket.username && !ticket.username.startsWith("user_")) {
    return ticket.username;
  }

  return null;
}

/**
 * Attaches the IGSID identifier to the customer bio for persistent storage
 */
export function formatTicketBio(existingBio: string | null | undefined, senderId: string): string {
  const clean = existingBio?.replace(/IGSID:[^|]*(\| )?/g, "").trim();
  if (clean) {
    return `IGSID:${senderId} | ${clean}`;
  }
  return `IGSID:${senderId}`;
}

/**
 * Strips the internal IGSID metadata when rendering the customer bio
 */
export function cleanTicketBio(bio: string | null | undefined): string {
  if (!bio) return "";
  return bio.replace(/IGSID:[^|]*(\| )?/g, "").trim();
}

/**
 * Resolves the sender's public profile from Meta Graph API, with fallback
 */
export async function fetchInstagramUserProfile(senderId: string): Promise<InstagramProfile> {
  const { pageAccessToken } = getInstagramConfig();

  if (pageAccessToken) {
    try {
      const isIgToken = pageAccessToken.startsWith("IG");
      const host = isIgToken ? "graph.instagram.com" : "graph.facebook.com";
      const url = `https://${host}/v21.0/${senderId}?fields=name,username,profile_pic&access_token=${encodeURIComponent(
        pageAccessToken
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as any;
        return {
          name: data.name || data.username || "Instagram User",
          username: data.username || senderId,
          avatar:
            data.profile_pic ||
            `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        };
      } else {
        const err = await res.text();
        console.warn(`[Instagram Graph API] Profile fetch failed for ${senderId}:`, err);
      }
    } catch (error) {
      console.warn(`[Instagram Graph API] Profile fetch error for ${senderId}:`, error);
    }
  }

  // Default fallback when token is missing or call fails
  const shortId = senderId.length > 6 ? senderId.slice(-6) : senderId;
  return {
    name: `Instagram User (${shortId})`,
    username: `user_${shortId}`,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  };
}

/**
 * Sends a Direct Message reply to the user on Instagram via Meta Send API
 */
export async function sendInstagramDirectMessage(
  recipientId: string,
  text: string
): Promise<InstagramSendResult> {
  const { pageAccessToken, pageId, isConfigured } = getInstagramConfig();

  if (!recipientId) {
    return {
      success: false,
      error: "Recipient Instagram ID not found for this ticket.",
    };
  }

  // If live credentials are provided in .env, call Meta Graph Send API
  if (isConfigured) {
    try {
      const isIgToken = pageAccessToken.startsWith("IG");
      const endpoint = isIgToken
        ? `https://graph.instagram.com/v21.0/me/messages`
        : pageId
        ? `https://graph.facebook.com/v21.0/${pageId}/messages`
        : `https://graph.facebook.com/v21.0/me/messages`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pageAccessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      });

      const data = (await res.json()) as any;

      if (res.ok && data.message_id) {
        console.log(
          `[Instagram Direct] Message successfully sent to ${recipientId}. Message ID: ${data.message_id}`
        );
        return {
          success: true,
          messageId: data.message_id,
          recipientId,
          simulated: false,
        };
      } else {
        const errMsg = data.error?.message || "Unknown Meta API error";
        console.error(`[Instagram Direct] Meta API Send Error for ${recipientId}:`, data.error);
        return {
          success: false,
          error: errMsg,
          recipientId,
        };
      }
    } catch (err: any) {
      console.error(`[Instagram Direct] Network error while sending to ${recipientId}:`, err);
      return {
        success: false,
        error: err?.message || String(err),
        recipientId,
      };
    }
  }

  // Simulated outbound DM when in local development without live Meta credentials
  const simulatedMsgId = `mid_sim_${Date.now()}`;
  console.log(
    `[Instagram Direct (Dev Mode)] INSTAGRAM_PAGE_ACCESS_TOKEN not set in .env. ` +
      `Simulated DM sent to @${recipientId}: "${text}" (ID: ${simulatedMsgId})`
  );

  return {
    success: true,
    messageId: simulatedMsgId,
    recipientId,
    simulated: true,
  };
}

/**
 * Ingests an incoming Instagram Direct message into PostgreSQL
 * - If an open conversation with this customer exists, appends the message to the thread
 * - Otherwise, creates a new i-ticket and initial message
 * - Broadcasts real-time SSE events so the UI updates instantaneously
 */
export async function processInstagramInboundMessage(params: {
  senderId: string;
  messageText: string;
  messageId?: string;
  timestamp?: number | string;
  profileOverride?: Partial<InstagramProfile>;
}): Promise<{ ticketId: string; isNewTicket: boolean; messageId: string }> {
  const { senderId, messageText, messageId, timestamp, profileOverride } = params;

  if (!senderId || !messageText?.trim()) {
    throw new Error("senderId and messageText are required");
  }

  const cleanText = messageText.trim();
  const now = timestamp ? new Date(timestamp) : new Date();

  // Resolve user profile (name, username, avatar)
  const baseProfile = await fetchInstagramUserProfile(senderId);
  const profile: InstagramProfile = {
    ...baseProfile,
    ...profileOverride,
  };

  // Find if customer has an existing active conversation
  const existingTicket = await prisma.iTicket.findFirst({
    where: {
      channel: "instagram",
      OR: [
        { bio: { contains: `IGSID:${senderId}` } },
        { username: profile.username },
        { username: senderId },
      ],
      status: { in: ["open", "processing"] },
    },
    include: { messages: true },
  });

  if (existingTicket) {
    // Append message to existing thread
    const newMsg = await prisma.iTicketMessage.create({
      data: {
        ticketId: existingTicket.id,
        senderType: "customer",
        senderName: profile.name,
        senderUsername: profile.username,
        senderAvatar: profile.avatar,
        text: cleanText,
        timestamp: now,
      },
    });

    // Update ticket state
    const updated = await prisma.iTicket.update({
      where: { id: existingTicket.id },
      data: {
        lastMessage: cleanText,
        lastMessageAt: now,
        unread: true,
        status: "open",
        aiStatus: "awaiting_reply",
      },
    });

    // Broadcast SSE to live clients
    broadcastSSE({
      type: "ticket:updated",
      data: {
        id: updated.id,
        status: updated.status,
        channel: "instagram",
        displayName: profile.name,
        username: profile.username,
        lastMessage: cleanText,
      },
    });

    return {
      ticketId: updated.id,
      isNewTicket: false,
      messageId: newMsg.id,
    };
  }

  // Create brand new i-ticket
  const subject = cleanText.length > 60 ? cleanText.slice(0, 60) + "..." : cleanText;
  const created = await prisma.iTicket.create({
    data: {
      channel: "instagram",
      username: profile.username || senderId,
      displayName: profile.name || "Instagram User",
      avatar: profile.avatar || "",
      bio: formatTicketBio(null, senderId),
      profileUrl: `https://instagram.com/${profile.username || senderId}`,
      subject,
      category: "general_query",
      priority: "medium",
      status: "open",
      aiStatus: "awaiting_reply",
      unread: true,
      lastMessage: cleanText,
      lastMessageAt: now,
      messages: {
        create: {
          senderType: "customer",
          senderName: profile.name,
          senderUsername: profile.username,
          senderAvatar: profile.avatar,
          text: cleanText,
          timestamp: now,
        },
      },
    },
  });

  // Broadcast real-time event
  broadcastSSE({
    type: "ticket:created",
    data: {
      id: created.id,
      status: created.status,
      channel: "instagram",
      displayName: profile.name,
      username: profile.username,
      subject: created.subject,
    },
  });

  return {
    ticketId: created.id,
    isNewTicket: true,
    messageId: created.id,
  };
}

/**
 * Validates Meta's x-hub-signature-256 HMAC header
 */
export function verifyMetaSignature(
  rawBody: string | Buffer,
  signatureHeader?: string
): boolean {
  const { appSecret } = getInstagramConfig();
  if (!appSecret) {
    // If no app secret configured in local dev, allow request
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signatureHeader.replace("sha256=", "");
  const hmac = crypto.createHmac("sha256", appSecret);
  hmac.update(rawBody);
  const calculatedSignature = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}
