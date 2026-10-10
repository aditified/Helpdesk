import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TicketIcon,
  CircleDot,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";

export interface Stats {
  role?: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets?: number;
  closedTickets?: number;
  resolutionRate?: number;
  totalReplies?: number;
  resolvedByAI: number;
  aiResolutionRate: number;
  avgResolutionTime: number;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "N/A";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface DashboardStatsProps {
  stats?: Stats;
  resolvedCount?: number;
  isLoading: boolean;
  isAgent: boolean;
}

export default function DashboardStats({
  stats,
  resolvedCount,
  isLoading,
  isAgent,
}: DashboardStatsProps) {
  // Safe derivation for resolved count when in admin mode
  const effectiveResolved = isAgent
    ? stats?.resolvedTickets
    : resolvedCount !== undefined
      ? resolvedCount
      : stats
        ? Math.max(0, stats.totalTickets - stats.openTickets)
        : undefined;

  const effectiveResolutionRate = isAgent
    ? stats ? `${stats.resolutionRate}%` : undefined
    : stats && stats.totalTickets > 0 && effectiveResolved !== undefined
      ? `${Math.round((effectiveResolved / stats.totalTickets) * 100)}%`
      : stats ? `${stats.aiResolutionRate}%` : undefined;

  const cards = isAgent
    ? [
        {
          title: "Assigned Tickets",
          value: stats?.totalTickets,
          subtext: "In your queue",
          icon: TicketIcon,
          iconColor: "text-primary",
          iconBg: "bg-primary/10",
        },
        {
          title: "Open Tickets",
          value: stats?.openTickets,
          subtext: "Awaiting action",
          icon: CircleDot,
          iconColor: "text-amber-400",
          iconBg: "bg-amber-400/10",
        },
        {
          title: "Resolved by Me",
          value: stats?.resolvedTickets,
          subtext: "Successfully closed",
          icon: CheckCircle2,
          iconColor: "text-emerald-400",
          iconBg: "bg-emerald-400/10",
        },
        {
          title: "Resolution Rate",
          value: stats ? `${stats.resolutionRate}%` : undefined,
          subtext: "Personal efficiency",
          icon: TrendingUp,
          iconColor: "text-sky-400",
          iconBg: "bg-sky-400/10",
        },
        {
          title: "Avg Resolution Time",
          value: stats ? formatDuration(stats.avgResolutionTime) : undefined,
          subtext: "Average handling speed",
          icon: Clock,
          iconColor: "text-purple-400",
          iconBg: "bg-purple-400/10",
        },
      ]
    : [
        {
          title: "Total Tickets",
          value: stats?.totalTickets,
          subtext: "All tickets in system",
          icon: TicketIcon,
          iconColor: "text-primary",
          iconBg: "bg-primary/10",
        },
        {
          title: "Open Tickets",
          value: stats?.openTickets,
          subtext: "Requires attention",
          icon: CircleDot,
          iconColor: "text-amber-400",
          iconBg: "bg-amber-400/10",
        },
        {
          title: "Resolved Tickets",
          value: effectiveResolved,
          subtext: stats ? `${stats.resolvedByAI ?? 0} auto-resolved by AI` : "Completed",
          icon: CheckCircle2,
          iconColor: "text-emerald-400",
          iconBg: "bg-emerald-400/10",
        },
        {
          title: "Resolution Rate",
          value: effectiveResolutionRate,
          subtext: "Overall rate",
          icon: TrendingUp,
          iconColor: "text-sky-400",
          iconBg: "bg-sky-400/10",
        },
        {
          title: "Avg Resolution Time",
          value: stats ? formatDuration(stats.avgResolutionTime) : undefined,
          subtext: "Creation to resolution",
          icon: Clock,
          iconColor: "text-purple-400",
          iconBg: "bg-purple-400/10",
        },
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="border-border/60 hover:border-primary/40 transition-all duration-200 group"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <div
                className={`h-8 w-8 rounded-lg ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}
              >
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {card.value ?? "—"}
              </p>
            )}
            <p className="text-[12px] text-muted-foreground truncate">
              {card.subtext}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
