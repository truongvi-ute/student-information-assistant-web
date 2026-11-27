export type DocumentLifecycleStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type DocumentRagStatus =
  | "NOT_INDEXED"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "DISABLED";

export type DocumentRequestType = "ADD" | "UPDATE" | "DELETE";

export type DocumentRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Payload gửi lên API POST /api/documents
 */
export interface UploadDocumentPayload {
  file: File;
  title: string;
  description?: string;
  allowDownload?: boolean;
}

/**
 * Phản hồi từ API POST /api/documents 
 */
export interface DocumentUploadResponse {
  documentId: string;
  title: string;
  description: string | null;
  allowDownload: boolean;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  lifecycleStatus: DocumentLifecycleStatus;
  ragStatus: DocumentRagStatus;
  createdAt: string;
}

/**
 * Phản hồi từ API GET /api/documents
 */
export interface DocumentResponse {
  documentId: string;
  title: string;
  description: string | null;
  allowDownload: boolean;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  lifecycleStatus: DocumentLifecycleStatus;
  ragStatus: DocumentRagStatus;
  uploadedById?: string | null;
  uploadedByEmail?: string | null;
  uploadedByName?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Bản ghi Tài liệu đào tạo hiển thị trên giao diện 
 */
export type DocumentItem = DocumentResponse;

/**
 * Bản ghi Yêu cầu thay đổi tài liệu RAG phản hồi từ Backend
 */
export interface DocumentRagRequestResponse {
  id: string;
  documentId: string;
  documentTitle: string;
  currentDescription?: string | null;
  currentAllowDownload?: boolean;
  documentLifecycleStatus?: DocumentLifecycleStatus | null;
  documentRagStatus?: DocumentRagStatus | null;
  requestedByName: string;
  reviewedByName?: string | null;
  requestType: DocumentRequestType;
  status: DocumentRequestStatus;
  proposedTitle?: string | null;
  proposedDescription?: string | null;
  proposedAllowDownload?: boolean | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

/**
 * Alias tương thích ngược cho giao diện
 */
export type DocumentChangeRequestItem = DocumentRagRequestResponse;

/**
 * Payload gửi lên API POST /api/document-requests/documents/{documentId}/update
 */
export interface CreateDocumentUpdateRequestPayload {
  title: string;
  description: string | null;
  allowDownload: boolean;
}

/**
 * Payload gửi lên API POST /api/document-requests/{requestId}/reject
 */
export interface RejectDocumentRagRequestPayload {
  reason: string;
}

/**
 * Phản hồi từ API GET /api/documents/{documentId}/content
 */
export interface DocumentContentResponse {
  documentId: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  allowDownload: boolean;
  markdownContent: string;
}
