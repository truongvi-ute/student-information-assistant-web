import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import {
  Search,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentReviewModal } from "@/components/documents/DocumentReviewModal";
import { DocumentChangeReviewModal } from "@/components/documents/DocumentChangeReviewModal";
import { DocumentUpdateRequestModal } from "@/components/documents/DocumentUpdateRequestModal";
import {
  DocumentLifecycleBadge,
  DocumentProcessingBadge,
  DocumentRequestTypeBadge,
  formatDateVi,
} from "@/components/documents/DocumentStatusBadges";
import { documentService } from "@/services/document.service";
import { ApiClientError } from "@/lib/api/api-error";
import type {
  CreateDocumentUpdateRequestPayload,
  DocumentItem,
  DocumentRagRequestResponse,
  DocumentLifecycleStatus,
} from "@/types/document";
import { formatFileSize } from "@/validations/document.validation";

type AdminDocTab = "REPOSITORY" | "PENDING_REQUESTS";

type ReviewTarget =
  | { type: "REQUEST"; request: DocumentRagRequestResponse }
  | { type: "DOCUMENT"; documentId: string };

export function AdminDocumentsView() {
  const { user } = useAuth();
  const router = useRouter();
  const activeTab: AdminDocTab =
    router.query.tab === "requests" ? "PENDING_REQUESTS" : "REPOSITORY";

  const setActiveTab = (tab: AdminDocTab) => {
    const query = { ...router.query };
    if (tab === "PENDING_REQUESTS") {
      query.tab = "requests";
    } else {
      query.tab = "repository";
    }
    void router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [requests, setRequests] = useState<DocumentRagRequestResponse[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState<DocumentItem | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const savingDraftRef = useRef(false);
  const retryingRef = useRef(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    "ALL" | DocumentLifecycleStatus
  >("ALL");

  const [bannerMessage, setBannerMessage] = useState<{
    text: string;
    type: "info" | "success" | "error";
    loading?: boolean;
    retryConflict?: boolean;
  } | null>(null);

  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [submittingAction, setSubmittingAction] = useState<
    "APPROVE" | "REJECT" | null
  >(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const submittingDecisionRef = useRef(false);
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
        setDocumentsError("Không thể tải kho tài liệu.");
      }
      return false;
    } finally {
      setIsDocumentsLoading(false);
    }
  }, []);

  const fetchPendingRequests = useCallback(async (): Promise<boolean> => {
    try {
      setIsRequestsLoading(true);
      setRequestsError(null);
      const data = await documentService.getPendingRequests();
      setRequests(data);
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setRequestsError(err.message);
      } else {
        setRequestsError("Không thể tải danh sách yêu cầu chờ duyệt.");
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
      fetchPendingRequests(),
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
  }, [fetchDocuments, fetchPendingRequests]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([fetchDocuments(), fetchPendingRequests()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchDocuments, fetchPendingRequests, isRefreshing]);

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
            setDocumentsError("Không thể tải kho tài liệu.");
          }
          setIsDocumentsLoading(false);
        }
      });

    documentService
      .getPendingRequests()
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
            setRequestsError("Không thể tải danh sách yêu cầu chờ duyệt.");
          }
          setIsRequestsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      !router.isReady ||
      router.query.tab ||
      isRequestsLoading ||
      requestsError
    ) {
      return;
    }

    void router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          tab: requests.length > 0 ? "requests" : "repository",
        },
      },
      undefined,
      { shallow: true }
    );
  }, [router, isRequestsLoading, requestsError, requests.length]);

  const documentMap = useMemo(() => {
    const map = new Map<string, DocumentItem>();
    for (const doc of documents) {
      map.set(doc.documentId, doc);
    }
    return map;
  }, [documents]);

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

  if (user && user.role !== "ADMIN") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />
        <h2 className="mt-2 text-sm font-semibold text-red-800">
          Không có quyền truy cập
        </h2>
        <p className="mt-1 text-xs text-red-600">
          Trang này chỉ dành cho tài khoản Quản trị viên.
        </p>
      </div>
    );
  }

  const handleOpenRequestReview = (req: DocumentRagRequestResponse) => {
    setDecisionError(null);
    setReviewTarget({ type: "REQUEST", request: req });
  };

  const handleOpenDocumentView = (doc: DocumentItem) => {
    setDecisionError(null);
    setReviewTarget({ type: "DOCUMENT", documentId: doc.documentId });
  };

  const handleReviewConflict = async () => {
    setReviewTarget(null);
    setDecisionError(null);
    await reloadAfterConflict();
  };

  const handleSaveDraft = async (payload: CreateDocumentUpdateRequestPayload) => {
    if (!draftToEdit || savingDraftRef.current) return;
    savingDraftRef.current = true;
    setIsSavingDraft(true);
    setDraftError(null);
    try {
      await documentService.updateDraft(draftToEdit.documentId, payload);
      setDraftToEdit(null);
      await fetchDocuments();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setDraftToEdit(null);
        await reloadAfterConflict();
      } else {
        setDraftError("Không thể lưu bản nháp. Vui lòng thử lại.");
      }
    } finally {
      savingDraftRef.current = false;
      setIsSavingDraft(false);
    }
  };

  const renderEditDraft = (doc: DocumentItem) => {
    if (doc.lifecycleStatus !== "DRAFT" || doc.ragStatus !== "NOT_INDEXED" ||
        isRequestsLoading || requestsError ||
        requests.some((request) => request.documentId === doc.documentId && request.status === "PENDING")) {
      return null;
    }
    return (
      <button
        type="button"
        onClick={() => {
          setDraftError(null);
          setDraftToEdit(doc);
        }}
        className="mr-2 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
      >
        Sửa bản nháp
      </button>
    );
  };

  const renderRetryRag = (doc: DocumentItem) => {
    if (doc.lifecycleStatus !== "DRAFT" || doc.ragStatus !== "FAILED") return null;

    return (
      <button
        type="button"
        disabled={isRetrying}
        onClick={async () => {
          if (retryingRef.current) return;
          retryingRef.current = true;
          setIsRetrying(true);
          try {
            await documentService.retryRag(doc.documentId);
            setBannerMessage({ text: "Đã yêu cầu xử lý lại tài liệu.", type: "success" });
            await fetchDocuments();
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 409) {
              await reloadAfterConflict();
            } else {
              setBannerMessage({ text: "Không thể xử lý lại tài liệu.", type: "error" });
            }
          } finally {
            retryingRef.current = false;
            setIsRetrying(false);
          }
        }}
        className="mr-2 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
      >
        Xử lý lại
      </button>
    );
  };

  const handleApproveRequest = async (req: DocumentRagRequestResponse) => {
    const targetDoc = documentMap.get(req.documentId);
    const effectiveLifecycle =
      targetDoc?.lifecycleStatus ?? req.documentLifecycleStatus;
    const isEligibleForApproval =
      req.requestType === "ADD"
        ? Boolean(
            targetDoc &&
              targetDoc.lifecycleStatus === "DRAFT" &&
              targetDoc.ragStatus === "NOT_INDEXED"
          )
        : req.requestType === "DELETE" &&
          effectiveLifecycle === "ACTIVE" &&
          (targetDoc?.ragStatus ?? req.documentRagStatus) === "READY";
    if (
      submittingDecisionRef.current ||
      req.status !== "PENDING" ||
      isDocumentsLoading ||
      Boolean(documentsError) ||
      !isEligibleForApproval
    ) {
      return;
    }

    submittingDecisionRef.current = true;
    setSubmittingAction("APPROVE");
    setDecisionError(null);
    reloadSeqRef.current += 1;
    setBannerMessage(null);

    try {
      await documentService.approveRequest(req.id);
      if (req.requestType === "DELETE") {
        documentService.evictDocumentPreviewCache(req.documentId);
      }
      setReviewTarget(null);
      const successText =
        req.requestType === "DELETE"
            ? `Đã duyệt yêu cầu ngừng sử dụng tài liệu "${req.documentTitle}". Tài liệu đã chuyển sang Lưu trữ.`
            : "Đã duyệt yêu cầu. Tài liệu đang được xử lý để Chatbot sử dụng.";
      reloadSeqRef.current += 1;
      setBannerMessage({
        text: successText,
        type: "success",
      });
      await Promise.all([fetchPendingRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          if (req.requestType === "DELETE") {
            documentService.evictDocumentPreviewCache(req.documentId);
          }
          setReviewTarget(null);
          await reloadAfterConflict();
        } else if (err.status === 403) {
          setDecisionError(
            "Bạn không có quyền quản trị viên để duyệt yêu cầu."
          );
        } else if (err.status === 404) {
          setDecisionError("Không tìm thấy yêu cầu xét duyệt.");
        } else {
          setDecisionError(err.message || "Duyệt yêu cầu thất bại.");
        }
      } else {
        setDecisionError("Đã xảy ra lỗi khi duyệt yêu cầu.");
      }
    } finally {
      submittingDecisionRef.current = false;
      setSubmittingAction(null);
    }
  };

  const handleRejectRequest = async (
    req: DocumentRagRequestResponse,
    reason: string
  ) => {
    if (submittingDecisionRef.current || req.status !== "PENDING") return;

    const cleanReason = reason.trim();
    if (!cleanReason) {
      setDecisionError("Vui lòng nhập lý do từ chối.");
      return;
    }

    submittingDecisionRef.current = true;
    setSubmittingAction("REJECT");
    setDecisionError(null);
    reloadSeqRef.current += 1;
    setBannerMessage(null);

    try {
      await documentService.rejectRequest(req.id, cleanReason);
      setReviewTarget(null);
      reloadSeqRef.current += 1;
      setBannerMessage({
        text: `Đã từ chối yêu cầu cho tài liệu "${req.documentTitle}".`,
        type: "success",
      });
      await Promise.all([fetchPendingRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setReviewTarget(null);
          await reloadAfterConflict();
        } else if (err.status === 400) {
          setDecisionError("Lý do từ chối không được để trống.");
        } else if (err.status === 403) {
          setDecisionError(
            "Bạn không có quyền quản trị viên để từ chối yêu cầu."
          );
        } else if (err.status === 404) {
          setDecisionError("Không tìm thấy yêu cầu xét duyệt.");
        } else {
          setDecisionError(
            err.message || "Từ chối yêu cầu thất bại. Vui lòng thử lại."
          );
        }
      } else {
        setDecisionError("Đã xảy ra lỗi khi từ chối yêu cầu.");
      }
    } finally {
      submittingDecisionRef.current = false;
      setSubmittingAction(null);
    }
  };

  const renderPendingDocMeta = (doc?: DocumentItem) => {
    if (doc) {
      return (
        <p
          className="mt-0.5 max-w-[280px] truncate font-mono text-[11px] text-slate-500"
          title={doc.originalFilename}
        >
          {doc.originalFilename} · {formatFileSize(doc.sizeBytes)} ·{" "}
          {doc.allowDownload ? "Cho phép tải" : "Không tải"}
        </p>
      );
    }
    if (isDocumentsLoading) {
      return (
        <p className="mt-0.5 text-[11px] text-slate-400">
          Đang tải thông tin tệp...
        </p>
      );
    }
    return (
      <p className="mt-0.5 text-[11px] text-red-600">Chưa có thông tin tệp</p>
    );
  };

  const activeReviewRequest =
    reviewTarget?.type === "REQUEST"
      ? requests.find((r) => r.id === reviewTarget.request.id) ??
        reviewTarget.request
      : null;

  const activeReviewDocumentId =
    reviewTarget?.type === "REQUEST"
      ? reviewTarget.request.documentId
      : reviewTarget?.type === "DOCUMENT"
        ? reviewTarget.documentId
        : null;

  const activeReviewDocument = activeReviewDocumentId
    ? documentMap.get(activeReviewDocumentId) ?? null
    : null;

  const isChangeRequestReview = Boolean(
    reviewTarget?.type === "REQUEST" &&
      activeReviewRequest &&
      (activeReviewRequest.requestType === "UPDATE" ||
        activeReviewRequest.requestType === "DELETE")
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Kho tài liệu đào tạo
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Quản lý tài liệu và xét duyệt các yêu cầu từ Tư vấn viên.
            </p>
          </div>
          <button
            type="button"
            disabled={isRefreshing || isDocumentsLoading || isRequestsLoading}
            onClick={() => void handleRefresh()}
            className="inline-flex self-start items-center justify-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
        </div>

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

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("REPOSITORY")}
            className={`border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "REPOSITORY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Kho tài liệu ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PENDING_REQUESTS")}
            className={`border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "PENDING_REQUESTS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Yêu cầu chờ duyệt ({requests.length})
          </button>
        </div>

        {activeTab === "REPOSITORY" ? (
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
                  <span>Đang tải kho tài liệu...</span>
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
                  ? "Kho tài liệu hiện đang trống."
                  : "Không tìm thấy tài liệu phù hợp."}
              </div>
            ) : (
              <>
                {/* Mobile Card List */}
                <div className="space-y-3 md:hidden">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.documentId}
                      className="space-y-3 rounded border border-slate-200 bg-white p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 break-words">
                          {doc.title}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500 break-all">
                          {doc.originalFilename} ·{" "}
                          {formatFileSize(doc.sizeBytes)}
                        </p>
                        {doc.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {doc.description}
                          </p>
                        )}
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
                            : "Không cho phép tải"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-500">
                          Người tải: {doc.uploadedByName || "—"}
                        </span>
                        {renderEditDraft(doc)}
                        {renderRetryRag(doc)}
                        <button
                          type="button"
                          onClick={() => handleOpenDocumentView(doc)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded border border-slate-200 bg-white md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50 font-medium uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3.5 py-3">Tài liệu</th>
                          <th className="px-3.5 py-3 whitespace-nowrap">
                            Tải xuống
                          </th>
                          <th className="px-3.5 py-3 whitespace-nowrap">
                            Trạng thái tài liệu
                          </th>
                          <th className="px-3.5 py-3 whitespace-nowrap">
                            Trạng thái xử lý
                          </th>
                          <th className="px-3.5 py-3 whitespace-nowrap">
                            Người tải lên
                          </th>
                          <th className="px-3.5 py-3 text-right whitespace-nowrap">
                            Chi tiết
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDocuments.map((doc) => (
                          <tr
                            key={doc.documentId}
                            className="transition-colors hover:bg-slate-50/70"
                          >
                            <td className="px-3.5 py-3">
                              <p className="font-medium text-slate-900">
                                {doc.title}
                              </p>
                              <p
                                className="mt-0.5 max-w-[280px] truncate font-mono text-[11px] text-slate-500"
                                title={doc.originalFilename}
                              >
                                {doc.originalFilename} ·{" "}
                                {formatFileSize(doc.sizeBytes)}
                              </p>
                              {doc.description && (
                                <p className="mt-0.5 line-clamp-1 max-w-[300px] text-[11px] text-slate-500">
                                  {doc.description}
                                </p>
                              )}
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${
                                  doc.allowDownload
                                    ? "border-slate-200 bg-slate-50 text-slate-700"
                                    : "border-slate-100 bg-slate-50 text-slate-400"
                                }`}
                              >
                                {doc.allowDownload
                                  ? "Cho phép"
                                  : "Không cho phép"}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <DocumentLifecycleBadge
                                status={doc.lifecycleStatus}
                              />
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <DocumentProcessingBadge
                                lifecycleStatus={doc.lifecycleStatus}
                                ragStatus={doc.ragStatus}
                              />
                            </td>
                            <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                              {doc.uploadedByName || "—"}
                            </td>
                            <td className="px-3.5 py-3 text-right whitespace-nowrap">
                              {renderEditDraft(doc)}
                              {renderRetryRag(doc)}
                              <button
                                type="button"
                                onClick={() => handleOpenDocumentView(doc)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Xem</span>
                              </button>
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
        ) : (
          /* Tab 2: Yêu cầu chờ xét duyệt */
          <>
            {documentsError && !isDocumentsLoading && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-red-200 bg-red-50 px-3.5 py-2 text-xs text-red-700"
              >
                <span>
                  Không thể tải thông tin chi tiết tài liệu ({documentsError}).
                </span>
                <button
                  type="button"
                  onClick={() => void fetchDocuments()}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Thử lại
                </button>
              </div>
            )}

            {isRequestsLoading ? (
              <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Đang tải danh sách yêu cầu chờ duyệt...</span>
                </div>
              </div>
            ) : requestsError ? (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-6 text-center text-xs text-red-600">
                <p>{requestsError}</p>
                <button
                  type="button"
                  onClick={() => void fetchPendingRequests()}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-500">
                Không có yêu cầu nào đang chờ xét duyệt.
              </div>
            ) : (
              <>
                {/* Mobile Card List */}
                <div className="space-y-3 md:hidden">
                  {requests.map((req) => {
                    const doc = documentMap.get(req.documentId);
                    return (
                      <div
                        key={req.id}
                        className="space-y-3 rounded border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 break-words">
                              {req.documentTitle}
                            </p>
                            {renderPendingDocMeta(doc)}
                          </div>
                          <DocumentRequestTypeBadge type={req.requestType} />
                        </div>

                        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                          <span>Người gửi: {req.requestedByName}</span>
                          <span>{formatDateVi(req.createdAt)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenRequestReview(req)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem xét</span>
                        </button>
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
                          <th className="px-3.5 py-3 whitespace-nowrap">
                            Loại yêu cầu
                          </th>
                          <th className="px-3.5 py-3">Tài liệu</th>
                          <th className="px-3.5 py-3 whitespace-nowrap">
                            Người gửi
                          </th>
                          <th className="px-3.5 py-3 whitespace-nowrap">
                            Ngày gửi
                          </th>
                          <th className="px-3.5 py-3 text-right whitespace-nowrap">
                            Xét duyệt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {requests.map((req) => {
                          const doc = documentMap.get(req.documentId);
                          return (
                            <tr
                              key={req.id}
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <DocumentRequestTypeBadge
                                  type={req.requestType}
                                />
                              </td>
                              <td className="px-3.5 py-3">
                                <p className="max-w-md font-medium text-slate-900 break-words">
                                  {req.documentTitle}
                                </p>
                                {renderPendingDocMeta(doc)}
                              </td>
                              <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                                {req.requestedByName}
                              </td>
                              <td className="px-3.5 py-3 text-slate-500 whitespace-nowrap">
                                {formatDateVi(req.createdAt)}
                              </td>
                              <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRequestReview(req)}
                                  className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Xem xét</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal Xem trước & Xét duyệt tài liệu ADD / Xem chi tiết */}
      <DocumentUpdateRequestModal
        open={draftToEdit !== null}
        document={draftToEdit}
        isSubmitting={isSavingDraft}
        errorMessage={draftError}
        onClose={() => {
          if (!isSavingDraft) setDraftToEdit(null);
        }}
        onSubmit={handleSaveDraft}
      />
      <DocumentReviewModal
        open={reviewTarget !== null && !isChangeRequestReview}
        request={activeReviewRequest}
        document={activeReviewDocument}
        isDocumentLoading={isDocumentsLoading}
        documentLoadError={documentsError}
        onRetryLoadDocument={() => void fetchDocuments()}
        onClose={() => {
          setReviewTarget(null);
          setDecisionError(null);
        }}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onReviewConflict={handleReviewConflict}
        submittingAction={submittingAction}
        decisionError={decisionError}
        onClearDecisionError={() => setDecisionError(null)}
      />

      {/* Modal Đối chiếu & Xét duyệt yêu cầu UPDATE / DELETE */}
      <DocumentChangeReviewModal
        open={isChangeRequestReview}
        request={activeReviewRequest}
        document={activeReviewDocument}
        isDocumentLoading={isDocumentsLoading}
        documentLoadError={documentsError}
        onRetryLoadDocument={() => void fetchDocuments()}
        onClose={() => {
          setReviewTarget(null);
          setDecisionError(null);
        }}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onOpenDocumentPreview={
          activeReviewDocument && activeReviewDocument.lifecycleStatus !== "ARCHIVED"
            ? () => handleOpenDocumentView(activeReviewDocument)
            : undefined
        }
        submittingAction={submittingAction}
        decisionError={decisionError}
        onClearDecisionError={() => setDecisionError(null)}
      />
    </>
  );
}
