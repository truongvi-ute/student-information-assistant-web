import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Eraser, FileText, Loader2, X } from "lucide-react";
import type {
  CreateDocumentUpdateRequestPayload,
  DocumentItem,
} from "@/types/document";
import {
  formatFileSize,
  hasDocumentMetadataChanges,
  normalizeOptionalDescription,
  validateDocumentUpdateForm,
} from "@/validations/document.validation";

export interface DocumentUpdateRequestModalProps {
  open: boolean;
  document: DocumentItem | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateDocumentUpdateRequestPayload) => Promise<void> | void;
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

export function DocumentUpdateRequestModal(
  props: DocumentUpdateRequestModalProps
) {
  if (!props.open || !props.document) return null;

  return (
    <DocumentUpdateRequestModalContent
      key={props.document.documentId}
      document={props.document}
      isSubmitting={props.isSubmitting}
      errorMessage={props.errorMessage}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}

interface DocumentUpdateRequestModalContentProps {
  document: DocumentItem;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateDocumentUpdateRequestPayload) => Promise<void> | void;
}

function DocumentUpdateRequestModalContent({
  document: doc,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: DocumentUpdateRequestModalContentProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const keepEditingButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description ?? "");
  const [allowDownload, setAllowDownload] = useState(doc.allowDownload);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const currentSnapshot = {
    title: doc.title,
    description: normalizeOptionalDescription(doc.description),
    allowDownload: doc.allowDownload,
  };

  const normalizedProposedDescription = normalizeOptionalDescription(description);
  const hasChanges = hasDocumentMetadataChanges(currentSnapshot, {
    title,
    description: normalizedProposedDescription,
    allowDownload,
  });
  const isClearingDescription =
    currentSnapshot.description !== null && normalizedProposedDescription === null;
  const isChangingAllowDownload = allowDownload !== currentSnapshot.allowDownload;
  const isDiscardConfirmVisible =
    showDiscardConfirm && hasChanges && !isSubmitting;

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;
    if (hasChanges) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  }, [hasChanges, isSubmitting, onClose]);

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
    if (isDiscardConfirmVisible) {
      keepEditingButtonRef.current?.focus();
    }
  }, [isDiscardConfirmVisible]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isSubmitting) return;
        if (isDiscardConfirmVisible) {
          setShowDiscardConfirm(false);
          closeButtonRef.current?.focus();
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
  }, [handleRequestClose, isDiscardConfirmVisible, isSubmitting]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formError = validateDocumentUpdateForm(
      currentSnapshot,
      title,
      description,
      allowDownload
    );
    if (formError) {
      setValidationError(formError);
      return;
    }

    setValidationError(null);
    await onSubmit({
      title: title.trim(),
      description: normalizedProposedDescription,
      allowDownload,
    });
  };

  const activeError = validationError || errorMessage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
      onClick={handleRequestClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-document-request-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3
              id="update-document-request-title"
              className="text-base font-semibold text-slate-900"
            >
              Yêu cầu cập nhật tài liệu
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Tài liệu vẫn giữ nguyên cho đến khi Quản trị viên duyệt.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleRequestClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại yêu cầu cập nhật"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {activeError && (
            <div
              role="alert"
              className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-600"
            >
              {activeError}
            </div>
          )}

          <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-700">
                  <span className="font-medium text-slate-500">Tên tệp: </span>
                  <span className="font-mono font-medium text-slate-800">
                    {doc.originalFilename}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatFileSize(doc.sizeBytes)} · Chỉ cập nhật tên tài liệu, mô tả và quyền tải; không thay thế tệp.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="update-doc-title"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Tên tài liệu <span className="text-red-500">*</span>
            </label>
            <input
              id="update-doc-title"
              type="text"
              required
              maxLength={255}
              disabled={isSubmitting}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
                if (showDiscardConfirm) setShowDiscardConfirm(false);
              }}
              placeholder="Nhập tên tài liệu"
              className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label
                htmlFor="update-doc-description"
                className="block text-xs font-medium text-slate-700"
              >
                Mô tả
              </label>
              {description.trim().length > 0 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setDescription("");
                    if (validationError) setValidationError(null);
                    if (showDiscardConfirm) setShowDiscardConfirm(false);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:underline disabled:opacity-50"
                >
                  <Eraser className="h-3 w-3" />
                  <span>Xóa mô tả</span>
                </button>
              )}
            </div>
            <textarea
              id="update-doc-description"
              rows={3}
              disabled={isSubmitting}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError(null);
                if (showDiscardConfirm) setShowDiscardConfirm(false);
              }}
              placeholder="Để trống nếu muốn xóa mô tả hiện tại..."
              className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div className="flex items-start gap-2 pt-0.5">
            <input
              type="checkbox"
              id="updateAllowDownloadCheck"
              disabled={isSubmitting}
              checked={allowDownload}
              onChange={(e) => {
                setAllowDownload(e.target.checked);
                if (validationError) setValidationError(null);
                if (showDiscardConfirm) setShowDiscardConfirm(false);
              }}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <label
              htmlFor="updateAllowDownloadCheck"
              className="cursor-pointer select-none text-xs text-slate-700"
            >
              Cho phép sinh viên tải tệp gốc về máy
            </label>
          </div>

          {(isClearingDescription || isChangingAllowDownload) && (
            <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50/80 p-2.5 text-[11px] text-amber-900">
              {isClearingDescription && (
                <p>
                  <span className="font-semibold">Xóa mô tả:</span> Mô tả hiện tại sẽ được xóa sau khi Quản trị viên duyệt.
                </p>
              )}
              {isChangingAllowDownload && (
                <p>
                  <span className="font-semibold">Quyền tải xuống:</span>{" "}
                  {currentSnapshot.allowDownload ? "Cho phép tải" : "Không cho phép tải"} →{" "}
                  {allowDownload ? "Cho phép tải" : "Không cho phép tải"}
                </p>
              )}
            </div>
          )}

          {!hasChanges && !activeError && (
            <p className="text-[11px] text-slate-500">
              Thay đổi ít nhất một thông tin (tên tài liệu, mô tả hoặc quyền tải) để gửi yêu cầu.
            </p>
          )}

          {isDiscardConfirmVisible ? (
            <div
              role="alert"
              className="space-y-2.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"
            >
              <p className="font-medium">
                Bạn có thay đổi chưa gửi. Bạn muốn bỏ các thay đổi đang nhập?
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  ref={keepEditingButtonRef}
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tiếp tục chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Bỏ thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={isSubmitting}
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !hasChanges}
                className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Gửi yêu cầu</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
