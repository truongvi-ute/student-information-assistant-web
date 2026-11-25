import {
  AlertCircle,
  Archive,
  Ban,
  CheckCircle2,
  Clock,
  FileClock,
  Loader2,
  XCircle,
} from "lucide-react";
import type {
  DocumentLifecycleStatus,
  DocumentRagRequestResponse,
  DocumentRagStatus,
  DocumentRequestStatus,
  DocumentRequestType,
} from "@/types/document";

export type DocumentProcessingCode =
  | "NOT_INDEXED"
  | "PROCESSING"
  | "FAILED"
  | "READY"
  | "STOPPED"
  | "UNCONFIRMED";

export interface DocumentProcessingInfo {
  code: DocumentProcessingCode;
  label: string;
  isReady: boolean;
}

/**
 * Chuẩn hóa cặp trạng thái vòng đời và trạng thái xử lý RAG thành nhãn hiển thị thống nhất.
 * Chỉ ACTIVE + READY mới được coi là sẵn sàng cho Chatbot sử dụng.
 */
export function getDocumentProcessingInfo(
  lifecycleStatus: DocumentLifecycleStatus,
  ragStatus: DocumentRagStatus
): DocumentProcessingInfo {
  if (lifecycleStatus === "ARCHIVED") {
    return {
      code: "STOPPED",
      label: "Đã ngừng sử dụng",
      isReady: false,
    };
  }

  if (lifecycleStatus === "ACTIVE" && ragStatus === "READY") {
    return {
      code: "READY",
      label: "Sẵn sàng sử dụng",
      isReady: true,
    };
  }

  switch (ragStatus) {
    case "NOT_INDEXED":
      return {
        code: "NOT_INDEXED",
        label: "Chưa xử lý",
        isReady: false,
      };
    case "PROCESSING":
      return {
        code: "PROCESSING",
        label: "Đang xử lý",
        isReady: false,
      };
    case "FAILED":
      return {
        code: "FAILED",
        label: "Xử lý thất bại",
        isReady: false,
      };
    case "DISABLED":
      return {
        code: "STOPPED",
        label: "Đã ngừng sử dụng",
        isReady: false,
      };
    default:
      return {
        code: "UNCONFIRMED",
        label: "Chưa sẵn sàng",
        isReady: false,
      };
  }
}

export function formatDateVi(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN");
}

export function formatDateTimeVi(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const REQUEST_STATUS_PRIORITY: Record<DocumentRequestStatus, number> = {
  PENDING: 3,
  APPROVED: 2,
  REJECTED: 1,
};

function parseTimestampMs(value?: string | null): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export interface DocumentRequestSummary {
  latestRequest: DocumentRagRequestResponse | null;
  displayRequest: DocumentRagRequestResponse | null;
  hasPendingRequest: boolean;
  hasApprovedAddRequest: boolean;
  latestRejectedAddRequest: DocumentRagRequestResponse | null;
}

/**
 * Tổng hợp các yêu cầu của một tài liệu theo thời gian mới nhất,
 * tránh để lý do từ chối cũ ghi đè trạng thái PENDING hoặc APPROVED mới hơn.
 */
export function summarizeDocumentRequests(
  requests: DocumentRagRequestResponse[],
  documentId: string
): DocumentRequestSummary {
  const docRequests = requests.filter((r) => r.documentId === documentId);

  if (docRequests.length === 0) {
    return {
      latestRequest: null,
      displayRequest: null,
      hasPendingRequest: false,
      hasApprovedAddRequest: false,
      latestRejectedAddRequest: null,
    };
  }

  const sorted = [...docRequests].sort((a, b) => {
    const createdDiff =
      parseTimestampMs(b.createdAt) - parseTimestampMs(a.createdAt);
    if (createdDiff !== 0) return createdDiff;

    const reviewedDiff =
      parseTimestampMs(b.reviewedAt) - parseTimestampMs(a.reviewedAt);
    if (reviewedDiff !== 0) return reviewedDiff;

    return (
      (REQUEST_STATUS_PRIORITY[b.status] ?? 0) -
      (REQUEST_STATUS_PRIORITY[a.status] ?? 0)
    );
  });

  const latestRequest = sorted[0] ?? null;
  const pendingRequest = sorted.find((r) => r.status === "PENDING") ?? null;
  const approvedAddRequest =
    sorted.find((r) => r.requestType === "ADD" && r.status === "APPROVED") ??
    null;

  const hasPendingRequest = pendingRequest !== null;
  const hasApprovedAddRequest = approvedAddRequest !== null;

  const displayRequest = pendingRequest ?? latestRequest;

  const latestRejectedAddRequest =
    !hasPendingRequest &&
    !hasApprovedAddRequest &&
    latestRequest?.requestType === "ADD" &&
    latestRequest.status === "REJECTED"
      ? latestRequest
      : null;

  return {
    latestRequest,
    displayRequest,
    hasPendingRequest,
    hasApprovedAddRequest,
    latestRejectedAddRequest,
  };
}

/**
 * Kiểm tra tệp tài liệu có phải PDF dựa trên MIME type hoặc phần mở rộng tên tệp.
 */
export function isPdfDocument(
  filename?: string | null,
  mimeType?: string | null
): boolean {
  if (mimeType && mimeType.trim().toLowerCase() === "application/pdf") {
    return true;
  }
  if (filename && filename.trim().toLowerCase().endsWith(".pdf")) {
    return true;
  }
  return false;
}

export function DocumentLifecycleBadge({
  status,
}: {
  status: DocumentLifecycleStatus;
}) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Hoạt động</span>
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 whitespace-nowrap">
          <FileClock className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Bản nháp</span>
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 whitespace-nowrap">
          <Archive className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Lưu trữ</span>
        </span>
      );
  }
}

export function DocumentProcessingBadge({
  lifecycleStatus,
  ragStatus,
}: {
  lifecycleStatus: DocumentLifecycleStatus;
  ragStatus: DocumentRagStatus;
}) {
  const info = getDocumentProcessingInfo(lifecycleStatus, ragStatus);

  switch (info.code) {
    case "READY":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{info.label}</span>
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap">
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
          <span>{info.label}</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 whitespace-nowrap">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{info.label}</span>
        </span>
      );
    case "STOPPED":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          <Ban className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{info.label}</span>
        </span>
      );
    case "UNCONFIRMED":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 whitespace-nowrap">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{info.label}</span>
        </span>
      );
    case "NOT_INDEXED":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 whitespace-nowrap">
          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{info.label}</span>
        </span>
      );
  }
}

export function DocumentRequestStatusBadge({
  status,
}: {
  status: DocumentRequestStatus;
}) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 whitespace-nowrap">
          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Chờ duyệt</span>
        </span>
      );
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Đã duyệt</span>
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 whitespace-nowrap">
          <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>Đã từ chối</span>
        </span>
      );
  }
}

export function DocumentRequestTypeBadge({
  type,
}: {
  type: DocumentRequestType;
}) {
  switch (type) {
    case "ADD":
      return (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap">
          Thêm mới
        </span>
      );
    case "UPDATE":
      return (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap">
          Cập nhật
        </span>
      );
    case "DELETE":
      return (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap">
          Ngừng sử dụng
        </span>
      );
  }
}
