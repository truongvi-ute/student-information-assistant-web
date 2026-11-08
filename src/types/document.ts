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
  uploadedByEmail?: string | null;
  uploadedByName?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Bản ghi Tài liệu đào tạo hiển thị trên giao diện 
 */
export interface DocumentItem extends DocumentResponse {}

/**
 * Bản ghi Yêu cầu thay đổi tài liệu RAG 
 */
export interface DocumentChangeRequestItem {
  requestId: string;
  documentId: string;
  documentTitle: string;
  originalFilename: string;
  requestedByAdvisorName: string;
  requestedByAdvisorEmail?: string;
  requestType: DocumentRequestType;
  status: DocumentRequestStatus;
  proposedTitle?: string | null;
  proposedDescription?: string | null;
  proposedAllowDownload?: boolean | null;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}
