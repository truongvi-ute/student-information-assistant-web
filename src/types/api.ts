/**Api Success Reponse **
 * {
        "success": true,
        "message": "Login successful",
        "data": {
            "id": 1,
            "email": "student@hcmute.edu.vn"
        }
    }
*/
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/**Standard API error response **
 * 
 * {
    "success": false,
    "message": "Invalid credentials",
    "data": null,
    "error": {
    "code": "INVALID_CREDENTIALS"
    }
 * 
*/
export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  details?: unknown;
}

export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;