import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  FileEdit,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DocumentItem,
  DocumentRagRequestResponse,
} from "@/types/document";
import {
  formatFileSize,
  normalizeOptionalDescription,
} from "@/validations/document.validation";
import {
  DocumentRequestStatusBadge,
  formatDateTimeVi,
} from "./DocumentStatusBadges";

export interface DocumentChangeReviewModalProps {
  open: boolean;
  request: DocumentRagRequestResponse | null;
  document: DocumentItem | null;
  isDocumentLoading: boolean;
  documentLoadError: string | null;
  onRetryLoadDocument: () => void;
  onClose: () => void;
  onApprove: (request: DocumentRagRequestResponse) => Promise<void> | void;
  onReject: (
    request: DocumentRagRequestResponse,
    reason: string
  ) => Promise<void> | void;
  onOpenDocumentPreview?: () => void;
  submittingAction?: "APPROVE" | "REJECT" | null;
  decisionError?: string | null;
  onClearDecisionError?: () => void;
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

export function DocumentChangeReviewModal(
  props: DocumentChangeReviewModalProps
) {
  if (
    !props.open ||
    !props.request ||
    (props.request.requestType !== "UPDATE" &&
      props.request.requestType !== "DELETE")
  ) {
    return null;
  }

  return (
    <DocumentChangeReviewModalContent
      key={props.request.id}
      request={props.request}
      document={props.document}
      isDocumentLoading={props.isDocumentLoading}
      documentLoadError={props.documentLoadError}
      onRetryLoadDocument={props.onRetryLoadDocument}
      onClose={props.onClose}
      onApprove={props.onApprove}
      onReject={props.onReject}
      onOpenDocumentPreview={props.onOpenDocumentPreview}
      submittingAction={props.submittingAction}
      decisionError={props.decisionError}
      onClearDecisionError={props.onClearDecisionError}
    />
  );
}

interface DocumentChangeReviewModalContentProps {
  request: DocumentRagRequestResponse;
  document: DocumentItem | null;
  isDocumentLoading: boolean;
  documentLoadError: string | null;
  onRetryLoadDocument: () => void;
  onClose: () => void;
  onApprove: (request: DocumentRagRequestResponse) => Promise<void> | void;
  onReject: (
    request: DocumentRagRequestResponse,
    reason: string
  ) => Promise<void> | void;
  onOpenDocumentPreview?: () => void;
  submittingAction?: "APPROVE" | "REJECT" | null;
  decisionError?: string | null;
  onClearDecisionError?: () => void;
}

function DocumentChangeReviewModalContent({
  request,
  document: doc,
  isDocumentLoading,
  documentLoadError,
  onRetryLoadDocument,
  onClose,
  onApprove,
  onReject,
  onOpenDocumentPreview,
  submittingAction = null,
  decisionError = null,
  onClearDecisionError,
}: DocumentChangeReviewModalContentProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const rejectTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [isRejectFormOpen, setIsRejectFormOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [localRejectError, setLocalRejectError] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const isSubmitting = Boolean(submittingAction);
  const isDeleteRequest = request.requestType === "DELETE";

  const effectiveLifecycle =
    doc?.lifecycleStatus ?? request.documentLifecycleStatus;
  const isEligible = effectiveLifecycle === "ACTIVE";

  const canApprove = Boolean(
    request.status === "PENDING" &&
      isEligible &&
      !isSubmitting &&
      !(isDocumentLoading && !doc) &&
      !documentLoadError
  );

  const currentTitle = request.documentTitle;
  const currentDescription = normalizeOptionalDescription(
    request.currentDescription !== undefined
      ? request.currentDescription
      : doc?.description
  );
  const currentAllowDownload =
    request.currentAllowDownload ?? doc?.allowDownload ?? true;

  const proposedTitle = (request.proposedTitle ?? currentTitle).trim();
  const proposedDescription = normalizeOptionalDescription(
    request.proposedDescription
  );
  const proposedAllowDownload =
    request.proposedAllowDownload ?? currentAllowDownload;

  const titleChanged = proposedTitle !== currentTitle.trim();
  const descriptionChanged = proposedDescription !== currentDescription;
  const isDescriptionCleared =
    currentDescription !== null && proposedDescription === null;
  const allowDownloadChanged = proposedAllowDownload !== currentAllowDownload;
  const unchangedCount =
    (titleChanged ? 0 : 1) +
    (descriptionChanged ? 0 : 1) +
    (allowDownloadChanged ? 0 : 1);
  const changedCount = 3 - unchangedCount;

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

    return () => {
      window.cancelAnimationFrame(focusFrame);
      winDoc.body.style.overflow = prevOverflow;
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
    if (isRejectFormOpen) {
      rejectTextareaRef.current?.focus();
    }
  }, [isRejectFormOpen]);

  const handleOpenRejectForm = () => {
    if (isSubmitting) return;
    setLocalRejectError(null);
    onClearDecisionError?.();
    setIsRejectFormOpen(true);
  };

  const handleRejectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setLocalRejectError("Vui lòng nhập lý do từ chối.");
      rejectTextareaRef.current?.focus();
      return;
    }

