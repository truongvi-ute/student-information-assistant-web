import type { UserProfile } from "@/types/auth.types";

const AUTH_TOKEN_KEY = "hcmute_auth_token";
const REFRESH_TOKEN_KEY = "hcmute_refresh_token";
const USER_PROFILE_KEY = "hcmute_user_profile";
const REMEMBERED_EMAIL_KEY = "hcmute_remembered_email";

/**
 * Safe local storage wrapper that checks SSR environment.
 */
function isClient(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const authStorage = {
  getToken(): string | null {
    if (!isClient()) return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setToken(token: string): void {
    if (!isClient()) return;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    if (!isClient()) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    if (!isClient()) return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUser(): UserProfile | null {
    if (!isClient()) return null;
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  },

  setUser(user: UserProfile): void {
    if (!isClient()) return;
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage quota error
    }
  },

  getRememberedEmail(): string {
    if (!isClient()) return "";
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
  },

  setRememberedEmail(email: string): void {
    if (!isClient()) return;
    if (email.trim()) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  },

  clearRememberedEmail(): void {
    if (!isClient()) return;
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  },

  clearAuth(): void {
    if (!isClient()) return;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
  },

  isAuthenticated(): boolean {
    if (!isClient()) return false;
    return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
  },
};
