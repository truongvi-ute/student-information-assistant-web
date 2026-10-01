/**
 * Route access level types:
 * - 'public': Anyone can access (Home, Terms, Privacy, FAQs)
 * - 'auth-only': Only guest / unauthenticated users can access (Login, Register, Verify OTP).
 *                If an authenticated user visits, they are redirected to Dashboard.
 * - 'protected': Requires authenticated user (Dashboard, Chat, Profile, Academic Records).
 *                If unauthenticated, redirects to Login with return redirect query.
 * - 'admin': Requires administrative privileges.
 */
export type RouteAccessType = "public" | "auth-only" | "protected" | "admin";

export type LayoutType = "auth" | "main" | "dashboard" | "none";

/**
 * Route configuration definition with metadata
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
 * Options for generating route URLs
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
