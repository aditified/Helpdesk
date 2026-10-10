import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Bot } from "lucide-react";
import type { ITicket } from "@/types/iticket";
import {
  summarizeITicket,
  getITicketSuggestedReply,
} from "@/lib/iticket/iticketService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ErrorAlert from "@/components/ErrorAlert";

interface ITicketAiSectionProps {
  ticket: ITicket;
  onApplySuggestion: (text: string) => void;
}

export default function ITicketAiSection({
  ticket,
  onApplySuggestion,
}: ITicketAiSectionProps) {
  const queryClient = useQueryClient();
  const [activeSummary, setActiveSummary] = useState<string | null>(
    ticket.aiSummary || null
  );
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(
    ticket.suggestedReply || null
  );

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      return summarizeITicket(ticket.id);
    },
    onSuccess: (summary) => {
      setActiveSummary(summary);
      queryClient.invalidateQueries({ queryKey: ["i-ticket", ticket.id] });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      return getITicketSuggestedReply(ticket.id);
    },
    onSuccess: (suggestion) => {
      setActiveSuggestion(suggestion);
      queryClient.invalidateQueries({ queryKey: ["i-ticket", ticket.id] });
    },
  });

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => summarizeMutation.mutate()}
          disabled={summarizeMutation.isPending}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          {summarizeMutation.isPending ? "Summarizing..." : "Summarize"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => suggestMutation.mutate()}
          disabled={suggestMutation.isPending}
          className="gap-2"
        >
          <Bot className="h-4 w-4 text-primary" />
          {suggestMutation.isPending
            ? "Generating Suggestion..."
            : "AI Suggested Reply"}
        </Button>
      </div>

      {summarizeMutation.error && (
        <ErrorAlert
          error={summarizeMutation.error}
          fallback="Failed to generate conversation summary"
        />
      )}

      {suggestMutation.error && (
        <ErrorAlert
          error={suggestMutation.error}
          fallback="Failed to generate suggested reply"
        />
      )}

      {/* Summary card */}
      {activeSummary && (
        <Card className="border-chart-3/25 bg-chart-3/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2.5">
              <div className="h-6 w-6 rounded-md bg-chart-3/15 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-chart-3" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-chart-3 uppercase tracking-wider">
                  Conversation Summary
                </span>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {activeSummary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Reply card */}
      {activeSuggestion && (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI Suggested Reply
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs gap-1.5"
                onClick={() => onApplySuggestion(activeSuggestion)}
              >
                Insert into Reply
              </Button>
            </div>
            <p className="text-sm italic text-foreground leading-relaxed bg-background/60 p-3 rounded-md border border-border/50 whitespace-pre-wrap">
              &ldquo;{activeSuggestion}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
