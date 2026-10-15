import React, { useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { determineRedirect, isPublicRoute } from "./guards";
import { useAuth } from "@/contexts/AuthContext";

interface RouteGuardProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  isAuthLoading?: boolean;
  fallback?: ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  isAuthenticated: propIsAuthenticated,
  isAuthLoading: propIsAuthLoading,
  fallback,
}) => {
  const router = useRouter();
  const auth = useAuth();

  const isAuthenticated = propIsAuthenticated ?? auth.isAuthenticated;
  const isAuthLoading = propIsAuthLoading ?? auth.isLoading;

  const isPublic = isPublicRoute(router.asPath);
  const redirectTarget = !isAuthLoading && !isPublic ? determineRedirect(router.asPath, isAuthenticated) : null;

  useEffect(() => {
    if (redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  // Cho phép render ngay lập tức đối với các trang công khai
  if (isPublic) {
    return <>{children}</>;
  }

  // Hiển thị màn hình chờ khi đang kiểm tra phiên hoặc đang chuyển hướng
  if (isAuthLoading || redirectTarget) {
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
