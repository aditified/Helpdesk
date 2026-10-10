import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Bot, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { Stats } from "./DashboardStats";
import { formatDuration } from "./DashboardStats";

interface AiPerformanceCardProps {
  stats?: Stats;
  isLoading: boolean;
}

export default function AiPerformanceCard({
  stats,
  isLoading,
}: AiPerformanceCardProps) {
  const resolvedByAI = stats?.resolvedByAI ?? 0;
  const aiResolutionRate = stats?.aiResolutionRate ?? 0;
  const avgResolutionTime = stats ? formatDuration(stats.avgResolutionTime) : "N/A";

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-card via-card to-primary/[0.03]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold">
              AI Performance
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Autonomous ticket triage, classification, and resolution
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/5 text-xs font-normal flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AI Agent Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Resolved by AI */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Resolved by AI</span>
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {resolvedByAI}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Tickets auto-resolved end-to-end
              </p>
            </div>
          </div>

          {/* Metric 2: AI Resolution Rate */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">AI Resolution Rate</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {aiResolutionRate}%
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, aiResolutionRate)}%` }}
                    />
                  </div>
                </>
              )}
              <p className="text-[11px] text-muted-foreground pt-0.5">
                Of resolved tickets handled autonomously
              </p>
            </div>
          </div>

          {/* Metric 3: Avg Resolution Time */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg Resolution Time</span>
              <Clock className="h-4 w-4 text-purple-400" />
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {avgResolutionTime}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                Turnaround on knowledge base matches
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
