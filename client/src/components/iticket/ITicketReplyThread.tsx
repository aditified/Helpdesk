import { Bot, User, Sparkles } from "lucide-react";
import type { ITicket } from "@/types/iticket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ITicketReplyThreadProps {
  ticket: ITicket;
}

export default function ITicketReplyThread({ ticket }: ITicketReplyThreadProps) {
  // All messages after the initial message are conversation replies
  const replies = (ticket.messages || []).slice(1);

  if (replies.length === 0) {
    return <p className="text-sm text-muted-foreground">No replies yet</p>;
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => {
        const isAgent = reply.senderType === "agent";
        const isAi = reply.senderType === "ai";
        const displayName = isAgent
          ? reply.senderName || "Support Agent"
          : isAi
          ? "AI Assistant"
          : ticket.displayName;

        return (
          <Card key={reply.id} className={isAgent ? "border-primary/25" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-md flex items-center justify-center ${
                    isAgent
                      ? "bg-primary/15 text-primary"
                      : isAi
                      ? "bg-purple-500/15 text-purple-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isAgent ? (
                    <Bot className="h-3.5 w-3.5" />
                  ) : isAi ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">
                    {displayName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isAgent
                      ? "Support Agent"
                      : isAi
                      ? "AI Assistant"
                      : "Customer"}{" "}
                    &middot; {new Date(reply.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {reply.text}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
