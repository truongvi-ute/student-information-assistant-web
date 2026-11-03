import Image from "next/image";
import Link from "next/link";
import { PanelLeftClose, PanelLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "./DashboardNav";
import { getNavItemsByRole } from "./navigation.config";
import type { UserProfile } from "@/types/auth";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  role?: string;
  currentUser?: UserProfile | null;
}

export function DashboardSidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onToggleCollapse,
  role,
  currentUser,
}: DashboardSidebarProps) {
  const navItems = getNavItemsByRole(role);
  const homeHref = role === "ADMIN" ? "/admin" : "/advisor";

  return (
    <>
      {/* Lớp nền mờ (Backdrop) khi mở sidebar trên Mobile */}
      {isMobileOpen && (
        <div
          role="presentation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Khung Sidebar chính */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 lg:static ${
          isCollapsed ? "lg:w-20" : "lg:w-64"
        } ${isMobileOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Phần đầu: Logo và Tên hệ thống */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] px-4">
          <Link href={homeHref} className="flex items-center gap-3 overflow-hidden">
            <Image
              src="/assets/images/hcmute-logo.png"
              alt="Logo HCMUTE"
              width={36}
              height={40}
              className="h-9 w-8 shrink-0 object-contain"
            />
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-[#0F172A]">HCMUTE</span>
                <span className="text-[11px] font-medium text-[#64748B]">
                  {role === "ADMIN" ? "Quản trị hệ thống" : "Cổng Cố vấn học tập"}
                </span>
              </div>
            )}
          </Link>

          {/* Nút đóng Sidebar chỉ hiển thị trên Mobile */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="h-8 w-8 text-[#475569] hover:bg-[#F1F5F9] lg:hidden"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Danh sách Menu điều hướng (Cuộn độc lập) */}
        <div className="flex-1 overflow-y-auto py-2">
          <DashboardNav
            items={navItems}
            isCollapsed={isCollapsed}
            onItemClick={onCloseMobile}
          />
        </div>

        {/* Phần chân: Nút thu gọn / mở rộng Sidebar trên Desktop */}
        <div className="hidden border-t border-[#E2E8F0] p-3 lg:flex lg:items-center lg:justify-between">
          {!isCollapsed && (
            <div className="truncate text-xs text-[#64748B]">
              <span>Đăng nhập: </span>
              <span className="font-semibold text-[#0F172A]">
                {currentUser?.fullName || currentUser?.email || "Người dùng"}
              </span>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            className="h-9 w-9 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

