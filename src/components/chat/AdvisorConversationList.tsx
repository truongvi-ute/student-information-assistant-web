import { useConsultation } from "@/contexts/ConsultationContext";
import type { ChatConversationItem } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus } from "lucide-react";

interface AdvisorConversationListProps {
  role?: "STUDENT" | "ADVISOR";
  conversations: ChatConversationItem[];
  selectedPartnerId: string | null;
  onSelectConversation: (item: ChatConversationItem) => void;
  onOpenAdvisorDialog?: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  isCollapsed?: boolean;
}

function formatConversationTime(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function AdvisorConversationList({
  role = "STUDENT",
  conversations,
  selectedPartnerId,
  onSelectConversation,
  onOpenAdvisorDialog,
  isLoading,
  error,
  onRetry,
  isCollapsed = false,
}: AdvisorConversationListProps) {
  const { searchTerm, setSearchTerm } = useConsultation();

  const isStudent = role === "STUDENT";

  const searchPlaceholder = isStudent
    ? "Tìm theo tên cố vấn..."
    : "Tìm sinh viên, nội dung...";

  const query = searchTerm.trim().toLowerCase();
  const filteredConversations = conversations.filter((item) =>
    item.partnerName.toLowerCase().includes(query)
    || (!isStudent && item.lastMessage.toLowerCase().includes(query))
  );


  if (isCollapsed) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto py-3">
        {isStudent && (
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={onOpenAdvisorDialog}
              title="Liên hệ cố vấn"
              className="h-10 w-10 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          )}


        <div className="w-8 h-px bg-[#E2E8F0] my-0.5" />
          <div className="flex flex-col items-center gap-2.5 w-full max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar px-1">
            {conversations.map((conv) => {
              const isSelected = selectedPartnerId === conv.partnerId;

              return (
                <button
                  key={conv.conversationId || conv.partnerId}
                  type="button"
                  onClick={() => onSelectConversation(conv)}
                  title={conv.partnerName}
                  className={`relative p-0.5 rounded-full transition-all ${
                    isSelected
                      ? "ring-2 ring-[#1D4ED8] ring-offset-2 ring-offset-white scale-105"
                      : "opacity-85 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "bg-[#1D4ED8] text-white"
                          : "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                      }`}
                    >
                      {conv.partnerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#15803D] border-2 border-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2.5 border-b border-[#E2E8F0] p-3.5">
        {isStudent && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onOpenAdvisorDialog}
            className="w-full gap-2 h-9 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm transition-all rounded-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>Liên hệ cố vấn</span>
          </Button>
        )}

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#475569] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8 pr-3 h-8 text-xs rounded-lg border-[#94A3B8] bg-[#EFF4FF] text-[#0F172A] placeholder:text-[#64748B] shadow-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white">
        <h2 className="px-2 py-2 text-[11px] font-medium text-[#64748B]">HỘI THOẠI TƯ VẤN</h2>
        {isLoading ? (
          <div className="space-y-2 p-1">
            <Skeleton className="h-14 w-full rounded-lg bg-[#F1F5F9]" />
            <Skeleton className="h-14 w-full rounded-lg bg-[#F1F5F9]" />
            <Skeleton className="h-14 w-full rounded-lg bg-[#F1F5F9]" />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-xs text-[#B91C1C] mb-2">{error}</p>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8 text-xs border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                Thử lại
              </Button>
            )}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            {isStudent ? (
              <>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Bạn chưa có cuộc trò chuyện nào với cố vấn học tập.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenAdvisorDialog}
                  className="text-xs border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]"
                >
                  Liên hệ cố vấn ngay
                </Button>
              </>
            ) : (
              <p className="text-xs text-[#475569] leading-relaxed">
                Chưa nhận được tin nhắn từ sinh viên.
              </p>
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-xs">
            Không tìm thấy cuộc trò chuyện phù hợp
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedPartnerId === conv.partnerId;
            const timeStr = formatConversationTime(conv.lastMessageAt);

            return (
              <button
                key={conv.conversationId || conv.partnerId}
                type="button"
                onClick={() => onSelectConversation(conv)}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                  isSelected
                    ? "bg-[#DBEAFE] text-[#1E40AF] border-l-4 border-l-[#1D4ED8]"
                    : "hover:bg-[#F1F5F9] text-[#0F172A] border-l-4 border-l-transparent"
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback
                    className={`text-sm font-semibold ${
                      isSelected
                        ? "bg-[#1D4ED8] text-white"
                        : "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                    }`}
                  >
                    {conv.partnerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-xs truncate ${
                        isSelected
                          ? "font-semibold text-[#1E40AF]"
                          : "font-semibold text-[#0F172A]"
                      }`}
                    >
                      {conv.partnerName}
                    </p>
                    {timeStr && (
                      <span
                        className={`text-[11px] shrink-0 ${
                          isSelected ? "text-[#1E40AF]/80 font-medium" : "text-[#475569]"
                        }`}
                      >
                        {timeStr}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs truncate mt-0.5 ${
                      isSelected ? "text-[#1E40AF]/85" : "text-[#475569]"
                    }`}
                  >
                    <span>{isStudent ? conv.partnerDepartment || "Cố vấn" : "Sinh viên"}</span>
                    <span className="mx-1 text-[#94A3B8]">•</span>
                    <span>{conv.lastMessage || "Bắt đầu cuộc trò chuyện..."}</span>
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

    </div>
  );
}
