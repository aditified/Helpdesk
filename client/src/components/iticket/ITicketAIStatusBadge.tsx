import type { ITicketAIStatus } from "@/types/iticket";
import { Bot, Sparkles, UserCheck, Clock, AlertTriangle } from "lucide-react";

interface AIStatusConfig {
  label: string;
  className: string;
  icon: typeof Bot;
}

const aiStatusConfigs: Record<ITicketAIStatus, AIStatusConfig> = {
  ai_resolved: {
    label: "AI Resolved",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: Bot,
  },
  ai_suggested: {
    label: "AI Suggested",
    className: "bg-primary/10 text-primary border-primary/30",
    icon: Sparkles,
  },
  human_replied: {
    label: "Human Replied",
    className: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    icon: UserCheck,
  },
  awaiting_reply: {
    label: "Awaiting Reply",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  escalated: {
    label: "Escalated",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    icon: AlertTriangle,
  },
};

export default function ITicketAIStatusBadge({
  aiStatus,
  className = "",
}: {
  aiStatus: ITicketAIStatus;
  className?: string;
}) {
  const config = aiStatusConfigs[aiStatus] ?? {
    label: aiStatus,
    className: "bg-muted text-muted-foreground border-border/40",
    icon: Bot,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide transition-colors ${config.className} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
