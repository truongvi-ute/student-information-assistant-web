export type AiSenderType = "STUDENT" | "ADVISOR" | "AI";

export interface AiCitationResponse {
  documentId: string | null;
  sourceTitle: string;
  pageNumber: number | null;
  chunkReference: string | null;
  quotedContent: string;
  relevanceScore: number | null;
}

export interface AiMessageResponse {
  messageId: string;
  senderType: AiSenderType;
  content: string;
  citations: AiCitationResponse[];
  sentAt: string;
}

export interface AiConversationResponse {
  conversationId: string;
  title: string;
  scopeMajorId: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface AiChatbotHistoryResponse {
  messages: AiMessageResponse[];
  hasNext: boolean;
}

export interface AiChatbotTurnResponse {
  conversationId: string;
  title: string;
  studentMessage: AiMessageResponse;
  aiMessage: AiMessageResponse;
}

export interface CreateAiConversationRequest {
  title?: string;
  scopeMajorId?: string;
}

export interface SendAiMessageRequest {
  question: string;
  topK?: number;
  filenameFilter?: string;
}

export interface ChatbotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: AiCitationResponse[];
  sentAt?: string;
  isPending?: boolean;
}

export interface ChatbotConversation {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string | null;
  createdAt: string;
  messages: ChatbotMessage[];
  messagesLoaded: boolean;
  hasNext: boolean;
  page: number;
  draft: string;
}
