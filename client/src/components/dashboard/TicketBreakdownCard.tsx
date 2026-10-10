import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Layers } from "lucide-react";
import type { Stats } from "./DashboardStats";
import type { Ticket } from "core/constants/ticket";
import { categoryLabel } from "core/constants/ticket-category";

interface TicketBreakdownCardProps {
  stats?: Stats;
  recentTickets?: Ticket[];
  resolvedCount?: number;
  closedCount?: number;
  isLoading: boolean;
  isAgent: boolean;
}

export default function TicketBreakdownCard({
  stats,
  recentTickets = [],
  resolvedCount,
  closedCount = 0,
  isLoading,
  isAgent,
}: TicketBreakdownCardProps) {
  const total = stats?.totalTickets || 1;
  const openCount = stats?.openTickets ?? 0;
  const effectiveResolved = isAgent
    ? (stats?.resolvedTickets ?? 0)
    : resolvedCount !== undefined
      ? resolvedCount
      : stats
        ? Math.max(0, stats.totalTickets - stats.openTickets)
        : 0;

  const openPct = Math.min(100, Math.round((openCount / total) * 100)) || 0;
  const resolvedPct = Math.min(100, Math.round((effectiveResolved / total) * 100)) || 0;
  const closedPct = Math.min(100, Math.round((closedCount / total) * 100)) || 0;

  // Derive categories from real available recent tickets
  const categoryCounts = recentTickets.reduce(
    (acc, t) => {
      if (t.category) {
        acc[t.category] = (acc[t.category] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card className="border-border/60 flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Status Breakdown
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Current ticket health and categories
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              {/* Status Bars */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Open
                    </span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{openCount}</strong> ({openPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${openPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Resolved
                    </span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{effectiveResolved}</strong> ({resolvedPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${resolvedPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                      Closed
                    </span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{closedCount}</strong> ({closedPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-muted-foreground/60 rounded-full transition-all duration-300"
                      style={{ width: `${closedPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Categories Section */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(categoryLabel).map((catKey) => {
                    const count = categoryCounts[catKey] ?? 0;
                    return (
                      <span
                        key={catKey}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-secondary/80 text-secondary-foreground border border-border/40"
                      >
                        {categoryLabel[catKey as keyof typeof categoryLabel]}
                        {count > 0 && (
                          <span className="font-semibold text-primary">
                            {count}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </div>

      <div className="px-6 pb-4 pt-1">
        <Link
          to="/tickets"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium transition-colors"
        >
          Manage tickets in table <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
