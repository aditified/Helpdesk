import { Instagram } from "lucide-react";

export default function ITicketChannelBadge({
  username,
  compact = false,
  className = "",
}: {
  username?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-pink-500/10 text-pink-500 border border-pink-500/20 dark:bg-pink-500/15 dark:text-pink-400 ${className}`}
      title={username ? `Instagram DM with @${username}` : "Instagram DM"}
    >
      <Instagram className="h-3 w-3 shrink-0" />
      <span>{compact ? "Instagram" : username ? `@${username}` : "Instagram DM"}</span>
    </span>
  );
}
