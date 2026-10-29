import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useConsultation } from "@/contexts/ConsultationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatProps } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PanelLeft, ChevronLeft } from "lucide-react";
import { useChatLayout } from "@/layouts/ChatLayout";

export function ChatContainer({
  accountId,
  currentUser: propCurrentUser,
}: ChatProps) {
  const { user: authUser } = useAuth();
  const currentUser = propCurrentUser || authUser;
  const { isSidebarOpen, openSidebar } = useChatLayout();

  const {
    selectedContact,
    setSelectedContact,
    updateOnNewMessage,
  } = useConsultation();

  const {
    messages,
    sendMessage,
    isConnected,
    error: chatError,
    isHistoryLoading,
    hasOlder,
    loadOlder,
  } = useChat(selectedContact?.accountId ?? null, (incoming) => {
    updateOnNewMessage(incoming, accountId, selectedContact);
  });

  const handleSendMessage = (text: string): boolean => {
    if (!selectedContact) return false;
    return sendMessage(text, selectedContact.accountId);
  };

  const userRole = currentUser?.role === "ADVISOR" ? "ADVISOR" : "STUDENT";

  return (
    <>
      <div className="h-14 px-4 sm:px-5 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={openSidebar}
              aria-label="Mở danh sách"
              className="h-8 w-8 shrink-0 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] md:hidden"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
          )}

          {selectedContact ? (
            <div className="flex items-center gap-3 min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedContact(null)}
                aria-label="Quay lại"
                className="h-8 w-8 md:hidden shrink-0 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Avatar className="h-9 w-9 shrink-0 ring-1 ring-[#CBD5E1]">
                <AvatarFallback className="bg-[#EFF6FF] text-[#1D4ED8] font-semibold text-sm">
                  {selectedContact.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-[#0F172A] truncate">
                  {selectedContact.fullName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-medium shrink-0">
                  {selectedContact.role === "ADVISOR" ? "Cố vấn" : "Sinh viên"}
                </span>
                {selectedContact.departmentName && (
                  <span className="text-xs text-[#475569] hidden sm:inline truncate">
                    • {selectedContact.departmentName}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <h1 className="text-sm font-semibold text-[#0F172A] tracking-wide">
              {userRole === "STUDENT" ? "Tư vấn trực tiếp" : "Tin nhắn sinh viên"}
            </h1>
          )}
        </div>
      </div>

      {chatError && (
        <div className="border-b border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2 text-xs font-medium text-[#B91C1C]">
          {chatError}
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserId={accountId}
        selectedContact={selectedContact}
        hasOlder={hasOlder}
        isHistoryLoading={isHistoryLoading}
        onLoadOlder={() => void loadOlder()}
      />

      <ChatInput
        onSend={handleSendMessage}
        disabled={!isConnected || !selectedContact}
        placeholder={
          selectedContact
            ? `Nhắn tin cho ${selectedContact.fullName}...`
            : "Chọn người nhận để gửi tin nhắn..."
        }
      />

    </>
  );
}
