import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { processInboundEmail } from "./inbound-email";
import Sentry from "./sentry";

let client: ImapFlow | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let isPolling = false;
let isStopped = false;

function getImapConfig() {
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASS;
  const port = process.env.IMAP_PORT ? parseInt(process.env.IMAP_PORT, 10) : 993;
  const secure = process.env.IMAP_SECURE !== "false";

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, secure, auth: { user, pass } };
}

async function ensureConnected(): Promise<ImapFlow | null> {
  const config = getImapConfig();
  if (!config) return null;

  if (client && client.usable) {
    return client;
  }

  if (client) {
    try {
      await client.logout();
    } catch {
      // ignore
    }
    client = null;
  }

  const imap = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    logger: false,
  });

  imap.on("error", (err) => {
    console.error("[IMAP] Client error:", err.message);
    Sentry.captureException(err, { tags: { service: "imap-client" } });
  });

  await imap.connect();
  client = imap;
  console.log(`[IMAP] Connected to ${config.host}:${config.port} as ${config.auth.user}`);
  return client;
}

export async function checkInbox(): Promise<void> {
  if (isPolling || isStopped) return;
  isPolling = true;

  try {
    const imap = await ensureConnected();
    if (!imap) return;

    const lock = await imap.getMailboxLock("INBOX");
    try {
      const unseenUids = await imap.search({ seen: false }, { uid: true });
      if (Array.isArray(unseenUids) && unseenUids.length > 0) {
        console.log(`[IMAP] Found ${unseenUids.length} unread email(s)`);

        for (const uid of unseenUids) {
          try {
            const message = await imap.fetchOne(
              String(uid),
              { source: true, uid: true },
              { uid: true }
            );

            if (!message || !message.source) continue;

            const parsed = await simpleParser(message.source);

            const fromAddress = parsed.from?.value?.[0]?.address || "";
            const fromName = parsed.from?.value?.[0]?.name || fromAddress;
            const subject = parsed.subject || "No Subject";
            const textBody = parsed.text || "";
            const htmlBody = typeof parsed.html === "string" ? parsed.html : undefined;

            if (fromAddress) {
              await processInboundEmail({
                from: fromAddress,
                fromName,
                subject,
                body: textBody,
                bodyHtml: htmlBody,
              });

              // Mark email as seen so it's not processed on next poll
              await imap.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
            }
          } catch (msgErr) {
            console.error(`[IMAP] Failed to process message UID ${uid}:`, msgErr);
            Sentry.captureException(msgErr, { tags: { service: "imap-fetch" } });
          }
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("[IMAP] Error polling inbox:", error);
    Sentry.captureException(error, { tags: { service: "imap-poll" } });
    if (client) {
      try {
        await client.logout();
      } catch {
        // ignore
      }
      client = null;
    }
  } finally {
    isPolling = false;
  }
}

export async function startImapListener(): Promise<void> {
  const config = getImapConfig();
  if (!config) {
    console.log(
      "[IMAP] IMAP credentials not configured (set IMAP_HOST, IMAP_USER, IMAP_PASS). IMAP inbox listener disabled."
    );
    return;
  }

  isStopped = false;
  console.log("[IMAP] Starting IMAP inbox listener...");

  // Initial check
  checkInbox().catch((err) => console.error("[IMAP] Initial check failed:", err));

  const pollIntervalSeconds = parseInt(process.env.IMAP_POLL_INTERVAL || "30", 10);
  pollTimer = setInterval(() => {
    checkInbox().catch((err) => console.error("[IMAP] Scheduled check failed:", err));
  }, Math.max(pollIntervalSeconds, 5) * 1000);
}

export async function stopImapListener(): Promise<void> {
  isStopped = true;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  if (client) {
    try {
      await client.logout();
    } catch {
      // ignore
    }
    client = null;
  }
  console.log("[IMAP] IMAP listener stopped.");
}
