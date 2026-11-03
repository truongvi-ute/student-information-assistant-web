import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Tự động đóng menu trên Mobile mỗi khi chuyển trang
  useEffect(() => {
    setIsMobileOpen(false);
  }, [router.asPath]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      {/* Thanh điều hướng bên trái (Sidebar) */}
      <DashboardSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        role={user?.role}
        currentUser={user}
      />

      {/* Vùng nội dung chính bên phải */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Thanh tiêu đề đầu trang (Header) */}
        <DashboardHeader
          title={title}
          onOpenMobile={() => setIsMobileOpen(true)}
        />

        {/* Nội dung trang con (Vùng cuộn độc lập) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
