"use client";

import { Message } from "@types/message";
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
  Download
} from "lucide-react";
import { cn } from "@lib/utils";

interface Props {
  message: Message;
  onReply?: (message: Message) => void;
}

export default function MessageBubble({ message, onReply }: Props) {
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
      | Array<{ name: string; type: string; size: number; url?: string; kind?: string }>
      | undefined;
  const sticker = (message.envelope_metadata as any)?.sticker as string | undefined;

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

  return (
    <div className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
      <div className="max-w-[72%] space-y-1">
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
          style={
            isMine
              ? {
                  background: theme.primaryColor,
                  boxShadow: "0 14px 30px rgba(80,115,255,0.35)"
                }
              : {}
          }
        >
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
            {sticker ? (
              <span className="inline-flex items-center gap-2 font-semibold">
                <Sticker className="h-4 w-4" />
                {sticker}
              </span>
            ) : (
              message.body
            )}
          </p>
          {attachments && attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((a, idx) => {
                const isAudio = a.kind === "voice" || a.type?.startsWith("audio");
                return (
                  <div
                    key={`${a.name}-${idx}`}
                    className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1 text-xs"
                  >
                    {isAudio ? <Mic className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                    <span className="truncate">{a.name}</span>
                    <span className="text-[10px] opacity-70">
                      {(a.size / 1024).toFixed(1)} КБ
                    </span>
                    {isAudio && a.url ? (
                      <audio controls className="ml-auto max-w-[160px]">
                        <source src={a.url} type={a.type || "audio/aac"} />
                      </audio>
                    ) : a.url ? (
                      <a
                        href={a.url}
                        download={a.name}
                        className="ml-auto inline-flex items-center gap-1 text-[var(--pc-text)] hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Скачать
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-[11px] text-white/80">
            {message.encrypted && <Lock className="h-3.5 w-3.5" />}
            <span className="opacity-80">
              {new Date(message.inserted_at).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
            {isMine && <span className="flex items-center gap-1">{statusIcon}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
