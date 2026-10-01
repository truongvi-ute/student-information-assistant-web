/**
 * Successful API response
 *
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "id": 1,
 *     "email": "student@hcmute.edu.vn"
 *   }
 * }
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/**
 * Error information returned by backend.
 */
export interface ApiErrorDetail {
  code: string;
  details?: unknown;
}

/**
 * Failed API response
 *
 * {
 *   "success": false,
 *   "message": "Invalid credentials",
 *   "data": null,
 *   "error": {
 *     "code": "INVALID_CREDENTIALS"
 *   }
 * }
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  error?: ApiErrorDetail;
}

/**
 * Standard API response envelope.
 */
export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;