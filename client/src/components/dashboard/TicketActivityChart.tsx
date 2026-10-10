import { useState, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorAlert from "@/components/ErrorAlert";

export interface DailyVolume {
  data: { date: string; tickets: number }[];
}

const chartConfig = {
  tickets: {
    label: "Tickets",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface TicketActivityChartProps {
  volume?: DailyVolume;
  isLoading: boolean;
  error: Error | null;
  isAgent: boolean;
}

export default function TicketActivityChart({
  volume,
  isLoading,
  error,
  isAgent,
}: TicketActivityChartProps) {
  const [timeframe, setTimeframe] = useState<7 | 30>(30);

  const chartData = useMemo(() => {
    if (!volume?.data) return [];
    if (timeframe === 7) {
      return volume.data.slice(-7);
    }
    return volume.data;
  }, [volume, timeframe]);

  const totalInPeriod = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.tickets || 0), 0);
  }, [chartData]);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              Ticket Activity
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[11px] font-normal text-muted-foreground border-border/60"
            >
              {isAgent ? "Your Daily Tickets" : "Tickets Per Day"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Ticket volume over time &middot;{" "}
            <span className="text-foreground font-medium">
              {totalInPeriod} tickets
            </span>{" "}
            in last {timeframe} days
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 p-1 rounded-lg border border-border/50">
          <Button
            variant={timeframe === 7 ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs font-medium"
            onClick={() => setTimeframe(7)}
          >
            7 Days
          </Button>
          <Button
            variant={timeframe === 30 ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs font-medium"
            onClick={() => setTimeframe(30)}
          >
            30 Days
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {error ? (
          <ErrorAlert error={error} fallback="Failed to load chart data" />
        ) : isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ticketAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border/40"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => {
                  const d = new Date(value + "T00:00:00");
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string) => {
                      const d = new Date(value + "T00:00:00");
                      return d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="tickets"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#ticketAreaGradient)"
                activeDot={{ r: 4, className: "fill-primary stroke-background" }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
