import type { ITicketStatus } from "@/types/iticket";

const statusStyles: Record<ITicketStatus, string> = {
  open: "bg-pink-400/15 text-pink-400",
  processing: "bg-amber-500/15 text-amber-400",
  resolved: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<ITicketStatus, string> = {
  open: "Open",
  processing: "Processing",
  resolved: "Resolved",
  closed: "Closed",
};

export default function ITicketStatusBadge({
  status,
  className = "",
}: {
  status: ITicketStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border-0 px-2 py-0.5 text-xs font-medium ${
        statusStyles[status] ?? "bg-muted text-muted-foreground"
      } ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status] ?? status}
    </span>
  );
}
