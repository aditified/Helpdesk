export type ITicketStatus = "open" | "processing" | "resolved" | "closed";

export type ITicketPriority = "low" | "medium" | "high" | "urgent";

export type ITicketCategory =
  | "admission"
  | "fees"
  | "technical_issue"
  | "account"
  | "general_query"
  | "complaint"
  | "other";

export type ITicketAIStatus =
  | "ai_resolved"
  | "ai_suggested"
  | "human_replied"
  | "awaiting_reply"
  | "escalated";

export type ITicketSenderType = "customer" | "ai" | "agent";

export type ITicketSentiment = "positive" | "neutral" | "frustrated" | "urgent";

export interface ITicketAttachment {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
  size?: string;
}

export interface ITicketMessage {
  id: string;
  ticketId: string;
  senderType: ITicketSenderType;
  senderName: string;
  senderUsername?: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isAiGenerated?: boolean;
  aiConfidence?: number;
  attachments?: ITicketAttachment[];
}

export interface ITicketCustomerDetails {
  bio?: string;
  followerCount?: number;
  isVerified?: boolean;
  connectedSince?: string;
  profileUrl?: string;
}

export interface ITicket {
  id: string;
  channel: "instagram";
  username: string; // e.g. "rahulsharma"
  displayName: string; // e.g. "Rahul Sharma"
  subject?: string;
  avatar: string;
  customerDetails?: ITicketCustomerDetails;
  category: ITicketCategory;
  priority: ITicketPriority;
  status: ITicketStatus;
  aiStatus: ITicketAIStatus;
  aiConfidence: number; // percentage 0-100
  aiSummary: string;
  suggestedReply?: string;
  sentiment: ITicketSentiment;
  unread: boolean;
  assignedTo?: { id: string; name: string } | null;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  escalationReason?: string;
  messages: ITicketMessage[];
}

export interface ITicketFiltersState {
  search?: string;
  status?: ITicketStatus | "all";
  category?: ITicketCategory | "all";
  priority?: ITicketPriority | "all";
  aiStatus?: ITicketAIStatus | "all";
  unreadOnly?: boolean;
}

export interface ITicketStats {
  totalITickets: number;
  aiResolvedRate: number; // e.g. 84%
  awaitingReply: number; // e.g. 12
  escalated: number; // e.g. 9
  avgResponseTimeMinutes: number;
}
