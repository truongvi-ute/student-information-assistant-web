import { apiClient } from "@/lib/api/api-client";
import { authStorage } from "@/utils/auth-storage";

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  OtpResendCooldownResponse,
  VerifyRegistrationRequest,
  UserProfile,
} from "@/types/auth.types";

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
      authStorage.setToken(token);
    }

    if (response.refreshToken) {
      authStorage.setRefreshToken(response.refreshToken);
    }

    if (response.user) {
      authStorage.setUser(response.user);
    } else if (response.id && response.email) {
      authStorage.setUser({
        id: response.id,
        email: response.email,
        fullName: response.fullName || "",
      });
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

  /**
   * Lấy profile
   *
   * Chỉ sử dụng khi backend đã có GET /api/auth/me
   */
  async getProfile(): Promise<UserProfile> {
    const response =
      await apiClient.get<UserProfile>("/auth/me");

    authStorage.setUser(response);

    return response;
  },
};