import type {
  VerifyOtpUrlOptions,
  RegisterUrlOptions,
  LoginUrlOptions,
} from "./types";

/**
 * Định nghĩa hằng số các đường dẫn (Routes) cố định cho toàn bộ ứng dụng.
 * Là nguồn chân lý duy nhất (Single Source of Truth) quản lý tập trung mọi URL.
 */
export const ROUTES = {
  // Tuyến đường xác thực người dùng (Auth)
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
    VERIFY_REGISTRATION: "/verify-registration",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },

  // Trang công khai / Landing pages
  PUBLIC: {
    HOME: "/",
    TERMS: "/terms",
    PRIVACY: "/privacy",
    ABOUT: "#gioi-thieu",
    FEATURES: "#tinh-nang",
    SUPPORT: "#ho-tro",
  },

  // Cổng thông tin sinh viên sau khi đăng nhập (Portal / App)
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
 * Các hàm helper tạo URL an toàn kèm mã hóa tham số truy vấn (Query Parameters)
 */

/**
 * Tạo URL cho trang xác thực mã OTP
 * @example buildVerifyOtpUrl({ email: "student@hcmute.edu.vn" }) => "/verify-otp?email=student%40hcmute.edu.vn"
 */
export function buildVerifyOtpUrl(options?: VerifyOtpUrlOptions): string {
  const base = ROUTES.AUTH.VERIFY_OTP;
  if (!options?.email) {
    return base;
  }
  const params = new URLSearchParams();
  params.set("email", options.email);
  return `${base}?${params.toString()}`;
}

/**
 * Tạo URL cho trang đăng ký kèm tham số bước (step) hoặc email
 * @example buildRegisterUrl({ step: "otp", email: "student@hcmute.edu.vn" }) => "/register?step=otp&email=student%40hcmute.edu.vn"
 */
export function buildRegisterUrl(options?: RegisterUrlOptions): string {
  const base = ROUTES.AUTH.REGISTER;
  if (!options) return base;

  const params = new URLSearchParams();
  if (options.step) {
    params.set("step", options.step);
  }
  if (options.email) {
    params.set("email", options.email);
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Tạo URL cho trang đăng nhập kèm trang cần quay lại sau khi đăng nhập (?redirect=...)
 * @example buildLoginUrl({ redirect: "/dashboard" }) => "/login?redirect=%2Fdashboard"
 */
export function buildLoginUrl(options?: LoginUrlOptions): string {
  const base = ROUTES.AUTH.LOGIN;
  if (!options) return base;

  const params = new URLSearchParams();
  if (options.redirect) {
    params.set("redirect", options.redirect);
  }
  if (options.email) {
    params.set("email", options.email);
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
