import { MessageSquare, Plus, Search } from "lucide-react";
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
    createConversation,
    selectConversation,
  } = useChatbot();
  const filteredConversations = conversations.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const closeOnMobile = () => {
    if (window.innerWidth < 768) onSelect?.();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`space-y-2.5 border-b border-[#E2E8F0] ${isCollapsed ? "p-2" : "p-3.5"}`}>
        <Button
          type="button"
          onClick={() => {
            createConversation();
            closeOnMobile();
          }}
          title="Hội thoại mới"
          aria-label="Hội thoại mới"
          className="h-9 w-full gap-2 bg-[#1D4ED8] text-xs text-white hover:bg-[#1E40AF]"
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
        {filteredConversations.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.title}
            aria-label={item.title}
            aria-current={activeConversation?.id === item.id ? "true" : undefined}
            onClick={() => {
              selectConversation(item.id);
              closeOnMobile();
            }}
            className={`mb-1 flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs ${isCollapsed ? "justify-center" : ""} ${activeConversation?.id === item.id ? "bg-[#DBEAFE] text-[#1D4ED8]" : "text-[#475569] hover:bg-[#F1F5F9]"}`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.title}</span>}
          </button>
        ))}
        {!isCollapsed && filteredConversations.length === 0 && (
          <p className="px-2 py-4 text-xs text-[#64748B]">
            {searchTerm ? "Không tìm thấy hội thoại phù hợp." : "Chưa có hội thoại AI."}
          </p>
        )}
      </div>
    </div>
  );
}
