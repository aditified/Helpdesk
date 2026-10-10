import { useRef, useEffect } from "react";
import type { ITicket } from "@/types/iticket";
import {
  Bot,
  User,
  Sparkles,
  Instagram,
  CheckCheck,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ITicketConversationViewProps {
  ticket: ITicket;
}

export default function ITicketConversationView({
  ticket,
}: ITicketConversationViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages]);

  return (
    <div className="space-y-4">
      {/* Top Banner for Conversation State & Channel Info */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-card border border-border/70 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Connected via <strong className="text-foreground">Instagram Direct</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Clock className="h-3 w-3" />
          <span>Thread started {new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="space-y-4 min-h-[300px]">
        {ticket.messages.map((msg, index) => {
          const isCustomer = msg.senderType === "customer";
          const isAi = msg.senderType === "ai";
          const isAgent = msg.senderType === "agent";

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${
                isCustomer ? "items-start" : "items-end"
              } space-y-1`}
            >
              {/* Header meta */}
              <div
                className={`flex items-center gap-2 text-xs text-muted-foreground px-1 ${
                  isCustomer ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    isCustomer
                      ? "bg-muted text-foreground ring-1 ring-border"
                      : isAi
                      ? "bg-primary/15 text-primary"
                      : "bg-sky-500/15 text-sky-400"
                  }`}
                >
                  {isCustomer ? (
                    <Instagram className="h-3 w-3 text-pink-500" />
                  ) : isAi ? (
                    <Bot className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </div>

                <span className="font-medium text-foreground">
                  {isCustomer
                    ? ticket.displayName
                    : isAi
                    ? "AI Assistant"
                    : msg.senderName || "Support Agent"}
                </span>

                {isCustomer && (
                  <span className="font-mono text-[11px]">@{ticket.username}</span>
                )}

                {isAi && (
                  <Badge
                    variant="outline"
                    className="h-4 text-[10px] px-1.5 border-primary/30 text-primary bg-primary/5"
                  >
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    Auto-reply
                  </Badge>
                )}

                {isAgent && (
                  <Badge
                    variant="outline"
                    className="h-4 text-[10px] px-1.5 border-sky-500/30 text-sky-400 bg-sky-500/5"
                  >
                    Staff
                  </Badge>
                )}

                <span className="text-[11px]">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Message Bubble Card */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                  isCustomer
                    ? "bg-card border border-border/80 text-foreground rounded-tl-sm"
                    : isAi
                    ? "bg-primary/[0.04] border border-primary/25 text-foreground rounded-tr-sm"
                    : "bg-card border border-sky-500/25 text-foreground rounded-tr-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* AI Confidence footnote if applicable */}
                {isAi && msg.aiConfidence && (
                  <div className="mt-2 pt-2 border-t border-primary/10 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-primary">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Knowledge Base Match</span>
                    </span>
                    <span className="font-mono">{msg.aiConfidence}% confidence</span>
                  </div>
                )}

                {/* Read receipt / channel indicator */}
                <div
                  className={`mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/80 ${
                    isCustomer ? "justify-start" : "justify-end"
                  }`}
                >
                  {isCustomer ? (
                    <span>Sent via Instagram Direct</span>
                  ) : (
                    <>
                      <span>Delivered to Instagram</span>
                      <CheckCheck className="h-3 w-3 text-emerald-500" />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
