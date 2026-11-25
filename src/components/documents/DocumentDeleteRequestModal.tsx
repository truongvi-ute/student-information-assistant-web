import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { DocumentItem } from "@/types/document";
import { formatFileSize } from "@/validations/document.validation";

export interface DocumentDeleteRequestModalProps {
  open: boolean;
  document: DocumentItem | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
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

export function DocumentDeleteRequestModal(
  props: DocumentDeleteRequestModalProps
) {
  if (!props.open || !props.document) return null;

  return (
    <DocumentDeleteRequestModalContent
      key={props.document.documentId}
      document={props.document}
      isSubmitting={props.isSubmitting}
      errorMessage={props.errorMessage}
      onClose={props.onClose}
      onConfirm={props.onConfirm}
    />
  );
}

interface DocumentDeleteRequestModalContentProps {
  document: DocumentItem;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

function DocumentDeleteRequestModalContent({
  document: doc,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: DocumentDeleteRequestModalContentProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
        if (!isSubmitting) {
          onClose();
        }
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
  }, [isSubmitting, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-document-request-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3
            id="delete-document-request-title"
            className="text-base font-semibold text-slate-900"
          >
            Yêu cầu ngừng sử dụng tài liệu
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại yêu cầu ngừng sử dụng"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {errorMessage && (
            <div
              role="alert"
              className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-600"
            >
              {errorMessage}
            </div>
          )}

          <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold">
                Tài liệu vẫn hoạt động cho đến khi Quản trị viên duyệt.
              </p>
              <p className="text-amber-800">
                Sau khi duyệt, tài liệu sẽ được lưu trữ và không thể mở hoặc tải từ kho. Lịch sử xét duyệt vẫn được giữ.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 rounded-md border border-slate-100 bg-slate-50/80 p-3 text-xs">
            <div>
              <span className="font-medium text-slate-500">Tên tài liệu: </span>
              <span className="font-medium text-slate-900 break-words">
                {doc.title}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-500">Tên tệp: </span>
              <span className="font-mono text-slate-700 break-all">
                {doc.originalFilename} ({formatFileSize(doc.sizeBytes)})
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-500">Quyền tải hiện hành: </span>
              <span className="text-slate-700">
                {doc.allowDownload ? "Cho phép tải" : "Không cho phép tải"}
              </span>
            </div>
            {doc.description && (
              <div>
                <span className="font-medium text-slate-500">Mô tả: </span>
                <span className="text-slate-700 break-words">
                  {doc.description}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Gửi yêu cầu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
