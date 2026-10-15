import type { ApiError } from "@/types/api";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly error?: ApiError,
    public readonly timestamp?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}