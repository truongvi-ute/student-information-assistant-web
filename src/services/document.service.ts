import { apiClient } from "@/lib/api/api-client";
import type {
  DocumentResponse,
  DocumentUploadResponse,
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
};
