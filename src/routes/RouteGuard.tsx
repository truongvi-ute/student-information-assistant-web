"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/router";
import { determineRedirect } from "./guards";

interface RouteGuardProps {
  children: ReactNode;
  /**
   * Trạng thái xác thực của người dùng. Nếu để trống, RouteGuard sẽ hiển thị trang bình thường mà không chuyển hướng.
   */
  isAuthenticated?: boolean;
  /**
   * Đang trong quá trình kiểm tra trạng thái xác thực hay không.
   */
  isAuthLoading?: boolean;
  /**
   * Giao diện loading tùy chỉnh (nếu muốn thay thế spinner mặc định).
   */
  fallback?: ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  isAuthenticated = false,
  isAuthLoading = false,
  fallback,
}) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // Chờ cho đến khi quá trình xác thực hoàn tất kiểm tra
    if (isAuthLoading) {
      setIsAuthorized(false);
      return;
    }

    const redirectTarget = determineRedirect(router.asPath, isAuthenticated);

    if (redirectTarget) {
      setIsAuthorized(false);
      router.replace(redirectTarget);
    } else {
      setIsAuthorized(true);
    }
  }, [router.asPath, isAuthenticated, isAuthLoading, router]);

  // Nếu đang kiểm tra hoặc chưa được cấp quyền trong lúc chuyển hướng, hiển thị giao diện chờ
  if (isAuthLoading || !isAuthorized) {
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
