import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import type { ITicket, ITicketStatus, ITicketCategory } from "@/types/iticket";
import { updateITicket } from "@/lib/iticket/iticketService";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Agent {
  id: string;
  name: string;
}

interface ITicketSidebarProps {
  ticket: ITicket;
}

const statusOptions: { value: ITicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "processing", label: "Processing" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const categoryOptions: { value: ITicketCategory; label: string }[] = [
  { value: "general_query", label: "General Query" },
  { value: "account", label: "Account & Access" },
  { value: "admission", label: "Admission" },
  { value: "fees", label: "Fees / Financial" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
];

export default function ITicketSidebar({ ticket }: ITicketSidebarProps) {
  const queryClient = useQueryClient();

  const { data: agentsData } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      try {
        const { data } = await axios.get<{ agents: Agent[] }>("/api/agents");
        return data;
      } catch {
        return { agents: [] };
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<ITicket>) => {
      return updateITicket(ticket.id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["i-ticket", ticket.id] });
      queryClient.invalidateQueries({ queryKey: ["i-tickets"] });
    },
  });

  return (
    <div className="w-56 space-y-4 shrink-0">
      <Card className="w-full h-fit">
        <CardContent className="pt-5 space-y-5">
          {/* STATUS */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Status
            </span>
            <Select
              value={ticket.status}
              onValueChange={(value) =>
                updateMutation.mutate({ status: value as ITicketStatus })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CATEGORY */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Category
            </span>
            <Select
              value={ticket.category}
              onValueChange={(value) =>
                updateMutation.mutate({ category: value as ITicketCategory })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ASSIGNED TO */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Assigned To
            </span>
            <Select
              value={ticket.assignedTo?.id ?? "unassigned"}
              onValueChange={(value) =>
                updateMutation.mutate({
                  assignedTo:
                    value === "unassigned"
                      ? null
                      : agentsData?.agents.find((a) => a.id === value) || null,
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agentsData?.agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer profile card */}
      <Card className="w-full h-fit">
        <CardContent className="pt-4 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Customer
          </div>
          <div className="flex items-center gap-2.5">
            <img
              src={ticket.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={ticket.displayName}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold truncate text-foreground">
                  {ticket.displayName}
                </span>
                {ticket.customerDetails?.isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                )}
              </div>
              <div className="text-xs text-muted-foreground font-mono truncate">
                @{ticket.username}
              </div>
            </div>
          </div>

          {ticket.customerDetails?.followerCount !== undefined && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
              <span>Followers</span>
              <span className="font-semibold text-foreground">
                {ticket.customerDetails.followerCount.toLocaleString()}
              </span>
            </div>
          )}

          {ticket.customerDetails?.profileUrl && (
            <a
              href={ticket.customerDetails.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1"
            >
              Instagram Profile <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Channel</span>
            <span className="font-medium text-pink-500 inline-flex items-center gap-1 text-[11px]">
              Direct DM Sync
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
