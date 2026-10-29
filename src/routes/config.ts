import { ROUTES } from "./paths";
import type { RouteConfig, RouteAccessType } from "./types";

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
  [ROUTES.PUBLIC.CHATBOT]: {
    path: ROUTES.PUBLIC.CHATBOT,
    title: "Hội thoại AI",
    access: "public",
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
  [ROUTES.AUTH.FORGOT_PASSWORD]: {
    path: ROUTES.AUTH.FORGOT_PASSWORD,
    title: "Khôi phục mật khẩu — HCMUTE Student Assistant",
    access: "auth-only",
    layout: "auth",
    description: "Khôi phục mật khẩu tài khoản sinh viên HCMUTE qua mã xác thực OTP.",
  },
  [ROUTES.AUTH.RESET_PASSWORD]: {
    path: ROUTES.AUTH.RESET_PASSWORD,
    title: "Đặt lại mật khẩu — HCMUTE Student Assistant",
    access: "auth-only",
    layout: "auth",
    description: "Thiết lập mật khẩu mới cho tài khoản.",
  },

  [ROUTES.PORTAL.TRAINING]: {
    path: ROUTES.PORTAL.TRAINING,
    title: "Thông tin đào tạo — HCMUTE Student Assistant",
    access: "protected",
    layout: "dashboard",
    description: "Tra cứu thông tin đào tạo của sinh viên.",
  },

  [ROUTES.PORTAL.NOTIFICATIONS]: {
    path: ROUTES.PORTAL.NOTIFICATIONS,
    title: "Thông báo — HCMUTE Student Assistant",
    access: "protected",
    layout: "dashboard",
    description: "Xem thông báo dành cho sinh viên.",
  },
};


/**
 * Lấy danh sách đường dẫn theo quyền truy cập.
 */
function getPathsByAccess(access: RouteAccessType): readonly string[] {
  return Object.values(ROUTE_CONFIGS)
    .filter((config) => config.access === access)
    .map((config) => config.path);
}

/**
 * Các trang dành cho người chưa đăng nhập.
 */
export const AUTH_ONLY_PATHS = getPathsByAccess("auth-only");

/**
 * Các trang yêu cầu đăng nhập.
 */
export const PROTECTED_PATHS = getPathsByAccess("protected");

/**
 * Các trang công khai.
 */
export const PUBLIC_PATHS = getPathsByAccess("public");
