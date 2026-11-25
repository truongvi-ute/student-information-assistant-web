import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useConsultation } from "@/contexts/ConsultationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatProps } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, PanelLeft, RefreshCw, WifiOff } from "lucide-react";
import { useAppLayout } from "@/layouts/AppLayout";

export function ChatContainer({
  accountId,
  currentUser: propCurrentUser,
}: ChatProps) {
  const { user: authUser } = useAuth();
  const currentUser = propCurrentUser || authUser;
  const effectiveAccountId = String(accountId || currentUser?.id || "");
  const { isSidebarOpen, openSidebar } = useAppLayout();

  const {
    conversations,
    selectedContact,
    setSelectedContact,
    connectionStatus: sharedConnectionStatus,
    socketError,
    isTabVisible,
    sendSocketMessage,
    reconnectSocket,
    subscribeSocketEvents,
    markLocalConversationRead,
  } = useConsultation();

  const selectedConversation = selectedContact
    ? conversations.find((c) => c.partnerId === selectedContact.accountId)
    : undefined;

  const effectiveSelectedContact = selectedContact
    ? {
        ...selectedContact,
        fullName: selectedConversation?.partnerName || selectedContact.fullName,
        departmentName:
          selectedContact.departmentName ?? selectedConversation?.partnerDepartment ?? null,
      }
    : null;

  const {
    messages,
    sendMessage,
    retryMessage,
    deleteFailedMessage,
    connectionStatus,
    reconnect,
    error: chatError,
    partnerLastReadAt,
    isHistoryLoading,
    historyError,
    hasOlder,
    loadOlder,
    retryHistory,
  } = useChat({
    currentUserId: effectiveAccountId,
    contactId: selectedContact?.accountId ?? null,
    initialPartnerLastReadAt: selectedConversation?.partnerLastReadAt ?? null,
    hasUnread: (selectedConversation?.unreadCount ?? 0) > 0,
    isTabVisible,
    connectionStatus: sharedConnectionStatus,
    socketError,
    sendSocketMessage,
    reconnectSocket,
    subscribeSocketEvents,
    onMarkedRead: (partnerId) => {
      markLocalConversationRead(partnerId);
    },
  });

  const handleSendMessage = (text: string): boolean => {
    if (!effectiveSelectedContact) return false;
    return sendMessage(text, effectiveSelectedContact.accountId);
  };

  const userRole = currentUser?.role === "ADVISOR" ? "ADVISOR" : "STUDENT";
  const showReconnectBanner =
    connectionStatus === "reconnecting" || connectionStatus === "disconnected";

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

          {effectiveSelectedContact ? (
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
                  {effectiveSelectedContact.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-[#0F172A] truncate">
                  {effectiveSelectedContact.fullName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-medium shrink-0">
                  {effectiveSelectedContact.role === "ADVISOR" ? "Cố vấn" : "Sinh viên"}
                </span>
                {effectiveSelectedContact.departmentName && (
                  <span className="text-xs text-[#475569] hidden sm:inline truncate">
                    • {effectiveSelectedContact.departmentName}
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

      {showReconnectBanner && (
        <div className="border-b border-[#FDE68A] bg-[#FFFBEB] px-4 py-2 text-xs font-medium text-[#92400E] flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0 text-[#D97706]" />
            <span>
              {connectionStatus === "reconnecting"
                ? "Kết nối trò chuyện tạm gián đoạn. Đang tự động kết nối lại..."
                : "Mất kết nối trò chuyện với máy chủ."}
            </span>
          </span>
          <button
            type="button"
            onClick={reconnect}
            className="inline-flex items-center gap-1 shrink-0 font-semibold text-[#B45309] hover:text-[#92400E] underline underline-offset-2 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Kết nối lại</span>
          </button>
        </div>
      )}

      {chatError && (
        <div className="border-b border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2 text-xs font-medium text-[#B91C1C]">
          {chatError}
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserId={effectiveAccountId}
        selectedContact={effectiveSelectedContact}
        partnerLastReadAt={partnerLastReadAt}
        hasOlder={hasOlder}
        isHistoryLoading={isHistoryLoading}
        historyError={historyError}
        onRetryHistory={() => void retryHistory()}
        onLoadOlder={() => void loadOlder()}
        onRetryMessage={retryMessage}
        onDeleteFailedMessage={deleteFailedMessage}
      />

      <ChatInput
        onSend={handleSendMessage}
        disabled={!effectiveSelectedContact}
        placeholder={
          effectiveSelectedContact
            ? `Nhắn tin cho ${effectiveSelectedContact.fullName}...`
            : "Chọn người nhận để gửi tin nhắn..."
        }
      />

    </>
  );
}
