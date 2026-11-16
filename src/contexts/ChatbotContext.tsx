import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { chatbotService } from "@/services/chatbot.service";
import type {
  AiCitationResponse,
  AiConversationResponse,
  AiMessageResponse,
  ChatbotConversation,
  ChatbotMessage,
} from "@/types/chatbot";

export type ChatbotAuthReason = "guest" | "non-student" | null;

interface ChatbotContextType {
  conversations: ChatbotConversation[];
  activeConversation: ChatbotConversation | null;
  draft: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  canUseChatbot: boolean;
  isAuthLoading: boolean;
  authPromptReason: ChatbotAuthReason;
  isLoadingConversations: boolean;
  conversationsError: string | null;
  refreshConversations: () => Promise<void>;
  isLoadingMessages: boolean;
  isLoadingOlderMessages: boolean;
  messagesError: string | null;
  loadOlderMessages: () => Promise<void>;
  isSending: boolean;
  sendError: string | null;
  clearSendError: () => void;
  activeCitations: AiCitationResponse[];
  selectedCitationMessageId: string | null;
  selectCitationsForMessage: (messageId: string) => void;
  selectConversation: (id: string) => Promise<void>;
  createConversation: () => void;
  sendQuestion: (question: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setDraft: (value: string) => void;
  getScrollPosition: (id: string) => number | undefined;
  saveScrollPosition: (id: string, position: number) => void;
  clearConversations: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

function mapApiMessage(message: AiMessageResponse): ChatbotMessage {
  return {
    id: message.messageId,
    role: message.senderType === "AI" ? "assistant" : "user",
    content: message.content,
    citations: message.citations ?? [],
    sentAt: message.sentAt,
  };
}

function mapApiConversation(conv: AiConversationResponse): ChatbotConversation {
  return {
    id: conv.conversationId,
    title: conv.title,
    lastMessage: conv.lastMessage || "",
    lastMessageAt: conv.lastMessageAt,
    createdAt: conv.createdAt,
    messages: [],
    messagesLoaded: false,
    hasNext: false,
    page: 0,
    draft: "",
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isStudent = isAuthenticated && user?.role?.toUpperCase() === "STUDENT";
  const authPromptReason: ChatbotAuthReason = isAuthLoading
    ? null
    : !isAuthenticated
      ? "guest"
      : !isStudent
        ? "non-student"
        : null;
  const sessionKey = isStudent ? user?.id || "student" : "guest";

  return (
    <ChatbotProviderInner
      key={sessionKey}
      isStudent={isStudent}
      isAuthLoading={isAuthLoading}
      authPromptReason={authPromptReason}
    >
      {children}
    </ChatbotProviderInner>
  );
}

interface ChatbotProviderInnerProps {
  children: ReactNode;
  isStudent: boolean;
  isAuthLoading: boolean;
  authPromptReason: ChatbotAuthReason;
}

function ChatbotProviderInner({
  children,
  isStudent,
  isAuthLoading,
  authPromptReason,
}: ChatbotProviderInnerProps) {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newConversationDraft, setNewConversationDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoadingConversations, setIsLoadingConversations] = useState(isStudent && !isAuthLoading);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedCitationMessageId, setSelectedCitationMessageId] = useState<string | null>(null);

  const scrollPositions = useRef<Record<string, number>>({});
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const getScrollPosition = useCallback((id: string) => scrollPositions.current[id], []);
  const saveScrollPosition = useCallback((id: string, position: number) => {
    scrollPositions.current[id] = position;
  }, []);

  const clearConversations = useCallback(() => {
    setConversations([]);
    setActiveId(null);
    activeIdRef.current = null;
    setNewConversationDraft("");
    setSearchTerm("");
    setConversationsError(null);
    setMessagesError(null);
    setSendError(null);
    setSelectedCitationMessageId(null);
    scrollPositions.current = {};
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!isStudent) return;

    setIsLoadingConversations(true);
    setConversationsError(null);
    try {
      const data = await chatbotService.getConversations();
      setConversations((current) => {
        const currentById = new Map(current.map((item) => [item.id, item]));
        return data.map((item) => {
          const existing = currentById.get(item.conversationId);
          if (!existing) {
            return mapApiConversation(item);
          }
          return {
            ...existing,
            title: item.title,
            lastMessage: item.lastMessage || "",
            lastMessageAt: item.lastMessageAt,
          };
        });
      });
    } catch (error: unknown) {
      setConversationsError(getErrorMessage(error, "Không thể tải danh sách hội thoại AI."));
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isStudent]);

  useEffect(() => {
    if (isAuthLoading || !isStudent) return;

    let cancelled = false;
    chatbotService
      .getConversations()
      .then((data) => {
        if (!cancelled) {
          setConversations(data.map(mapApiConversation));
          setConversationsError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setConversationsError(getErrorMessage(error, "Không thể tải danh sách hội thoại AI."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingConversations(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isStudent]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) || null,
    [conversations, activeId]
  );

  const draft = activeConversation ? activeConversation.draft : newConversationDraft;

  const activeCitations = useMemo(() => {
    if (!activeConversation) return [];
    const messages = activeConversation.messages;
    if (selectedCitationMessageId) {
      const matched = messages.find((msg) => msg.id === selectedCitationMessageId);
      if (matched) return matched.citations;
    }
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant" && messages[i].citations.length > 0) {
        return messages[i].citations;
      }
    }
    return [];
  }, [activeConversation, selectedCitationMessageId]);

  const selectConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      activeIdRef.current = id;
      setSendError(null);
      setMessagesError(null);
      setSelectedCitationMessageId(null);

      const target = conversations.find((item) => item.id === id);
      if (!target || target.messagesLoaded || !isStudent) {
        return;
      }

      setIsLoadingMessages(true);
      try {
        const history = await chatbotService.getMessages(id, 0, 30);
        const mappedMessages = history.messages.map(mapApiMessage);
        setConversations((current) =>
          current.map((item) =>
            item.id === id
              ? {
                ...item,
                messages: mappedMessages,
                messagesLoaded: true,
                hasNext: history.hasNext,
                page: 0,
              }
              : item
          )
        );
      } catch (error: unknown) {
        if (activeIdRef.current === id) {
          setMessagesError(getErrorMessage(error, "Không thể tải lịch sử tin nhắn."));
        }
      } finally {
        if (activeIdRef.current === id) {
          setIsLoadingMessages(false);
        }
      }
    },
    [conversations, isStudent]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!activeId || !isStudent || isLoadingOlderMessages) return;
    const currentConv = conversations.find((item) => item.id === activeId);
    if (!currentConv || !currentConv.hasNext) return;

    const nextPage = currentConv.page + 1;
    setIsLoadingOlderMessages(true);
    setMessagesError(null);
    try {
      const history = await chatbotService.getMessages(activeId, nextPage, 30);
      const olderMessages = history.messages.map(mapApiMessage);
      setConversations((current) =>
        current.map((item) => {
          if (item.id !== activeId) return item;
          const existingIds = new Set(item.messages.map((m) => m.id));
          const uniqueOlder = olderMessages.filter((m) => !existingIds.has(m.id));
          return {
            ...item,
            messages: [...uniqueOlder, ...item.messages],
            hasNext: history.hasNext,
            page: nextPage,
          };
        })
      );
    } catch (error: unknown) {
      setMessagesError(getErrorMessage(error, "Không thể tải thêm tin nhắn cũ."));
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [activeId, conversations, isStudent, isLoadingOlderMessages]);

  const createConversation = useCallback(() => {
    setActiveId(null);
    activeIdRef.current = null;
    setNewConversationDraft("");
    setSendError(null);
    setMessagesError(null);
    setSelectedCitationMessageId(null);
    setSearchTerm("");
  }, []);

  const setDraft = useCallback(
    (value: string) => {
      if (!activeId) {
        setNewConversationDraft(value);
        return;
      }
      setConversations((current) =>
        current.map((item) => (item.id === activeId ? { ...item, draft: value } : item))
      );
    },
    [activeId]
  );

  const sendQuestion = useCallback(
    async (question: string) => {
      const content = question.trim();
      if (!content || !isStudent || isSending) return;

      setIsSending(true);
      setSendError(null);

      let targetId = activeId;
      try {
        if (!targetId) {
          const created = await chatbotService.createConversation();
          const newConv: ChatbotConversation = {
            ...mapApiConversation(created),
            messagesLoaded: true,
          };
          setConversations((current) => [newConv, ...current]);
          setActiveId(created.conversationId);
          activeIdRef.current = created.conversationId;
          targetId = created.conversationId;
        }

        const tempMessageId = `pending-${crypto.randomUUID()}`;
        const optimisticUserMessage: ChatbotMessage = {
          id: tempMessageId,
          role: "user",
          content,
          citations: [],
          isPending: true,
        };

        setNewConversationDraft("");
        setConversations((current) =>
          current.map((item) =>
            item.id === targetId
              ? {
                ...item,
                draft: "",
                messages: [...item.messages, optimisticUserMessage],
              }
              : item
          )
        );

        try {
          const turn = await chatbotService.askQuestion(targetId, { question: content });
          const studentMsg = mapApiMessage(turn.studentMessage);
          const aiMsg = mapApiMessage(turn.aiMessage);

          setConversations((current) => {
            const existing = current.find((item) => item.id === targetId);
            if (!existing) return current;

            const updated: ChatbotConversation = {
              ...existing,
              title: turn.title || existing.title,
              lastMessage: aiMsg.content,
              lastMessageAt: aiMsg.sentAt ?? existing.lastMessageAt,
              messagesLoaded: true,
              messages: [
                ...existing.messages.filter((m) => m.id !== tempMessageId),
                studentMsg,
                aiMsg,
              ],
            };
            return [updated, ...current.filter((item) => item.id !== targetId)];
          });
          setSelectedCitationMessageId(aiMsg.id);
        } catch (askError: unknown) {
          setConversations((current) =>
            current.map((item) =>
              item.id === targetId
                ? {
                  ...item,
                  draft: content,
                  messages: item.messages.filter((m) => m.id !== tempMessageId),
                }
                : item
            )
          );
          setSendError(getErrorMessage(askError, "Không thể nhận phản hồi từ trợ lý AI. Vui lòng thử lại."));
        }
      } catch (createError: unknown) {
        setSendError(getErrorMessage(createError, "Không thể khởi tạo cuộc hội thoại AI."));
      } finally {
        setIsSending(false);
      }
    },
    [activeId, isStudent, isSending]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!isStudent) return;
      try {
        await chatbotService.deleteConversation(id);
        setConversations((current) => current.filter((item) => item.id !== id));
        if (activeId === id) {
          setActiveId(null);
          activeIdRef.current = null;
          setSelectedCitationMessageId(null);
          setSendError(null);
          setMessagesError(null);
        }
      } catch (error: unknown) {
        setConversationsError(getErrorMessage(error, "Không thể xóa cuộc hội thoại."));
      }
    },
    [activeId, isStudent]
  );

  const selectCitationsForMessage = useCallback((messageId: string) => {
    setSelectedCitationMessageId(messageId);
  }, []);

  const clearSendError = useCallback(() => {
    setSendError(null);
  }, []);

  return (
    <ChatbotContext.Provider
      value={{
        conversations,
        activeConversation,
        draft,
        searchTerm,
        setSearchTerm,
        canUseChatbot: isStudent,
        isAuthLoading,
        authPromptReason,
        isLoadingConversations,
        conversationsError,
        refreshConversations,
        isLoadingMessages,
        isLoadingOlderMessages,
        messagesError,
        loadOlderMessages,
        isSending,
        sendError,
        clearSendError,
        activeCitations,
        selectedCitationMessageId,
        selectCitationsForMessage,
        selectConversation,
        createConversation,
        sendQuestion,
        deleteConversation,
        setDraft,
        getScrollPosition,
        saveScrollPosition,
        clearConversations,
      }}
    >
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
