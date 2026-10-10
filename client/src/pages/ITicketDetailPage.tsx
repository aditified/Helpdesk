import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchITicketById } from "@/lib/iticket/iticketService";
import BackLink from "@/components/BackLink";
import ErrorAlert from "@/components/ErrorAlert";
import TicketDetailSkeleton from "@/components/TicketDetailSkeleton";
import ITicketDetailHeader from "@/components/iticket/ITicketDetailHeader";
import ITicketAiSection from "@/components/iticket/ITicketAiSection";
import ITicketReplyThread from "@/components/iticket/ITicketReplyThread";
import ITicketReplyForm from "@/components/iticket/ITicketReplyForm";
import ITicketSidebar from "@/components/iticket/ITicketSidebar";

export default function ITicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [draftReply, setDraftReply] = useState("");

  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["i-ticket", id],
    queryFn: () => (id ? fetchITicketById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });

  return (
    <div className="space-y-6">
      <BackLink to="/i-tickets">Back to i-Tickets</BackLink>

      {isLoading && <TicketDetailSkeleton />}

      {error && <ErrorAlert message="Instagram conversation not found" />}

      {ticket && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          <div className="space-y-6 min-w-0">
            {/* Header and Original Message */}
            <ITicketDetailHeader ticket={ticket} />

            {/* AI Conversation Summarize & Suggested Reply */}
            <ITicketAiSection
              ticket={ticket}
              onApplySuggestion={(text) => setDraftReply(text)}
            />

            {/* Replies Thread */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Replies</h2>
              <ITicketReplyThread ticket={ticket} />
            </div>

            {/* Add a Reply Section */}
            <div className="space-y-3 pb-16">
              <h2 className="text-base font-semibold">Add a Reply</h2>
              <ITicketReplyForm
                ticket={ticket}
                externalDraft={draftReply}
                onDraftApplied={() => setDraftReply("")}
              />
            </div>
          </div>

          {/* Right Sidebar: Status, Category, Assignee, Customer details */}
          <ITicketSidebar ticket={ticket} />
        </div>
      )}
    </div>
  );
}
