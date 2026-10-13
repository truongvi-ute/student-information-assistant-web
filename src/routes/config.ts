import { ROUTES } from "./paths";
import type { RouteConfig } from "./types";

/**
 * Cấu hình thông tin Metadata chi tiết cho toàn bộ các tuyến đường trong hệ thống
 */
export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  [ROUTES.PUBLIC.HOME]: {
    path: ROUTES.PUBLIC.HOME,
    title: "HCMUTE Student Assistant — Trợ lý thông tin sinh viên",
    access: "public",
    layout: "main",
    description: "Nền tảng hỗ trợ tra cứu thông tin và giải đáp thắc mắc cho sinh viên HCMUTE.",
  },
  [ROUTES.AUTH.LOGIN]: {
    path: ROUTES.AUTH.LOGIN,
    title: "Đăng nhập — HCMUTE Student Assistant",
    access: "auth-only",
    layout: "auth",
    description: "Đăng nhập vào tài khoản sinh viên HCMUTE Student Assistant.",
  },
  [ROUTES.AUTH.REGISTER]: {
    path: ROUTES.AUTH.REGISTER,
    title: "Tạo tài khoản — HCMUTE Student Assistant",
    access: "auth-only",
    layout: "auth",
    description: "Đăng ký tài khoản sinh viên HCMUTE Student Assistant mới.",
  },
  [ROUTES.AUTH.VERIFY_OTP]: {
    path: ROUTES.AUTH.VERIFY_OTP,
    title: "Xác thực mã OTP — HCMUTE Student Assistant",
    access: "auth-only",
    layout: "auth",
    description: "Nhập mã xác thực 6 chữ số để kích hoạt tài khoản.",
  },
  [ROUTES.AUTH.VERIFY_REGISTRATION]: {
    path: ROUTES.AUTH.VERIFY_REGISTRATION,
    title: "Xác thực mã OTP — HCMUTE Student Assistant",
    access: "auth-only",
    layout: "auth",
    description: "Nhập mã xác thực 6 chữ số để kích hoạt tài khoản.",
  },
  [ROUTES.PUBLIC.TERMS]: {
    path: ROUTES.PUBLIC.TERMS,
    title: "Điều khoản sử dụng — HCMUTE Student Assistant",
    access: "public",
    layout: "main",
    description: "Các điều khoản và quy định khi sử dụng hệ thống.",
  },
  [ROUTES.PUBLIC.PRIVACY]: {
    path: ROUTES.PUBLIC.PRIVACY,
    title: "Chính sách bảo mật — HCMUTE Student Assistant",
    access: "public",
    layout: "main",
    description: "Cam kết bảo mật dữ liệu và quyền riêng tư của người dùng.",
  },
  [ROUTES.PORTAL.DASHBOARD]: {
    path: ROUTES.PORTAL.DASHBOARD,
    title: "Trang chủ sinh viên — HCMUTE Student Assistant",
    access: "protected",
    layout: "dashboard",
    description: "Bảng tổng quan thông tin học tập, thông báo và lịch trình cá nhân.",
  },
  [ROUTES.PORTAL.CHAT]: {
    path: ROUTES.PORTAL.CHAT,
    title: "Trợ lý AI hỏi đáp — HCMUTE Student Assistant",
    access: "protected",
    layout: "dashboard",
    description: "Trò chuyện trực tiếp cùng trợ lý AI giải đáp thắc mắc đào tạo.",
  },
  [ROUTES.PORTAL.SCHEDULE]: {
    path: ROUTES.PORTAL.SCHEDULE,
    title: "Thời khóa biểu & Lịch thi — HCMUTE Student Assistant",
    access: "protected",
    layout: "dashboard",
    description: "Tra cứu lịch học, lịch thi và các mốc thời gian quan trọng.",
  },
  [ROUTES.PORTAL.PROFILE]: {
    path: ROUTES.PORTAL.PROFILE,
    title: "Hồ sơ sinh viên — HCMUTE Student Assistant",
    access: "protected",
    layout: "dashboard",
    description: "Thông tin cá nhân, chuyên ngành, hệ đào tạo và niên khóa.",
  },
};

/**
 * Danh sách các tuyến đường chỉ dành riêng cho khách chưa đăng nhập.
 * Nếu người dùng đã đăng nhập truy cập vào các trang này, hệ thống sẽ tự động chuyển hướng về DASHBOARD.
 */
export const AUTH_ONLY_PATHS: readonly string[] = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.VERIFY_OTP,
  ROUTES.AUTH.VERIFY_REGISTRATION,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
];

/**
 * Danh sách các tuyến đường bắt buộc phải có phiên đăng nhập hợp lệ.
 * Nếu khách chưa đăng nhập truy cập, hệ thống sẽ chuyển hướng về trang LOGIN kèm tham số chuyển tiếp.
 */
export const PROTECTED_PATHS: readonly string[] = [
  ROUTES.PORTAL.DASHBOARD,
  ROUTES.PORTAL.CHAT,
  ROUTES.PORTAL.TRAINING,
  ROUTES.PORTAL.SCHEDULE,
  ROUTES.PORTAL.PROFILE,
  ROUTES.PORTAL.NOTIFICATIONS,
];

/**
 * Danh sách các tuyến đường công khai cho tất cả mọi người.
 */
export const PUBLIC_PATHS: readonly string[] = [
  ROUTES.PUBLIC.HOME,
  ROUTES.PUBLIC.TERMS,
  ROUTES.PUBLIC.PRIVACY,
];
