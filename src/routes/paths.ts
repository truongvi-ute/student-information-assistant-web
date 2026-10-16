
import type {
  VerifyOtpUrlOptions,
  RegisterUrlOptions,
  LoginUrlOptions,
} from "./types";

/**
 * Quản lý tập trung các đường dẫn trong ứng dụng.
 */
export const ROUTES = {
  // Các trang xác thực
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
    VERIFY_REGISTRATION: "/verify-registration",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },

  // Các trang công khai và liên kết đến mục trên trang chủ
  PUBLIC: {
    HOME: "/",
    TERMS: "/terms",
    PRIVACY: "/privacy",
    ABOUT: "#gioi-thieu",
    FEATURES: "#tinh-nang",
    SUPPORT: "#ho-tro",
  },

  // Các trang dành cho người dùng đã đăng nhập
  PORTAL: {
    DASHBOARD: "/dashboard",
    CHAT: "/chat",
    TRAINING: "/training",
    SCHEDULE: "/schedule",
    PROFILE: "/profile",
    NOTIFICATIONS: "/notifications",
  },
} as const;

/**
 * Tạo URL kèm các query parameters.
 * Bỏ qua những tham số không có giá trị.
 */
function buildUrl(
  path: string,
  params: Record<string, string | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
}

/**
 * Tạo URL đến trang xác thực OTP.
 */
export function buildVerifyOtpUrl(
  options?: VerifyOtpUrlOptions
): string {
  return buildUrl(ROUTES.AUTH.VERIFY_OTP, {
    email: options?.email,
  });
}

/**
 * Tạo URL đăng ký kèm bước đăng ký hoặc email.
 */
export function buildRegisterUrl(
  options?: RegisterUrlOptions
): string {
  return buildUrl(ROUTES.AUTH.REGISTER, {
    step: options?.step,
    email: options?.email,
  });
}

/**
 * Tạo URL đăng nhập kèm trang chuyển tiếp hoặc email.
 */
export function buildLoginUrl(
  options?: LoginUrlOptions
): string {
  return buildUrl(ROUTES.AUTH.LOGIN, {
    redirect: options?.redirect,
    email: options?.email,
  });
}