    setLocalRejectError(null);
    await onReject(request, cleanReason);
  };

  const activeRejectError = localRejectError || decisionError;

  const footerHint = (() => {
    if (isDocumentLoading && !doc) {
      return "Đang kiểm tra trạng thái tài liệu hiện hành...";
    }
    if (documentLoadError) {
      return "Không thể xét duyệt khi chưa tải được thông tin tài liệu.";
    }
    if (!isEligible) {
      return isDeleteRequest
        ? "Chỉ tài liệu đang Hoạt động mới có thể duyệt ngừng sử dụng."
        : "Chỉ tài liệu đang Hoạt động mới có thể duyệt cập nhật.";
    }
    return null;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-2 sm:p-4 backdrop-blur-[1px]"
      onClick={handleRequestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-change-review-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-[#E2E8F0] bg-white shadow-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            {isDeleteRequest ? (
              <Archive
                className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C1C]"
                aria-hidden="true"
              />
            ) : (
              <FileEdit
                className="mt-0.5 h-5 w-5 shrink-0 text-[#1D4ED8]"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="document-change-review-modal-title"
                  className="text-sm font-semibold text-[#0F172A] sm:text-base"
                >
                  {isDeleteRequest
                    ? "Xét duyệt yêu cầu ngừng sử dụng"
                    : "Xét duyệt yêu cầu cập nhật"}
                </h3>
                <DocumentRequestStatusBadge status={request.status} />
              </div>
              {(doc || isDocumentLoading) && (
                <p className="mt-0.5 truncate text-xs text-[#64748B]">
                  {doc
                    ? `${doc.originalFilename} · ${formatFileSize(doc.sizeBytes)}`
                    : "Đang tải thông tin tài liệu..."}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {onOpenDocumentPreview && doc && doc.lifecycleStatus !== "ARCHIVED" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={onOpenDocumentPreview}
                aria-label="Xem nội dung tài liệu"
                className="h-8 gap-1.5 text-xs"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Xem nội dung</span>
              </Button>
            )}
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSubmitting}
              onClick={handleRequestClose}
              aria-label="Đóng cửa sổ xét duyệt"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {documentLoadError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{documentLoadError}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDocumentLoading || isSubmitting}
                onClick={onRetryLoadDocument}
                className="h-7 gap-1 border-[#FCA5A5] bg-white px-2.5 text-xs text-[#B91C1C] hover:bg-[#FEF2F2]"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Thử lại</span>
              </Button>
            </div>
          )}

          <div className="space-y-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs">
            <p className="text-sm font-semibold text-[#0F172A] break-words">
              {currentTitle}
            </p>
            <p className="text-xs leading-relaxed text-[#475569]">
              Người gửi:{" "}
              <span className="font-medium text-[#0F172A]">
                {request.requestedByName}
              </span>
              {" · "}
              <span className="whitespace-nowrap">
                {formatDateTimeVi(request.createdAt)}
              </span>
            </p>
          </div>

          {isDeleteRequest ? (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-xs text-[#7F1D1D]">
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#B91C1C]"
                  aria-hidden="true"
                />
                <p className="leading-relaxed">
                  Sau khi duyệt, tài liệu sẽ được lưu trữ và không thể mở hoặc tải từ kho. Lịch sử xét duyệt vẫn được giữ.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[#475569]">
                Nội dung thay đổi ({changedCount})
              </h4>

              {titleChanged && (
                <div className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF]/40 p-3">
                  <p className="mb-2 text-xs font-semibold text-[#0F172A]">
                    Tên tài liệu
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                    <div className="rounded border border-[#E2E8F0] bg-white p-2.5 text-xs">
                      <p className="text-[10px] font-semibold uppercase text-[#64748B]">
                        Hiện tại
                      </p>
                      <p className="mt-1 text-[#334155] break-words">
                        {currentTitle}
                      </p>
                    </div>
                    <div className="flex items-center justify-center text-[#64748B]">
                      <ArrowDown className="h-4 w-4 sm:hidden" />
                      <ArrowRight className="hidden h-4 w-4 sm:block" />
                    </div>
                    <div className="rounded border border-[#93C5FD] bg-white p-2.5 text-xs">
                      <p className="text-[10px] font-semibold uppercase text-[#1D4ED8]">
                        Sau khi duyệt
                      </p>
                      <p className="mt-1 font-medium text-[#0F172A] break-words">
                        {proposedTitle}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {descriptionChanged && (
                <div
                  className={`rounded-lg border p-3 ${
                    isDescriptionCleared
                      ? "border-[#FDE68A] bg-[#FFFBEB]/70"
                      : "border-[#BFDBFE] bg-[#EFF6FF]/40"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold text-[#0F172A]">
                    Mô tả
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                    <div className="rounded border border-[#E2E8F0] bg-white p-2.5 text-xs">
                      <p className="text-[10px] font-semibold uppercase text-[#64748B]">
                        Hiện tại
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[#334155] break-words">
                        {currentDescription ?? "Không có mô tả"}
                      </p>
                    </div>
                    <div className="flex items-center justify-center text-[#64748B]">
                      <ArrowDown className="h-4 w-4 sm:hidden" />
                      <ArrowRight className="hidden h-4 w-4 sm:block" />
                    </div>
                    <div
                      className={`rounded border bg-white p-2.5 text-xs ${
                        isDescriptionCleared
                          ? "border-[#FCD34D]"
                          : "border-[#93C5FD]"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold uppercase ${
                          isDescriptionCleared
                            ? "text-[#B45309]"
                            : "text-[#1D4ED8]"
                        }`}
                      >
                        Sau khi duyệt
                      </p>
                      <p
                        className={`mt-1 whitespace-pre-wrap break-words ${
                          isDescriptionCleared
                            ? "font-semibold text-[#B45309]"
                            : "font-medium text-[#0F172A]"
                        }`}
                      >
                        {isDescriptionCleared
                          ? "Xóa mô tả"
                          : proposedDescription ?? "Không có mô tả"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {allowDownloadChanged && (
                <div
                  className={`rounded-lg border p-3 ${
                    !proposedAllowDownload
                      ? "border-[#FDE68A] bg-[#FFFBEB]/70"
                      : "border-[#BFDBFE] bg-[#EFF6FF]/40"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold text-[#0F172A]">
                    Quyền tải xuống
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                    <div className="rounded border border-[#E2E8F0] bg-white p-2.5 text-xs">
                      <p className="text-[10px] font-semibold uppercase text-[#64748B]">
                        Hiện tại
                      </p>
                      <p className="mt-1 font-medium text-[#334155]">
                        {currentAllowDownload ? "Cho phép tải" : "Không cho phép tải"}
                      </p>
                    </div>
                    <div className="flex items-center justify-center text-[#64748B]">
                      <ArrowDown className="h-4 w-4 sm:hidden" />
                      <ArrowRight className="hidden h-4 w-4 sm:block" />
                    </div>
                    <div
                      className={`rounded border bg-white p-2.5 text-xs ${
                        !proposedAllowDownload
                          ? "border-[#FCD34D]"
                          : "border-[#93C5FD]"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold uppercase ${
                          !proposedAllowDownload
                            ? "text-[#B45309]"
                            : "text-[#1D4ED8]"
                        }`}
                      >
                        Sau khi duyệt
                      </p>
                      <p
                        className={`mt-1 font-semibold ${
                          !proposedAllowDownload
                            ? "text-[#B45309]"
                            : "text-[#0F172A]"
                        }`}
                      >
                        {proposedAllowDownload ? "Cho phép tải" : "Không cho phép tải"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {unchangedCount > 0 && (
                <div className="rounded-lg border border-[#E2E8F0] bg-white">
                  <button
                    type="button"
                    aria-expanded={showUnchanged}
                    aria-controls="unchanged-fields-panel"
                    onClick={() => setShowUnchanged((prev) => !prev)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-[#475569] hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    <span>Thông tin giữ nguyên ({unchangedCount})</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showUnchanged ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {showUnchanged && (
                    <div
                      id="unchanged-fields-panel"
                      className="space-y-1.5 border-t border-[#E2E8F0] px-3 py-2.5 text-xs"
                    >
                      {!titleChanged && (
                        <div>
                          <span className="text-[#64748B]">Tên tài liệu: </span>
                          <span className="text-[#0F172A] break-words">
                            {currentTitle}
                          </span>
                        </div>
                      )}
                      {!descriptionChanged && (
                        <div>
                          <span className="text-[#64748B]">Mô tả: </span>
                          <span className="text-[#334155] break-words">
                            {currentDescription ?? "Không có mô tả"}
                          </span>
                        </div>
                      )}
                      {!allowDownloadChanged && (
                        <div>
                          <span className="text-[#64748B]">Quyền tải xuống: </span>
                          <span className="text-[#0F172A]">
                            {currentAllowDownload ? "Cho phép tải" : "Không cho phép tải"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 py-3 sm:px-5">
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
                  htmlFor="change-reject-reason"
                  className="mb-1 block text-xs font-medium text-[#0F172A]"
                >
                  Lý do từ chối <span className="text-[#B91C1C]">*</span>
                </label>
                <textarea
                  id="change-reject-reason"
                  ref={rejectTextareaRef}
                  rows={2}
                  disabled={isSubmitting}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (localRejectError) setLocalRejectError(null);
                    onClearDecisionError?.();
                  }}
                  placeholder="Nhập lý do để Tư vấn viên nắm rõ..."
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
            <div
              className={`flex flex-col gap-2.5 sm:flex-row sm:items-center ${
                footerHint ? "sm:justify-between" : "sm:justify-end"
              }`}
            >
              {footerHint && (
                <p className="text-[11px] text-[#64748B]">{footerHint}</p>
              )}
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
                  disabled={isSubmitting || (isDocumentLoading && !doc)}
                  onClick={handleOpenRejectForm}
                  className="gap-1.5 text-[#334155]"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Từ chối</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canApprove}
                  onClick={() => void onApprove(request)}
                  className={`gap-1.5 text-white ${
                    isDeleteRequest
                      ? "bg-[#B91C1C] hover:bg-[#991B1B]"
                      : "bg-[#15803D] hover:bg-[#166534]"
                  }`}
                >
                  {submittingAction === "APPROVE" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isDeleteRequest ? (
                    <Archive className="h-3.5 w-3.5" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isDeleteRequest
                      ? "Duyệt ngừng sử dụng"
                      : "Duyệt cập nhật"}
                  </span>
                </Button>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
