import { useState } from "react";
import type {
  ITicket,
  ITicketStatus,
  ITicketCategory,
  ITicketPriority,
  ITicketAIStatus,
} from "@/types/iticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Users,
  RefreshCw,
} from "lucide-react";
import ITicketChannelBadge from "./ITicketChannelBadge";
import { categoryLabels } from "./ITicketCategoryBadge";

interface ITicketDetailsSidebarProps {
  ticket: ITicket;
  onUpdateMetadata: (patch: {
    status?: ITicketStatus;
    category?: ITicketCategory;
    priority?: ITicketPriority;
    aiStatus?: ITicketAIStatus;
  }) => Promise<void>;
  onSummarize?: () => Promise<void>;
}

const sentimentConfigs: Record<
  string,
  { label: string; className: string }
> = {
  positive: {
    label: "Positive",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  neutral: {
    label: "Neutral",
    className: "bg-muted text-muted-foreground border-border/50",
  },
  frustrated: {
    label: "Frustrated",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  urgent: {
    label: "Urgent",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
};

export default function ITicketDetailsSidebar({
  ticket,
  onUpdateMetadata,
  onSummarize,
}: ITicketDetailsSidebarProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (!onSummarize) return;
    setIsSummarizing(true);
    try {
      await onSummarize();
    } finally {
      setIsSummarizing(false);
    }
  };

  const sentiment = sentimentConfigs[ticket.sentiment] ?? sentimentConfigs.neutral;

  return (
    <div className="space-y-4 w-full lg:w-72 shrink-0">
      {/* 1. Customer Card */}
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Customer
            </CardTitle>
            <ITicketChannelBadge compact />
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 pt-0">
          <div className="flex items-center gap-3">
            <img
              src={ticket.avatar}
              alt={ticket.displayName}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-pink-500/20"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {ticket.displayName}
              </h4>
              <a
                href={ticket.customerDetails?.profileUrl || `https://instagram.com/${ticket.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-pink-500 transition-colors inline-flex items-center gap-1 font-mono"
              >
                <span>@{ticket.username}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {ticket.customerDetails?.bio && (
            <p className="text-xs text-muted-foreground/90 bg-muted/30 p-2 rounded-lg border border-border/40">
              {ticket.customerDetails.bio}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/60 pt-2.5">
            <div>
              <span className="text-muted-foreground text-[11px] block">Followers</span>
              <span className="font-semibold text-foreground">
                {ticket.customerDetails?.followerCount?.toLocaleString() ?? "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Messages</span>
              <span className="font-semibold text-foreground">
                {ticket.messages.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Ticket Properties / Status Control */}
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Status
            </label>
            <Select
              value={ticket.status}
              onValueChange={(val) =>
                onUpdateMetadata({ status: val as ITicketStatus })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Category
            </label>
            <Select
              value={ticket.category}
              onValueChange={(val) =>
                onUpdateMetadata({ category: val as ITicketCategory })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Priority
            </label>
            <Select
              value={ticket.priority}
              onValueChange={(val) =>
                onUpdateMetadata({ priority: val as ITicketPriority })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Assigned Agent
            </label>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border/50 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>{ticket.assignedTo?.name ?? "Unassigned"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. AI Intelligence & Resolution Panel */}
      <Card className="border-primary/25 bg-gradient-to-b from-card via-card to-primary/[0.03]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Resolution</span>
            </div>
            <Badge
              variant="outline"
              className="border-primary/30 text-primary text-[10px] px-1.5 py-0"
            >
              {ticket.aiConfidence}% match
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 pt-0 text-xs">
          {/* Resolution Banner */}
          {ticket.aiStatus === "ai_resolved" && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-2.5 text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Automatically Resolved</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Knowledge base matched customer question autonomously.
                </p>
              </div>
            </div>
          )}

          {ticket.aiStatus === "escalated" && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-2.5 text-rose-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Escalated to Agent</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {ticket.escalationReason || "Requires human agent intervention."}
                </p>
              </div>
            </div>
          )}

          {ticket.aiStatus === "ai_suggested" && (
            <div className="rounded-lg bg-primary/10 border border-primary/25 p-2.5 text-primary flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">AI Suggested Reply</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Suggested draft prepared in message composer.
                </p>
              </div>
            </div>
          )}

          {/* Customer Sentiment */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Customer Sentiment</span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${sentiment.className}`}
              >
                {sentiment.label}
              </span>
            </div>
          </div>

          {/* AI Summary */}
          <div className="space-y-1.5 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground text-[11px]">
                AI Conversation Summary
              </span>
              {onSummarize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RefreshCw
                    className={`h-2.5 w-2.5 mr-1 ${
                      isSummarizing ? "animate-spin" : ""
                    }`}
                  />
                  <span>Refresh</span>
                </Button>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px] bg-muted/40 p-2.5 rounded-lg border border-border/50">
              {ticket.aiSummary}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
