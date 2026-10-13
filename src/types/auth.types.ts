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