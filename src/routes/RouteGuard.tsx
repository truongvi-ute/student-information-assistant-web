import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "./paths";
import { determineRedirect, getRouteConfig } from "./guards";

interface RouteGuardProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  isAuthLoading?: boolean;
  fallback?: ReactNode;
}

/**
 * Kiểm tra đường dẫn chuyển hướng sau đăng nhập.
 */
function getSafePostLoginRedirect(path: string): string {
  const target = path.trim();

  // Chỉ cho phép đường dẫn nội bộ.
  if (
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(target)
  ) {
    return ROUTES.PORTAL.CHAT;
  }

  // Không chuyển người đã đăng nhập về các trang xác thực.
  if (getRouteConfig(target)?.access === "auth-only") {
    return ROUTES.PORTAL.CHAT;
  }

  return target;
}

export function RouteGuard({
  children,
  isAuthenticated: propIsAuthenticated,
  isAuthLoading: propIsAuthLoading,
  fallback,
}: RouteGuardProps) {
  const router = useRouter();
  const {
    isAuthenticated: contextIsAuthenticated,
    isLoading: contextIsLoading,
    postLoginRedirect,
    clearPostLoginRedirect,
  } = useAuth();
  const isAuthenticated = propIsAuthenticated ?? contextIsAuthenticated;
  const isAuthLoading = propIsAuthLoading ?? contextIsLoading;
  const pendingRedirect = useRef<string | null>(null);
  const routeConfig = getRouteConfig(router.pathname);
  const isPublic = routeConfig?.access === "public";
  const isAuthOnly = routeConfig?.access === "auth-only";
  let redirectTarget: string | null = null;

  if (router.isReady && !isAuthLoading && !isPublic) {
    if (isAuthenticated && isAuthOnly && postLoginRedirect) {
      redirectTarget = getSafePostLoginRedirect(postLoginRedirect);
    } else {
      redirectTarget = determineRedirect(router.asPath, isAuthenticated);
    }
  }
  useEffect(() => {
    if (!redirectTarget) {
      pendingRedirect.current = null;
      return;
    }

    if (pendingRedirect.current === redirectTarget) {
      return;
    }

    pendingRedirect.current = redirectTarget;

    void router.replace(redirectTarget).catch((error: unknown) => {
      console.error("Không thể chuyển hướng:", error);

      if (pendingRedirect.current === redirectTarget) {
        pendingRedirect.current = null;
      }
    });
  }, [redirectTarget, router]);

  // Xóa redirect tạm sau khi đã rời trang xác thực.
  useEffect(() => {
    if (
      router.isReady &&
      isAuthenticated &&
      postLoginRedirect &&
      !isAuthOnly
    ) {
      clearPostLoginRedirect();
    }
  }, [
    router.isReady,
    isAuthenticated,
    postLoginRedirect,
    isAuthOnly,
    clearPostLoginRedirect,
  ]);

  // Trang công khai không cần chờ xác thực.
  if (isPublic) {
    return <>{children}</>;
  }

  // Hiển thị loading khi kiểm tra phiên hoặc chuyển hướng.
  if (!router.isReady || isAuthLoading || redirectTarget) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div
        className="w-full min-h-screen bg-[#071a3d] flex items-center justify-center text-white"
        aria-label="Đang kiểm tra quyền truy cập..."
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#38bdf8] animate-spin" />
          <span className="text-[13px] text-[#94a3b8] font-medium tracking-wide">
            Đang tải dữ liệu...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
