import { apiClient } from "@/lib/api/api-client";
import type {
  AiChatbotHistoryResponse,
  AiChatbotTurnResponse,
  AiConversationResponse,
  CreateAiConversationRequest,
  SendAiMessageRequest,
} from "@/types/chatbot";

export const chatbotService = {
  createConversation(
    payload?: CreateAiConversationRequest
  ): Promise<AiConversationResponse> {
    return apiClient.post<AiConversationResponse>(
      "/chat/ai/conversations",
      payload ?? {}
    );
  },

  getConversations(): Promise<AiConversationResponse[]> {
    return apiClient.get<AiConversationResponse[]>("/chat/ai/conversations");
  },

  getMessages(
    conversationId: string,
    page = 0,
    size = 30
  ): Promise<AiChatbotHistoryResponse> {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    return apiClient.get<AiChatbotHistoryResponse>(
      `/chat/ai/conversations/${encodeURIComponent(conversationId)}/messages?${query}`
    );
  },

  askQuestion(
    conversationId: string,
    payload: SendAiMessageRequest
  ): Promise<AiChatbotTurnResponse> {
    return apiClient.post<AiChatbotTurnResponse>(
      `/chat/ai/conversations/${encodeURIComponent(conversationId)}/messages`,
      payload
    );
  },

  deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete<void>(
      `/chat/ai/conversations/${encodeURIComponent(conversationId)}`
    );
  },
};
