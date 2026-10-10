import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/require-auth";
import { registerSSEClient, removeSSEClient } from "../lib/sse";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const clientId = crypto.randomUUID();
  registerSSEClient(clientId, res, req.user.id);

  // Send initial connected payload
  res.write(
    `event: connected\ndata: ${JSON.stringify({ status: "connected", clientId })}\n\n`
  );

  req.on("close", () => {
    removeSSEClient(clientId);
  });
});

export default router;
