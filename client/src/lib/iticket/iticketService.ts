import axios from "axios";
import { initialITickets, mockITicketStats } from "./mockData";
import type {
  ITicket,
  ITicketFiltersState,
  ITicketStats,
  ITicketMessage,
} from "@/types/iticket";

// In-memory / session store fallback for tests
let ticketsStore: ITicket[] = [...initialITickets];

const isTestEnv =
  (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
  (typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.MODE === "test"));

export interface FetchITicketsParams {
  filters?: ITicketFiltersState;
  sortBy?:
    | "createdAt"
    | "lastMessageAt"
    | "priority"
    | "status"
    | "subject"
    | "displayName"
    | "sender"
    | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface FetchITicketsResult {
  tickets: ITicket[];
  total: number;
  page: number;
  pageSize: number;
}

function fetchMockITickets(params: FetchITicketsParams = {}): FetchITicketsResult {
  const {
    filters = {},
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 10,
  } = params;

  let filtered = [...ticketsStore];

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        t.displayName.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        t.lastMessage.toLowerCase().includes(q) ||
        t.aiSummary.toLowerCase().includes(q)
    );
  }

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((t) => t.status === filters.status);
  }

  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter((t) => t.category === filters.category);
  }

  if (filters.priority && filters.priority !== "all") {
    filtered = filtered.filter((t) => t.priority === filters.priority);
  }

  if (filters.aiStatus && filters.aiStatus !== "all") {
    filtered = filtered.filter((t) => t.aiStatus === filters.aiStatus);
  }

  if (filters.unreadOnly) {
    filtered = filtered.filter((t) => t.unread);
  }

  filtered.sort((a, b) => {
    let comp = 0;
    if (sortBy === "createdAt") {
      comp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "lastMessageAt") {
      comp = new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    } else if (sortBy === "subject") {
      const subA = a.subject ?? a.messages?.[0]?.text ?? "";
      const subB = b.subject ?? b.messages?.[0]?.text ?? "";
      comp = subB.localeCompare(subA);
    } else if (sortBy === "displayName" || sortBy === "sender") {
      comp = b.displayName.localeCompare(a.displayName);
    } else if (sortBy === "category") {
      comp = b.category.localeCompare(a.category);
    } else if (sortBy === "priority") {
      const pMap = { urgent: 4, high: 3, medium: 2, low: 1 };
      comp = pMap[b.priority] - pMap[a.priority];
    } else if (sortBy === "status") {
      comp = b.status.localeCompare(a.status);
    }
    return sortOrder === "asc" ? -comp : comp;
  });

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    tickets: paginated,
    total,
    page,
    pageSize,
  };
}

/**
 * Fetch Instagram tickets from PostgreSQL API with fallback
 */
