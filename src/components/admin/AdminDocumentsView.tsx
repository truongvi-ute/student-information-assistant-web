import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Clock,
  Edit,
  RotateCcw,
  Check,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { documentService } from "@/services/document.service";
import { ApiClientError } from "@/lib/api/api-error";
import type {
  DocumentItem,
  DocumentRagRequestResponse,
  DocumentLifecycleStatus,
  DocumentRagStatus,
} from "@/types/document";
import { formatFileSize } from "@/validations/document.validation";

type AdminDocTab = "REPOSITORY" | "PENDING_REQUESTS";

export function AdminDocumentsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminDocTab>("REPOSITORY");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [requests, setRequests] = useState<DocumentRagRequestResponse[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    "ALL" | DocumentLifecycleStatus
  >("ALL");

  const [bannerMessage, setBannerMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Đang xử lý xét duyệt một yêu cầu
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  );

  // Modal Từ chối yêu cầu kèm lý do
  const [rejectingReq, setRejectingReq] =
    useState<DocumentRagRequestResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [rejectModalError, setRejectModalError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsDocumentsLoading(true);
      setDocumentsError(null);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setDocumentsError(err.message);
      } else {
        setDocumentsError("Không thể tải kho tài liệu.");
      }
    } finally {
      setIsDocumentsLoading(false);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setIsRequestsLoading(true);
      setRequestsError(null);
      const data = await documentService.getPendingRequests();
      setRequests(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setRequestsError(err.message);
      } else {
        setRequestsError("Không thể tải danh sách yêu cầu chờ duyệt.");
      }
    } finally {
      setIsRequestsLoading(false);
    }
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

  const handleApproveRequest = async (req: DocumentRagRequestResponse) => {
    if (processingRequestId) return;

    try {
      setProcessingRequestId(req.id);
      setBannerMessage(null);
      await documentService.approveRequest(req.id);
      setBannerMessage({
        text: `Đã phê duyệt yêu cầu cho tài liệu "${req.documentTitle}".`,
        type: "success",
      });
      await Promise.all([fetchPendingRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 403) {
          setBannerMessage({
            text: "Bạn không có quyền quản trị viên để phê duyệt yêu cầu.",
            type: "error",
          });
        } else if (err.status === 404) {
          setBannerMessage({
            text: "Không tìm thấy yêu cầu xét duyệt (có thể đã được xử lý trước đó).",
            type: "error",
          });
        } else {
          setBannerMessage({
            text: err.message || "Phê duyệt yêu cầu thất bại.",
            type: "error",
          });
        }
      } else {
        setBannerMessage({
          text: "Đã xảy ra lỗi khi phê duyệt yêu cầu.",
          type: "error",
        });
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq || isSubmittingReject) return;

    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setRejectModalError("Vui lòng nhập lý do từ chối.");
      return;
    }

    try {
      setIsSubmittingReject(true);
      setRejectModalError(null);
      await documentService.rejectRequest(rejectingReq.id, cleanReason);
      const docTitle = rejectingReq.documentTitle;
      setRejectingReq(null);
      setRejectionReason("");
      setBannerMessage({
        text: `Đã từ chối yêu cầu cho tài liệu "${docTitle}".`,
        type: "success",
      });
      await Promise.all([fetchPendingRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 400) {
          setRejectModalError("Lý do từ chối không được để trống.");
        } else if (err.status === 403) {
          setRejectModalError(
            "Bạn không có quyền quản trị viên để từ chối yêu cầu."
          );
        } else if (err.status === 404) {
          setRejectModalError(
            "Không tìm thấy yêu cầu xét duyệt (có thể đã được xử lý trước đó)."
          );
        } else {
          setRejectModalError(
            err.message || "Từ chối yêu cầu thất bại. Vui lòng thử lại."
          );
        }
      } else {
        setRejectModalError("Đã xảy ra lỗi khi từ chối yêu cầu.");
      }
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const renderStatusBadge = (status: DocumentLifecycleStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
            Hoạt động
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap">
            Bản nháp
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">
            Lưu trữ
          </span>
        );
    }
  };

  const renderRagStatusBadge = (status: DocumentRagStatus) => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
            Sẵn sàng
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang xử lý
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 whitespace-nowrap">
            Thất bại
          </span>
        );
      case "DISABLED":
        return (
          <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 whitespace-nowrap">
            Vô hiệu
          </span>
        );
      case "NOT_INDEXED":
      default:
        return (
          <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">
            Chưa lập chỉ mục
          </span>
        );
    }
  };

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
              Quản lý tài liệu và xét duyệt các yêu cầu từ Cố vấn học tập.
            </p>
          </div>
        </div>

        {bannerMessage && (
          <div
            className={`flex items-center justify-between rounded border px-3.5 py-2 text-xs ${
              bannerMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
                value={lifecycleFilter}
                onChange={(e) =>
                  setLifecycleFilter(
                    e.target.value as "ALL" | DocumentLifecycleStatus
                  )
                }
                className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>

            {/* Bảng dữ liệu */}
            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 font-medium text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Tài liệu</th>
                      <th className="px-4 py-3 whitespace-nowrap">Tệp đính kèm</th>
                      <th className="px-4 py-3 whitespace-nowrap">Quyền tải</th>
                      <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                      <th className="px-4 py-3 whitespace-nowrap">Trạng thái RAG</th>
                      <th className="px-4 py-3 whitespace-nowrap">Người tải</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isDocumentsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span>Đang tải kho tài liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : documentsError ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-red-500">
                          <p>{documentsError}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDocumentsLoading(true);
                              void fetchDocuments();
                            }}
                            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                          >
                            Thử lại
                          </button>
                        </td>
                      </tr>
                    ) : filteredDocuments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          Kho tài liệu hiện đang trống.
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <tr
                          key={doc.documentId}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {doc.title}
                            </p>
                            {doc.description && (
                              <p className="mt-0.5 line-clamp-1 text-slate-500 text-[11px]">
                                {doc.description}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p
                              className="font-mono text-[11px] text-slate-700 max-w-[200px] truncate"
                              title={doc.originalFilename}
                            >
                              {doc.originalFilename}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {formatFileSize(doc.sizeBytes)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium border ${
                                doc.allowDownload
                                  ? "bg-slate-50 text-slate-700 border-slate-200"
                                  : "bg-slate-50 text-slate-400 border-slate-100"
                              }`}
                            >
                              {doc.allowDownload ? "Cho phép tải" : "Không tải"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderStatusBadge(doc.lifecycleStatus)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderRagStatusBadge(doc.ragStatus)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {doc.uploadedByName || "—"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled
                                title="Chức năng chỉnh sửa tài liệu đang được phát triển"
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400 cursor-not-allowed"
                              >
                                <Edit className="h-3 w-3 text-slate-400" />
                                <span>Sửa</span>
                              </button>
                              {doc.ragStatus === "FAILED" && (
                                <button
                                  type="button"
                                  disabled
                                  title="Chức năng thử lại RAG đang được phát triển"
                                  className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50/50 px-2.5 py-1 text-xs text-amber-400 cursor-not-allowed"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  <span>Thử lại</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Tab 2: Yêu cầu chờ xét duyệt */
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Loại yêu cầu</th>
                    <th className="px-4 py-3">Tài liệu</th>
                    <th className="px-4 py-3 whitespace-nowrap">Người gửi</th>
                    <th className="px-4 py-3 whitespace-nowrap">Ngày gửi</th>
                    <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Xét duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isRequestsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span>Đang tải danh sách yêu cầu chờ duyệt...</span>
                        </div>
                      </td>
                    </tr>
                  ) : requestsError ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                        <p>{requestsError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRequestsLoading(true);
                            void fetchPendingRequests();
                          }}
                          className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                        >
                          Thử lại
                        </button>
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Không có yêu cầu nào đang chờ xét duyệt.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => {
                      const isProcessing = processingRequestId === req.id;
                      const isAnyProcessing = processingRequestId !== null;

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`rounded px-2 py-0.5 text-[11px] font-medium border ${
                                req.requestType === "ADD"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : req.requestType === "UPDATE"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {req.requestType === "ADD"
                                ? "Thêm mới"
                                : req.requestType === "UPDATE"
                                  ? "Cập nhật"
                                  : "Ngừng dùng"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {req.documentTitle}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {req.requestedByName}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                              <Clock className="h-3 w-3" />
                              Chờ duyệt
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req)}
                                disabled={isAnyProcessing}
                                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                <span>Duyệt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingReq(req);
                                  setRejectionReason("");
                                  setRejectModalError(null);
                                }}
                                disabled={isAnyProcessing}
                                className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Từ chối yêu cầu */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Từ chối yêu cầu tài liệu
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (isSubmittingReject) return;
                  setRejectingReq(null);
                }}
                disabled={isSubmittingReject}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-3">
              {rejectModalError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  {rejectModalError}
                </div>
              )}

              <p className="text-xs text-slate-600">
                Từ chối yêu cầu thêm tài liệu{" "}
                <strong className="text-slate-900">
                  &quot;{rejectingReq.documentTitle}&quot;
                </strong>{" "}
                do Cố vấn{" "}
                <strong className="text-slate-900">
                  {rejectingReq.requestedByName}
                </strong>{" "}
                gửi lên.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  disabled={isSubmittingReject}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do phản hồi cho Cố vấn học tập..."
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  disabled={isSubmittingReject}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmittingReject && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Xác nhận từ chối</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
