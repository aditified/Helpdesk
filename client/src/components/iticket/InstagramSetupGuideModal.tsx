import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Instagram,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface InstagramSetupGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InstagramSetupGuideModal({
  open,
  onOpenChange,
}: InstagramSetupGuideModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    isConfigured: boolean;
    hasPageId: boolean;
    verifyToken: string;
    webhookUrl: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      axios
        .get("/api/webhooks/instagram/status")
        .then((res) => setStatus(res.data))
        .catch(() =>
          setStatus({
            isConfigured: false,
            hasPageId: false,
            verifyToken: "helpdesk_instagram_verify_token",
            webhookUrl: "/api/webhooks/instagram",
          })
        );
    }
  }, [open]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fullWebhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/instagram`
      : "https://your-domain.com/api/webhooks/instagram";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-pink-500 mb-1">
            <Instagram className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Meta Graph API Connection
            </span>
          </div>
          <DialogTitle>Connect Live Instagram Page</DialogTitle>
          <DialogDescription>
            Follow these steps to connect your Instagram Professional / Creator account so customer
            DMs create Helpdesk tickets and agent replies are delivered to their Instagram inbox.
          </DialogDescription>
        </DialogHeader>

        {/* Status banner */}
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            status?.isConfigured
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {status?.isConfigured ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>
              {status?.isConfigured
                ? "INSTAGRAM_PAGE_ACCESS_TOKEN is configured in server/.env."
                : "INSTAGRAM_PAGE_ACCESS_TOKEN is pending in server/.env (using dev simulator)."}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {status?.isConfigured ? "Live API" : "Simulated"}
          </Badge>
        </div>

        {/* Step-by-step instructions */}
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg border border-border/70 space-y-2 bg-muted/20">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <span>Step 1: Configure Webhook in Meta Developer App</span>
            </h4>
            <p className="text-muted-foreground">
              Go to{" "}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline inline-flex items-center gap-0.5"
              >
                developers.facebook.com <ExternalLink className="h-3 w-3" />
              </a>{" "}
              &rarr; select your App &rarr; <strong>Instagram</strong> &rarr; <strong>Webhooks</strong>.
            </p>

            <div className="space-y-2 pt-1 font-mono text-[11px]">
              <div>
                <span className="text-muted-foreground block mb-0.5 font-sans">
                  Callback URL:
                </span>
                <div className="flex items-center gap-2 bg-background p-2 rounded border border-border">
                  <span className="truncate flex-1 select-all">{fullWebhookUrl}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(fullWebhookUrl, "url")}
                    className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  >
                    {copiedField === "url" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block mb-0.5 font-sans">
                  Verify Token:
                </span>
                <div className="flex items-center gap-2 bg-background p-2 rounded border border-border">
                  <span className="truncate flex-1 select-all font-mono">
                    {status?.verifyToken || "helpdesk_instagram_verify_token"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        status?.verifyToken || "helpdesk_instagram_verify_token",
                        "token"
                      )
                    }
                    className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  >
                    {copiedField === "token" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border/70 space-y-2 bg-muted/20">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <span>Step 2: Subscribe to Webhook Fields</span>
            </h4>
            <p className="text-muted-foreground">
              In the Webhook subscriptions table for your Page, subscribe to:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Badge variant="secondary" className="font-mono text-[10px]">
                messages
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px]">
                messaging_postbacks
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px]">
                message_deliveries
              </Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border/70 space-y-2 bg-muted/20">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Step 3: Add Permissions & Page Access Token</span>
            </h4>
            <p className="text-muted-foreground">
              Generate a Page Access Token with these permissions and paste it into{" "}
              <code className="text-primary font-mono text-[11px]">server/.env</code>:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                instagram_basic
              </Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                instagram_manage_messages
              </Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                pages_manage_metadata
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
