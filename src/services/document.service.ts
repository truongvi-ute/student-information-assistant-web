import { apiClient, type BlobDownloadResult } from "@/lib/api/api-client";
import type {
  DocumentContentResponse,
  DocumentRagRequestResponse,
  DocumentResponse,
  DocumentUploadResponse,
  RejectDocumentRagRequestPayload,
  UploadDocumentPayload,
} from "@/types/document";

const PREVIEW_CACHE_LIMIT = 5;
const previewCache = new Map<string, BlobDownloadResult>();

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
   * Admin tải tệp gốc của yêu cầu ADD đang chờ duyệt để kiểm tra nội dung (GET /api/document-requests/{requestId}/file).
   */
  async getReviewFile(
    requestId: string,
    options?: { signal?: AbortSignal }
  ): Promise<BlobDownloadResult> {
    options?.signal?.throwIfAborted();
    return apiClient.getBlob(
      `/document-requests/${encodeURIComponent(requestId)}/file`,
      options
    );
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

  /**
   * Lấy nội dung Markdown chuẩn hóa của tài liệu để xem trước và tô sáng (GET /api/documents/{documentId}/content).
   */
  async getDocumentContent(
    documentId: string,
    options?: { signal?: AbortSignal }
  ): Promise<DocumentContentResponse> {
    return apiClient.get<DocumentContentResponse>(
      `/documents/${encodeURIComponent(documentId)}/content`,
      options
    );
  },

  /**
   * Xem trước file gốc của tài liệu (inline) từ RustFS (GET /api/documents/{documentId}/preview).
   * Cache LRU nhẹ trong bộ nhớ để mở lại cùng tài liệu tức thì.
   */
  async previewDocument(
    documentId: string,
    options?: { signal?: AbortSignal }
  ): Promise<BlobDownloadResult> {
    options?.signal?.throwIfAborted();
    const cached = previewCache.get(documentId);
    if (cached) {
      previewCache.delete(documentId);
      previewCache.set(documentId, cached);
      return cached;
    }

    const result = await apiClient.getBlob(
      `/documents/${encodeURIComponent(documentId)}/preview`,
      options
    );

    if (previewCache.size >= PREVIEW_CACHE_LIMIT) {
      const oldestKey = previewCache.keys().next().value;
      if (oldestKey !== undefined) {
        previewCache.delete(oldestKey);
      }
    }
    previewCache.set(documentId, result);
    return result;
  },

  /**
   * Tải file gốc của tài liệu từ RustFS (GET /api/documents/{documentId}/download).
   */
  async downloadDocument(
    documentId: string,
    options?: { signal?: AbortSignal }
  ): Promise<BlobDownloadResult> {
    return apiClient.getBlob(
      `/documents/${encodeURIComponent(documentId)}/download`,
      options
    );
  },
};
