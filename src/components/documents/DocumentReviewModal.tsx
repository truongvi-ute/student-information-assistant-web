import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  Check,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfHighlightViewer } from "@/components/chatbot/PdfHighlightViewer";
import { ApiClientError } from "@/lib/api/api-error";
import { documentService } from "@/services/document.service";
import type {
  DocumentItem,
  DocumentRagRequestResponse,
} from "@/types/document";
import { formatFileSize } from "@/validations/document.validation";
import {
  DocumentLifecycleBadge,
  DocumentProcessingBadge,
  DocumentRequestStatusBadge,
  DocumentRequestTypeBadge,
  isPdfDocument,
} from "./DocumentStatusBadges";

export interface DocumentReviewModalProps {
  open: boolean;
  request: DocumentRagRequestResponse | null;
  document: DocumentItem | null;
  isDocumentLoading: boolean;
  documentLoadError: string | null;
  onRetryLoadDocument: () => void;
  onClose: () => void;
  onApprove?: (request: DocumentRagRequestResponse) => Promise<void> | void;
  onReject?: (
    request: DocumentRagRequestResponse,
    reason: string
  ) => Promise<void> | void;
  onReviewConflict?: () => Promise<void> | void;
  submittingAction?: "APPROVE" | "REJECT" | null;
  decisionError?: string | null;
  onClearDecisionError?: () => void;
}

