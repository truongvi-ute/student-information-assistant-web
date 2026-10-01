import type {
  VerifyOtpUrlOptions,
  RegisterUrlOptions,
  LoginUrlOptions,
} from "./types";

/**
 * Immutable Route Paths Definition for the entire application.
 * Centralized source of truth for all URLs.
 */
export const ROUTES = {
  // Authentication routes
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
    VERIFY_REGISTRATION: "/verify-registration",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },

  // Public / Landing pages
  PUBLIC: {
    HOME: "/",
    TERMS: "/terms",
    PRIVACY: "/privacy",
    ABOUT: "#gioi-thieu",
    FEATURES: "#tinh-nang",
    SUPPORT: "#ho-tro",
  },

  // Authenticated Student Portal / App
  PORTAL: {
    DASHBOARD: "/dashboard",
    CHAT: "/chat",
    TRAINING: "/training",
    SCHEDULE: "/schedule",
    PROFILE: "/profile",
    NOTIFICATIONS: "/notifications",
  },
} as const;

/**
 * Route URL Builders with safe encoding and query parameter generation
 */

/**
 * Generates the URL for the OTP verification page
 * @example buildVerifyOtpUrl({ email: "student@hcmute.edu.vn" }) => "/verify-otp?email=student%40hcmute.edu.vn"
 */
export function buildVerifyOtpUrl(options?: VerifyOtpUrlOptions): string {
  const base = ROUTES.AUTH.VERIFY_OTP;
  if (!options?.email) {
    return base;
  }
  const params = new URLSearchParams();
  params.set("email", options.email);
  return `${base}?${params.toString()}`;
}

/**
 * Generates the URL for the registration page with optional step / email query
 * @example buildRegisterUrl({ step: "otp", email: "student@hcmute.edu.vn" }) => "/register?step=otp&email=student%40hcmute.edu.vn"
 */
export function buildRegisterUrl(options?: RegisterUrlOptions): string {
  const base = ROUTES.AUTH.REGISTER;
  if (!options) return base;

  const params = new URLSearchParams();
  if (options.step) {
    params.set("step", options.step);
  }
  if (options.email) {
    params.set("email", options.email);
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Generates the URL for login with optional return redirect target
 * @example buildLoginUrl({ redirect: "/dashboard" }) => "/login?redirect=%2Fdashboard"
 */
export function buildLoginUrl(options?: LoginUrlOptions): string {
  const base = ROUTES.AUTH.LOGIN;
  if (!options) return base;

  const params = new URLSearchParams();
  if (options.redirect) {
    params.set("redirect", options.redirect);
  }
  if (options.email) {
    params.set("email", options.email);
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
