import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ITicket } from "@/types/iticket";
import {
  sendITicketReply,
  polishITicketReply,
} from "@/lib/iticket/iticketService";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ErrorAlert from "@/components/ErrorAlert";

interface ITicketReplyFormProps {
  ticket: ITicket;
  externalDraft?: string;
  onDraftApplied?: () => void;
}

export default function ITicketReplyForm({
  ticket,
  externalDraft = "",
  onDraftApplied,
}: ITicketReplyFormProps) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (externalDraft) {
      setBody(externalDraft);
      onDraftApplied?.();
    }
  }, [externalDraft, onDraftApplied]);

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      return sendITicketReply(ticket.id, text, "Support Agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["i-ticket", ticket.id] });
      queryClient.invalidateQueries({ queryKey: ["i-tickets"] });
      setBody("");
    },
  });

  const polishMutation = useMutation({
    mutationFn: async () => {
      return polishITicketReply(ticket.id, body);
    },
    onSuccess: (polished) => {
      setBody(polished);
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!body.trim() || replyMutation.isPending) return;
    replyMutation.mutate(body);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyMutation.error && (
        <ErrorAlert
          error={replyMutation.error}
          fallback="Failed to send reply"
        />
      )}
      {polishMutation.error && (
        <ErrorAlert
          error={polishMutation.error}
          fallback="Failed to polish reply"
        />
      )}

      <div className="space-y-1">
        <Textarea
          placeholder="Type your reply..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={
            !body.trim() ||
            polishMutation.isPending ||
            replyMutation.isPending
          }
          onClick={() => polishMutation.mutate()}
        >
          {polishMutation.isPending ? "Polishing..." : "Polish"}
        </Button>

        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={
            !body.trim() ||
            replyMutation.isPending ||
            polishMutation.isPending
          }
        >
          {replyMutation.isPending ? "Sending..." : "Send Reply"}
        </Button>
      </div>
    </form>
  );
}
