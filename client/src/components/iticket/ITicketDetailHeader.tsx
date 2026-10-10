import type { ITicket } from "@/types/iticket";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ITicketStatusBadge from "@/components/iticket/ITicketStatusBadge";

interface ITicketDetailHeaderProps {
  ticket: ITicket;
}

export default function ITicketDetailHeader({ ticket }: ITicketDetailHeaderProps) {
  const firstMessage = ticket.messages?.[0];
  const initialText = firstMessage?.text || ticket.lastMessage || ticket.subject || "No message content";
  const displaySubject =
    ticket.subject ||
    (initialText.length > 70 ? initialText.slice(0, 70) + "..." : initialText) ||
    "Instagram Conversation";

  return (
    <>
      <div>
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-2xl font-semibold tracking-tight flex-1">
            {displaySubject}
          </h1>
          <ITicketStatusBadge status={ticket.status} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">From:</span>{" "}
            {ticket.displayName} (@{ticket.username})
          </div>
          <div>
            <span className="font-medium text-foreground">Created:</span>{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium text-foreground">Updated:</span>{" "}
            {new Date(ticket.updatedAt || ticket.lastMessageAt).toLocaleString()}
          </div>
        </div>
      </div>

      <Card className="py-0 gap-0">
        <CardHeader className="py-2.5 px-5 border-b flex flex-row items-center !pb-2.5">
          <span className="text-xs text-muted-foreground font-medium">Message</span>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {initialText}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
