import { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Send, Sparkles } from "lucide-react";

interface SimulateInstagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (ticketId: string) => void;
}

const SAMPLE_MESSAGES = [
  "Hi, I submitted my admission application last week. When will the shortlist be released?",
  "Can you please tell me if fee installments are allowed for international students?",
  "I'm unable to log into the student portal using my registered email ID.",
  "Are scholarship applications still open for the spring semester?",
];

export default function SimulateInstagramModal({
  open,
  onOpenChange,
  onSuccess,
}: SimulateInstagramModalProps) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("alex_student");
  const [displayName, setDisplayName] = useState("Alex Johnson");
  const [message, setMessage] = useState(SAMPLE_MESSAGES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await axios.post("/api/webhooks/instagram/simulate", {
        username: username.replace(/^@/, "").trim(),
        displayName: displayName.trim(),
        message: message.trim(),
        senderId: `ig_${username.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now().toString().slice(-4)}`,
      });

      queryClient.invalidateQueries({ queryKey: ["i-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["i-ticket-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-i-tickets"] });

      onOpenChange(false);
      if (data.ticketId) {
        onSuccess?.(data.ticketId);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to simulate Instagram DM");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-pink-500 mb-1">
            <Instagram className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Instagram Direct Simulator
            </span>
          </div>
          <DialogTitle>Simulate Inbound Instagram DM</DialogTitle>
          <DialogDescription>
            Simulate a message sent by a student directly to your Instagram Page to test
            real-time ingestion, AI suggestions, and direct DM replies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Instagram Handle
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-mono">
                  @
                </span>
                <Input
                  className="pl-6 h-8 text-xs font-mono"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="handle"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Display Name
              </label>
              <Input
                className="h-8 text-xs"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Direct Message Content
              </label>
              <button
                type="button"
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                onClick={() => {
                  const random =
                    SAMPLE_MESSAGES[
                      Math.floor(Math.random() * SAMPLE_MESSAGES.length)
                    ];
                  setMessage(random);
                }}
              >
                <Sparkles className="h-3 w-3" />
                Random sample
              </button>
            </div>
            <Textarea
              rows={3}
              className="text-xs"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message text..."
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !message.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? "Sending DM..." : "Send Instagram DM"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
