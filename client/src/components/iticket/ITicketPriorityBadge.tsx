import type { ITicketPriority } from "@/types/iticket";
import { AlertCircle, Flame, ArrowUp, ArrowDown } from "lucide-react";

interface PriorityConfig {
  label: string;
  className: string;
  icon?: typeof ArrowUp;
}

const priorityConfigs: Record<ITicketPriority, PriorityConfig> = {
  low: {
    label: "Low",
    className: "bg-muted/70 text-muted-foreground border-border/50",
    icon: ArrowDown,
  },
  medium: {
    label: "Medium",
    className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    icon: ArrowUp,
  },
  high: {
    label: "High",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: AlertCircle,
  },
  urgent: {
    label: "Urgent",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: Flame,
  },
};

export default function ITicketPriorityBadge({
  priority,
  showIcon = true,
  className = "",
}: {
  priority: ITicketPriority;
  showIcon?: boolean;
  className?: string;
}) {
  const config = priorityConfigs[priority] ?? {
    label: priority,
    className: "bg-muted text-muted-foreground",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {showIcon && Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
