import { AlertCircle, Check, CheckCheck, Loader2, RotateCcw, Trash2 } from "lucide-react";
import type { ChatUiMessage } from "@/types/chat";

export type MessageDisplayStatus = "sending" | "sent" | "read" | "failed" | null;

interface MessageItemProps {
  message: ChatUiMessage;
  isMe: boolean;
  partnerName?: string;
  deliveryState?: MessageDisplayStatus;
  onRetry?: (clientMessageId: string) => void;
  onDelete?: (clientMessageId: string) => void;
}

export function MessageItem({
  message,
  isMe,
  partnerName,
  deliveryState = null,
  onRetry,
  onDelete,
}: MessageItemProps) {
  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isFailed = isMe && deliveryState === "failed";
  const isSending = isMe && deliveryState === "sending";
  const canActOnFailed = Boolean(message.clientMessageId);

  return (
    <div className={`flex flex-col my-2 ${isMe ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-1.5 mb-1 px-1.5 text-xs text-[#475569]">
        <span className="font-medium text-[#0F172A]">{isMe ? "Bạn" : partnerName || message.senderId}</span>
        {formattedTime && <span className="text-[#475569]">• {formattedTime}</span>}
      </div>

      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words rounded-2xl shadow-sm transition-opacity ${
          isMe
            ? isFailed
              ? "bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-tr-xs"
              : isSending
                ? "bg-[#1D4ED8]/80 text-white rounded-tr-xs"
                : "bg-[#1D4ED8] text-white rounded-tr-xs"
            : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-tl-xs"
        }`}
      >
        {message.message}
      </div>

      {isMe && deliveryState && (
        <div className="mt-1 px-1.5 flex flex-wrap items-center justify-end gap-2 text-[11px]">
          {deliveryState === "sending" && (
            <span className="inline-flex items-center gap-1 text-[#64748B]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Đang gửi...</span>
            </span>
          )}

          {deliveryState === "sent" && (
            <span className="inline-flex items-center gap-1 text-[#64748B]">
              <Check className="w-3.5 h-3.5" />
              <span>Đã gửi</span>
            </span>
          )}

          {deliveryState === "read" && (
            <span className="inline-flex items-center gap-1 text-[#1D4ED8] font-medium">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đã xem</span>
            </span>
          )}

          {deliveryState === "failed" && (
            <div className="inline-flex flex-wrap items-center gap-2 text-[#B91C1C]">
              <span className="inline-flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{message.errorMessage || "Gửi thất bại"}</span>
              </span>

              {canActOnFailed && onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(message.clientMessageId!)}
                  className="inline-flex items-center gap-1 font-medium text-[#1D4ED8] hover:text-[#1E40AF] underline underline-offset-2 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Gửi lại</span>
                </button>
              )}

              {canActOnFailed && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(message.clientMessageId!)}
                  className="inline-flex items-center gap-1 font-medium text-[#64748B] hover:text-[#B91C1C] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
