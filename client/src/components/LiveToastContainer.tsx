import { Link } from "react-router";
import { useLiveEvents } from "@/lib/useLiveEvents";
import { Mail, MessageSquare, CheckCircle2, X } from "lucide-react";

export default function LiveToastContainer() {
  const { notifications, dismissNotification } = useLiveEvents();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      {notifications.map((n) => {
        const icon =
          n.type === "ticket:created" ? (
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4" />
            </div>
          ) : n.type === "reply:created" ? (
            <div className="h-8 w-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          );

        return (
          <div
            key={n.id}
            className="pointer-events-auto bg-card border border-border/80 shadow-xl rounded-xl p-3.5 flex items-start gap-3 transition-all duration-300 animate-in-page"
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {n.title}
              </p>
              <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                {n.description}
              </p>
              {n.ticketId && (
                <Link
                  to={`/tickets/${n.ticketId}`}
                  onClick={() => dismissNotification(n.id)}
                  className="text-[11px] font-medium text-primary hover:underline inline-block mt-1.5"
                >
                  Open ticket &rarr;
                </Link>
              )}
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
