import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { IncomingChatToastData } from "@/components/chat/ChatIncomingToast";
import { useChatConversations } from "@/hooks/useChatConversations";
import { ChatSocketService } from "@/services/chat-socket.service";
import type {
  ChatConnectionStatus,
  ChatContact,
  ChatConversationItem,
  ChatErrorEvent,
  ChatMessageEvent,
  ChatReadReceiptEvent,
  ChatSocketHandlers,
  SendChatMessageRequest,
} from "@/types/chat";
import { authStorage } from "@/utils/auth-storage";

const INCOMING_TOAST_DURATION_MS = 4500;

export type ChatViewSocketListener = {
  onMessage?: (message: ChatMessageEvent) => void;
  onReadReceipt?: (receipt: ChatReadReceiptEvent) => void;
  onServerError?: (errorEvent: ChatErrorEvent) => void;
  onConnectionChange?: (
    connected: boolean,
    info?: { isReconnect: boolean; permanent?: boolean },
  ) => void;
};

interface ConsultationProviderProps {
  children: ReactNode;
  enabled?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  isChatPageActive?: boolean;
}

interface ConsultationContextType {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedContact: ChatContact | null;
  setSelectedContact: Dispatch<SetStateAction<ChatContact | null>>;
  isAdvisorDialogOpen: boolean;
  setIsAdvisorDialogOpen: Dispatch<SetStateAction<boolean>>;
  conversations: ReturnType<typeof useChatConversations>["conversations"];
  totalUnreadCount: number;
  isConversationsLoading: boolean;
  conversationsError: string | null;
  connectionStatus: ChatConnectionStatus;
  socketError: string | null;
  isTabVisible: boolean;
  incomingToast: IncomingChatToastData | null;
  dismissIncomingToast: () => void;
  refreshConversations: ReturnType<typeof useChatConversations>["refreshConversations"];
  updateOnNewMessage: ReturnType<typeof useChatConversations>["updateOnNewMessage"];
  applyReadReceipt: ReturnType<typeof useChatConversations>["applyReadReceipt"];
  markLocalConversationRead: ReturnType<typeof useChatConversations>["markLocalConversationRead"];
  sendSocketMessage: (message: SendChatMessageRequest) => boolean;
  reconnectSocket: () => void;
  subscribeSocketEvents: (listener: ChatViewSocketListener) => () => void;
  handleSelectConversation: (item: ChatConversationItem) => void;
  handleSelectAdvisorFromDialog: (advisor: ChatContact) => void;
  openConversationByPartner: (
    partnerId: string,
    fallbackName?: string,
    fallbackRole?: "ADVISOR" | "STUDENT",
  ) => void;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

function subscribeToVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  window.addEventListener("focus", callback);
  return () => {
    document.removeEventListener("visibilitychange", callback);
    window.removeEventListener("focus", callback);
  };
}

function getVisibilitySnapshot() {
  return document.visibilityState === "visible";
}

