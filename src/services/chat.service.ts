import { apiClient } from "@/lib/api/api-client";
import type {
  ChatContact,
  ChatConversationItem,
  ChatDepartment,
  ChatHistoryResponse,
  MarkChatReadRequest,
  MarkChatReadResponse,
} from "@/types/chat";

export const chatService = {
  getHistory(contactId: string, page = 0): Promise<ChatHistoryResponse> {
    const query = new URLSearchParams({ contactId, page: String(page), size: "30" });
    return apiClient.get<ChatHistoryResponse>(`/chat/messages?${query}`);
  },

  getContacts(): Promise<ChatContact[]> {
    return apiClient.get<ChatContact[]>("/chat/contacts");
  },

  getConversations(): Promise<ChatConversationItem[]> {
    return apiClient.get<ChatConversationItem[]>("/chat/conversations");
  },

  markConversationRead(payload: MarkChatReadRequest): Promise<MarkChatReadResponse> {
    return apiClient.post<MarkChatReadResponse>("/chat/conversations/read", payload);
  },

  getDepartments(): Promise<ChatDepartment[]> {
    return apiClient.get<ChatDepartment[]>("/chat/departments");
  },
};