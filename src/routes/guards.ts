import { ROUTES } from "./paths";
import {
  AUTH_ONLY_PATHS,
  PROTECTED_PATHS,
  PUBLIC_PATHS,
  ROUTE_CONFIGS,
} from "./config";
import type { RouteConfig } from "./types";

/**
 * Normalizes a URL pathname by stripping query parameters, hashes, and trailing slashes.
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
 * Checks if a pathname matches a target path (exact or prefix matching for nested routes).
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
 * Checks if a route is public (anyone can access).
 */
export function isPublicRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return PUBLIC_PATHS.some((path) => matchPath(normalized, path));
}

/**
 * Checks if a route is auth-only (Login, Register, OTP).
 * Authenticated users should not access these routes.
 */
export function isAuthOnlyRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return AUTH_ONLY_PATHS.some((path) => matchPath(normalized, path));
}

/**
 * Checks if a route is protected (requires authentication).
 */
export function isProtectedRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return PROTECTED_PATHS.some((path) => matchPath(normalized, path));
}

/**
 * Looks up the RouteConfig metadata for a given path.
 */
export function getRouteConfig(pathname: string): RouteConfig | undefined {
  const normalized = normalizePathname(pathname);
  // Exact match first
  if (ROUTE_CONFIGS[normalized]) {
    return ROUTE_CONFIGS[normalized];
  }
  // Find prefix match
  const foundKey = Object.keys(ROUTE_CONFIGS).find((key) =>
    matchPath(normalized, key)
  );
  return foundKey ? ROUTE_CONFIGS[foundKey] : undefined;
}

/**
 * Determines whether a redirect is required based on authentication state.
 *
 * @param pathname Current path being requested
 * @param isAuthenticated User's authentication status
 * @returns Target redirect path if a redirect is needed, or null if the route can be accessed
 */
export function determineRedirect(
  pathname: string,
  isAuthenticated: boolean
): string | null {
  const normalized = normalizePathname(pathname);

  // 1. If user is authenticated and attempts to visit an Auth-only page (Login / Register / OTP)
  // Redirect to Portal Dashboard
  if (isAuthenticated && isAuthOnlyRoute(normalized)) {
    return ROUTES.PORTAL.DASHBOARD;
  }

  // 2. If user is unauthenticated and attempts to visit a Protected route
  // Redirect to Login with the attempted path as return redirect target
  if (!isAuthenticated && isProtectedRoute(normalized)) {
    const encodedTarget = encodeURIComponent(pathname);
    return `${ROUTES.AUTH.LOGIN}?redirect=${encodedTarget}`;
  }

  // 3. Otherwise access is permitted
  return null;
}
