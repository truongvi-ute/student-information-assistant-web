import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { ApiClientError } from "@/lib/api/api-error";
import { documentService } from "@/services/document.service";
import type { DocumentUploadResponse } from "@/types/document";
import {
  formatFileSize,
  validateDocumentUploadForm,
} from "@/validations/document.validation";

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: (uploaded: DocumentUploadResponse) => void;
  role: "ADVISOR" | "ADMIN";
}

export function DocumentUploadModal({
  open,
  onClose,
  onUploadSuccess,
  role,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) return null;

  const resetForm = () => {
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setAllowDownload(true);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

    if (file && !title.trim()) {
      const suggested = file.name.replace(/\.(pdf|docx)$/i, "");
      setTitle(suggested);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    const validationError = validateDocumentUploadForm(selectedFile, title);
    if (validationError || !selectedFile) {
      setErrorMessage(validationError || "Vui lòng kiểm tra lại thông tin.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await documentService.uploadDocument({
        file: selectedFile,
        title: title.trim(),
        description: description.trim() || undefined,
        allowDownload,
      });

      resetForm();
      onUploadSuccess(response);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 403) {
          setErrorMessage("Tài khoản chưa được cấp quyền tải lên tài liệu.");
        } else {
          setErrorMessage(err.message);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể tải lên tài liệu. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-semibold text-slate-900">
            Tải lên tài liệu
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMessage && (
            <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Chọn tệp */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tệp tài liệu <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/30"
              >
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-700">
                  Chọn tệp từ máy tính
                </span>
                <span className="text-[11px] text-slate-400">
                  Hỗ trợ PDF, DOCX (tối đa 20MB)
                </span>
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="shrink-0 text-xs text-red-600 hover:text-red-700 px-2 py-1"
                >
                  Đổi tệp
                </button>
              </div>
            )}
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tiêu đề tài liệu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề tài liệu"
              className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mô tả tóm tắt
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung chính hoặc ghi chú..."
              className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Tùy chọn quyền tải */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="allowDownloadCheck"
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <label
              htmlFor="allowDownloadCheck"
              className="text-xs text-slate-700 cursor-pointer select-none"
            >
              Cho phép sinh viên tải tệp gốc về máy
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? "Đang xử lý..." : "Tải lên"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
