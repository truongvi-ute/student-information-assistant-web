import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/lib/api/api-types";

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
          ? JSON.stringify(options.body)
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

  let body: any;
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

  if (!response.ok || body.success === false) {
    const errorResponse = body as ApiErrorResponse;

    throw new ApiClientError(
      response.status,
      errorResponse?.message || `Lỗi máy chủ (${response.status})`,
      errorResponse?.error,
    );
  }

  return body as T;
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