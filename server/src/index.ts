import path from "path";
import Sentry from "./lib/sentry";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/require-auth";
import usersRouter from "./routes/users";
import ticketsRouter from "./routes/tickets";
import agentsRouter from "./routes/agents";
import webhooksRouter from "./routes/webhooks";
import repliesRouter from "./routes/replies";
import eventsRouter from "./routes/events";
import iticketsRouter from "./routes/itickets";
import { startQueue, stopQueue } from "./lib/queue";
import { startImapListener, stopImapListener } from "./lib/imap-listener";
import { startInstagramPoller, stopInstagramPoller } from "./lib/instagram-poller";

// Start background services, IMAP listener, and queue
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.TRUSTED_ORIGINS?.split(",") ?? [],
    credentials: true,
  })
);

const isProduction = process.env.NODE_ENV === "production";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: () => !isProduction,
});

// Mount Better Auth handler BEFORE express.json()
// Better Auth parses its own request bodies
// toNodeHandler returns a promise; must be caught for Express 5
app.all("/api/auth/{*any}", authLimiter, (req, res, next) => {
  toNodeHandler(auth)(req, res).catch(next);
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/privacy", (_req, res) => {
  res.type("html").send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Helpdesk Privacy Policy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:800px;margin:40px auto;padding:24px;line-height:1.6;color:#222;}</style>
      </head>
      <body>
        <h1>Helpdesk Privacy Policy</h1>
        <p>Last updated: October 2026</p>
        <p>Helpdesk provides customer and student support ticket management. This policy outlines how we handle data from connected channels, including Instagram Direct.</p>
        <h2>1. Information We Collect</h2>
        <p>When you contact us via Instagram Direct, we receive your message text, timestamp, display name, and Instagram user handle to process your support ticket.</p>
        <h2>2. How We Use Information</h2>
        <p>We use this information solely to review, prioritize, and respond to your direct support inquiries and deliver replies back to your Instagram inbox.</p>
        <h2>3. Data Protection</h2>
        <p>We do not sell, rent, or share personal communications with third parties.</p>
        <p>For questions or data deletion requests, contact us at: <code>helpdeskmosh.07@gmail.com</code></p>
      </body>
    </html>
  `);
});

app.get("/api/me", requireAuth, (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ user: { id, name, email, role } });
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/tickets/:ticketId/replies", repliesRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/i-tickets", iticketsRouter);

Sentry.setupExpressErrorHandler(app);

// In production, serve the built React client as static files
if (isProduction) {
  const clientDist = path.resolve(import.meta.dirname, "../../client/dist");
  app.use(express.static(clientDist));

  // SPA fallback: serve index.html for any non-API route
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

if (!process.env.WEBHOOK_SECRET) {
  console.warn("Warning: WEBHOOK_SECRET is not set. Webhook endpoints will return 500.");
}

async function boot() {
  await startQueue();
  await startImapListener();
  await startInstagramPoller();

  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  const shutdown = async () => {
    console.log("Shutting down...");
    server.close();
    await stopImapListener();
    stopInstagramPoller();
    await stopQueue();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

boot().catch((error) => {
  Sentry.captureException(error);
  console.error("Failed to start server:", error);
  process.exit(1);
});
