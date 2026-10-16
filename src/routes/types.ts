
/**
 * Các loại quyền truy cập trang.
 */
export type RouteAccessType =
  | "public"
  | "auth-only"
  | "protected"
  | "admin";

/**
 * Các loại layout sử dụng trong ứng dụng.
 */
export type LayoutType =
  | "auth"
  | "main"
  | "dashboard"
  | "none";

/**
 * Thông tin cấu hình của một trang.
 */
export interface RouteConfig {
  path: string;
  title: string;
  access: RouteAccessType;
  description?: string;
  layout?: LayoutType;
  breadcrumb?: string;
  icon?: string;
}

/**
 * Tham số URL xác thực OTP.
 */
export interface VerifyOtpUrlOptions {
  email?: string;
  step?: "otp";
}

/**
 * Tham số URL đăng ký tài khoản.
 */
export interface RegisterUrlOptions {
  email?: string;
  step?: "register" | "otp";
}

/**
 * Tham số URL đăng nhập.
 */
export interface LoginUrlOptions {
  redirect?: string;
  email?: string;
}
