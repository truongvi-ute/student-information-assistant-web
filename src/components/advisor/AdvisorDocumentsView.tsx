import { useState, useMemo, useEffect, useCallback, type FormEvent } from "react";
import {
  Upload,
  Search,
  FileText,
  Send,
  Edit,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import { documentService } from "@/services/document.service";
import type {
  DocumentItem,
  DocumentChangeRequestItem,
  DocumentLifecycleStatus,
  DocumentRequestType,
  DocumentUploadResponse,
} from "@/types/document";
import { formatFileSize } from "@/validations/document.validation";

type AdvisorDocTab = "DOCUMENTS" | "REQUESTS";

export function AdvisorDocumentsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdvisorDocTab>("DOCUMENTS");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [requests, setRequests] = useState<DocumentChangeRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    "ALL" | DocumentLifecycleStatus
  >("ALL");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Modal chỉnh sửa DRAFT hoặc tạo yêu cầu ADD / UPDATE / DELETE
  const [editingDraft, setEditingDraft] = useState<DocumentItem | null>(null);
  const [requestTarget, setRequestTarget] = useState<{
    doc: DocumentItem;
    type: DocumentRequestType;
  } | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAllowDownload, setFormAllowDownload] = useState(true);
  const [modalError, setModalError] = useState("");

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

  const handleUploadSuccess = (uploaded: DocumentUploadResponse) => {
    const newDoc: DocumentItem = {
      ...uploaded,
      uploadedByName: user?.fullName || user?.email || "Cố vấn",
      uploadedByEmail: user?.email,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setBannerMessage(`Đã tải lên tài liệu "${uploaded.title}".`);
  };

  const openEditDraftModal = (doc: DocumentItem) => {
    setEditingDraft(doc);
    setFormTitle(doc.title);
    setFormDescription(doc.description || "");
    setFormAllowDownload(doc.allowDownload);
    setModalError("");
  };

  const handleSaveDraftMetadata = (e: FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;
    const cleanTitle = formTitle.trim();
    if (!cleanTitle) {
      setModalError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.documentId === editingDraft.documentId
          ? {
              ...d,
              title: cleanTitle,
              description: formDescription.trim() || null,
              allowDownload: formAllowDownload,
            }
          : d
      )
    );
    setEditingDraft(null);
    setBannerMessage("Đã lưu thay đổi thông tin tài liệu.");
  };

  const openCreateRequestModal = (
    doc: DocumentItem,
    type: DocumentRequestType
  ) => {
    if (hasPendingRequest(doc.documentId)) {
      setBannerMessage(null);
      alert("Tài liệu này đang có yêu cầu chờ xét duyệt.");
      return;
    }
    setRequestTarget({ doc, type });
    setFormTitle(doc.title);
    setFormDescription(doc.description || "");
    setFormAllowDownload(doc.allowDownload);
    setModalError("");
  };

  const handleSubmitChangeRequest = (e: FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;

    const { doc, type } = requestTarget;
    const cleanTitle = formTitle.trim();

    if (type !== "DELETE" && !cleanTitle) {
      setModalError("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }

    const newReq: DocumentChangeRequestItem = {
      requestId: `REQ-${Date.now().toString().slice(-4)}`,
      documentId: doc.documentId,
      documentTitle: doc.title,
      originalFilename: doc.originalFilename,
      requestedByAdvisorName: user?.fullName || "Cố vấn",
      requestedByAdvisorEmail: user?.email,
      requestType: type,
      status: "PENDING",
      proposedTitle: type === "DELETE" ? null : cleanTitle,
      proposedDescription:
        type === "DELETE" ? null : formDescription.trim() || null,
      proposedAllowDownload: type === "DELETE" ? null : formAllowDownload,
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);
    setRequestTarget(null);
    setBannerMessage(`Đã gửi yêu cầu ${type} thành công.`);
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
              Quản lý tài liệu hướng dẫn và đề xuất bổ sung vào kho dữ liệu tư vấn.
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
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span>Đang tải danh sách tài liệu...</span>
                          </div>
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
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                  <Clock className="h-3 w-3" />
                                  Chờ duyệt
                                </span>
                              ) : doc.lifecycleStatus === "DRAFT" ? (
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditDraftModal(doc)}
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Edit className="h-3 w-3 text-slate-500" />
                                    <span>Sửa</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openCreateRequestModal(doc, "ADD")
                                    }
                                    className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                                  >
                                    <Send className="h-3 w-3" />
                                    <span>Gửi duyệt</span>
                                  </button>
                                </div>
                              ) : doc.lifecycleStatus === "ACTIVE" ? (
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openCreateRequestModal(doc, "UPDATE")
                                    }
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    <Edit className="h-3 w-3 text-slate-500" />
                                    <span>Yêu cầu sửa</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openCreateRequestModal(doc, "DELETE")
                                    }
                                    className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
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
                    <th className="px-4 py-3">Tài liệu áp dụng</th>
                    <th className="px-4 py-3 whitespace-nowrap">Trạng thái</th>
                    <th className="px-4 py-3 whitespace-nowrap">Ngày gửi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Chưa có yêu cầu nào được gửi.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr
                        key={req.requestId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {req.requestId}
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
                          <p className="font-mono text-[11px] text-slate-500">
                            {req.originalFilename}
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
                                <p className="mt-0.5 text-[11px] text-red-600">
                                  {req.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString("vi-VN")}
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

      {/* Modal Sửa nháp */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Chỉnh sửa tài liệu nháp
              </h3>
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDraftMetadata} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tiêu đề tài liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="draftAllowDownload"
                  checked={formAllowDownload}
                  onChange={(e) => setFormAllowDownload(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <label
                  htmlFor="draftAllowDownload"
                  className="text-xs text-slate-700 cursor-pointer select-none"
                >
                  Cho phép sinh viên tải tệp gốc về máy
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDraft(null)}
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

      {/* Modal Gửi yêu cầu */}
      {requestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {requestTarget.type === "ADD"
                  ? "Gửi yêu cầu thêm tài liệu"
                  : requestTarget.type === "UPDATE"
                    ? "Gửi yêu cầu cập nhật"
                    : "Xác nhận ngừng sử dụng"}
              </h3>
              <button
                type="button"
                onClick={() => setRequestTarget(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitChangeRequest} className="mt-4 space-y-4">
              {modalError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  {modalError}
                </div>
              )}

              {requestTarget.type === "DELETE" ? (
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn có chắc muốn gửi yêu cầu ngừng sử dụng tài liệu{" "}
                  <strong className="text-slate-900">
                    &quot;{requestTarget.doc.title}&quot;
                  </strong>
                  ? Sau khi Quản trị viên duyệt, tài liệu sẽ được lưu trữ và không còn xuất hiện trong hệ thống tư vấn.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tiêu đề tài liệu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mô tả nội dung
                    </label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="reqAllowDownload"
                      checked={formAllowDownload}
                      onChange={(e) => setFormAllowDownload(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <label
                      htmlFor="reqAllowDownload"
                      className="text-xs text-slate-700 cursor-pointer select-none"
                    >
                      Cho phép sinh viên tải tệp gốc về máy
                    </label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setRequestTarget(null)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  {requestTarget.type === "DELETE" ? "Xác nhận gửi" : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
