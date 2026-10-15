/**
 * Authentication Data Types & API Contracts for HCMUTE Student Assistant.
 */

export interface UserProfile {
  id: number | string;
  email: string;
  fullName: string;
  role?: string;
  academicContext?: string | null;
  avatarUrl?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: UserProfile;
  id?: number | string;
  email?: string;
  fullName?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;

  majorId: string | null;
  educationSystemId: string | null;
  cohortId: string | null;

  academicContext?: string | null;
}

export interface OtpResendCooldownResponse {
  message: string;
  resendAvailableInSeconds: number;
}

export interface VerifyRegistrationRequest {
  email: string;
  otp: string;
}

export interface VerifyRegistrationResponse {
  message: string;
  accessToken?: string;
  token?: string;
  user?: UserProfile;
}

export interface ResendOtpRequest {
  email: string;
}

export interface OtpVerificationLockResponse {
  message: string;
  lockRemainingSeconds: number;
}

/**
 * Trạng thái các bước trong quy trình Quên / Đặt lại mật khẩu
 */
export type ForgotPasswordStep = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

/**
 * Payload yêu cầu gửi mã OTP quên mật khẩu (Bước 1)
 * POST /api/auth/forgot-password
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Phản hồi sau khi yêu cầu gửi OTP thành công (Bước 1)
 */
export interface ForgotPasswordResponse {
  message: string;
  resendAvailableInSeconds: number;
}

/**
 * Payload xác thực OTP quên mật khẩu (Bước 2)
 * POST /api/auth/forgot-password/verify
 */
export interface VerifyForgotPasswordOtpRequest {
  email: string;
  otp: string;
}

/**
 * Phản hồi sau khi xác thực OTP thành công (Bước 2)
 * Trả về resetToken để làm vé thông hành cho Bước 3
 */
export interface ForgotPasswordOtpVerificationResponse {
  message: string;
  resetToken: string;
}

/**
 * Payload đặt lại mật khẩu mới (Bước 3)
 * POST /api/auth/reset-password
 */
export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Phản hồi thông báo chung từ backend
 */
export interface MessageResponse {
  message: string;
}
