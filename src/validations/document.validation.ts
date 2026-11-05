export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; 
export const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".docx"] as const;
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function validateDocumentUploadForm(
  file: File | null,
  title: string
): string | null {
  if (!file) {
    return "Vui lòng chọn tệp tài liệu (.pdf hoặc .docx) để tải lên.";
  }

  if (file.size <= 0) {
    return "Tệp tài liệu không được rỗng.";
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "Kích thước tệp tài liệu không được vượt quá 20 MB (QĐ09).";
  }

  const fileName = file.name.trim();
  if (!fileName || fileName.length > 255) {
    return "Tên tệp gốc không hợp lệ hoặc vượt quá 255 ký tự.";
  }

  const lowerName = fileName.toLowerCase();
  const hasValidExt = ALLOWED_DOCUMENT_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  if (!hasValidExt) {
    return "Hệ thống chỉ chấp nhận định dạng tệp PDF (.pdf) hoặc Word (.docx) theo QĐ09.";
  }

  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return "Vui lòng nhập tiêu đề chính thức của tài liệu.";
  }

  if (cleanTitle.length > 255) {
    return "Tiêu đề tài liệu không được vượt quá 255 ký tự.";
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}
