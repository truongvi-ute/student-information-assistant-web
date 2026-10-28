import { apiClient } from "@/lib/api/api-client";
import { authStorage } from "@/utils/auth-storage";

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  OtpResendCooldownResponse,
  VerifyRegistrationRequest,
  UserProfile,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyForgotPasswordOtpRequest,
  ForgotPasswordOtpVerificationResponse,
  ResetPasswordRequest,
  MessageResponse,
} from "@/types/auth";

export const authService = {
  /**
   * Đăng nhập người dùng
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      {
        email: data.email.trim(),
        password: data.password,
      }
    );

    const token = response.accessToken || response.token;

    if (token) {
      authStorage.clearAuth();
      authStorage.setToken(token);

      if (response.refreshToken) {
        authStorage.setRefreshToken(response.refreshToken);
      }

      if (response.user) {
        authStorage.setUser(response.user);
      } else {
        try {
          await this.getProfile();
        } catch {
          authStorage.setUser({
            id: authStorage.getAccountId() || "",
            email: data.email.trim(),
            fullName: data.email.trim().split("@")[0] || "",
          });
        }
      }
    }

    if (data.rememberMe) {
      authStorage.setRememberedEmail(data.email);
    } else {
      authStorage.clearRememberedEmail();
    }

    return response;
  },


  /**
   * Bắt đầu đăng ký và gửi OTP
   */
  async register(
    data: RegisterRequest
  ): Promise<OtpResendCooldownResponse> {
    return apiClient.post<OtpResendCooldownResponse>(
      "/auth/register",
      data
    );
  },

  /**
   * Xác thực OTP đăng ký
   */
  async verifyRegistration(
    data: VerifyRegistrationRequest
  ): Promise<void> {
    await apiClient.post<void>(
      "/auth/register/verify",
      {
        email: data.email.trim().toLowerCase(),
        otp: data.otp.trim(),
      }
    );
  },

  /**
   * Gửi lại mã OTP đăng ký
   */
  async resendRegistrationOtp(
    email: string
  ): Promise<OtpResendCooldownResponse> {
    return apiClient.post<OtpResendCooldownResponse>(
      "/auth/register/resend-otp",
      {
        email: email.trim().toLowerCase(),
      }
    );
  },

  /**
   * Đăng xuất phía frontend
   */
  async logout(): Promise<void> {
    authStorage.clearAuth();
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<{
      accountId: string;
      fullName: string;
      email: string;
      role?: string;
    }>("/users/me");

    const profile: UserProfile = {
      id: response.accountId,
      email: response.email,
      fullName: response.fullName,
      role: response.role,
    };

    authStorage.setUser(profile);

    return profile;
  },

  /**
   * Bước 1: Gửi yêu cầu OTP quên mật khẩu về email sinh viên
   */
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      {
        email: data.email.trim().toLowerCase(),
      }
    );
  },

  /**
   * Bước 2: Xác thực mã OTP 6 số để nhận resetToken
   */
  async verifyForgotPasswordOtp(
    data: VerifyForgotPasswordOtpRequest
  ): Promise<ForgotPasswordOtpVerificationResponse> {
    return apiClient.post<ForgotPasswordOtpVerificationResponse>(
      "/auth/forgot-password/verify",
      {
        email: data.email.trim().toLowerCase(),
        otp: data.otp.trim(),
      }
    );
  },

  /**
   * Bước 3: Đặt lại mật khẩu mới cùng với resetToken
   */
  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(
      "/auth/reset-password",
      {
        resetToken: data.resetToken.trim(),
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }
    );
  },

};