import { useState, useMemo, useEffect, useCallback, type FormEvent } from "react";
import {
  Search,
  FileText,
  Clock,
  Edit,
  RotateCcw,
  Check,
  X,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { documentService } from "@/services/document.service";
import type {
  DocumentItem,
  DocumentChangeRequestItem,
  DocumentLifecycleStatus,
} from "@/types/document";
import { formatFileSize } from "@/validations/document.validation";

type AdminDocTab = "REPOSITORY" | "PENDING_REQUESTS";

export function AdminDocumentsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminDocTab>("REPOSITORY");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [requests, setRequests] = useState<DocumentChangeRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    "ALL" | DocumentLifecycleStatus
  >("ALL");

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Chỉnh sửa trực tiếp metadata
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAllowDownload, setEditAllowDownload] = useState(true);

  // Từ chối yêu cầu kèm lý do
  const [rejectingReq, setRejectingReq] =
    useState<DocumentChangeRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error("Không thể tải danh sách tài liệu:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

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

  const openEditModal = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description || "");
    setEditAllowDownload(doc.allowDownload);
  };

  const handleSaveDirectEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editTitle.trim()) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.documentId === editingDoc.documentId
          ? {
              ...d,
              title: editTitle.trim(),
              description: editDescription.trim() || null,
              allowDownload: editAllowDownload,
            }
          : d
      )
    );
    setEditingDoc(null);
    setBannerMessage("Đã cập nhật thông tin tài liệu.");
  };

  const handleApproveRequest = (req: DocumentChangeRequestItem) => {
    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === req.requestId
          ? { ...r, status: "APPROVED", reviewedAt: now }
          : r
      )
    );

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.documentId !== req.documentId) return doc;
        if (req.requestType === "ADD") {
          return {
            ...doc,
            title: req.proposedTitle || doc.title,
            description: req.proposedDescription ?? doc.description,
            allowDownload: req.proposedAllowDownload ?? doc.allowDownload,
            lifecycleStatus: "ACTIVE",
            ragStatus: "READY",
          };
        }
        if (req.requestType === "UPDATE") {
          return {
            ...doc,
            title: req.proposedTitle || doc.title,
            description: req.proposedDescription ?? doc.description,
            allowDownload: req.proposedAllowDownload ?? doc.allowDownload,
          };
        }
        return {
          ...doc,
          lifecycleStatus: "ARCHIVED",
          ragStatus: "DISABLED",
          archivedAt: now,
        };
      })
    );

    setBannerMessage(`Đã phê duyệt yêu cầu cho "${req.documentTitle}".`);
  };

  const handleConfirmReject = (e: FormEvent) => {
    e.preventDefault();
    if (!rejectingReq || !rejectionReason.trim()) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.requestId === rejectingReq.requestId
          ? {
              ...r,
              status: "REJECTED",
              rejectionReason: rejectionReason.trim(),
              reviewedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setRejectingReq(null);
    setRejectionReason("");
    setBannerMessage("Đã từ chối yêu cầu.");
  };

  const handleRetryRag = (doc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.documentId === doc.documentId
          ? { ...d, ragStatus: "PROCESSING" }
          : d
      )
    );
    setBannerMessage(`Đang xử lý lại tài liệu "${doc.title}".`);
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

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
          <div className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{bannerMessage}</span>
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
            Yêu cầu chờ duyệt ({pendingCount})
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
                      <th className="px-4 py-3 whitespace-nowrap">Người tải</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span>Đang tải kho tài liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDocuments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
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
                            <p className="font-mono text-[11px] text-slate-700 max-w-[200px] truncate" title={doc.originalFilename}>
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
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {doc.uploadedByName || "—"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(doc)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Edit className="h-3 w-3 text-slate-500" />
                                <span>Sửa</span>
                              </button>
                              {doc.ragStatus === "FAILED" && (
                                <button
                                  type="button"
                                  onClick={() => handleRetryRag(doc)}
                                  className="inline-flex items-center gap-1 rounded border border-amber-200 bg-white px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
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
                    <th className="px-4 py-3">Nội dung đề xuất</th>
                    <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Xét duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Không có yêu cầu nào đang chờ xét duyệt.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr
                        key={req.requestId}
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
                          <p className="font-mono text-[11px] text-slate-500">
                            {req.originalFilename}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {req.requestedByAdvisorName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {req.requestType === "DELETE" ? (
                            <span className="text-red-600">Đề xuất lưu trữ</span>
                          ) : (
                            <div className="text-[11px]">
                              <p className="font-medium text-slate-800">
                                {req.proposedTitle}
                              </p>
                              <span className="text-slate-400">
                                {req.proposedAllowDownload ? "Cho phép tải" : "Không tải"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-medium text-slate-700">
                            {req.status === "PENDING"
                              ? "Chờ duyệt"
                              : req.status === "APPROVED"
                                ? "Đã duyệt"
                                : "Từ chối"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {req.status === "PENDING" ? (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req)}
                                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                              >
                                <Check className="h-3 w-3" />
                                <span>Duyệt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingReq(req);
                                  setRejectionReason("");
                                }}
                                className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <X className="h-3 w-3" />
                                <span>Từ chối</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              Đã xử lý
                            </span>
                          )}
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

      {/* Modal Sửa trực tiếp */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Chỉnh sửa tài liệu
              </h3>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tiêu đề tài liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adminAllowDownload"
                  checked={editAllowDownload}
                  onChange={(e) => setEditAllowDownload(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <label
                  htmlFor="adminAllowDownload"
                  className="text-xs text-slate-700 cursor-pointer select-none"
                >
                  Cho phép sinh viên tải tệp gốc về máy
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Từ chối yêu cầu */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Từ chối yêu cầu
            </h3>
            <form onSubmit={handleConfirmReject} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do phản hồi cho Cố vấn..."
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  Từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
