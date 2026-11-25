import { MessageSquare, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface IncomingChatToastData {
  messageId: string;
  partnerId: string;
  senderName: string;
  senderRole: "ADVISOR" | "STUDENT";
  message: string;
}

interface ChatIncomingToastProps {
  toast: IncomingChatToastData;
  onOpen: (toast: IncomingChatToastData) => void;
  onDismiss: () => void;
}

export function ChatIncomingToast({
  toast,
  onOpen,
  onDismiss,
}: ChatIncomingToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-[#BFDBFE] bg-white p-3.5 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onOpen(toast)}
          className="group flex flex-1 min-w-0 items-start gap-3 text-left cursor-pointer"
        >
          <Avatar className="mt-0.5 h-9 w-9 shrink-0">
            <AvatarFallback className="border border-[#BFDBFE] bg-[#EFF6FF] text-xs font-semibold text-[#1D4ED8]">
              {toast.senderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#1D4ED8]">
              <MessageSquare className="h-3 w-3 shrink-0" />
              <span>
                {toast.senderRole === "ADVISOR"
                  ? "Tin nhắn mới • Cố vấn"
                  : "Tin nhắn mới • Sinh viên"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#0F172A] transition-colors group-hover:text-[#1D4ED8]">
              {toast.senderName}
            </p>
            <p className="mt-0.5 line-clamp-2 break-words text-xs text-[#475569]">
              {toast.message}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-label="Đóng thông báo"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
