import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ChatbotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  file?: File;
}

interface ChatbotConversation {
  id: string;
  title: string;
  messages: ChatbotMessage[];
  draft: string;
  selectedFile: File | null;
}

interface ChatbotContextType {
  conversations: ChatbotConversation[];
  activeConversation: ChatbotConversation | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectConversation: (id: string) => void;
  createConversation: () => void;
  sendQuestion: (question: string) => void;
  setDraft: (value: string) => void;
  setSelectedFile: (file: File | null) => void;
  getScrollPosition: (id: string) => number | undefined;
  saveScrollPosition: (id: string, position: number) => void;
  clearConversations: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollPositions = useRef<Record<string, number>>({});
  const getScrollPosition = useCallback((id: string) => scrollPositions.current[id], []);
  const saveScrollPosition = useCallback((id: string, position: number) => {
    scrollPositions.current[id] = position;
  }, []);
  const activeConversation = conversations.find((item) => item.id === activeId) || null;

  const createConversation = () => {
    const id = crypto.randomUUID();
    setConversations((current) => [
      { id, title: "Hội thoại mới", messages: [], draft: "", selectedFile: null },
      ...current,
    ]);
    setActiveId(id);
    setSearchTerm("");
  };

  const setDraft = (value: string) => {
    if (!activeId) {
      const id = crypto.randomUUID();
      setConversations((current) => [
        { id, title: "Hội thoại mới", messages: [], draft: value, selectedFile: null },
        ...current,
      ]);
      setActiveId(id);
      return;
    }
    setConversations((current) => current.map((item) =>
      item.id === activeId ? { ...item, draft: value } : item
    ));
  };

  const setSelectedFile = (file: File | null) => {
    if (!activeId) {
      if (!file) return;
      const id = crypto.randomUUID();
      setConversations((current) => [
        { id, title: "Hội thoại mới", messages: [], draft: "", selectedFile: file },
        ...current,
      ]);
      setActiveId(id);
      return;
    }
    setConversations((current) => current.map((item) =>
      item.id === activeId ? { ...item, selectedFile: file } : item
    ));
  };

  const sendQuestion = (question: string) => {
    const content = question.trim();
    const file = activeConversation?.selectedFile || undefined;
    if (!content && !file) return;

    const id = activeId || crypto.randomUUID();
    const messages: ChatbotMessage[] = [
      { id: crypto.randomUUID(), role: "user", content, file },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Đây là phản hồi minh họa cho giao diện Chatbot. Bạn có thể liên hệ Cố vấn qua mục Tư vấn trực tiếp để được hỗ trợ về câu hỏi này.",
      },
    ];
    setConversations((current) => {
      const existing = current.find((item) => item.id === id);
      const updated: ChatbotConversation = {
        id,
        title: existing?.messages.length ? existing.title : content || file?.name || "Hội thoại mới",
        messages: [...(existing?.messages || []), ...messages],
        draft: "",
        selectedFile: null,
      };
      return [updated, ...current.filter((item) => item.id !== id)];
    });
    setActiveId(id);
  };

  const clearConversations = () => {
    setConversations([]);
    setActiveId(null);
    setSearchTerm("");
    scrollPositions.current = {};
  };

  return (
    <ChatbotContext.Provider value={{
      conversations,
      activeConversation,
      searchTerm,
      setSearchTerm,
      selectConversation: setActiveId,
      createConversation,
      sendQuestion,
      setDraft,
      setSelectedFile,
      getScrollPosition,
      saveScrollPosition,
      clearConversations,
    }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot phải được sử dụng bên trong ChatbotProvider");
  }
  return context;
}
