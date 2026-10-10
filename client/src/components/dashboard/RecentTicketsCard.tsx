import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import { ArrowRight, Inbox } from "lucide-react";
import type { Ticket } from "core/constants/ticket";
import { categoryLabel } from "core/constants/ticket-category";

interface RecentTicketsCardProps {
  tickets?: Ticket[];
  isLoading: boolean;
  isAgent: boolean;
}

export default function RecentTicketsCard({
  tickets = [],
  isLoading,
  isAgent,
}: RecentTicketsCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">
            Recent Tickets
          </CardTitle>
          <CardDescription className="text-xs">
            {isAgent
              ? "Latest tickets assigned to you"
              : "Latest inbound customer requests"}
          </CardDescription>
        </div>
        <Link
          to="/tickets"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No recent tickets
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
              All caught up! New inbound tickets will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {!isAgent && <TableHead>Assignee</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="border-border/40 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{ticket.id}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors truncate block"
                        title={ticket.subject}
                      >
                        {ticket.subject}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[160px]">
                        <p className="text-xs font-medium text-foreground">
                          {ticket.senderName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {ticket.senderEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.category ? (
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-normal"
                        >
                          {categoryLabel[ticket.category]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    {!isAgent && (
                      <TableCell className="text-xs text-muted-foreground">
                        {ticket.assignedTo?.name ?? (
                          <span className="italic text-muted-foreground/70">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
