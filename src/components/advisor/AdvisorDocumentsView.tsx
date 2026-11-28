import { Fragment, useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  Search,
  Send,
  ShieldAlert,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Archive,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import { DocumentUpdateRequestModal } from "@/components/documents/DocumentUpdateRequestModal";
import { DocumentDeleteRequestModal } from "@/components/documents/DocumentDeleteRequestModal";
import { DocumentReviewModal } from "@/components/documents/DocumentReviewModal";
import {
  DocumentLifecycleBadge,
  DocumentProcessingBadge,
  DocumentRequestStatusBadge,
  DocumentRequestTypeBadge,
  formatDateTimeVi,
  formatDateVi,
  summarizeDocumentRequests,
} from "@/components/documents/DocumentStatusBadges";
import { documentService } from "@/services/document.service";
import { ApiClientError } from "@/lib/api/api-error";
import type {
  CreateDocumentUpdateRequestPayload,
  DocumentItem,
  DocumentRagRequestResponse,
  DocumentLifecycleStatus,
  DocumentUploadResponse,
} from "@/types/document";
import {
  formatFileSize,
  normalizeOptionalDescription,
} from "@/validations/document.validation";

type AdvisorDocTab = "DOCUMENTS" | "REQUESTS";

interface ConfirmAddState {
  doc: DocumentItem;
  previousRejectedRequest: DocumentRagRequestResponse | null;
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

interface ConfirmAddRequestModalProps {
  doc: DocumentItem;
  previousRejectedRequest: DocumentRagRequestResponse | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmAddRequestModal({
  doc,
  previousRejectedRequest,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: ConfirmAddRequestModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isResend = previousRejectedRequest !== null;

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
      aria-labelledby="confirm-add-request-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3
            id="confirm-add-request-title"
            className="text-base font-semibold text-slate-900"
          >
            {isResend
              ? "Gửi lại yêu cầu thêm tài liệu"
              : "Gửi yêu cầu thêm tài liệu"}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại xác nhận"
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

          {isResend && previousRejectedRequest && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <p className="font-semibold text-red-700">
                Lý do từ chối lần trước
                {previousRejectedRequest.reviewedAt
                  ? ` (${formatDateVi(previousRejectedRequest.reviewedAt)})`
                  : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {previousRejectedRequest.rejectionReason?.trim() ||
                  "Không có ghi chú lý do."}
              </p>
            </div>
          )}

          <p className="text-xs text-slate-600">
            {isResend
              ? "Xác nhận gửi lại yêu cầu thêm tài liệu này để Quản trị viên xem xét lại."
              : "Sau khi gửi, Quản trị viên sẽ kiểm tra tài liệu trước khi đưa vào xử lý cho Chatbot."}
          </p>

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
              <span className="font-medium text-slate-500">Quyền tải về: </span>
              <span className="text-slate-700">
                {doc.allowDownload
                  ? "Cho phép sinh viên tải"
                  : "Không cho phép tải"}
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

        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
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
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isResend ? "Xác nhận gửi lại" : "Xác nhận gửi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdvisorDocumentsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdvisorDocTab>("DOCUMENTS");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [requests, setRequests] = useState<DocumentRagRequestResponse[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    "ALL" | DocumentLifecycleStatus
  >("ALL");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    text: string;
    type: "info" | "success" | "error";
    loading?: boolean;
    retryConflict?: boolean;
  } | null>(null);

  const [confirmingAdd, setConfirmingAdd] = useState<ConfirmAddState | null>(
    null
  );
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const submittingAddRef = useRef(false);

  const [editingUpdateDoc, setEditingUpdateDoc] = useState<DocumentItem | null>(
    null
  );
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [updateModalError, setUpdateModalError] = useState<string | null>(null);
  const submittingUpdateRef = useRef(false);

  const [confirmingDeleteDoc, setConfirmingDeleteDoc] =
    useState<DocumentItem | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const submittingDeleteRef = useRef(false);
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<string>>(
    () => new Set()
  );
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(
    null
  );
  const isMountedRef = useRef(true);
  const reloadSeqRef = useRef(0);

  const fetchDocuments = useCallback(async (): Promise<boolean> => {
    try {
      setIsDocumentsLoading(true);
      setDocumentsError(null);
      const data = await documentService.getDocuments();
      setDocuments(data);
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setDocumentsError(err.message);
      } else {
        setDocumentsError("Không thể tải danh sách tài liệu.");
      }
      return false;
    } finally {
      setIsDocumentsLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async (): Promise<boolean> => {
    try {
      setIsRequestsLoading(true);
      setRequestsError(null);
      const data = await documentService.getMyRequests();
      setRequests(data);
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setRequestsError(err.message);
      } else {
        setRequestsError("Không thể tải danh sách yêu cầu.");
      }
      return false;
    } finally {
      setIsRequestsLoading(false);
    }
  }, []);

  const reloadAfterConflict = useCallback(async () => {
    const seq = ++reloadSeqRef.current;
    setBannerMessage({
      text: "Yêu cầu đã thay đổi. Đang tải lại danh sách…",
      type: "info",
      loading: true,
    });
    const [reqOk, docOk] = await Promise.all([
      fetchRequests(),
      fetchDocuments(),
    ]);
    if (!isMountedRef.current || reloadSeqRef.current !== seq) return;
    if (reqOk && docOk) {
      setBannerMessage({
        text: "Yêu cầu đã thay đổi trước đó. Danh sách đã được cập nhật.",
        type: "info",
      });
    } else {
      setBannerMessage({
        text: "Yêu cầu đã thay đổi. Chưa tải lại được danh sách.",
        type: "error",
        retryConflict: true,
      });
    }
  }, [fetchDocuments, fetchRequests]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([fetchDocuments(), fetchRequests()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchDocuments, fetchRequests, isRefreshing]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    documentService
      .getDocuments()
      .then((data) => {
        if (isMounted) {
          setDocuments(data);
          setIsDocumentsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiClientError) {
            setDocumentsError(err.message);
          } else {
            setDocumentsError("Không thể tải danh sách tài liệu.");
          }
          setIsDocumentsLoading(false);
        }
      });

    documentService
      .getMyRequests()
      .then((data) => {
        if (isMounted) {
          setRequests(data);
          setIsRequestsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiClientError) {
            setRequestsError(err.message);
          } else {
            setRequestsError("Không thể tải danh sách yêu cầu.");
          }
          setIsRequestsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentItem>();
    for (const doc of documents) {
      map.set(doc.documentId, doc);
    }
    return map;
  }, [documents]);

  const activeViewingDocument = useMemo(
    () => (viewingDocumentId ? documentMap.get(viewingDocumentId) ?? null : null),
    [documentMap, viewingDocumentId]
  );

  const handleViewerAccessForbidden = useCallback(async () => {
    const seq = ++reloadSeqRef.current;
    const [docOk, reqOk] = await Promise.all([
      fetchDocuments(),
      fetchRequests(),
    ]);
    if (!isMountedRef.current || reloadSeqRef.current !== seq) return;
    if (docOk && reqOk) {
      setBannerMessage({
        text: "Trạng thái hoặc quyền truy cập tài liệu đã thay đổi. Danh sách đã được đồng bộ lại.",
        type: "info",
      });
    }
  }, [fetchDocuments, fetchRequests]);

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.originalFilename.toLowerCase().includes(q);
      const matchStatus =
        lifecycleFilter === "ALL" || doc.lifecycleStatus === lifecycleFilter;
      return matchSearch && matchStatus;
    });
  }, [documents, searchQuery, lifecycleFilter]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const ta = Date.parse(a.createdAt);
      const tb = Date.parse(b.createdAt);
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
  }, [requests]);

  const sameDayMultiDocDates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const req of requests) {
      const key = `${req.documentId}::${formatDateVi(req.createdAt)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const multi = new Set<string>();
    for (const [key, count] of counts) {
      if (count > 1) {
        multi.add(key);
      }
    }
    return multi;
  }, [requests]);

  if (user && user.role !== "ADVISOR") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />
        <h2 className="mt-2 text-sm font-semibold text-red-800">
          Không có quyền truy cập
        </h2>
        <p className="mt-1 text-xs text-red-600">
          Trang này chỉ dành cho tài khoản Tư vấn viên.
        </p>
      </div>
    );
  }

  const isOwnedByCurrentAdvisor = (doc: DocumentItem): boolean => {
    if (!user) return false;
    const currentUserId =
      user.id !== undefined && user.id !== null
        ? String(user.id).trim().toLowerCase()
        : "";
    const uploaderId = doc.uploadedById?.trim().toLowerCase() ?? "";

    if (currentUserId && uploaderId) {
      return currentUserId === uploaderId;
    }
    if (uploaderId && !currentUserId) {
      return false;
    }

    const currentUserEmail = user.email?.trim().toLowerCase() ?? "";
    const uploaderEmail = doc.uploadedByEmail?.trim().toLowerCase() ?? "";
    return Boolean(
      currentUserEmail && uploaderEmail && currentUserEmail === uploaderEmail
    );
  };

  const handleUploadSuccess = (uploaded: DocumentUploadResponse) => {
    const newDoc: DocumentItem = {
      ...uploaded,
      uploadedById:
        user?.id !== undefined && user?.id !== null && String(user.id).trim()
          ? String(user.id)
          : null,
      uploadedByName: user?.fullName || user?.email || "Tư vấn viên",
      uploadedByEmail: user?.email,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    reloadSeqRef.current += 1;
    setBannerMessage({
      text: `Đã tải lên tài liệu "${uploaded.title}". Bạn có thể gửi yêu cầu để Quản trị viên xét duyệt.`,
      type: "success",
    });
  };

  const handleConfirmSendAddRequest = async () => {
    if (!confirmingAdd || submittingAddRef.current) return;

    const targetDoc = confirmingAdd.doc;
    const isResend = confirmingAdd.previousRejectedRequest !== null;

    const isOwner = isOwnedByCurrentAdvisor(targetDoc);

    if (!isOwner) {
      setAddModalError(
        !targetDoc.uploadedById && !targetDoc.uploadedByEmail
          ? "Thiếu thông tin người tải lên, không thể gửi yêu cầu."
          : "Bạn chỉ có thể gửi yêu cầu cho tài liệu do chính mình tải lên."
      );
      return;
    }

    submittingAddRef.current = true;
    setIsSubmittingAdd(true);
    setAddModalError(null);

    try {
      await documentService.createAddRequest(targetDoc.documentId);
      const docTitle = targetDoc.title;
      setConfirmingAdd(null);
      reloadSeqRef.current += 1;
      setBannerMessage({
        text: isResend
          ? `Đã gửi lại yêu cầu thêm tài liệu "${docTitle}". Vui lòng chờ Quản trị viên xét duyệt.`
          : `Đã gửi yêu cầu thêm tài liệu "${docTitle}" thành công. Vui lòng chờ Quản trị viên xét duyệt.`,
        type: "success",
      });
      await Promise.all([fetchRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setConfirmingAdd(null);
          await reloadAfterConflict();
        } else if (err.status === 403) {
          setAddModalError(
            "Bạn chỉ có thể gửi yêu cầu cho tài liệu do chính mình tải lên."
          );
        } else if (err.status === 404) {
          setAddModalError("Không tìm thấy thông tin tài liệu.");
        } else {
          setAddModalError(
            err.message || "Gửi yêu cầu thất bại. Vui lòng thử lại."
          );
        }
      } else if (err instanceof Error) {
        setAddModalError(err.message);
      } else {
        setAddModalError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ."
        );
      }
    } finally {
      submittingAddRef.current = false;
      setIsSubmittingAdd(false);
    }
  };

  const handleSaveDraft = async (
    payload: CreateDocumentUpdateRequestPayload
  ) => {
    if (!editingUpdateDoc || submittingUpdateRef.current) return;

    const targetDoc = editingUpdateDoc;
    if (!isOwnedByCurrentAdvisor(targetDoc)) {
      setUpdateModalError(
        "Bạn chỉ có thể sửa bản nháp do chính mình tải lên."
      );
      return;
    }

    submittingUpdateRef.current = true;
    setIsSubmittingUpdate(true);
    setUpdateModalError(null);

    try {
      await documentService.updateDraft(targetDoc.documentId, payload);
      setEditingUpdateDoc(null);
      reloadSeqRef.current += 1;
      setBannerMessage({
        text: "Đã lưu thông tin bản nháp.",
        type: "success",
      });
      await Promise.all([fetchRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setEditingUpdateDoc(null);
          await reloadAfterConflict();
        } else if (err.status === 403) {
          setUpdateModalError(
            "Bạn chỉ có thể sửa bản nháp do chính mình tải lên."
          );
        } else if (err.status === 404) {
          setUpdateModalError("Không tìm thấy thông tin tài liệu.");
        } else {
          setUpdateModalError(
            err.message || "Lưu bản nháp thất bại. Vui lòng thử lại."
          );
        }
      } else if (err instanceof Error) {
        setUpdateModalError(err.message);
      } else {
        setUpdateModalError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ."
        );
      }
    } finally {
      submittingUpdateRef.current = false;
      setIsSubmittingUpdate(false);
    }
  };

  const handleConfirmSendDeleteRequest = async () => {
    if (!confirmingDeleteDoc || submittingDeleteRef.current) return;

    const targetDoc = confirmingDeleteDoc;
    if (!isOwnedByCurrentAdvisor(targetDoc)) {
      setDeleteModalError(
        "Bạn chỉ có thể gửi yêu cầu ngừng sử dụng cho tài liệu do chính mình tải lên."
      );
      return;
    }

    submittingDeleteRef.current = true;
    setIsSubmittingDelete(true);
    setDeleteModalError(null);

    try {
      const isDraft = targetDoc.lifecycleStatus === "DRAFT";
      if (isDraft) {
        await documentService.deleteDraft(targetDoc.documentId);
      } else {
        await documentService.createDeleteRequest(targetDoc.documentId);
      }
      setConfirmingDeleteDoc(null);
      reloadSeqRef.current += 1;
      setBannerMessage({
        text: isDraft
          ? "Đã xóa bản nháp."
          : "Đã gửi yêu cầu ngừng sử dụng. Tài liệu vẫn hoạt động cho đến khi được duyệt.",
        type: "success",
      });
      await Promise.all([fetchRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setConfirmingDeleteDoc(null);
          await reloadAfterConflict();
        } else if (err.status === 403) {
          setDeleteModalError(
            "Bạn chỉ có thể gửi yêu cầu ngừng sử dụng cho tài liệu do chính mình tải lên."
          );
        } else if (err.status === 404) {
          setDeleteModalError("Không tìm thấy thông tin tài liệu.");
        } else {
          setDeleteModalError(
            err.message || "Gửi yêu cầu ngừng sử dụng thất bại. Vui lòng thử lại."
          );
        }
      } else if (err instanceof Error) {
        setDeleteModalError(err.message);
      } else {
        setDeleteModalError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ."
        );
      }
    } finally {
      submittingDeleteRef.current = false;
      setIsSubmittingDelete(false);
    }
  };

  const renderRequestCell = (doc: DocumentItem) => {
    if (isRequestsLoading) {
      return <span className="text-[11px] text-slate-500">Đang kiểm tra...</span>;
    }

    if (requestsError) {
      return (
        <span className="text-[11px] text-red-600">Không rõ trạng thái</span>
      );
    }

    const summary = summarizeDocumentRequests(requests, doc.documentId);
    const displayReq = summary.displayRequest;

    if (!displayReq) {
      return (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">
          Chưa gửi
        </span>
      );
    }

    const isReadyForChatbot =
      doc.lifecycleStatus === "ACTIVE" && doc.ragStatus === "READY";

    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1">
          <DocumentRequestTypeBadge type={displayReq.requestType} />
          <DocumentRequestStatusBadge status={displayReq.status} />
        </div>
        {displayReq.requestType === "ADD" &&
          displayReq.status === "APPROVED" &&
          !isReadyForChatbot && (
            <p className="text-[11px] text-slate-500">
              {doc.ragStatus === "FAILED"
                ? "Xử lý RAG thất bại"
                : "Chưa sẵn sàng cho Chatbot"}
            </p>
          )}
        {displayReq.status === "REJECTED" && displayReq.rejectionReason && (
          <p className="max-w-xs line-clamp-2 text-[11px] text-slate-600 break-words">
            <span className="font-medium text-red-700">Lý do: </span>
            {displayReq.rejectionReason}
          </p>
        )}
      </div>
    );
  };

  const renderSubmitAddAction = (doc: DocumentItem, fullWidth = false) => {
    const summary = summarizeDocumentRequests(requests, doc.documentId);
    const isOwner = isOwnedByCurrentAdvisor(doc);

    if (
      doc.lifecycleStatus === "DRAFT" &&
      (doc.ragStatus === "PROCESSING" || doc.ragStatus === "FAILED")
    ) {
      return fullWidth ? (
        <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {doc.ragStatus === "PROCESSING"
            ? "Đang xử lý RAG · Chỉ theo dõi trạng thái"
            : "Xử lý RAG thất bại · Chờ Quản trị viên xử lý lại"}
        </p>
      ) : (
        <span className="text-xs text-slate-500">
          {doc.ragStatus === "PROCESSING"
            ? "Chỉ theo dõi trạng thái"
            : "Chờ Quản trị viên xử lý lại"}
        </span>
      );
    }

    if (doc.lifecycleStatus === "ACTIVE" && doc.ragStatus === "READY") {
      const canProposeActiveChanges =
        isOwner &&
        !isRequestsLoading &&
        !requestsError &&
        !summary.hasPendingRequest;

      return (
        <div
          className={
            fullWidth
              ? canProposeActiveChanges
                ? "grid grid-cols-2 gap-2 pt-1"
                : "pt-1"
              : "inline-flex items-center justify-end gap-1.5"
          }
        >
          <button
            type="button"
            onClick={() => setViewingDocumentId(doc.documentId)}
            className={`inline-flex items-center justify-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 ${
              fullWidth ? "w-full" : ""
            }`}
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>Xem</span>
          </button>
          {canProposeActiveChanges && (
            <button
              type="button"
              onClick={() => {
                setDeleteModalError(null);
                setConfirmingDeleteDoc(doc);
              }}
              className={`inline-flex items-center justify-center gap-1 rounded border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 ${
                fullWidth ? "w-full" : ""
              }`}
            >
              <Archive className="h-3 w-3 shrink-0" />
              <span>Ngừng sử dụng</span>
            </button>
          )}
        </div>
      );
    }

    const isOwnNotIndexedDraft =
      isOwner &&
      doc.lifecycleStatus === "DRAFT" &&
      doc.ragStatus === "NOT_INDEXED";

    if (!isOwnNotIndexedDraft) {
      return fullWidth ? null : <span className="text-xs text-slate-400">—</span>;
    }

    const canSubmitAdd =
      !isRequestsLoading &&
      !requestsError &&
      !summary.hasPendingRequest &&
      !summary.hasApprovedAddRequest;

    return (
      <div
        className={
          fullWidth
            ? "flex flex-col gap-2 pt-1"
            : "inline-flex flex-wrap justify-end gap-1.5"
        }
      >
        <button
          type="button"
          onClick={() => setViewingDocumentId(doc.documentId)}
          className={`inline-flex items-center justify-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span>Xem</span>
        </button>
        {canSubmitAdd && (
          <>
            <button
              type="button"
              onClick={() => {
                setUpdateModalError(null);
                setEditingUpdateDoc(doc);
              }}
              className={`inline-flex items-center justify-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 ${
                fullWidth ? "w-full" : ""
              }`}
            >
              <Edit3 className="h-3 w-3 shrink-0" />
              <span>Sửa bản nháp</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteModalError(null);
                setConfirmingDeleteDoc(doc);
              }}
              className={`rounded border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 ${
                fullWidth ? "w-full" : ""
              }`}
            >
              Xóa bản nháp
            </button>
            <button
              type="button"
              onClick={() => {
                setAddModalError(null);
                setConfirmingAdd({
                  doc,
                  previousRejectedRequest: summary.latestRejectedAddRequest,
                });
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 ${
                fullWidth ? "w-full" : ""
              }`}
            >
              <Send className="h-3 w-3" />
              <span>
                {summary.latestRejectedAddRequest ? "Gửi lại duyệt" : "Gửi duyệt"}
              </span>
            </button>
          </>
        )}
      </div>
    );
  };

  const toggleRequestDetail = (requestId: string) => {
    setExpandedRequestIds((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  const formatSentTime = (req: DocumentRagRequestResponse): string => {
    const day = formatDateVi(req.createdAt);
    return sameDayMultiDocDates.has(`${req.documentId}::${day}`)
      ? formatDateTimeVi(req.createdAt)
      : day;
  };

  const renderRequestExpandedDetails = (
    req: DocumentRagRequestResponse,
    doc?: DocumentItem
  ) => {
    const proposedDescText =
      normalizeOptionalDescription(req.proposedDescription) ?? "Không có mô tả";
    const allowDownloadLabel =
      req.proposedAllowDownload === null ||
      req.proposedAllowDownload === undefined
        ? "—"
        : req.proposedAllowDownload
          ? "Có"
          : "Không";

    return (
      <div className="space-y-3 text-xs text-slate-600">
        {req.requestType === "UPDATE" && (
          <div className="space-y-1.5 rounded border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Nội dung yêu cầu
            </p>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-[140px_1fr]">
              <dt className="text-slate-500">Tên tài liệu</dt>
              <dd className="font-medium text-slate-900 break-words">
                {req.proposedTitle?.trim() || "—"}
              </dd>
              <dt className="text-slate-500">Mô tả</dt>
              <dd className="whitespace-pre-wrap text-slate-700 break-words">
                {proposedDescText}
              </dd>
              <dt className="text-slate-500">Cho phép tải xuống</dt>
              <dd className="font-medium text-slate-900">{allowDownloadLabel}</dd>
            </dl>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-[140px_1fr]">
          {doc?.originalFilename && (
            <>
              <dt className="text-slate-500">Tên tệp</dt>
              <dd className="font-mono text-[11px] text-slate-700 break-all">
                {doc.originalFilename}
              </dd>
            </>
          )}
          <dt className="text-slate-500">Thời điểm gửi</dt>
          <dd className="text-slate-700">{formatDateTimeVi(req.createdAt)}</dd>
          {req.reviewedByName && (
            <>
              <dt className="text-slate-500">Người xét duyệt</dt>
              <dd className="font-medium text-slate-900">{req.reviewedByName}</dd>
            </>
          )}
          {req.reviewedAt && (
            <>
              <dt className="text-slate-500">Thời điểm xét duyệt</dt>
              <dd className="text-slate-700">{formatDateTimeVi(req.reviewedAt)}</dd>
            </>
          )}
          {req.status === "REJECTED" && req.rejectionReason && (
            <>
              <dt className="text-slate-500">Lý do từ chối</dt>
              <dd className="whitespace-pre-wrap text-slate-800 break-words">
                {req.rejectionReason}
              </dd>
            </>
          )}
        </dl>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Quản lý tài liệu
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tải lên tài liệu nháp (.pdf, .docx) và gửi yêu cầu thêm vào nguồn tri thức Chatbot.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isRefreshing || isDocumentsLoading || isRequestsLoading}
              onClick={() => void handleRefresh()}
              className="inline-flex items-center justify-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => {
                reloadSeqRef.current += 1;
                setBannerMessage(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-700"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Tải lên tài liệu</span>
            </button>
          </div>
        </div>

        {/* Thông báo kết quả */}
        {bannerMessage && (
          <div
            role={bannerMessage.type === "error" ? "alert" : "status"}
            className={`flex items-center justify-between gap-2 rounded border px-3.5 py-2 text-xs ${
              bannerMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : bannerMessage.type === "info"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerMessage.loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-700" />
              ) : bannerMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : bannerMessage.type === "info" ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              {bannerMessage.retryConflict && (
                <button
                  type="button"
                  onClick={() => void reloadAfterConflict()}
                  className="font-medium text-red-700 underline hover:text-red-800"
                >
                  Thử lại
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  reloadSeqRef.current += 1;
                  setBannerMessage(null);
                }}
                aria-label="Đóng thông báo"
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Cảnh báo lỗi tải yêu cầu khi đang ở Tab 1 */}
        {activeTab === "DOCUMENTS" && requestsError && !isRequestsLoading && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-red-200 bg-red-50 px-3.5 py-2 text-xs text-red-700"
          >
            <span>
              Không thể tải danh sách yêu cầu ({requestsError}). Tạm khóa thao tác gửi duyệt để tránh trùng lặp.
            </span>
            <button
              type="button"
              onClick={() => void fetchRequests()}
              className="font-medium text-blue-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("DOCUMENTS")}
            className={`border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "DOCUMENTS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Danh sách tài liệu ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REQUESTS")}
            className={`border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "REQUESTS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Yêu cầu đã gửi ({requests.length})
          </button>
        </div>

        {activeTab === "DOCUMENTS" ? (
          <>
            {/* Bộ lọc & Tìm kiếm */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên tài liệu hoặc tên tệp..."
                  className="w-full rounded border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <select
                aria-label="Lọc theo vòng đời tài liệu"
                value={lifecycleFilter}
                onChange={(e) =>
                  setLifecycleFilter(
                    e.target.value as "ALL" | DocumentLifecycleStatus
                  )
                }
                className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả vòng đời</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>

            {isDocumentsLoading ? (
              <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Đang tải danh sách tài liệu...</span>
                </div>
              </div>
            ) : documentsError ? (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-6 text-center text-xs text-red-600">
                <p>{documentsError}</p>
                <button
                  type="button"
                  onClick={() => void fetchDocuments()}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500">
                {documents.length === 0
                  ? 'Chưa có tài liệu nào. Nhấn "Tải lên tài liệu" để thêm tệp mới.'
                  : "Không tìm thấy tài liệu phù hợp."}
              </div>
            ) : (
              <>
                {/* Mobile Card List */}
                <div className="space-y-3 md:hidden">
                  {filteredDocuments.map((doc) => {
                    const actionNode = renderSubmitAddAction(doc, true);
                    return (
                      <div
                        key={doc.documentId}
                        className="space-y-3 rounded border border-slate-200 bg-white p-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 break-words">
                            {doc.title}
                          </p>
                          {doc.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                              {doc.description}
                            </p>
                          )}
                          <p className="mt-1 font-mono text-[11px] text-slate-600 break-all">
                            {doc.originalFilename} · {formatFileSize(doc.sizeBytes)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <DocumentLifecycleBadge status={doc.lifecycleStatus} />
                          <DocumentProcessingBadge
                            lifecycleStatus={doc.lifecycleStatus}
                            ragStatus={doc.ragStatus}
                          />
                          <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                            {doc.allowDownload
                              ? "Cho phép tải"
                              : "Không tải"}
                          </span>
                        </div>

                        <div className="space-y-1 border-t border-slate-100 pt-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2 text-slate-500">
                            <span>Yêu cầu gần nhất:</span>
                            <span className="text-[11px]">
                              {formatDateVi(doc.createdAt)}
                            </span>
                          </div>
                          <div>{renderRequestCell(doc)}</div>
                        </div>

                        {actionNode}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded border border-slate-200 bg-white md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50 font-medium uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Tài liệu</th>
                          <th className="px-4 py-3 whitespace-nowrap">
                            Tên tệp
                          </th>
                          <th className="px-4 py-3 whitespace-nowrap">
                            Trạng thái xử lý
                          </th>
                          <th className="px-4 py-3 whitespace-nowrap">
                            Yêu cầu gần nhất
                          </th>
                          <th className="px-4 py-3 whitespace-nowrap">
                            Ngày tạo
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDocuments.map((doc) => (
                          <tr
                            key={doc.documentId}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">
                                {doc.title}
                              </p>
                              {doc.description && (
                                <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                                  {doc.description}
                                </p>
                              )}
                              {doc.uploadedByName && (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  Người tải: {doc.uploadedByName}
                                  {doc.uploadedByEmail
                                    ? ` (${doc.uploadedByEmail})`
                                    : ""}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p
                                className="max-w-[200px] truncate font-mono text-[11px] text-slate-700"
                                title={doc.originalFilename}
                              >
                                {doc.originalFilename}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span>{formatFileSize(doc.sizeBytes)}</span>
                                <span>·</span>
                                <span>
                                  {doc.allowDownload
                                    ? "Cho phép tải"
                                    : "Không tải"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col items-start gap-1">
                                <DocumentLifecycleBadge
                                  status={doc.lifecycleStatus}
                                />
                                <DocumentProcessingBadge
                                  lifecycleStatus={doc.lifecycleStatus}
                                  ragStatus={doc.ragStatus}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {renderRequestCell(doc)}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {formatDateVi(doc.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {renderSubmitAddAction(doc)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        ) : isRequestsLoading ? (
          <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500">
            <div className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Đang tải danh sách yêu cầu...</span>
            </div>
          </div>
        ) : requestsError ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-6 text-center text-xs text-red-600">
            <p>{requestsError}</p>
            <button
              type="button"
              onClick={() => void fetchRequests()}
              className="mt-2 text-xs font-medium text-blue-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500">
            Chưa có yêu cầu nào được gửi.
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="space-y-3 md:hidden">
              {sortedRequests.map((req) => {
                const doc = documentMap.get(req.documentId);
                const isExpanded = expandedRequestIds.has(req.id);
                const detailId = `mobile-request-detail-${req.id}`;
                return (
                  <div
                    key={req.id}
                    className="space-y-2.5 rounded border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 line-clamp-2 text-sm font-medium text-slate-900 break-words">
                        {req.documentTitle}
                      </p>
                      <DocumentRequestTypeBadge type={req.requestType} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <DocumentRequestStatusBadge status={req.status} />
                      <span className="text-[11px] text-slate-500">
                        {formatSentTime(req)}
                      </span>
                    </div>

                    {req.status === "REJECTED" && req.rejectionReason && (
                      <p className="line-clamp-2 text-xs text-slate-600 break-words">
                        <span className="font-medium text-red-700">Lý do: </span>
                        {req.rejectionReason}
                      </p>
                    )}

                    <div className="flex justify-end border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={detailId}
                        onClick={() => toggleRequestDetail(req.id)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <span>{isExpanded ? "Thu gọn" : "Chi tiết"}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        id={detailId}
                        className="border-t border-slate-100 pt-2.5"
                      >
                        {renderRequestExpandedDetails(req, doc)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded border border-slate-200 bg-white md:block">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 font-medium uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="w-[116px] px-3 py-3 whitespace-nowrap">
                        Loại yêu cầu
                      </th>
                      <th className="px-3 py-3">Tài liệu</th>
                      <th className="w-[126px] px-3 py-3 whitespace-nowrap">
                        Ngày gửi
                      </th>
                      <th className="w-[180px] lg:w-[215px] xl:w-[255px] px-3 py-3 whitespace-nowrap">
                        Trạng thái
                      </th>
                      <th className="w-[98px] px-3 py-3 text-right whitespace-nowrap">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedRequests.map((req) => {
                      const doc = documentMap.get(req.documentId);
                      const isExpanded = expandedRequestIds.has(req.id);
                      const detailId = `request-detail-${req.id}`;

                      return (
                        <Fragment key={req.id}>
                          <tr className="transition-colors hover:bg-slate-50/70">
                            <td className="px-3 py-3 align-top whitespace-nowrap">
                              <DocumentRequestTypeBadge type={req.requestType} />
                            </td>
                            <td className="px-3 py-3 align-top">
                              <p
                                className="line-clamp-2 font-medium text-slate-900 break-words [overflow-wrap:anywhere]"
                                title={req.documentTitle}
                              >
                                {req.documentTitle}
                              </p>
                            </td>
                            <td className="px-3 py-3 align-top text-slate-600 whitespace-nowrap">
                              {formatSentTime(req)}
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="space-y-1">
                                <DocumentRequestStatusBadge status={req.status} />
                                {req.status === "REJECTED" &&
                                  req.rejectionReason && (
                                    <p
                                      className="line-clamp-2 text-xs leading-relaxed text-slate-600 break-words"
                                      title={req.rejectionReason}
                                    >
                                      <span className="font-medium text-red-700">
                                        Lý do:{" "}
                                      </span>
                                      {req.rejectionReason}
                                    </p>
                                  )}
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top text-right whitespace-nowrap">
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-controls={detailId}
                                onClick={() => toggleRequestDetail(req.id)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              >
                                <span>{isExpanded ? "Thu gọn" : "Chi tiết"}</span>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                  aria-hidden="true"
                                />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr id={detailId} className="bg-slate-50/70">
                              <td colSpan={5} className="px-3 py-3">
                                {renderRequestExpandedDetails(req, doc)}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Upload */}
      <DocumentUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Modal Xác nhận Gửi / Gửi lại yêu cầu Thêm mới */}
      {confirmingAdd && (
        <ConfirmAddRequestModal
          key={confirmingAdd.doc.documentId}
          doc={confirmingAdd.doc}
          previousRejectedRequest={confirmingAdd.previousRejectedRequest}
          isSubmitting={isSubmittingAdd}
          errorMessage={addModalError}
          onClose={() => {
            if (!isSubmittingAdd) {
              setConfirmingAdd(null);
              setAddModalError(null);
            }
          }}
          onConfirm={() => void handleConfirmSendAddRequest()}
        />
      )}

      {/* Modal Yêu cầu cập nhật metadata */}
      <DocumentUpdateRequestModal
        open={editingUpdateDoc !== null}
        document={editingUpdateDoc}
        isSubmitting={isSubmittingUpdate}
        errorMessage={updateModalError}
        onClose={() => {
          if (!isSubmittingUpdate) {
            setEditingUpdateDoc(null);
            setUpdateModalError(null);
          }
        }}
        onSubmit={handleSaveDraft}
      />

      {/* Modal Yêu cầu ngừng sử dụng tài liệu */}
      <DocumentDeleteRequestModal
        open={confirmingDeleteDoc !== null}
        document={confirmingDeleteDoc}
        isSubmitting={isSubmittingDelete}
        errorMessage={deleteModalError}
        onClose={() => {
          if (!isSubmittingDelete) {
            setConfirmingDeleteDoc(null);
            setDeleteModalError(null);
          }
        }}
        onConfirm={handleConfirmSendDeleteRequest}
      />

      {/* Modal Xem chi tiết tài liệu (khóa nội dung khi PROCESSING / FAILED) */}
      <DocumentReviewModal
        open={viewingDocumentId !== null}
        request={null}
        document={activeViewingDocument}
        isDocumentLoading={isDocumentsLoading}
        documentLoadError={documentsError}
        onRetryLoadDocument={() => void fetchDocuments()}
        lockProcessingAndFailedContent={true}
        onAccessForbidden={handleViewerAccessForbidden}
        onClose={() => setViewingDocumentId(null)}
      />
    </>
  );
}