interface PreviewLoadState {
  key: string;
  pdfBytes: Uint8Array | null;
  markdownContent: string | null;
  error: string | null;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-3 mb-1.5 text-base font-bold text-[#0F172A] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 mb-1.5 text-sm font-bold text-[#0F172A] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-2.5 mb-1 text-sm font-semibold text-[#0F172A] first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 leading-relaxed text-[#1E293B] last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#0F172A]">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-[#1E293B] last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-[#1E293B] last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white">
      <table className="w-full border-collapse text-left text-xs">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#F8FAFC] text-[#0F172A]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-[#E2E8F0] px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[#F1F5F9] px-3 py-2 text-[#334155]">
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[#93C5FD] bg-[#F8FAFC] py-1 pl-3 pr-2 text-xs text-[#475569]">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-[#0F172A] p-3 text-xs text-[#F8FAFC]">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3 border-[#E2E8F0]" />,
};

function formatDateTimeVi(value?: string | null): string {
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

function mapPreviewErrorMessage(err: unknown, isPdf: boolean): string {
  if (err instanceof ApiClientError) {
    if (err.status === 404) {
      return isPdf
        ? "Không tìm thấy tệp PDF trên máy chủ."
        : "Chưa tìm thấy nội dung trích xuất của tài liệu.";
    }
    if (err.status === 403) {
      return "Bạn không có quyền xem nội dung tài liệu này.";
    }
    if (err.status === 503) {
      return "Dịch vụ lưu trữ tài liệu tạm thời không khả dụng.";
    }
    return (
      err.message ||
      (isPdf
        ? "Không thể tải tệp PDF từ máy chủ."
        : "Không thể tải nội dung tài liệu từ máy chủ.")
    );
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return isPdf
    ? "Không thể tải tệp PDF từ máy chủ."
    : "Không thể tải nội dung tài liệu từ máy chủ.";
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0
  );
}

export function DocumentReviewModal(props: DocumentReviewModalProps) {
  if (!props.open) return null;

  const modalKey =
    props.request?.id ?? props.document?.documentId ?? "document-review-modal";

  return <DocumentReviewModalContent key={modalKey} {...props} />;
}

function DocumentReviewModalContent({
  request,
  document: doc,
  isDocumentLoading,
  documentLoadError,
  onRetryLoadDocument,
  onClose,
  onApprove,
  onReject,
  onReviewConflict,
  submittingAction = null,
  decisionError = null,
  onClearDecisionError,
}: DocumentReviewModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const rejectTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const downloadControllerRef = useRef<AbortController | null>(null);
  const reviewFileControllerRef = useRef<AbortController | null>(null);
  const activeObjectUrlsRef = useRef<Set<string>>(new Set());
  const revokeTimersRef = useRef<Set<number>>(new Set());

  const [previewRetryCount, setPreviewRetryCount] = useState(0);
  const [loadState, setLoadState] = useState<PreviewLoadState | null>(null);
  const [pdfRenderState, setPdfRenderState] = useState<{
    key: string;
    isRendering: boolean;
    renderError: string | null;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloadingReviewFile, setIsDownloadingReviewFile] = useState(false);
  const [reviewFileError, setReviewFileError] = useState<string | null>(null);
  const [hasDownloadedReviewFile, setHasDownloadedReviewFile] = useState(false);
  const [hasConfirmedDocxReview, setHasConfirmedDocxReview] = useState(false);

  const [isRejectFormOpen, setIsRejectFormOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [localRejectError, setLocalRejectError] = useState<string | null>(null);

  const isSubmitting = Boolean(submittingAction);
  const canReviewDecision = Boolean(
    request && request.status === "PENDING" && onApprove && onReject
  );
  const isPendingAddReview = Boolean(
    canReviewDecision && request?.requestType === "ADD"
  );
  const isEligibleForAdd = Boolean(
    doc &&
      doc.lifecycleStatus === "DRAFT" &&
      doc.ragStatus === "NOT_INDEXED"
  );
  const isPdf = useMemo(
    () =>
      doc ? isPdfDocument(doc.originalFilename, doc.mimeType) : false,
    [doc]
  );
  const isDocxPendingReview = Boolean(
    !isPdf && isPendingAddReview && isEligibleForAdd
  );
  const shouldFetchContent = Boolean(
    doc && (isPdf || doc.ragStatus === "READY")
  );
  const previewTargetKey = doc
    ? `${doc.documentId}:${doc.ragStatus}:${isPdf ? "pdf" : "docx"}:${previewRetryCount}`
    : null;

  const isPreviewLoading = Boolean(
    shouldFetchContent && previewTargetKey && loadState?.key !== previewTargetKey
  );
  const activePdfBytes =
    previewTargetKey && loadState?.key === previewTargetKey
      ? loadState.pdfBytes
      : null;
  const activeMarkdownContent =
    previewTargetKey && loadState?.key === previewTargetKey
      ? loadState.markdownContent
      : null;
  const activePreviewError =
    previewTargetKey && loadState?.key === previewTargetKey
      ? loadState.error
      : null;

  const handlePdfRenderStateChange = useCallback(
    (state: { isRendering: boolean; renderError: string | null }) => {
      if (!previewTargetKey) return;
      setPdfRenderState({
        key: previewTargetKey,
        isRendering: state.isRendering,
        renderError: state.renderError,
      });
    },
    [previewTargetKey]
  );

  const isPdfPreviewReady = Boolean(
    isPdf &&
      previewTargetKey &&
      !isPreviewLoading &&
      !activePreviewError &&
      activePdfBytes &&
      pdfRenderState?.key === previewTargetKey &&
      !pdfRenderState.isRendering &&
      !pdfRenderState.renderError
  );

  const isDocxReviewReady = Boolean(
    isDocxPendingReview &&
      hasDownloadedReviewFile &&
      hasConfirmedDocxReview &&
      !isDownloadingReviewFile &&
      !reviewFileError
  );

  const isPreviewReadyForApproval = !isEligibleForAdd
    ? false
    : isPdf
      ? isPdfPreviewReady
      : isDocxReviewReady;

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  useEffect(() => {
    const winDoc = window.document;
    previousFocusRef.current = winDoc.activeElement as HTMLElement | null;
    const prevOverflow = winDoc.body.style.overflow;
    winDoc.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const objectUrls = activeObjectUrlsRef.current;
    const revokeTimers = revokeTimersRef.current;

    return () => {
      window.cancelAnimationFrame(focusFrame);
      winDoc.body.style.overflow = prevOverflow;
      downloadControllerRef.current?.abort();
      reviewFileControllerRef.current?.abort();

      for (const timerId of revokeTimers) {
        window.clearTimeout(timerId);
      }
      revokeTimers.clear();

      for (const url of objectUrls) {
        URL.revokeObjectURL(url);
      }
      objectUrls.clear();

      const prevEl = previousFocusRef.current;
      if (prevEl && typeof prevEl.focus === "function") {
        prevEl.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isSubmitting) return;
        if (isRejectFormOpen) {
          setIsRejectFormOpen(false);
          setLocalRejectError(null);
          onClearDecisionError?.();
          return;
        }
        handleRequestClose();
        return;
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusables = getFocusableElements(modalRef.current);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = window.document.activeElement;

        if (event.shiftKey) {
          if (activeEl === first || !modalRef.current.contains(activeEl)) {
            event.preventDefault();
            last.focus();
          }
        } else if (activeEl === last || !modalRef.current.contains(activeEl)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleRequestClose,
    isRejectFormOpen,
    isSubmitting,
    onClearDecisionError,
  ]);

  useEffect(() => {
    if (!shouldFetchContent || !doc || !previewTargetKey) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadPreview = async () => {
      try {
        if (isPdf) {
          const res = await documentService.previewDocument(doc.documentId, {
            signal: controller.signal,
          });
          const buffer = await res.blob.arrayBuffer();
          if (cancelled || controller.signal.aborted) return;

          setLoadState({
            key: previewTargetKey,
            pdfBytes: new Uint8Array(buffer),
            markdownContent: null,
            error: null,
          });
        } else {
          const res = await documentService.getDocumentContent(
            doc.documentId,
            {
              signal: controller.signal,
            }
          );
          if (cancelled || controller.signal.aborted) return;

          setLoadState({
            key: previewTargetKey,
            pdfBytes: null,
            markdownContent: res.markdownContent ?? "",
            error: null,
          });
        }
      } catch (err: unknown) {
        if (cancelled || controller.signal.aborted) return;
        setLoadState({
          key: previewTargetKey,
          pdfBytes: null,
          markdownContent: null,
          error: mapPreviewErrorMessage(err, isPdf),
        });
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [doc, isPdf, previewTargetKey, shouldFetchContent]);

  const triggerBrowserDownload = (blob: Blob, preferredFilename: string) => {
    if (
      typeof window === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      return;
    }

    const url = URL.createObjectURL(blob);
    activeObjectUrlsRef.current.add(url);

    const link = window.document.createElement("a");
    link.href = url;
    link.download = preferredFilename;
    window.document.body.appendChild(link);
    link.click();
    link.remove();

    const timerId = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      activeObjectUrlsRef.current.delete(url);
      revokeTimersRef.current.delete(timerId);
    }, 1000);
    revokeTimersRef.current.add(timerId);
  };

  const handleDownloadOriginal = async () => {
    if (!doc || isDownloading || !doc.allowDownload || doc.lifecycleStatus === "ARCHIVED") {
      return;
    }

    downloadControllerRef.current?.abort();
    const controller = new AbortController();
    downloadControllerRef.current = controller;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const { blob, filename } = await documentService.downloadDocument(
        doc.documentId,
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return;

      triggerBrowserDownload(
        blob,
        filename || doc.originalFilename || doc.title
      );
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (err instanceof ApiClientError) {
        if (err.status === 403) {
          setDownloadError("Tài liệu này không cho phép tải tệp gốc.");
        } else if (err.status === 404) {
          setDownloadError("Không tìm thấy tệp gốc trên máy chủ.");
        } else {
          setDownloadError(err.message || "Không thể tải tệp gốc.");
        }
      } else {
        setDownloadError("Không thể tải tệp gốc. Vui lòng thử lại.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsDownloading(false);
      }
    }
  };

  const handleDownloadReviewFile = async () => {
    if (
      !request ||
      !doc ||
      !isDocxPendingReview ||
      isDownloadingReviewFile ||
      isSubmitting
    ) {
      return;
    }

    reviewFileControllerRef.current?.abort();
    const controller = new AbortController();
    reviewFileControllerRef.current = controller;

    setIsDownloadingReviewFile(true);
    setReviewFileError(null);

    try {
      const { blob, filename } = await documentService.getReviewFile(
        request.id,
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return;

      triggerBrowserDownload(
        blob,
        filename || doc.originalFilename || doc.title
      );
      setHasDownloadedReviewFile(true);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setHasDownloadedReviewFile(false);
      setHasConfirmedDocxReview(false);

      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          if (onReviewConflict) {
            await onReviewConflict();
            return;
          }
          setReviewFileError(
            "Yêu cầu hoặc tài liệu đã thay đổi trạng thái. Vui lòng làm mới dữ liệu."
          );
        } else if (err.status === 403) {
          setReviewFileError(
            "Bạn không có quyền quản trị viên để tải tệp kiểm tra."
          );
        } else if (err.status === 404) {
          setReviewFileError(
            "Không tìm thấy yêu cầu xét duyệt trên máy chủ."
          );
        } else if (err.status === 503) {
          setReviewFileError(
            "Dịch vụ lưu trữ tài liệu tạm thời không khả dụng. Vui lòng thử lại."
          );
        } else {
          setReviewFileError(
            err.message || "Không thể tải tệp kiểm tra. Vui lòng thử lại."
          );
        }
      } else {
        setReviewFileError("Không thể tải tệp kiểm tra. Vui lòng thử lại.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsDownloadingReviewFile(false);
      }
    }
  };

  const handleOpenRejectForm = () => {
    if (isSubmitting) return;
    setLocalRejectError(null);
    onClearDecisionError?.();
    setIsRejectFormOpen(true);
  };

  useEffect(() => {
    if (isRejectFormOpen) {
      rejectTextareaRef.current?.focus();
    }
  }, [isRejectFormOpen]);

  const handleRejectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!request || !onReject || isSubmitting) return;

    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setLocalRejectError("Vui lòng nhập lý do từ chối.");
      rejectTextareaRef.current?.focus();
      return;
    }

    setLocalRejectError(null);
    await onReject(request, cleanReason);
  };

  const modalTitle =
    doc?.title || request?.documentTitle || "Xem chi tiết tài liệu";
  const canShowDownloadButton = Boolean(
    doc &&
      !isDocxPendingReview &&
      doc.allowDownload &&
      doc.lifecycleStatus !== "ARCHIVED"
  );
  const canApprove = Boolean(
    isPendingAddReview &&
      isEligibleForAdd &&
      !isSubmitting &&
      !isDocumentLoading &&
      !documentLoadError &&
      doc &&
      isPreviewReadyForApproval
  );
  const activeRejectError = localRejectError || decisionError;

  const handleApproveClick = () => {
    if (
      !canApprove ||
      !isEligibleForAdd ||
      !isPreviewReadyForApproval ||
      !doc ||
      !request ||
      request.status !== "PENDING" ||
      request.requestType !== "ADD" ||
      !onApprove
    ) {
      return;
    }
    void onApprove(request);
  };

  const approvalFooterHint = (() => {
    if (!doc || isDocumentLoading) {
      return "Đang tải thông tin tài liệu trước khi xét duyệt.";
    }
    if (documentLoadError) {
      return "Không thể phê duyệt khi chưa tải được thông tin tài liệu.";
    }
    if (!isEligibleForAdd) {
      return "Chỉ tài liệu bản nháp chưa xử lý mới có thể phê duyệt yêu cầu thêm mới.";
    }
    if (isPdf) {
      if (!isPdfPreviewReady) {
        return activePreviewError || pdfRenderState?.renderError
          ? "Không thể phê duyệt khi xem trước PDF bị lỗi."
          : "Đang tải nội dung PDF trước khi có thể phê duyệt.";
      }
    } else if (!hasDownloadedReviewFile) {
      return reviewFileError
        ? "Không thể phê duyệt khi tải tệp Word kiểm tra bị lỗi."
        : "Tải tệp Word để kiểm tra nội dung trước khi phê duyệt.";
    } else if (!hasConfirmedDocxReview) {
      return "Tích xác nhận đã kiểm tra nội dung tệp Word để bật Phê duyệt.";
    }
    return "Phê duyệt sẽ bắt đầu xử lý RAG; Chatbot chỉ dùng tài liệu khi đạt Sẵn sàng sử dụng.";
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-2 sm:p-4 backdrop-blur-[1px]"
      onClick={handleRequestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-review-modal-title"
    >
      <div
        ref={modalRef}
        className="flex h-[94dvh] sm:h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-[#E2E8F0] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <FileText
              className="mt-0.5 h-5 w-5 shrink-0 text-[#1D4ED8]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="document-review-modal-title"
                  className="truncate text-sm font-semibold text-[#0F172A] sm:text-base"
                >
                  {modalTitle}
                </h3>
                {request && (
                  <DocumentRequestTypeBadge type={request.requestType} />
                )}
                {request && (
                  <DocumentRequestStatusBadge status={request.status} />
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-[#64748B]">
                {doc
                  ? `${doc.originalFilename} · ${formatFileSize(doc.sizeBytes)}`
                  : isDocumentLoading
                    ? "Đang tải thông tin tài liệu..."
                    : "Thiếu thông tin chi tiết tài liệu"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canShowDownloadButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDownloading || isSubmitting}
                onClick={() => void handleDownloadOriginal()}
                className="h-8 gap-1.5 text-xs"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Tải tệp gốc</span>
              </Button>
            )}
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSubmitting}
              onClick={handleRequestClose}
              aria-label="Đóng cửa sổ xem tài liệu"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {downloadError && (
          <div
            role="alert"
            className="border-b border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-xs text-[#B91C1C] sm:px-5"
          >
            {downloadError}
          </div>
        )}

        {/* Body: Metadata + Preview */}
        <div className="min-h-0 flex-1 overflow-y-auto lg:flex lg:overflow-hidden">
          {/* Cột thông tin */}
          <section
            aria-label="Thông tin tài liệu"
            className="border-b border-[#E2E8F0] bg-white p-4 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[#475569]">
              Thông tin tài liệu
            </h4>

            {isDocumentLoading && !doc ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-[#64748B]">
                <Loader2 className="h-4 w-4 animate-spin text-[#1D4ED8]" />
                <span>Đang tải thông tin tài liệu...</span>
              </div>
            ) : !doc ? (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]"
              >
                <p className="font-medium">Không có dữ liệu tài liệu</p>
                <p className="mt-1 leading-relaxed">
                  {documentLoadError ||
                    "Không tìm thấy dữ liệu chi tiết của tài liệu tương ứng với yêu cầu này."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDocumentLoading || isSubmitting}
                  onClick={onRetryLoadDocument}
                  className="mt-2.5 h-7 gap-1.5 border-[#FCA5A5] bg-white px-2.5 text-xs text-[#B91C1C] hover:bg-[#FEF2F2]"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Thử lại</span>
                </Button>
              </div>
            ) : (
              <dl className="mt-3 space-y-3 text-xs">
                <div>
                  <dt className="text-[#64748B]">Tên tài liệu</dt>
                  <dd className="mt-0.5 font-medium text-[#0F172A] break-words">
                    {doc.title}
                  </dd>
                </div>

                <div>
                  <dt className="text-[#64748B]">Mô tả</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-[#334155] break-words">
                    {doc.description || "Không có mô tả."}
                  </dd>
                </div>

                <div>
                  <dt className="text-[#64748B]">Tệp đính kèm</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-[#0F172A] break-all">
                    {doc.originalFilename}
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-[#64748B]">Dung lượng</dt>
                    <dd className="mt-0.5 font-medium text-[#0F172A]">
                      {formatFileSize(doc.sizeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">Quyền tải</dt>
                    <dd className="mt-0.5 font-medium text-[#0F172A]">
                      {doc.allowDownload
                        ? "Cho phép sinh viên tải"
                        : "Không cho phép tải"}
                    </dd>
                  </div>
                </div>

                <div>
                  <dt className="text-[#64748B]">Người gửi / tải lên</dt>
                  <dd className="mt-0.5 font-medium text-[#0F172A] break-words">
                    {request?.requestedByName || doc.uploadedByName || "—"}
                    {doc.uploadedByEmail && (
                      <span className="block font-normal text-[11px] text-[#64748B]">
                        {doc.uploadedByEmail}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-[#64748B]">
                    {request ? "Ngày gửi yêu cầu" : "Ngày tải lên"}
                  </dt>
                  <dd className="mt-0.5 text-[#334155]">
                    {formatDateTimeVi(request?.createdAt ?? doc.createdAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-[#64748B]">Trạng thái tài liệu</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    <DocumentLifecycleBadge status={doc.lifecycleStatus} />
                    <DocumentProcessingBadge
                      lifecycleStatus={doc.lifecycleStatus}
                      ragStatus={doc.ragStatus}
                    />
                  </dd>
                </div>
              </dl>
            )}
          </section>

          {/* Khung xem nội dung kiểm tra */}
          <section
            aria-label="Nội dung kiểm tra tài liệu"
            className="flex min-h-[340px] flex-1 flex-col bg-[#F8FAFC] lg:min-h-0 lg:overflow-hidden"
          >
            {isDocumentLoading && !doc ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-xs text-[#64748B]">
                <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" />
                <span>Đang tải thông tin kiểm tra...</span>
              </div>
            ) : !doc ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-md rounded-xl border border-[#E2E8F0] bg-white p-5 text-center text-xs text-[#475569]">
                  <AlertCircle className="mx-auto h-6 w-6 text-[#B91C1C]" />
                  <p className="mt-2 font-medium text-[#0F172A]">
                    Chưa thể mở nội dung tài liệu
                  </p>
                  <p className="mt-1 leading-relaxed">
                    {documentLoadError ||
                      "Không tìm thấy dữ liệu tài liệu để xác định định dạng tệp."}
                  </p>
                </div>
              </div>
            ) : isPdf ? (
              isPreviewLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-xs text-[#64748B]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" />
                  <span>Đang tải tệp PDF gốc...</span>
                </div>
              ) : activePreviewError ? (
                <div className="flex flex-1 items-center justify-center p-6">
                  <div
                    role="alert"
                    className="max-w-md rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5 text-center text-xs text-[#B91C1C]"
                  >
                    <p className="font-medium">Không thể hiển thị tệp PDF</p>
                    <p className="mt-1">{activePreviewError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewRetryCount((c) => c + 1)}
                      className="mt-3 h-8 gap-1.5 border-[#FCA5A5] bg-white text-xs text-[#B91C1C] hover:bg-[#FEF2F2]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Thử lại</span>
                    </Button>
                  </div>
                </div>
              ) : activePdfBytes ? (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <PdfHighlightViewer
                    key={previewTargetKey ?? doc.documentId}
                    pdfBytes={activePdfBytes}
                    hitChunks={[]}
                    onRenderStateChange={handlePdfRenderStateChange}
                    onRetry={() => setPreviewRetryCount((c) => c + 1)}
                  />
                </div>
              ) : null
            ) : isDocxPendingReview ? (
              <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-5 text-center shadow-xs">
                  <FileText className="mx-auto h-7 w-7 text-[#1D4ED8]" />
                  <h4 className="mt-2.5 text-sm font-semibold text-[#0F172A]">
                    Kiểm tra nội dung tệp Word (.docx)
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                    Trình duyệt chưa hỗ trợ hiển thị trực tiếp tệp Word. Vui lòng
                    tải tệp kiểm tra về máy để mở xem nội dung trước khi phê duyệt.
                  </p>
                  {!doc.allowDownload && (
                    <p className="mt-1.5 text-[11px] text-[#64748B]">
                      Quyền tải này chỉ phục vụ Quản trị viên xét duyệt; sinh viên
                      vẫn không được phép tải tệp gốc.
                    </p>
                  )}

                  {reviewFileError && (
                    <div
                      role="alert"
                      className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-left text-xs text-[#B91C1C]"
                    >
                      {reviewFileError}
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      type="button"
                      variant={hasDownloadedReviewFile ? "outline" : "default"}
                      size="sm"
                      disabled={isDownloadingReviewFile || isSubmitting}
                      onClick={() => void handleDownloadReviewFile()}
                      className="gap-1.5 text-xs"
                    >
                      {isDownloadingReviewFile ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {hasDownloadedReviewFile
                          ? "Tải lại tệp kiểm tra"
                          : "Tải tệp để kiểm tra"}
                      </span>
                    </Button>
                  </div>

                  <label
                    htmlFor="confirm-docx-content-reviewed"
                    className={`mt-4 flex items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition-colors ${
                      hasDownloadedReviewFile && !isDownloadingReviewFile && !isSubmitting
                        ? "cursor-pointer border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A]"
                        : "cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC]/60 text-[#94A3B8]"
                    }`}
                  >
                    <input
                      id="confirm-docx-content-reviewed"
                      type="checkbox"
                      checked={hasConfirmedDocxReview}
                      disabled={
                        !hasDownloadedReviewFile ||
                        isDownloadingReviewFile ||
                        isSubmitting
                      }
                      onChange={(e) =>
                        setHasConfirmedDocxReview(e.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#CBD5E1] accent-[#1D4ED8] disabled:cursor-not-allowed"
                    />
                    <span className="leading-relaxed">
                      <span className="block font-medium">
                        Tôi đã mở và kiểm tra nội dung tệp Word này
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {hasDownloadedReviewFile
                          ? "Tích xác nhận sau khi đã kiểm tra để bật nút Phê duyệt."
                          : "Cần tải tệp kiểm tra về máy trước khi tích xác nhận."}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            ) : doc.ragStatus !== "READY" ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-md rounded-xl border border-[#E2E8F0] bg-white p-5 text-center">
                  <FileText className="mx-auto h-7 w-7 text-[#64748B]" />
                  <h4 className="mt-2.5 text-sm font-semibold text-[#0F172A]">
                    Chưa hỗ trợ xem trực tiếp tệp Word (.docx)
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                    {doc.ragStatus === "PROCESSING"
                      ? "Tài liệu Word (.docx) chưa hoàn tất trích xuất nội dung nên chưa thể hiển thị trực tiếp trong luồng này."
                      : doc.ragStatus === "FAILED"
                        ? "Quá trình trích xuất nội dung của tài liệu Word (.docx) gặp lỗi nên chưa có bản xem trước trực tiếp."
                        : "Tài liệu Word (.docx) chưa qua bước trích xuất nội dung nên chưa hỗ trợ xem trực tiếp trong luồng này."}
                  </p>
                  <p className="mt-2 text-[11px] text-[#64748B]">
                    Bạn vẫn có thể xem thông tin tài liệu ở khung bên cạnh.
                  </p>
                </div>
              </div>
            ) : isPreviewLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-xs text-[#64748B]">
                <Loader2 className="h-5 w-5 animate-spin text-[#1D4ED8]" />
                <span>Đang tải nội dung tài liệu...</span>
              </div>
            ) : activePreviewError ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <div
                  role="alert"
                  className="max-w-md rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5 text-center text-xs text-[#B91C1C]"
                >
                  <p className="font-medium">Không thể tải nội dung</p>
                  <p className="mt-1">{activePreviewError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewRetryCount((c) => c + 1)}
                    className="mt-3 h-8 gap-1.5 border-[#FCA5A5] bg-white text-xs text-[#B91C1C] hover:bg-[#FEF2F2]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Thử lại</span>
                  </Button>
                </div>
              </div>
            ) : !activeMarkdownContent?.trim() ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-md rounded-xl border border-[#E2E8F0] bg-white p-5 text-center text-xs text-[#475569]">
                  <p className="font-medium text-[#0F172A]">
                    Chưa có nội dung trích xuất để hiển thị
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewRetryCount((c) => c + 1)}
                    className="mt-3 h-8 gap-1.5 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Thử lại</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4 sm:px-6">
                <div className="mx-auto max-w-3xl text-sm break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {activeMarkdownContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        {canReviewDecision ? (
          <footer className="border-t border-[#E2E8F0] bg-white px-4 py-3 sm:px-5">
            {!isRejectFormOpen && decisionError && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B91C1C]"
              >
                {decisionError}
              </div>
            )}

            {isRejectFormOpen ? (
              <form onSubmit={handleRejectSubmit} className="space-y-2.5">
                {activeRejectError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B91C1C]"
                  >
                    {activeRejectError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="document-reject-reason"
                    className="mb-1 block text-xs font-medium text-[#0F172A]"
                  >
                    Lý do từ chối <span className="text-[#B91C1C]">*</span>
                  </label>
                  <textarea
                    id="document-reject-reason"
                    ref={rejectTextareaRef}
                    rows={2}
                    disabled={isSubmitting}
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      if (localRejectError) setLocalRejectError(null);
                      onClearDecisionError?.();
                    }}
                    placeholder="Nhập lý do để Tư vấn viên nắm rõ và điều chỉnh..."
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsRejectFormOpen(false);
                      setLocalRejectError(null);
                      onClearDecisionError?.();
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isSubmitting}
                    className="gap-1.5"
                  >
                    {submittingAction === "REJECT" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    <span>Xác nhận từ chối</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-[#64748B]">{approvalFooterHint}</p>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleRequestClose}
                  >
                    Đóng
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || isDocumentLoading}
                    onClick={handleOpenRejectForm}
                    className="gap-1.5 border-[#FCA5A5] text-[#B91C1C] hover:bg-[#FEF2F2]"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Từ chối</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canApprove}
                    onClick={handleApproveClick}
                    className="gap-1.5 bg-[#15803D] text-white hover:bg-[#166534]"
                  >
                    {submittingAction === "APPROVE" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>Phê duyệt</span>
                  </Button>
                </div>
              </div>
            )}
          </footer>
        ) : (
          <footer className="flex justify-end border-t border-[#E2E8F0] bg-white px-4 py-3 sm:px-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRequestClose}
            >
              Đóng
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}
