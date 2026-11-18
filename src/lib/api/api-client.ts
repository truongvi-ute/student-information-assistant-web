import type { ApiErrorResponse } from "@/types/api";

import { ApiClientError } from "@/lib/api/api-error";
import { authStorage } from "@/utils/auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = authStorage.getToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      body:
        options.body !== undefined
          ? isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body)
          : undefined,
      credentials: "include",
    });
  } catch (netErr: unknown) {
    const errorDetails = netErr instanceof Error ? netErr.message : String(netErr);
    throw new ApiClientError(
      0,
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ backend (http://localhost:8080).",
      { code: "NETWORK_ERROR", details: errorDetails }
    );
  }

  let body: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch {
      throw new ApiClientError(
        response.status,
        `Phản hồi từ máy chủ không hợp lệ (${response.status})`,
        { code: "INVALID_JSON_RESPONSE" }
      );
    }
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new ApiClientError(
        response.status,
        text || `Yêu cầu thất bại với mã lỗi ${response.status}`,
        { code: "HTTP_ERROR" }
      );
    }
    return text as unknown as T;
  }

  const isFailedResponse =
    !response.ok ||
    (typeof body === "object" &&
      body !== null &&
      "success" in body &&
      (body as { success?: boolean }).success === false);

  if (isFailedResponse) {
    const errorResponse = body as ApiErrorResponse | undefined;

    throw new ApiClientError(
      response.status,
      errorResponse?.message || `Lỗi máy chủ (${response.status})`,
      errorResponse?.error,
    );
  }

  return body as T;

}

export interface BlobDownloadResult {
  blob: Blob;
  filename: string | null;
  allowDownload?: boolean;
}

function extractFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;

  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "");
    }
  }

  const asciiMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  if (asciiMatch?.[1]) {
    return asciiMatch[1].trim();
  }

  return null;
}

async function requestBlob(
  endpoint: string,
  options: Omit<RequestInit, "body" | "method"> = {},
): Promise<BlobDownloadResult> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "GET",
      headers,
      credentials: "include",
    });
  } catch (netErr: unknown) {
    const errorDetails = netErr instanceof Error ? netErr.message : String(netErr);
    throw new ApiClientError(
      0,
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ backend (http://localhost:8080).",
      { code: "NETWORK_ERROR", details: errorDetails }
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const errBody = (await response.json()) as ApiErrorResponse;
        throw new ApiClientError(
          response.status,
          errBody?.message || `Lỗi máy chủ (${response.status})`,
          errBody?.error
        );
      } catch (err) {
        if (err instanceof ApiClientError) throw err;
      }
    }
    const text = await response.text().catch(() => "");
    throw new ApiClientError(
      response.status,
      text || `Tải tài liệu thất bại với mã lỗi ${response.status}`,
      { code: "HTTP_ERROR" }
    );
  }

  const blob = await response.blob();
  const filename = extractFilenameFromContentDisposition(
    response.headers.get("content-disposition")
  );
  const allowDownloadHeader = response.headers.get("x-allow-download");
  const allowDownload =
    allowDownloadHeader === null
      ? undefined
      : allowDownloadHeader.toLowerCase() === "true";
  return { blob, filename, allowDownload };
}

export const apiClient = {
  // Get
  get<T>(
    endpoint: string,
    options?: RequestOptions,
  ) {
    return request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  },

  getBlob(
    endpoint: string,
    options?: Omit<RequestInit, "body" | "method">,
  ) {
    return requestBlob(endpoint, options);
  },

  // Post
  post<T>(
    endpoint: string,
    body?: unknown,
  ) {
    return request<T>(endpoint, {
      method: "POST",
      body,
    });
  },

  // Put
  put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      body,
    });
  },

  // Patch
  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ) {
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  // Delete
  delete<T>(
    endpoint: string,
    options?: RequestOptions,
  ) {
    return request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  },
};