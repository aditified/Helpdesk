import prisma from "../db";
import {
  getInstagramConfig,
  processInstagramInboundMessage,
} from "./instagram";

let pollTimer: ReturnType<typeof setInterval> | null = null;
let isPolling = false;
let myAccountId: string | null = null;
let myUsername: string | null = null;
const seenMessageIds = new Set<string>();

/**
 * Resolves the connected account's ID and username once so we never mistake
 * our own replies as incoming customer messages.
 */
async function resolveSelfAccount(token: string): Promise<boolean> {
  if (myAccountId && myUsername) return true;

  try {
    const isIgToken = token.startsWith("IG");
    const host = isIgToken ? "graph.instagram.com" : "graph.facebook.com";
    const res = await fetch(`https://${host}/v21.0/me?fields=id,username&access_token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const data = (await res.json()) as any;
      myAccountId = String(data.id || "");
      myUsername = String(data.username || "").toLowerCase();
      console.log(`[Instagram Poller] Authenticated as @${myUsername} (ID: ${myAccountId})`);
      return true;
    }
  } catch (err: any) {
    console.warn("[Instagram Poller] Could not resolve self account:", err.message);
  }
  return false;
}

/**
 * Checks Meta Instagram Graph API for any new direct messages
 */
export async function pollInstagramConversations(): Promise<number> {
  if (isPolling) return 0;
  const { pageAccessToken, isConfigured } = getInstagramConfig();

  if (!isConfigured || !pageAccessToken) {
    return 0;
  }

  isPolling = true;
  let newMessagesCount = 0;

  try {
    await resolveSelfAccount(pageAccessToken);

    const isIgToken = pageAccessToken.startsWith("IG");
    const host = isIgToken ? "graph.instagram.com" : "graph.facebook.com";

    const url = `https://${host}/v21.0/me/conversations?fields=id,updated_time,messages{id,message,from,created_time}&access_token=${encodeURIComponent(
      pageAccessToken
    )}`;

    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.text();
      console.warn("[Instagram Poller] Error fetching conversations:", err);
      return 0;
    }

    const json = (await res.json()) as any;
    const conversations = json.data || [];

    for (const conv of conversations) {
      const messages = conv.messages?.data || [];

      // Sort messages oldest to newest so conversation history flows chronologically
      const orderedMessages = [...messages].reverse();

      for (const msg of orderedMessages) {
        if (!msg.message || !msg.from) continue;

        const senderId = String(msg.from.id || "");
        const senderUsername = String(msg.from.username || "").toLowerCase();

        // Skip messages sent by our own account (outbound agent replies)
        if (
          senderId === myAccountId ||
          (myUsername && senderUsername === myUsername) ||
          senderUsername === "helpdeskmosh.07"
        ) {
          continue;
        }

        // Fast-path in-memory deduplication check
        if (msg.id && seenMessageIds.has(msg.id)) {
          continue;
        }

        // Database deduplication check
        const existing = await prisma.iTicketMessage.findFirst({
          where: {
            text: msg.message.trim(),
            OR: [
              { ticket: { bio: { contains: `IGSID:${senderId}` } } },
              { senderUsername: senderUsername },
            ],
          },
        });

        if (existing) {
          if (msg.id) seenMessageIds.add(msg.id);
          continue;
        }

        // Ingest new message into Helpdesk
        console.log(
          `[Instagram Poller] 📩 Ingesting incoming DM from @${senderUsername || senderId}: "${msg.message}"`
        );

        await processInstagramInboundMessage({
          senderId,
          messageText: msg.message,
          messageId: msg.id,
          timestamp: msg.created_time,
          profileOverride: {
            username: senderUsername || `user_${senderId.slice(-4)}`,
            name: msg.from.name || senderUsername || "Instagram User",
          },
        });

        if (msg.id) seenMessageIds.add(msg.id);
        newMessagesCount++;
      }
    }
  } catch (error: any) {
    console.error("[Instagram Poller] Unexpected polling error:", error.message || error);
  } finally {
    isPolling = false;
  }

  return newMessagesCount;
}

/**
 * Starts the continuous background polling service
 */
export async function startInstagramPoller(): Promise<void> {
  const { isConfigured } = getInstagramConfig();

  if (!isConfigured) {
    console.log("[Instagram Poller] INSTAGRAM_PAGE_ACCESS_TOKEN not set — poller idle.");
    return;
  }

  const intervalSeconds = Math.max(
    10,
    parseInt(process.env.INSTAGRAM_POLL_INTERVAL || "15", 10)
  );

  console.log(`[Instagram Poller] Starting listener (checking every ${intervalSeconds}s)...`);

  // Run initial poll immediately
  await pollInstagramConversations();

  // Schedule recurring poll
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      await pollInstagramConversations();
    } catch (err: any) {
      console.error("[Instagram Poller] Interval error:", err.message);
    }
  }, intervalSeconds * 1000);
}

/**
 * Stops the background poller cleanly
 */
export function stopInstagramPoller(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    console.log("[Instagram Poller] Stopped.");
  }
}
