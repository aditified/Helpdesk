import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import { validate } from "../lib/validate";
import { parseId } from "../lib/parse-id";
import { ticketListQuerySchema, updateTicketSchema } from "core/schemas/tickets.ts";
import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { AI_AGENT_ID } from "core/constants/ai-agent.ts";
import { Role } from "core/constants/role.ts";
import { broadcastSSE } from "../lib/sse";

interface TicketStatsRow {
  totalTickets: bigint;
  openTickets: bigint;
  resolvedByAI: bigint;
  aiResolutionRate: number;
  avgResolutionTime: number;
}

interface AgentTicketStatsRow {
  totalTickets: bigint;
  openTickets: bigint;
  resolvedTickets: bigint;
  closedTickets: bigint;
  resolutionRate: number;
  avgResolutionTime: number;
  totalReplies: bigint;
}

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  if (req.user.role === Role.agent) {
    const [row] = await prisma.$queryRaw<[AgentTicketStatsRow]>`
      WITH counts AS (
        SELECT
          COUNT(*) FILTER (WHERE "assignedToId" = ${req.user.id} AND status IN ('open', 'resolved', 'closed')) AS total_tickets,
          COUNT(*) FILTER (WHERE "assignedToId" = ${req.user.id} AND status = 'open') AS open_tickets,
          COUNT(*) FILTER (WHERE "assignedToId" = ${req.user.id} AND status = 'resolved') AS resolved_tickets,
          COUNT(*) FILTER (WHERE "assignedToId" = ${req.user.id} AND status = 'closed') AS closed_tickets,
          AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) FILTER (WHERE "assignedToId" = ${req.user.id} AND status = 'resolved') AS avg_resolution
        FROM ticket
      ),
      replies AS (
        SELECT COUNT(*) AS total_replies FROM reply WHERE "userId" = ${req.user.id}
      )
      SELECT
        total_tickets AS "totalTickets",
        open_tickets AS "openTickets",
        resolved_tickets AS "resolvedTickets",
        closed_tickets AS "closedTickets",
        CASE
          WHEN total_tickets > 0
          THEN ROUND((resolved_tickets::DOUBLE PRECISION / total_tickets * 100)::NUMERIC, 1)::DOUBLE PRECISION
          ELSE 0
        END AS "resolutionRate",
        COALESCE(ROUND(avg_resolution::NUMERIC), 0)::DOUBLE PRECISION AS "avgResolutionTime",
        (SELECT total_replies FROM replies) AS "totalReplies"
      FROM counts;
    `;

    res.json({
      role: Role.agent,
      totalTickets: Number(row?.totalTickets ?? 0),
      openTickets: Number(row?.openTickets ?? 0),
      resolvedTickets: Number(row?.resolvedTickets ?? 0),
      closedTickets: Number(row?.closedTickets ?? 0),
      resolutionRate: row?.resolutionRate ?? 0,
      avgResolutionTime: row?.avgResolutionTime ?? 0,
      totalReplies: Number(row?.totalReplies ?? 0),
      resolvedByAI: 0,
      aiResolutionRate: 0,
    });
    return;
  }

  const [row] = await prisma.$queryRaw<
    [TicketStatsRow]
  >`SELECT * FROM get_ticket_stats(${AI_AGENT_ID})`;

  res.json({
    role: Role.admin,
    totalTickets: Number(row.totalTickets),
    openTickets: Number(row.openTickets),
    resolvedByAI: Number(row.resolvedByAI),
    aiResolutionRate: row.aiResolutionRate,
    avgResolutionTime: row.avgResolutionTime,
  });
});

router.get("/stats/daily-volume", requireAuth, async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const where: Prisma.TicketWhereInput = {
    createdAt: { gte: thirtyDaysAgo },
  };

  if (req.user.role === Role.agent) {
    where.assignedToId = req.user.id;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: { createdAt: true },
  });

  // Build a map of date -> count
  const countsByDate = new Map<string, number>();
  for (const t of tickets) {
    const dateKey = t.createdAt.toISOString().slice(0, 10);
    countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
  }

  // Fill in all 30 days (including zeros)
  const data: { date: string; tickets: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    data.push({ date: dateKey, tickets: countsByDate.get(dateKey) ?? 0 });
  }

  res.json({ data });
});

router.get("/", requireAuth, async (req, res) => {
  const query = validate(ticketListQuerySchema, req.query, res);
  if (!query) return;

  const where: Prisma.TicketWhereInput = {};

  if (req.user.role === Role.agent) {
    where.assignedToId = req.user.id;
  } else if (query.assignedToId) {
    where.assignedToId = query.assignedToId === "unassigned" ? null : query.assignedToId;
  }

  if (query.status) {
    where.status = query.status;
  } else {
    where.status = { in: ["open", "resolved", "closed"] };
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: "insensitive" } },
      { senderName: { contains: query.search, mode: "insensitive" } },
      { senderEmail: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        subject: true,
        status: true,
        category: true,
        senderName: true,
        senderEmail: true,
        createdAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total, page: query.page, pageSize: query.pageSize });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (req.user.role === Role.agent && ticket.assignedToId !== req.user.id) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const data = validate(updateTicketSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (req.user.role === Role.agent) {
    if (ticket.assignedToId !== req.user.id) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if ("assignedToId" in data && data.assignedToId !== req.user.id) {
      res.status(403).json({ error: "Only admins can reassign tickets" });
      return;
    }
  }

  if (data.assignedToId) {
    const user = await prisma.user.findUnique({
      where: { id: data.assignedToId, deletedAt: null },
    });
    if (!user) {
      res.status(400).json({ error: "Invalid agent" });
      return;
    }
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...("assignedToId" in data && { assignedToId: data.assignedToId }),
      ...("status" in data && { status: data.status }),
      ...("category" in data && { category: data.category }),
    },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  broadcastSSE({
    type: "ticket:updated",
    data: updated,
  });

  res.json(updated);
});

export default router;
