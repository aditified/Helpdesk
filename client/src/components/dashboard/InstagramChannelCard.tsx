import { useQuery } from "@tanstack/react-query";
import { fetchITicketStats } from "@/lib/iticket/iticketService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Instagram,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function InstagramChannelCard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["i-ticket-stats"],
    queryFn: fetchITicketStats,
  });

  const kpis = [
    {
      title: "i-Tickets",
      value: stats?.totalITickets,
      subtext: "Total Instagram chats",
      icon: Instagram,
      iconColor: "text-pink-500",
      iconBg: "bg-pink-500/10",
    },
    {
      title: "AI Resolved",
      value: stats ? `${stats.aiResolvedRate}%` : undefined,
      subtext: "Auto-handled autonomously",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-400/10",
    },
    {
      title: "Awaiting Reply",
      value: stats?.awaitingReply,
      subtext: "Pending agent response",
      icon: Clock,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10",
    },
    {
      title: "Escalated",
      value: stats?.escalated,
      subtext: "Action required by admin",
      icon: AlertTriangle,
      iconColor: "text-rose-400",
      iconBg: "bg-rose-400/10",
    },
  ];

  return (
    <Card className="border-pink-500/20 bg-gradient-to-b from-card via-card to-pink-500/[0.02]">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-pink-500/15 text-pink-500 flex items-center justify-center">
              <Instagram className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold">
              Instagram DM Support (i-Ticket)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Direct message support channel & autonomous Instagram resolution
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* KPI metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.title}
              className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div
                  className={`h-6 w-6 rounded-md ${kpi.iconBg} flex items-center justify-center`}
                >
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
                </div>
              </div>
              <div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {kpi.value ?? "—"}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
