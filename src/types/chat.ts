import type { UserProfile } from "@/types/auth";

export interface ChatProps {
  username?: string;
  accountId: string;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export type SendChatMessageRequest = {
  recipientId: string;
  message: string;
};

export type ChatMessageEvent = {
  messageId: string;
  createdAt: string;
  senderId: string;
  recipientId: string;
  message: string;
  type: "CHAT";
};

export type ChatSocketHandlers = {
  onMessage: (message: ChatMessageEvent) => void;
  onConnectionChange: (connected: boolean) => void;
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
};

export type ChatHistoryResponse = {
  messages: Omit<ChatMessageEvent, "type">[];
  hasNext: boolean;
};
