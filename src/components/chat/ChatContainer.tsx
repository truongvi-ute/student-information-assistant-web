import { useState } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { AdvisorContactDialog } from "./AdvisorContactDialog";
import { useChat } from "@/hooks/useChat";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatContact, ChatConversationItem, ChatProps } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PanelLeft, ChevronLeft } from "lucide-react";

export function ChatContainer({
  accountId,
  currentUser: propCurrentUser,
  onLogout: propOnLogout,
}: ChatProps) {
  const { user: authUser, logout: authLogout } = useAuth();
  const currentUser = propCurrentUser || authUser;
  const onLogout = propOnLogout || authLogout;

  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdvisorDialogOpen, setIsAdvisorDialogOpen] = useState(false);

  const {
    conversations,
    isLoading: isConversationsLoading,
    error: conversationsError,
    refreshConversations,
    updateOnNewMessage,
  } = useChatConversations();

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

  const handleSelectConversation = (item: ChatConversationItem) => {
    const contact: ChatContact = {
      accountId: item.partnerId,
      fullName: item.partnerName,
      role: item.partnerRole,
      departmentName: item.partnerDepartment,
    };
    setSelectedContact(contact);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectAdvisorFromDialog = (advisor: ChatContact) => {
    const existing = conversations.find((c) => c.partnerId === advisor.accountId);
    if (existing) {
      handleSelectConversation(existing);
    } else {
      setSelectedContact(advisor);
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const userRole = currentUser?.role === "ADVISOR" ? "ADVISOR" : "STUDENT";

  return (
    <div className="h-screen w-full flex bg-[#F8FAFC] text-[#0F172A] overflow-hidden font-sans">
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-all duration-200 md:relative ${
          isSidebarOpen
            ? "translate-x-0 w-80 md:w-80"
            : "-translate-x-full w-80 md:translate-x-0 md:w-[68px]"
        }`}
      >
        <ChatSidebar
          role={userRole}
          conversations={conversations}
          selectedPartnerId={selectedContact?.accountId ?? null}
          onSelectConversation={handleSelectConversation}
          onOpenAdvisorDialog={() => setIsAdvisorDialogOpen(true)}
          isLoading={isConversationsLoading}
          error={conversationsError}
          onRetry={refreshConversations}
          currentUser={currentUser}
          onLogout={onLogout}
          isCollapsed={!isSidebarOpen}
          onToggleCollapse={() => setIsSidebarOpen((v) => !v)}
          onCollapse={() => setIsSidebarOpen(false)}
        />
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs"
        />
      )}

      <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden min-w-0">
        <div className="h-14 px-4 sm:px-5 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!isSidebarOpen && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
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
          <div className="bg-[#FEF2F2] border-b border-[#FCA5A5] px-4 py-2 text-xs text-[#B91C1C] font-medium">
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
      </div>

      <AdvisorContactDialog
        open={isAdvisorDialogOpen}
        onClose={() => setIsAdvisorDialogOpen(false)}
        onSelectAdvisor={handleSelectAdvisorFromDialog}
        existingAdvisorIds={conversations.map((c) => c.partnerId)}
      />
    </div>
  );
}
