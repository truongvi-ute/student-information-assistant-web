import { apiClient } from "@/lib/api/api-client";
import type {
  DocumentRagRequestResponse,
  DocumentResponse,
  DocumentUploadResponse,
  RejectDocumentRagRequestPayload,
  UploadDocumentPayload,
} from "@/types/document";

export const documentService = {
  /**
   * Tải lên tài liệu đào tạo mới (POST /api/documents - multipart/form-data).
   */
  async uploadDocument(
    payload: UploadDocumentPayload
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("title", payload.title.trim());

    if (payload.description && payload.description.trim()) {
      formData.append("description", payload.description.trim());
    }

    formData.append(
      "allowDownload",
      String(payload.allowDownload ?? true)
    );

    return apiClient.post<DocumentUploadResponse>("/documents", formData);
  },

  /**
   * Lấy danh sách tài liệu từ cơ sở dữ liệu (GET /api/documents).
   */
  async getDocuments(): Promise<DocumentResponse[]> {
    return apiClient.get<DocumentResponse[]>("/documents");
  },

  /**
   * Advisor gửi yêu cầu thêm tài liệu vào kho RAG (POST /api/document-requests/documents/{documentId}).
   */
  async createAddRequest(documentId: string): Promise<string> {
    return apiClient.post<string>(`/document-requests/documents/${documentId}`);
  },

  /**
   * Advisor xem danh sách yêu cầu của chính mình (GET /api/document-requests/mine).
   */
  async getMyRequests(): Promise<DocumentRagRequestResponse[]> {
    return apiClient.get<DocumentRagRequestResponse[]>("/document-requests/mine");
  },

  /**
   * Admin xem danh sách các yêu cầu đang chờ duyệt (GET /api/document-requests/pending).
   */
  async getPendingRequests(): Promise<DocumentRagRequestResponse[]> {
    return apiClient.get<DocumentRagRequestResponse[]>("/document-requests/pending");
  },

  /**
   * Admin phê duyệt yêu cầu (POST /api/document-requests/{requestId}/approve).
   */
  async approveRequest(requestId: string): Promise<void> {
    return apiClient.post<void>(`/document-requests/${requestId}/approve`);
  },

  /**
   * Admin từ chối yêu cầu kèm lý do (POST /api/document-requests/{requestId}/reject).
   */
  async rejectRequest(
    requestId: string,
    reason: string
  ): Promise<void> {
    return apiClient.post<void>(`/document-requests/${requestId}/reject`, {
      reason,
    } as RejectDocumentRagRequestPayload);
  },
};
