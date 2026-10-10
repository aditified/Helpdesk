import { Router } from "express";
import multer from "multer";
import { simpleParser } from "mailparser";
import { requireWebhookSecret } from "../middleware/require-webhook-secret";
import { processInboundEmail, parseFromField } from "../lib/inbound-email";

const upload = multer();
const router = Router();

router.post("/inbound-email", requireWebhookSecret, upload.any(), async (req, res) => {
  try {
    let from = "";
    let fromName = "";
    let subject = "";
    let body = "";
    let bodyHtml: string | undefined = undefined;

    // Check if raw email MIME was uploaded (e.g. file or 'email' field)
    const rawEmailFile = (req.files as Express.Multer.File[])?.find(
      (f) => f.fieldname === "email" || f.mimetype.includes("message/rfc822")
    );

    if (rawEmailFile?.buffer) {
      const parsed = await simpleParser(rawEmailFile.buffer);
      from = parsed.from?.value?.[0]?.address || "";
      fromName = parsed.from?.value?.[0]?.name || "";
      subject = parsed.subject || "";
      body = parsed.text || "";
      bodyHtml = typeof parsed.html === "string" ? parsed.html : undefined;
    } else {
      // Standard multipart fields or JSON body (from, fromName, subject, text/body, html/bodyHtml)
      const rawFrom = (req.body.from || req.body.sender || "") as string;
      const parsedFrom = parseFromField(rawFrom);
      from = parsedFrom.email;
      fromName = (req.body.fromName as string) || parsedFrom.name;
      subject = (req.body.subject || "") as string;
      body = (req.body.body || req.body.text || "") as string;
      bodyHtml = (req.body.bodyHtml || req.body.html || undefined) as string | undefined;
    }

    const result = await processInboundEmail({
      from,
      fromName,
      subject,
      body,
      bodyHtml,
    });

    if (!result.success) {
      res.status(400).json({ error: "Invalid inbound email data", details: result.error });
      return;
    }

    res.status(result.reply ? 200 : 201).json(result);
  } catch (error) {
    console.error("[Webhook] Failed to process inbound email webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// INSTAGRAM DIRECT MESSAGING WEBHOOKS
// ==========================================
import {
  getInstagramConfig,
  processInstagramInboundMessage,
} from "../lib/instagram";

/**
 * GET /api/webhooks/instagram
 * Meta Webhook Verification Handshake
 * Meta sends this request when configuring the Webhook URL in Meta App Dashboard
 */
router.get("/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const { verifyToken } = getInstagramConfig();

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Instagram Webhook] Handshake verified successfully with Meta!");
    res.status(200).send(challenge);
  } else {
    console.warn(
      `[Instagram Webhook] Verification failed. Received token: "${token}", Expected: "${verifyToken}"`
    );
    res.status(403).send("Forbidden");
  }
});

/**
 * POST /api/webhooks/instagram
 * Meta Inbound Message Webhook Handler
 * Receives incoming Instagram Direct Messages sent by customers
 */
router.post("/instagram", async (req, res) => {
  try {
    const body = req.body;
    console.log("[Instagram Webhook Inbound] Received body:", JSON.stringify(body));

    // Check if this event comes from an Instagram subscription
    if (body.object === "instagram" || body.object === "page") {
      const entries = body.entry || [];

      for (const entry of entries) {
        const messagingEvents = entry.messaging || [];

        for (const event of messagingEvents) {
          // Ignore message echoes (messages sent by our own account)
          if (event.message?.is_echo) {
            continue;
          }

          const senderId = event.sender?.id;
          const messageText = event.message?.text;
          const messageId = event.message?.mid;
          const timestamp = event.timestamp;

          if (senderId && messageText) {
            console.log(
              `[Instagram Webhook] Inbound DM received from ${senderId}: "${messageText}"`
            );

            await processInstagramInboundMessage({
              senderId,
              messageText,
              messageId,
              timestamp,
            });
          }
        }
      }

      // Meta requires a 200 OK response within 20 seconds, otherwise it retries
      res.status(200).send("EVENT_RECEIVED");
      return;
    }

    res.status(404).send("Not Found");
  } catch (error) {
    console.error("[Instagram Webhook] Error processing incoming event:", error);
    // Return 200 to prevent Meta from indefinitely retrying a malformed payload
    res.status(200).send("EVENT_RECEIVED");
  }
});

/**
 * POST /api/webhooks/instagram/simulate
 * Local Development & Testing Endpoint
 * Allows testing inbound Instagram DMs without needing a live public webhook tunnel
 */
router.post("/instagram/simulate", async (req, res) => {
  try {
    const {
      senderId = `sim_user_${Math.floor(100000 + Math.random() * 900000)}`,
      message = "Hello, I need help with my admission application!",
      username,
      displayName,
      avatar,
    } = req.body;

    if (!message || !String(message).trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const result = await processInstagramInboundMessage({
      senderId: String(senderId),
      messageText: String(message),
      timestamp: Date.now(),
      profileOverride: {
        username: username || `user_${String(senderId).slice(-4)}`,
        name: displayName || "Instagram Student",
        avatar:
          avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      },
    });

    res.status(201).json({
      success: true,
      ...result,
      senderId,
      message,
    });
  } catch (error: any) {
    console.error("[Instagram Simulate] Error simulating DM:", error);
    res.status(500).json({ error: error?.message || "Failed to simulate message" });
  }
});

/**
 * GET /api/webhooks/instagram/status
 * Channel configuration and health status
 */
router.get("/instagram/status", (_req, res) => {
  const config = getInstagramConfig();
  res.json({
    isConfigured: config.isConfigured,
    hasPageId: Boolean(config.pageId),
    verifyToken: config.verifyToken,
    webhookUrl: "/api/webhooks/instagram",
  });
});

export default router;
