import { useState } from "react";
import { Loader2, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatbot } from "@/contexts/ChatbotContext";

interface ChatbotConversationListProps {
  isCollapsed?: boolean;
  onSelect?: () => void;
}

export function ChatbotConversationList({ isCollapsed = false, onSelect }: ChatbotConversationListProps) {
  const {
    conversations,
    activeConversation,
    searchTerm,
    setSearchTerm,
    canUseChatbot,
    isLoadingConversations,
    conversationsError,
    refreshConversations,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useChatbot();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredConversations = conversations.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const closeOnMobile = () => {
    if (window.innerWidth < 768) onSelect?.();
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteConversation(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`space-y-2.5 border-b border-[#E2E8F0] ${isCollapsed ? "p-2" : "p-3.5"}`}>
        <Button
          type="button"
          disabled={!canUseChatbot}
          onClick={() => {
            createConversation();
            closeOnMobile();
          }}
          title="Hội thoại mới"
          aria-label="Hội thoại mới"
          className="h-9 w-full gap-2 bg-[#1D4ED8] text-xs text-white hover:bg-[#1E40AF] disabled:opacity-50"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isCollapsed && "Hội thoại mới"}
        </Button>
        {!isCollapsed && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#475569]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm hội thoại AI..."
              aria-label="Tìm hội thoại AI"
              className="h-8 rounded-lg border-[#94A3B8] bg-[#EFF4FF] pl-8 text-xs text-[#0F172A] shadow-none"
            />
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!isCollapsed && <h2 className="px-2 py-2 text-[11px] font-medium text-[#64748B]">HỘI THOẠI GẦN ĐÂY</h2>}

        {!isCollapsed && isLoadingConversations && conversations.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-4 text-xs text-[#64748B]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Đang tải hội thoại...</span>
          </div>
        ) : !isCollapsed && conversationsError ? (
          <div className="space-y-2 px-2 py-3 text-xs text-[#B91C1C]">
            <p>{conversationsError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refreshConversations()}
              className="h-7 text-xs"
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            {filteredConversations.map((item) => {
              const isActive = activeConversation?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`group mb-1 flex items-center gap-1 rounded-lg ${
                    isActive
                      ? "bg-[#DBEAFE] text-[#1D4ED8]"
                      : "text-[#475569] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <button
                    type="button"
                    title={item.title}
                    aria-label={item.title}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => {
                      void selectConversation(item.id);
                      closeOnMobile();
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-2 p-2 text-left text-xs ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </button>
                  {!isCollapsed && (
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      aria-label={`Xóa hội thoại ${item.title}`}
                      title="Xóa hội thoại"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDelete(item.id);
                      }}
                      className={`mr-1 rounded p-1 text-[#64748B] transition-opacity hover:bg-white/70 hover:text-[#DC2626] ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                      }`}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {!isCollapsed && filteredConversations.length === 0 && (
              <p className="px-2 py-4 text-xs text-[#64748B]">
                {searchTerm ? "Không tìm thấy hội thoại phù hợp." : "Chưa có hội thoại AI."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
