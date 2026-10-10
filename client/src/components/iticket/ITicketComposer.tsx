import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Sparkles,
  Paperclip,
  Smile,
  Instagram,
  Check,
  X,
} from "lucide-react";

interface ITicketComposerProps {
  onSendMessage: (text: string) => Promise<void>;
  suggestedReply?: string;
  isSending?: boolean;
  username: string;
}

const COMMON_EMOJIS = ["👋", "👍", "✅", "🙏", "😊", "📅", "📄", "🚀"];

export default function ITicketComposer({
  onSendMessage,
  suggestedReply,
  isSending = false,
  username,
}: ITicketComposerProps) {
  const [replyText, setReplyText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSuggestedBanner, setShowSuggestedBanner] = useState(Boolean(suggestedReply));
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    const textToSend = attachmentName
      ? `${replyText.trim()}\n[Attached file: ${attachmentName}]`
      : replyText.trim();

    await onSendMessage(textToSend);
    setReplyText("");
    setAttachmentName(null);
  };

  const handleApplySuggestedReply = () => {
    if (suggestedReply) {
      setReplyText(suggestedReply);
      setShowSuggestedBanner(false);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setReplyText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSimulatedAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* AI Suggestion preview banner if available */}
      {suggestedReply && showSuggestedBanner && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Suggested Reply</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSuggestedBanner(false)}
              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              title="Dismiss suggestion"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-muted-foreground italic leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/50">
            &ldquo;{suggestedReply}&rdquo;
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleApplySuggestedReply}
              className="h-7 text-xs gap-1.5 cursor-pointer"
            >
              <Check className="h-3 w-3" />
              <span>Insert Suggestion</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Composer Box */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs focus-within:border-primary/50 transition-colors"
      >
        {/* Attachment preview tag if any */}
        {attachmentName && (
          <div className="px-3.5 pt-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted font-mono">
              <Paperclip className="h-3 w-3 text-primary" />
              {attachmentName}
            </span>
            <button
              type="button"
              onClick={() => setAttachmentName(null)}
              className="hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="p-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to @${username} on Instagram Direct...`}
            rows={3}
            className="border-0 shadow-none resize-none p-0 focus-visible:ring-0 text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Emoji Quick Picker Bar */}
        {showEmojiPicker && (
          <div className="px-3 py-1.5 border-t border-border/50 bg-muted/40 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Quick emoji:</span>
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="text-sm hover:scale-125 transition-transform cursor-pointer px-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-3 py-2 border-t border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          {/* Left tools: Attachments, Emojis, AI Suggest */}
          <div className="flex items-center gap-1">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSimulatedAttachment}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Attach media / file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer ${
                showEmojiPicker ? "bg-accent text-foreground" : ""
              }`}
              title="Insert Emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>

            {suggestedReply && !replyText && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplySuggestedReply}
                className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 cursor-pointer ml-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Suggest</span>
              </Button>
            )}
          </div>

          {/* Right tools: Channel notice & Send */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Instagram className="h-3 w-3 text-pink-500" />
              <span>Instagram DM</span>
            </span>

            <Button
              type="submit"
              disabled={!replyText.trim() || isSending}
              size="sm"
              className="h-8 px-3 gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSending ? "Sending..." : "Send"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
