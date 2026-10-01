/**
 * Application Routes Module
 * 
 * Provides centralized routing constants, URL builders, metadata configurations,
 * access control guards, and RouteGuard components.
 * 
 * @example
 * ```ts
 * import { ROUTES, buildVerifyOtpUrl, isProtectedRoute } from "@/routes";
 * 
 * // Access route constants
 * const loginPath = ROUTES.AUTH.LOGIN;
 * 
 * // Generate safe dynamic URL
 * const otpUrl = buildVerifyOtpUrl({ email: "student@hcmute.edu.vn" });
 * ```
 */

export * from "./paths";
export * from "./types";
export * from "./config";
export * from "./guards";
export * from "./RouteGuard";
