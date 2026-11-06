import { ROUTES, buildLoginUrl } from "./paths";
import { ROUTE_CONFIGS } from "./config";
import type { RouteAccessType, RouteConfig } from "./types";

/**
 * Chuẩn hóa đường dẫn, loại bỏ query, hash và dấu / cuối.
 */
export function normalizePathname(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] || "/";

  if (path === "/") {
    return path;
  }

  return path.replace(/\/+$/, "");
}

/**
 * Kiểm tra đường dẫn có khớp với route hoặc route con không.
 */
export function matchPath(
  pathname: string,
  targetPath: string
): boolean {
  const path = normalizePathname(pathname);
  const target = normalizePathname(targetPath);

  if (target === "/") {
    return path === "/";
  }

  return path === target || path.startsWith(`${target}/`);
}

/**
 * Lấy cấu hình tương ứng với đường dẫn.
 */
export function getRouteConfig(
  pathname: string
): RouteConfig | undefined {
  const path = normalizePathname(pathname);

  // Ưu tiên khớp chính xác.
  if (ROUTE_CONFIGS[path]) {
    return ROUTE_CONFIGS[path];
  }

  // Nếu là route con, chọn route cha cụ thể nhất.
  const matchedPath = Object.keys(ROUTE_CONFIGS)
    .filter((route) => matchPath(path, route))
    .sort((a, b) => b.length - a.length)[0];

  return matchedPath
    ? ROUTE_CONFIGS[matchedPath]
    : undefined;
}

/**
 * Kiểm tra quyền truy cập của một route.
 */
function hasRouteAccess(
  pathname: string,
  access: RouteAccessType
): boolean {
  return getRouteConfig(pathname)?.access === access;
}

/**
 * Kiểm tra route công khai.
 */
export function isPublicRoute(pathname: string): boolean {
  return hasRouteAccess(pathname, "public");
}

/**
 * Kiểm tra route dành cho người chưa đăng nhập.
 */
export function isAuthOnlyRoute(pathname: string): boolean {
  return hasRouteAccess(pathname, "auth-only");
}

/**
 * Kiểm tra route dành riêng cho Quản trị viên.
 */
export function isAdminRoute(pathname: string): boolean {
  return hasRouteAccess(pathname, "admin");
}

/**
 * Kiểm tra route yêu cầu đăng nhập (bao gồm cả route Admin).
 */
export function isProtectedRoute(pathname: string): boolean {
  return hasRouteAccess(pathname, "protected") || hasRouteAccess(pathname, "admin");
}

/**
 * Xác định trang chủ mặc định theo vai trò (Role) của người dùng.
 */
export function getDefaultHomeByRole(role?: string | null): string {
  const normalizedRole = role?.toUpperCase();

  if (normalizedRole === "ADMIN") {
    return ROUTES.ADMIN.DASHBOARD;
  }

  if (normalizedRole === "ADVISOR") {
    return ROUTES.ADVISOR.DASHBOARD;
  }

  return ROUTES.PORTAL.CHAT;
}

/**
 * Xác định đường dẫn chuyển hướng dựa trên trạng thái đăng nhập và vai trò.
 */
export function determineRedirect(
  pathname: string,
  isAuthenticated: boolean,
  userRole?: string | null
): string | null {
  const normalizedRole = userRole?.toUpperCase();

  // Đã đăng nhập thì không vào trang đăng nhập, đăng ký.
  if (isAuthenticated && isAuthOnlyRoute(pathname)) {
    return getDefaultHomeByRole(normalizedRole);
  }

  // Chưa đăng nhập thì chuyển về login.
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    return buildLoginUrl({ redirect: pathname });
  }

  // Kiểm tra phân quyền khi đã đăng nhập.
  if (isAuthenticated) {
    // Không phải ADMIN thì không được vào các trang /admin/*
    if (isAdminRoute(pathname) && normalizedRole !== "ADMIN") {
      return getDefaultHomeByRole(normalizedRole);
    }

    // ADMIN không sử dụng giao diện Tư vấn trực tiếp (/chat)
    if (normalizedRole === "ADMIN" && matchPath(pathname, ROUTES.PORTAL.CHAT)) {
      return ROUTES.ADMIN.DASHBOARD;
    }
  }

  // Không cần chuyển hướng.
  return null;
}
