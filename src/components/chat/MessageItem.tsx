import type { ChatMessageEvent } from "@/types/chat";

interface MessageItemProps {
  message: ChatMessageEvent;
  isMe: boolean;
  partnerName?: string;
}

export function MessageItem({
  message,
  isMe,
  partnerName,
}: MessageItemProps) {
  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`flex flex-col my-2 ${isMe ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-1.5 mb-1 px-1.5 text-xs text-[#475569]">
        <span className="font-medium text-[#0F172A]">{isMe ? "Bạn" : partnerName || message.senderId}</span>
        {formattedTime && <span className="text-[#475569]">• {formattedTime}</span>}
      </div>

      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words rounded-2xl shadow-sm ${
          isMe
            ? "bg-[#1D4ED8] text-white rounded-tr-xs"
            : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-tl-xs"
        }`}
      >
        {message.message}
      </div>
    </div>
  );
}