export function ConsultationProvider({
  children,
  enabled = true,
  currentUserId = "",
  currentUserRole,
  isChatPageActive = false,
}: ConsultationProviderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [isAdvisorDialogOpen, setIsAdvisorDialogOpen] = useState(false);
  const [rawConnectionStatus, setRawConnectionStatus] = useState<ChatConnectionStatus>(() =>
    typeof window !== "undefined" && authStorage.getToken() ? "connecting" : "disconnected",
  );
  const [socketError, setSocketError] = useState<string | null>(null);
  const [incomingToast, setIncomingToast] = useState<IncomingChatToastData | null>(null);

  const isTabVisible = useSyncExternalStore(
    subscribeToVisibility,
    getVisibilitySnapshot,
    () => true,
  );

  const {
    conversations,
    isLoading: isConversationsLoading,
    error: conversationsError,
    refreshConversations,
    updateOnNewMessage,
    applyReadReceipt,
    markLocalConversationRead,
  } = useChatConversations(enabled);

  const socketRef = useRef<ChatSocketService | null>(null);
  const subscribersRef = useRef<Set<ChatViewSocketListener>>(new Set());
  const conversationsRef = useRef<ChatConversationItem[]>(conversations);
  const selectedContactRef = useRef<ChatContact | null>(selectedContact);
  const currentUserIdRef = useRef(currentUserId);
  const currentUserRoleRef = useRef(currentUserRole);
  const isChatPageActiveRef = useRef(isChatPageActive);
  const isTabVisibleRef = useRef(isTabVisible);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
    selectedContactRef.current = selectedContact;
    currentUserIdRef.current = currentUserId;
    currentUserRoleRef.current = currentUserRole;
    isChatPageActiveRef.current = isChatPageActive;
    isTabVisibleRef.current = isTabVisible;
  });

  const dismissIncomingToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setIncomingToast(null);
  }, []);

  const buildSocketHandlers = useCallback((): ChatSocketHandlers => {
    return {
      onMessage: (incoming) => {
        if (incoming.type && incoming.type !== "CHAT") return;

        const uid = currentUserIdRef.current;
        const activeViewingContact = isChatPageActiveRef.current
          ? selectedContactRef.current
          : null;
        const isNew = updateOnNewMessage(
          incoming,
          uid,
          activeViewingContact,
          isTabVisibleRef.current,
        );

        subscribersRef.current.forEach((listener) => {
          listener.onMessage?.(incoming);
        });

        if (isNew && incoming.senderId !== uid && !isChatPageActiveRef.current) {
          const existingConv = conversationsRef.current.find(
            (c) => c.partnerId === incoming.senderId,
          );
          const fallbackRole: "ADVISOR" | "STUDENT" =
            currentUserRoleRef.current === "ADVISOR" ? "STUDENT" : "ADVISOR";
          const senderRole = existingConv?.partnerRole ?? fallbackRole;
          const senderName =
            existingConv?.partnerName ??
            (senderRole === "ADVISOR" ? "Cố vấn học tập" : "Sinh viên");

          if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
          }

          setIncomingToast({
            messageId: incoming.messageId,
            partnerId: incoming.senderId,
            senderName,
            senderRole,
            message: incoming.message,
          });

          toastTimerRef.current = setTimeout(() => {
            toastTimerRef.current = null;
            setIncomingToast((prev) =>
              prev?.messageId === incoming.messageId ? null : prev,
            );
          }, INCOMING_TOAST_DURATION_MS);
        }
      },
      onReadReceipt: (receipt) => {
        applyReadReceipt(receipt, currentUserIdRef.current);
        subscribersRef.current.forEach((listener) => {
          listener.onReadReceipt?.(receipt);
        });
      },
      onServerError: (errEvent) => {
        if (!errEvent.clientMessageId) {
          setSocketError(errEvent.message || "Không thể gửi tin nhắn.");
        }
        subscribersRef.current.forEach((listener) => {
          listener.onServerError?.(errEvent);
        });
      },
      onConnectionChange: (connected, info) => {
        if (connected) {
          setRawConnectionStatus("connected");
          setSocketError(null);
          if (info?.isReconnect) {
            refreshConversations({ silent: true });
          }
        } else {
          const hasToken = Boolean(authStorage.getToken());
          setRawConnectionStatus(!info?.permanent && hasToken ? "reconnecting" : "disconnected");
        }

        subscribersRef.current.forEach((listener) => {
          listener.onConnectionChange?.(connected, info);
        });
      },
      onError: (err) => {
        setSocketError(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
      },
    };
  }, [applyReadReceipt, refreshConversations, updateOnNewMessage]);

  useEffect(() => {
    if (!enabled || !currentUserId) return;

    const socket = new ChatSocketService();
    socketRef.current = socket;
    socket.connect(buildSocketHandlers());

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [buildSocketHandlers, currentUserId, enabled]);

  const subscribeSocketEvents = useCallback((listener: ChatViewSocketListener) => {
    subscribersRef.current.add(listener);
    return () => {
      subscribersRef.current.delete(listener);
    };
  }, []);

  const sendSocketMessage = useCallback((message: SendChatMessageRequest): boolean => {
    return socketRef.current?.send(message) ?? false;
  }, []);

  const reconnectSocket = useCallback(() => {
    if (!enabled || !currentUserIdRef.current) return;
    setRawConnectionStatus("connecting");
    setSocketError(null);
    socketRef.current?.reconnect(buildSocketHandlers());
  }, [buildSocketHandlers, enabled]);

  const handleSelectConversation = useCallback((item: ChatConversationItem) => {
    const contact: ChatContact = {
      accountId: item.partnerId,
      fullName: item.partnerName,
      role: item.partnerRole,
      departmentName: item.partnerDepartment,
    };
    setSelectedContact(contact);
  }, []);

  const handleSelectAdvisorFromDialog = useCallback(
    (advisor: ChatContact) => {
      const existing = conversationsRef.current.find((c) => c.partnerId === advisor.accountId);
      if (existing) {
        handleSelectConversation(existing);
      } else {
        setSelectedContact(advisor);
      }
    },
    [handleSelectConversation],
  );

  const openConversationByPartner = useCallback(
    (
      partnerId: string,
      fallbackName?: string,
      fallbackRole?: "ADVISOR" | "STUDENT",
    ) => {
      const existing = conversationsRef.current.find((c) => c.partnerId === partnerId);
      if (existing) {
        handleSelectConversation(existing);
        return;
      }
      setSelectedContact({
        accountId: partnerId,
        fullName:
          fallbackName ||
          (currentUserRoleRef.current === "ADVISOR" ? "Sinh viên" : "Cố vấn học tập"),
        role:
          fallbackRole ||
          (currentUserRoleRef.current === "ADVISOR" ? "STUDENT" : "ADVISOR"),
      });
    },
    [handleSelectConversation],
  );

  const totalUnreadCount = useMemo(
    () => conversations.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0),
    [conversations],
  );

  const connectionStatus: ChatConnectionStatus =
    enabled && currentUserId ? rawConnectionStatus : "disconnected";

  const value = useMemo<ConsultationContextType>(
    () => ({
      searchTerm,
      setSearchTerm,
      selectedContact,
      setSelectedContact,
      isAdvisorDialogOpen,
      setIsAdvisorDialogOpen,
      conversations,
      totalUnreadCount,
      isConversationsLoading,
      conversationsError,
      connectionStatus,
      socketError,
      isTabVisible,
      incomingToast,
      dismissIncomingToast,
      refreshConversations,
      updateOnNewMessage,
      applyReadReceipt,
      markLocalConversationRead,
      sendSocketMessage,
      reconnectSocket,
      subscribeSocketEvents,
      handleSelectConversation,
      handleSelectAdvisorFromDialog,
      openConversationByPartner,
    }),
    [
      applyReadReceipt,
      connectionStatus,
      conversations,
      conversationsError,
      dismissIncomingToast,
      handleSelectAdvisorFromDialog,
      handleSelectConversation,
      incomingToast,
      isAdvisorDialogOpen,
      isConversationsLoading,
      isTabVisible,
      markLocalConversationRead,
      openConversationByPartner,
      reconnectSocket,
      refreshConversations,
      searchTerm,
      selectedContact,
      sendSocketMessage,
      socketError,
      subscribeSocketEvents,
      totalUnreadCount,
      updateOnNewMessage,
    ],
  );

  return (
    <ConsultationContext.Provider value={value}>
      {children}
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  const context = useContext(ConsultationContext);

  if (!context) {
    throw new Error("useConsultation phải được sử dụng bên trong ConsultationProvider");
  }

  return context;
}
