"use client";

import { useEffect, useState } from "react";
import type { Message } from "@t/message";
import { useThemeStore } from "@store/theme-store";
import { useAuthStore } from "@store/auth-store";
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock3,
  Lock,
  Paperclip,
  Sticker,
  Mic,
  Download,
  Forward,
  SmilePlus,
  Pencil
} from "lucide-react";
import { cn } from "@lib/utils";
import { decryptAttachmentToUrl } from "@lib/crypto";

interface Props {
  message: Message;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
}

export default function MessageBubble({ message, onReply, onEdit, onForward, onReact }: Props) {
  const theme = useThemeStore();
  const currentUser = useAuthStore((s) => s.user);
  const isMine = message.sender_id === currentUser?.id;

  const densityClass =
    theme.density === "compact" ? "py-1.5 px-3 text-sm" : "py-2.5 px-4 text-base";

  const replyMeta = (message.envelope_metadata as any)?.reply_to as
    | { body: string; sender?: string }
    | undefined;
  const attachments =
    (message.envelope_metadata as any)?.attachments as
      | Array<{
          name: string;
          type?: string;
          size: number;
          url?: string;
          kind?: string;
          iv?: string;
          key_fingerprint?: string;
          original_type?: string;
          encrypted?: boolean;
        }>
      | undefined;
  const sticker = (message.envelope_metadata as any)?.sticker as string | undefined;
  const reactions = (message.reactions || {}) as Record<string, number[]>;
  const reactionItems = Object.entries(reactions);

  const [resolvedAttachments, setResolvedAttachments] = useState<
    Record<string, { url: string; type?: string }>
  >({});

  const statusIcon =
    message.status === "sending" ? (
      <Clock3 className="h-4 w-4 text-amber-300 animate-pulse" />
    ) : message.status === "failed" ? (
      <AlertCircle className="h-4 w-4 text-rose-300" />
    ) : message.status === "read" ? (
      <CheckCheck className="h-4 w-4 text-[var(--pc-accent)]" />
    ) : (
      <Check className="h-4 w-4 text-[var(--pc-text-muted)]" />
    );

  useEffect(() => {
    let active = true;
    const urls: string[] = [];

    async function hydrate() {
      if (!attachments) return;
      for (const a of attachments) {
        const key = a.url || `${a.name}-${a.size}`;
        if (!key || resolvedAttachments[key]) continue;

        try {
          if (a.encrypted || a.iv) {
            const res = await decryptAttachmentToUrl(a as any);
            if (!active) return;
            urls.push(res.url);
            setResolvedAttachments((prev) => ({ ...prev, [key]: { url: res.url, type: res.type } }));
          } else if (a.url) {
            setResolvedAttachments((prev) => ({ ...prev, [key]: { url: a.url!, type: a.type } }));
          }
        } catch {
          // ignore decrypt errors
        }
      }
    }

    hydrate();

    return () => {
      active = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [attachments, resolvedAttachments]);

  const quickReactions = ["👍", "🔥", "❤️", "✨"];

  return (
    <div className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
      <div className="max-w-[72%] space-y-1">
        {message.forwarded_from_id && (
          <div className="text-[11px] text-[var(--pc-text-muted)]">
            Переслано сообщение #{message.forwarded_from_id}
          </div>
        )}
        {replyMeta && (
          <button
            type="button"
            onClick={() => onReply?.(message)}
            className="group block w-full rounded-xl bg-[var(--pc-surface-subtle)]/70 border border-[var(--pc-border)] px-3 py-2 text-left text-xs text-[var(--pc-text-muted)] hover:border-[var(--pc-primary)] transition-colors"
          >
            <div className="font-semibold text-[var(--pc-text)] mb-1">Ответ на сообщение</div>
            <div className="line-clamp-2 text-[var(--pc-text-muted)]">
              {replyMeta.sender ? `${replyMeta.sender}: ` : ""}
              {replyMeta.body}
            </div>
          </button>
        )}
        <div
          className={cn(
            "rounded-2xl shadow-md border",
            densityClass,
            isMine
              ? "text-white border-transparent"
              : "bg-[var(--pc-surface)] text-[var(--pc-text)] border-[var(--pc-border)]"
          )}
          style=
            {
              isMine
                ? {
                    background: theme.primaryColor,
                    boxShadow: "0 14px 30px rgba(80,115,255,0.35)"
                  }
                : {}
            }
        >
          {sticker ? (
            <p className="whitespace-pre-wrap break-words inline-flex items-center gap-2 font-semibold">
              <Sticker className="h-4 w-4" />
              {sticker}
            </p>
          ) : (
            <p
              style={{
                fontSize:
                  theme.fontSize === "sm"
                    ? "0.95rem"
                    : theme.fontSize === "lg"
                    ? "1.08rem"
                    : "1rem"
              }}
              className="whitespace-pre-wrap break-words"
            >
              {message.body}
            </p>
          )}

          {attachments && attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachments.map((a, idx) => {
                const key = a.url || `${a.name}-${a.size}-${idx}`;
                const resolved = key ? resolvedAttachments[key] : undefined;
                const displayUrl = resolved?.url || a.url;
                const mime = resolved?.type || a.original_type || a.type;
                const isAudio = a.kind === "voice" || mime?.startsWith("audio");
                const isImage = mime?.startsWith("image");
                const isVideo = mime?.startsWith("video");
                return (
                  <div
                    key={`${a.name}-${idx}`}
                    className="flex flex-col gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      {isAudio ? <Mic className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                      <span className="truncate max-w-[200px]">{a.name}</span>
                      <span className="text-[10px] opacity-70">{(a.size / 1024).toFixed(1)} kB</span>
                      {displayUrl && (
                        <a
                          href={displayUrl}
                          download={a.name}
                          className="ml-auto inline-flex items-center gap-1 text-[var(--pc-text)] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Скачать
                        </a>
                      )}
                    </div>
                    {isImage && displayUrl && (
                      <img src={displayUrl} alt={a.name} className="rounded-lg max-h-64 object-cover" />
                    )}
                    {isVideo && displayUrl && (
                      <video controls className="rounded-lg max-h-72">
                        <source src={displayUrl} type={mime || "video/mp4"} />
                      </video>
                    )}
                    {isAudio && displayUrl && (
                      <audio controls className="w-full">
                        <source src={displayUrl} type={mime || "audio/aac"} />
                      </audio>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 text-[11px] text-white/80">
            {message.encrypted && <Lock className="h-3.5 w-3.5" />}
            {message.edited_at && <span className="opacity-70">edited</span>}
            <span className="opacity-80">
              {new Date(message.inserted_at).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
            {isMine && <span className="flex items-center gap-1">{statusIcon}</span>}
          </div>

          {reactionItems.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {reactionItems.map(([emoji, users]) => (
                <span
                  key={emoji}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px]"
                >
                  <span>{emoji}</span>
                  <span className="opacity-70">{users.length}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 text-[11px] text-white/80">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 hover:bg-white/20"
              onClick={() => onReact?.(message, "👍")}
            >
              <SmilePlus className="h-3.5 w-3.5" />
              Реакция
            </button>
            {quickReactions.map((r) => (
              <button
                key={r}
                type="button"
                className="rounded-full bg-white/5 px-2 py-1 hover:bg-white/15"
                onClick={() => onReact?.(message, r)}
              >
                {r}
              </button>
            ))}
            {isMine && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 hover:bg-white/20"
                onClick={() => onEdit?.(message)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Править
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 hover:bg-white/20"
              onClick={() => onForward?.(message)}
            >
              <Forward className="h-3.5 w-3.5" />
              Переслать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
