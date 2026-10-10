import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { type Ticket } from "core/constants/ticket.ts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Code, FileText } from "lucide-react";

interface TicketDetailProps {
  ticket: Ticket;
}

export function hasVisibleHtmlContent(html: string | null | undefined): boolean {
  if (!html || !html.trim()) return false;
  try {
    const sanitized = DOMPurify.sanitize(html);
    if (!sanitized.trim()) return false;

    if (typeof document !== "undefined") {
      const temp = document.createElement("div");
      temp.innerHTML = sanitized;
      const metaElements = temp.querySelectorAll("style, script, title, head");
      metaElements.forEach((el) => el.remove());
      const text = temp.textContent?.trim() || "";
      const hasMedia = temp.querySelector("img, svg, video, audio, iframe, button") !== null;
      return text.length > 0 || hasMedia;
    }
  } catch {
    // fallback
  }
  const stripped = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  return stripped.length > 0 || /<img|<svg|<iframe/i.test(html);
}

export default function TicketDetail({ ticket }: TicketDetailProps) {
  const hasHtml = useMemo(
    () => hasVisibleHtmlContent(ticket.bodyHtml),
    [ticket.bodyHtml]
  );
  const [viewMode, setViewMode] = useState<"html" | "text">("html");

  const sanitizedHtml = useMemo(() => {
    if (!ticket.bodyHtml) return "";
    return DOMPurify.sanitize(ticket.bodyHtml);
  }, [ticket.bodyHtml]);

  const showHtml = hasHtml && viewMode === "html";

  return (
    <>
      <div>
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-2xl font-semibold tracking-tight flex-1">
            {ticket.subject}
          </h1>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">From:</span>{" "}
            {ticket.senderName} ({ticket.senderEmail})
          </div>
          <div>
            <span className="font-medium text-foreground">Created:</span>{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium text-foreground">Updated:</span>{" "}
            {new Date(ticket.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <Card>
        {hasHtml && ticket.body && (
          <CardHeader className="py-2.5 px-6 border-b flex flex-row items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Message</span>
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
              <Button
                variant={viewMode === "html" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("html")}
              >
                <Code className="h-3.5 w-3.5" />
                Formatted
              </Button>
              <Button
                variant={viewMode === "text" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode("text")}
              >
                <FileText className="h-3.5 w-3.5" />
                Plain Text
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent className="pt-6">
          {showHtml ? (
            <div
              className="email-body-content max-w-none break-words overflow-x-auto text-foreground [&_img]:max-w-full [&_table]:max-w-full"
              dangerouslySetInnerHTML={{
                __html: sanitizedHtml,
              }}
            />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">
              {ticket.body}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