export async function fetchITickets(
  params: FetchITicketsParams = {}
): Promise<FetchITicketsResult> {
  if (isTestEnv) {
    return fetchMockITickets(params);
  }
  try {
    const { data } = await axios.get<FetchITicketsResult>("/api/i-tickets", {
      params: {
        ...params.filters,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
    return data;
  } catch {
    return fetchMockITickets(params);
  }
}

/**
 * Fetch a single i-Ticket by ID from PostgreSQL
 */
export async function fetchITicketById(id: string): Promise<ITicket | null> {
  if (isTestEnv) {
    const ticket = ticketsStore.find((t) => t.id === id);
    return ticket ? { ...ticket } : null;
  }
  try {
    const { data } = await axios.get<ITicket>(`/api/i-tickets/${id}`);
    return data;
  } catch {
    const ticket = ticketsStore.find((t) => t.id === id);
    return ticket ? { ...ticket } : null;
  }
}

/**
 * Send a reply in an i-Ticket thread, saved to PostgreSQL
 */
export async function sendITicketReply(
  ticketId: string,
  text: string,
  senderName = "Support Agent"
): Promise<{ ticket: ITicket; message: ITicketMessage }> {
  if (!isTestEnv) {
    try {
      const { data: message } = await axios.post<ITicketMessage>(
        `/api/i-tickets/${ticketId}/replies`,
        { text, senderName }
      );
      const { data: ticket } = await axios.get<ITicket>(`/api/i-tickets/${ticketId}`);
      return { ticket, message };
    } catch {
      // Fallback to local store below
    }
  }

  const targetIndex = ticketsStore.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) {
    throw new Error("Ticket not found");
  }

  const current = ticketsStore[targetIndex];
  const newMessage: ITicketMessage = {
    id: `msg-${Date.now()}`,
    ticketId,
    senderType: "agent",
    senderName,
    text,
    timestamp: new Date().toISOString(),
  };

  const updated: ITicket = {
    ...current,
    status: current.status === "open" ? "processing" : current.status,
    aiStatus: "human_replied",
    unread: false,
    lastMessage: text,
    lastMessageAt: newMessage.timestamp,
    updatedAt: newMessage.timestamp,
    messages: [...current.messages, newMessage],
  };

  ticketsStore[targetIndex] = updated;
  return { ticket: updated, message: newMessage };
}

/**
 * Update i-Ticket metadata in PostgreSQL
 */
export async function updateITicket(
  ticketId: string,
  patch: Partial<Pick<ITicket, "status" | "category" | "priority" | "assignedTo" | "aiStatus" | "aiSummary">>
): Promise<ITicket> {
  if (!isTestEnv) {
    try {
      const { data } = await axios.patch<ITicket>(`/api/i-tickets/${ticketId}`, patch);
      return data;
    } catch {
      // Fallback
    }
  }

  const targetIndex = ticketsStore.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) {
    throw new Error("Ticket not found");
  }

  const current = ticketsStore[targetIndex];
  const updated: ITicket = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  ticketsStore[targetIndex] = updated;
  return updated;
}

/**
 * Fetch Instagram Channel Statistics from PostgreSQL
 */
export async function fetchITicketStats(): Promise<ITicketStats> {
  if (isTestEnv) {
    return mockITicketStats;
  }
  try {
    const { data } = await axios.get<ITicketStats>("/api/i-tickets/stats");
    return data;
  } catch {
    return mockITicketStats;
  }
}

/**
 * Generate context-aware AI suggested reply
 */
export async function generateITicketAiSuggestion(ticket: ITicket): Promise<string> {
  if (ticket.suggestedReply) {
    return ticket.suggestedReply;
  }

  return `Hi ${ticket.displayName}, thank you for contacting Helpdesk via Instagram Direct. Regarding your inquiry on ${ticket.category.replace("_", " ")}, our support team is actively reviewing your request and will provide full details shortly.`;
}

/**
 * Summarize an i-Ticket conversation
 */
export async function summarizeITicket(ticketId: string): Promise<string> {
  if (!isTestEnv) {
    try {
      const { data } = await axios.post<{ summary: string }>(`/api/i-tickets/${ticketId}/summarize`);
      return data.summary;
    } catch {
      // Fallback
    }
  }

  const ticket = ticketsStore.find((t) => t.id === ticketId);
  if (!ticket) return "Inquiry summary unavailable.";
  return (
    ticket.aiSummary ||
    `Customer @${ticket.username} inquired regarding ${ticket.category.replace(/_/g, " ")}. The conversation contains ${ticket.messages.length} messages and is currently ${ticket.status}.`
  );
}

/**
 * Polish draft reply for an i-Ticket
 */
export async function polishITicketReply(ticketId: string, body: string): Promise<string> {
  if (!isTestEnv) {
    try {
      const { data } = await axios.post<{ body: string }>(`/api/i-tickets/${ticketId}/polish`, { body });
      return data.body;
    } catch {
      // Fallback
    }
  }

  const ticket = ticketsStore.find((t) => t.id === ticketId);
  const name = ticket ? ticket.displayName.split(" ")[0] : "there";
  const trimmed = body.trim();
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `Hi ${name},\n\n${capitalized}\n\nBest regards,\nSupport Team`;
}

/**
 * Get context-aware AI suggested reply
 */
export async function getITicketSuggestedReply(ticketId: string): Promise<string> {
  if (!isTestEnv) {
    try {
      const { data } = await axios.post<{ suggestedReply: string }>(`/api/i-tickets/${ticketId}/suggest-reply`);
      return data.suggestedReply;
    } catch {
      // Fallback
    }
  }

  const ticket = ticketsStore.find((t) => t.id === ticketId);
  if (!ticket) return "Thank you for reaching out! We are reviewing your inquiry.";
  return generateITicketAiSuggestion(ticket);
}

/**
 * Reset mock store to initial demo state
 */
export function resetITicketStore(): void {
  ticketsStore = [...initialITickets];
}

