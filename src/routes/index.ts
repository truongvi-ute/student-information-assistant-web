/**
 * Module Tuyến Đường Ứng Dụng (Application Routes)
 * 
 * Cung cấp hằng số định tuyến tập trung, các hàm sinh URL an toàn,
 * cấu hình metadata, hàm kiểm tra quyền truy cập và component RouteGuard.
 * 
 * @example
 * ```ts
 * import { ROUTES, buildVerifyOtpUrl, isProtectedRoute } from "@/routes";
 * 
 * // Sử dụng hằng số URL
 * const loginPath = ROUTES.AUTH.LOGIN;
 * 
 * // Sinh URL động an toàn kèm tham số
 * const otpUrl = buildVerifyOtpUrl({ email: "student@hcmute.edu.vn" });
 * ```
 */

export * from "./paths";
export * from "./types";
export * from "./config";
export * from "./guards";
export * from "./RouteGuard";
