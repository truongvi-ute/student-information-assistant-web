"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/router";
import { determineRedirect } from "./guards";

interface RouteGuardProps {
  children: ReactNode;
  /**
   * User authentication state. If omitted, RouteGuard renders children without redirection.
   */
  isAuthenticated?: boolean;
  /**
   * Whether the authentication check is currently loading.
   */
  isAuthLoading?: boolean;
  /**
   * Custom loading indicator component.
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
    // Wait until auth state finishes loading
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

  // If loading or unauthorized during redirect, show fallback or minimal loader
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
