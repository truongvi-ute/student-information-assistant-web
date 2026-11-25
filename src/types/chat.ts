import type { UserProfile } from "@/types/auth";

export interface ChatProps {
  username?: string;
  accountId: string;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export type MessageDeliveryStatus = "sending" | "sent" | "failed";

export type ChatConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type SendChatMessageRequest = {
  recipientId: string;
  message: string;
  clientMessageId: string;
};

export type ChatMessageEvent = {
  messageId: string;
  conversationId?: string | null;
  clientMessageId?: string | null;
  createdAt: string;
  senderId: string;
  recipientId: string;
  message: string;
  type: "CHAT";
};

export type ChatReadReceiptEvent = {
  conversationId: string;
  readerId: string;
  partnerId: string;
  lastReadAt: string;
  type: "READ_RECEIPT";
};

export type ChatErrorEvent = {
  clientMessageId?: string | null;
  recipientId?: string | null;
  message: string;
  type: "ERROR";
  timestamp: string;
};

export type ChatUiMessage = ChatMessageEvent & {
  deliveryStatus?: MessageDeliveryStatus;
  errorMessage?: string | null;
};

export type ChatSocketHandlers = {
  onMessage: (message: ChatMessageEvent) => void;
  onReadReceipt?: (receipt: ChatReadReceiptEvent) => void;
  onServerError?: (errorEvent: ChatErrorEvent) => void;
  onConnectionChange: (
    connected: boolean,
    info?: { isReconnect: boolean; permanent?: boolean },
  ) => void;
  onError?: (error: unknown) => void;
};

export type ChatContact = {
  accountId: string;
  fullName: string;
  role: "ADVISOR" | "STUDENT";
  departmentId?: string | null;
  departmentName?: string | null;
  avatarUrl?: string;
  online?: boolean;
  department?: string;
};

export type ChatDepartment = {
  id: string;
  name: string;
};

export type ChatConversationItem = {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  partnerRole: "ADVISOR" | "STUDENT";
  partnerDepartment?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
  partnerLastReadAt?: string | null;
};

export type ChatHistoryResponse = {
  conversationId?: string | null;
  messages: Omit<ChatMessageEvent, "type">[];
  hasNext: boolean;
  partnerLastReadAt?: string | null;
  myLastReadAt?: string | null;
};

export type MarkChatReadRequest = {
  contactId: string;
  lastMessageId?: string | null;
  lastReadAt?: string | null;
};

export type MarkChatReadResponse = {
  conversationId: string | null;
  contactId: string;
  lastReadAt: string | null;
  updated: boolean;
};
