import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import ErrorAlert from "@/components/ErrorAlert";
import { useSession } from "@/lib/auth-client";
import { Role } from "core/constants/role.ts";
import type { Ticket } from "core/constants/ticket.ts";

import DashboardStats, { type Stats } from "@/components/dashboard/DashboardStats";
import TicketActivityChart, { type DailyVolume } from "@/components/dashboard/TicketActivityChart";
import TicketBreakdownCard from "@/components/dashboard/TicketBreakdownCard";
import AiPerformanceCard from "@/components/dashboard/AiPerformanceCard";
import InstagramChannelCard from "@/components/dashboard/InstagramChannelCard";

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

export default function HomePage() {
  const { data: session } = useSession();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<Stats>({
    queryKey: ["ticket-stats"],
    queryFn: async () => {
      const res = await axios.get("/api/tickets/stats");
      return res.data;
    },
  });

  const {
    data: volume,
    isLoading: volumeLoading,
    error: volumeError,
  } = useQuery<DailyVolume>({
    queryKey: ["ticket-daily-volume"],
    queryFn: async () => {
      const res = await axios.get("/api/tickets/stats/daily-volume");
      return res.data;
    },
  });

  const isAgent = session?.user?.role === Role.agent || stats?.role === Role.agent;

  // Real recent tickets
  const { data: recentData, isLoading: recentLoading } = useQuery<TicketsResponse>({
    queryKey: ["dashboard-recent-tickets"],
    queryFn: async () => {
      try {
        const res = await axios.get<TicketsResponse>("/api/tickets", {
          params: { pageSize: 5, sortBy: "createdAt", sortOrder: "desc" },
        });
        return res.data;
      } catch {
        return { tickets: [], total: 0, page: 1, pageSize: 5 };
      }
    },
    retry: false,
  });

  // Query resolved count for admin if available
  const { data: resolvedData } = useQuery<{ total: number } | null>({
    queryKey: ["dashboard-resolved-count"],
    queryFn: async () => {
      try {
        const res = await axios.get("/api/tickets", {
          params: { status: "resolved", pageSize: 1 },
        });
        return res.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !isAgent,
    retry: false,
  });

  // Query closed count for admin if available
  const { data: closedData } = useQuery<{ total: number } | null>({
    queryKey: ["dashboard-closed-count"],
    queryFn: async () => {
      try {
        const res = await axios.get("/api/tickets", {
          params: { status: "closed", pageSize: 1 },
        });
        return res.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !isAgent,
    retry: false,
  });

  if (statsError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-6">
          Dashboard
        </h1>
        <ErrorAlert
          error={statsError}
          fallback="Failed to load dashboard stats"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAgent
              ? "Overview of your assigned tickets and personal performance"
              : "Overview of system activity and support metrics"}
          </p>
        </div>
      </div>

      {/* 1. Top KPI Cards */}
      <DashboardStats
        stats={stats}
        resolvedCount={resolvedData?.total}
        isLoading={statsLoading}
        isAgent={isAgent}
      />

      {/* 2. Middle Row: Ticket Activity Chart (2 cols) & Status Breakdown (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <TicketActivityChart
            volume={volume}
            isLoading={volumeLoading}
            error={volumeError}
            isAgent={isAgent}
          />
        </div>
        <div className="lg:col-span-1">
          <TicketBreakdownCard
            stats={stats}
            recentTickets={recentData?.tickets}
            resolvedCount={resolvedData?.total}
            closedCount={closedData?.total}
            isLoading={statsLoading || recentLoading}
            isAgent={isAgent}
          />
        </div>
      </div>

      {/* 3. Dedicated AI Performance Section & Instagram Channel Overview (Admin only) */}
      {!isAgent && (
        <>
          <AiPerformanceCard
            stats={stats}
            isLoading={statsLoading}
          />
          <InstagramChannelCard />
        </>
      )}
    </div>
  );
}
