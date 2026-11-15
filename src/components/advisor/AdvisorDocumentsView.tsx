import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Upload,
  Search,
  Send,
  Edit,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import { documentService } from "@/services/document.service";
import { ApiClientError } from "@/lib/api/api-error";
import type {
  DocumentItem,
  DocumentRagRequestResponse,
  DocumentLifecycleStatus,
  DocumentUploadResponse,
} from "@/types/document";
import { formatFileSize } from "@/validations/document.validation";

type AdvisorDocTab = "DOCUMENTS" | "REQUESTS";

export function AdvisorDocumentsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdvisorDocTab>("DOCUMENTS");
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

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modal xác nhận gửi yêu cầu ADD
  const [confirmingAddDoc, setConfirmingAddDoc] = useState<DocumentItem | null>(
    null
  );
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

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
        setDocumentsError("Không thể tải danh sách tài liệu.");
      }
    } finally {
      setIsDocumentsLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setIsRequestsLoading(true);
      setRequestsError(null);
      const data = await documentService.getMyRequests();
      setRequests(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setRequestsError(err.message);
      } else {
        setRequestsError("Không thể tải danh sách yêu cầu.");
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

  if (user && user.role !== "ADVISOR") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-red-600" />
        <h2 className="mt-2 text-sm font-semibold text-red-800">
          Không có quyền truy cập
        </h2>
        <p className="mt-1 text-xs text-red-600">
          Trang này chỉ dành cho tài khoản Cố vấn học tập.
        </p>
      </div>
    );
  }

  const hasPendingRequest = (documentId: string) =>
    requests.some(
      (r) => r.documentId === documentId && r.status === "PENDING"
    );

  const hasApprovedAddRequest = (documentId: string) =>
    requests.some(
      (r) =>
        r.documentId === documentId &&
        r.requestType === "ADD" &&
        r.status === "APPROVED"
    );

  const handleUploadSuccess = (uploaded: DocumentUploadResponse) => {
    const newDoc: DocumentItem = {
      ...uploaded,
      uploadedByName: user?.fullName || user?.email || "Cố vấn",
      uploadedByEmail: user?.email,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setBannerMessage({
      text: `Đã tải lên tài liệu "${uploaded.title}". Bạn có thể gửi yêu cầu để Quản trị viên xét duyệt.`,
      type: "success",
    });
  };

  const handleConfirmSendAddRequest = async () => {
    if (!confirmingAddDoc || isSubmittingAdd) return;

    const isOwner = Boolean(
      user?.email &&
        confirmingAddDoc.uploadedByEmail &&
        confirmingAddDoc.uploadedByEmail.trim().toLowerCase() ===
          user.email.trim().toLowerCase()
    );

    if (!isOwner) {
      setAddModalError(
        !confirmingAddDoc.uploadedByEmail
          ? "Thiếu thông tin người tải lên, không thể gửi yêu cầu."
          : "Bạn chỉ có thể gửi yêu cầu cho tài liệu do chính mình tải lên."
      );
      return;
    }

    try {
      setIsSubmittingAdd(true);
      setAddModalError(null);
      await documentService.createAddRequest(confirmingAddDoc.documentId);
      const docTitle = confirmingAddDoc.title;
      setConfirmingAddDoc(null);
      setBannerMessage({
        text: `Đã gửi yêu cầu thêm tài liệu "${docTitle}" thành công. Vui lòng chờ Quản trị viên xét duyệt.`,
        type: "success",
      });
      await Promise.all([fetchRequests(), fetchDocuments()]);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setAddModalError(
            "Tài liệu này đã có yêu cầu đang chờ duyệt hoặc đã được phê duyệt."
          );
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
      setIsSubmittingAdd(false);
    }
  };

  const renderStatusBadge = (status: DocumentLifecycleStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
            Hoạt động
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap">
            Bản nháp
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">
            Lưu trữ
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
              Quản lý tài liệu
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Quản lý tài liệu hướng dẫn và gửi yêu cầu phê duyệt để đưa vào kho dữ liệu tư vấn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBannerMessage(null);
              setIsUploadModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-blue-700"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Tải lên tài liệu</span>
          </button>
        </div>

        {/* Thông báo kết quả */}
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
                      <th className="px-4 py-3 whitespace-nowrap">Ngày tạo</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isDocumentsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span>Đang tải danh sách tài liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : documentsError ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-red-500">
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
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          Chưa có tài liệu nào. Nhấn &quot;Tải lên tài liệu&quot; để thêm tệp mới.
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map((doc) => {
                        const isPending = hasPendingRequest(doc.documentId);
                        const isApprovedAdd = hasApprovedAddRequest(doc.documentId);
                        const isOwner = Boolean(
                          user?.email &&
                            doc.uploadedByEmail &&
                            doc.uploadedByEmail.trim().toLowerCase() ===
                              user.email.trim().toLowerCase()
                        );

                        return (
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
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                  <Clock className="h-3 w-3" />
                                  Chờ duyệt
                                </span>
                              ) : isApprovedAdd ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Đã duyệt
                                </span>
                              ) : doc.lifecycleStatus === "DRAFT" ? (
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled
                                    title="Chức năng chỉnh sửa thông tin đang được phát triển"
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400 cursor-not-allowed"
                                  >
                                    <Edit className="h-3 w-3 text-slate-400" />
                                    <span>Sửa</span>
                                  </button>
                                  {isOwner ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddModalError(null);
                                        setConfirmingAddDoc(doc);
                                      }}
                                      className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                                    >
                                      <Send className="h-3 w-3" />
                                      <span>Gửi duyệt</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled
                                      title={
                                        !doc.uploadedByEmail
                                          ? "Thiếu thông tin người tải lên, không thể gửi yêu cầu"
                                          : "Chỉ người tải lên tài liệu mới có quyền gửi yêu cầu xét duyệt"
                                      }
                                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400 cursor-not-allowed"
                                    >
                                      <Send className="h-3 w-3 text-slate-400" />
                                      <span>Gửi duyệt</span>
                                    </button>
                                  )}
                                </div>
                              ) : doc.lifecycleStatus === "ACTIVE" ? (
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled
                                    title="Chức năng gửi yêu cầu cập nhật đang được phát triển"
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400 cursor-not-allowed"
                                  >
                                    <Edit className="h-3 w-3 text-slate-400" />
                                    <span>Yêu cầu sửa</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled
                                    title="Chức năng gửi yêu cầu ngừng sử dụng đang được phát triển"
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400 cursor-not-allowed"
                                  >
                                    <Trash2 className="h-3 w-3 text-slate-400" />
                                    <span>Ngừng dùng</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">
                                  Đã lưu trữ
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Tab 2: Yêu cầu đã gửi */
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Mã yêu cầu</th>
                    <th className="px-4 py-3 whitespace-nowrap">Loại yêu cầu</th>
                    <th className="px-4 py-3">Tài liệu</th>
                    <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 whitespace-nowrap">Ngày gửi</th>
                    <th className="px-4 py-3 whitespace-nowrap">Ngày xét duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isRequestsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span>Đang tải danh sách yêu cầu...</span>
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
                            void fetchRequests();
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
                        Chưa có yêu cầu nào được gửi.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td
                          className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap"
                          title={req.id}
                        >
                          {req.id.slice(0, 8)}...
                        </td>
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          {req.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                              <Clock className="h-3 w-3" />
                              Chờ duyệt
                            </span>
                          ) : req.status === "APPROVED" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Đã duyệt
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                                <XCircle className="h-3 w-3" />
                                Từ chối
                              </span>
                              {req.rejectionReason && (
                                <p className="mt-1 text-[11px] text-red-600 bg-red-50/80 p-1.5 rounded border border-red-100 max-w-xs">
                                  Lý do: {req.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {req.reviewedAt
                            ? new Date(req.reviewedAt).toLocaleDateString("vi-VN")
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Upload */}
      <DocumentUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Modal Xác nhận Gửi yêu cầu Thêm mới */}
      {confirmingAddDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Gửi yêu cầu thêm tài liệu
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (isSubmittingAdd) return;
                  setConfirmingAddDoc(null);
                }}
                disabled={isSubmittingAdd}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {addModalError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  {addModalError}
                </div>
              )}

              <p className="text-xs text-slate-600">
                Bạn có chắc chắn muốn gửi yêu cầu phê duyệt cho tài liệu này không?
                Sau khi gửi, Quản trị viên sẽ xem xét để đưa tài liệu vào nguồn tri thức của hệ thống.
              </p>

              <div className="rounded-md border border-slate-100 bg-slate-50/80 p-3 space-y-1.5 text-xs">
                <div>
                  <span className="font-medium text-slate-500">Tên tài liệu: </span>
                  <span className="font-medium text-slate-900">
                    {confirmingAddDoc.title}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Tệp đính kèm: </span>
                  <span className="font-mono text-slate-700">
                    {confirmingAddDoc.originalFilename} (
                    {formatFileSize(confirmingAddDoc.sizeBytes)})
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Quyền tải về: </span>
                  <span className="text-slate-700">
                    {confirmingAddDoc.allowDownload
                      ? "Cho phép sinh viên tải"
                      : "Không tải về"}
                  </span>
                </div>
                {confirmingAddDoc.description && (
                  <div>
                    <span className="font-medium text-slate-500">Mô tả: </span>
                    <span className="text-slate-700">
                      {confirmingAddDoc.description}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
              <button
                type="button"
                onClick={() => setConfirmingAddDoc(null)}
                disabled={isSubmittingAdd}
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSendAddRequest}
                disabled={isSubmittingAdd}
                className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmittingAdd && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Xác nhận gửi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
