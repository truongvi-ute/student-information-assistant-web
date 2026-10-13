import { ROUTES } from "./paths";
import {
  AUTH_ONLY_PATHS,
  PROTECTED_PATHS,
  PUBLIC_PATHS,
  ROUTE_CONFIGS,
} from "./config";
import type { RouteConfig } from "./types";

/**
 * Chuẩn hóa URL bằng cách loại bỏ query parameters, hash và dấu gạch chéo cuối cùng.
 */
export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) {
    return clean.slice(0, -1);
  }
  return clean || "/";
}

/**
 * Kiểm tra xem một đường dẫn có khớp với đường dẫn mục tiêu hay không (khớp chính xác hoặc tiền tố).
 */
export function matchPath(pathname: string, targetPath: string): boolean {
  const normalized = normalizePathname(pathname);
  const target = normalizePathname(targetPath);

  if (target === "/") {
    return normalized === "/";
  }
  return normalized === target || normalized.startsWith(`${target}/`);
}

/**
 * Kiểm tra xem tuyến đường có phải là trang công khai hay không (ai cũng có thể truy cập).
 */
export function isPublicRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return PUBLIC_PATHS.some((path) => matchPath(normalized, path));
}

/**
 * Kiểm tra xem tuyến đường có phải chỉ dành riêng cho khách chưa đăng nhập (Login, Register, OTP).
 * Người dùng đã đăng nhập không nên truy cập các trang này.
 */
export function isAuthOnlyRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return AUTH_ONLY_PATHS.some((path) => matchPath(normalized, path));
}

/**
 * Kiểm tra xem tuyến đường có bắt buộc phải đăng nhập hay không (Protected route).
 */
export function isProtectedRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return PROTECTED_PATHS.some((path) => matchPath(normalized, path));
}

/**
 * Tra cứu thông tin cấu hình RouteConfig tương ứng với đường dẫn.
 */
export function getRouteConfig(pathname: string): RouteConfig | undefined {
  const normalized = normalizePathname(pathname);
  // Khớp chính xác trước
  if (ROUTE_CONFIGS[normalized]) {
    return ROUTE_CONFIGS[normalized];
  }
  // Tìm kiếm theo tiền tố
  const foundKey = Object.keys(ROUTE_CONFIGS).find((key) =>
    matchPath(normalized, key)
  );
  return foundKey ? ROUTE_CONFIGS[foundKey] : undefined;
}

/**
 * Xác định xem có cần chuyển hướng hay không dựa vào trạng thái xác thực của người dùng.
 *
 * @param pathname Đường dẫn hiện tại đang yêu cầu truy cập
 * @param isAuthenticated Trạng thái đăng nhập của người dùng
 * @returns Đường dẫn mục tiêu cần chuyển hướng đến, hoặc null nếu được phép truy cập
 */
export function determineRedirect(
  pathname: string,
  isAuthenticated: boolean
): string | null {
  const normalized = normalizePathname(pathname);

  // 1. Nếu người dùng đã đăng nhập mà cố vào trang chỉ dành cho khách (Login / Register / OTP)
  // Chuyển hướng về trang chủ sinh viên (Portal Dashboard)
  if (isAuthenticated && isAuthOnlyRoute(normalized)) {
    return ROUTES.PORTAL.DASHBOARD;
  }

  // 2. Nếu người dùng chưa đăng nhập mà cố vào trang yêu cầu quyền (Protected route)
  // Chuyển hướng về trang Đăng nhập kèm tham số ?redirect= để quay lại sau
  if (!isAuthenticated && isProtectedRoute(normalized)) {
    const encodedTarget = encodeURIComponent(pathname);
    return `${ROUTES.AUTH.LOGIN}?redirect=${encodedTarget}`;
  }

  // 3. Các trường hợp còn lại: Cho phép truy cập bình thường
  return null;
}
