import { MessageSquare } from "lucide-react";

interface ChatEmptyStateProps {
  hasSelectedContact: boolean;
  contactName?: string;
}

export function ChatEmptyState({
  hasSelectedContact,
  contactName,
}: ChatEmptyStateProps) {
  if (hasSelectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center mb-3.5 text-[#1D4ED8] shadow-xs">
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[#0F172A]">
          Chưa có tin nhắn nào với {contactName || "người này"}
        </p>
        <p className="text-xs text-[#475569] mt-1 max-w-sm leading-relaxed">
          Gửi tin nhắn bên dưới để bắt đầu cuộc trò chuyện.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
      <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center mb-3.5 text-[#1D4ED8] shadow-xs">
        <MessageSquare className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-[#0F172A]">
        Chưa chọn cuộc trò chuyện
      </p>
      <p className="text-xs text-[#475569] mt-1 max-w-sm leading-relaxed">
        Vui lòng chọn một người từ danh sách bên trái hoặc nhấn &ldquo;Liên hệ cố vấn&rdquo; để bắt đầu.
      </p>
    </div>
  );
}
