import type { ApiErrorDetail } from "./api-types";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly error?: ApiErrorDetail,
    public readonly timestamp?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}