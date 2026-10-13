/**
 * Cấp độ quyền truy cập tuyến đường:
 * - 'public': Bất kỳ ai cũng có thể truy cập (Trang chủ, Điều khoản, Chính sách bảo mật...).
 * - 'auth-only': Chỉ dành cho khách / người dùng chưa đăng nhập (Đăng nhập, Đăng ký, Xác thực OTP).
 *                Nếu người đã đăng nhập truy cập, hệ thống sẽ tự chuyển hướng về Dashboard.
 * - 'protected': Bắt buộc phải đăng nhập (Dashboard, Chat AI, Hồ sơ, Tra cứu...).
 *                Nếu chưa đăng nhập, hệ thống sẽ chuyển hướng về trang Đăng nhập kèm tham số ?redirect=.
 * - 'admin': Yêu cầu quyền quản trị viên hệ thống.
 */
export type RouteAccessType = "public" | "auth-only" | "protected" | "admin";

export type LayoutType = "auth" | "main" | "dashboard" | "none";

/**
 * Cấu hình thông tin metadata chi tiết cho từng tuyến đường
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
 * Tùy chọn tham số khi sinh URL các trang điều hướng
 */
export interface VerifyOtpUrlOptions {
  email?: string;
  step?: "otp";
}

export interface RegisterUrlOptions {
  email?: string;
  step?: "register" | "otp";
}

export interface LoginUrlOptions {
  redirect?: string;
  email?: string;
}
