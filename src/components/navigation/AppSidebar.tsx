import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { PanelLeftClose, PanelLeft, LogOut, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROUTES } from "@/routes";
import type { UserProfile } from "@/types/auth";
import { AppNavigation } from "./AppNavigation";
import { getNavItemsByRole } from "./navigation.config";

interface AppSidebarProps {
  children?: ReactNode;
  currentUser: UserProfile | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
}

export function AppSidebar({
  children,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
}: AppSidebarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const role = currentUser?.role?.toUpperCase();
  const navItems = getNavItemsByRole(role);
  const displayName = currentUser?.fullName || currentUser?.email || "Tài khoản";
  const displayRole = role === "ADMIN" ? "Quản trị viên" : role === "ADVISOR" ? "Tư vấn viên" : "Sinh viên";
  const homeHref = role === "ADMIN" ? ROUTES.ADMIN.DASHBOARD : role === "ADVISOR" ? ROUTES.ADVISOR.DASHBOARD : ROUTES.PUBLIC.CHATBOT;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <aside aria-label="Thanh điều hướng" className="flex h-full w-full min-h-0 flex-col border-r border-[#E2E8F0] bg-white">
      <div className={`flex shrink-0 items-center border-b border-[#E2E8F0] p-3 ${isCollapsed ? "flex-col gap-2" : "h-16 justify-between"}`}>
        <Link href={homeHref} onClick={onNavigate} className="flex min-w-0 items-center gap-2.5" aria-label="UTEChatBot">
          <Image src="/assets/images/hcmute-logo.png" alt="Logo HCMUTE" width={36} height={40} className="h-10 w-9 shrink-0 object-contain" />
          {!isCollapsed && <span className="truncate text-base font-semibold text-[#0F172A]">UTEChatBot</span>}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          className="h-8 w-8 shrink-0 text-[#475569] hover:bg-[#F1F5F9]"
        >
          {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <AppNavigation items={navItems} isCollapsed={isCollapsed} onItemClick={onNavigate} />
        {children}
      </div>

      {currentUser ? (
        <div ref={menuRef} className="relative shrink-0 border-t border-[#E2E8F0] bg-white p-2">
          {profileMenuOpen && (
            <div className={`absolute bottom-full mb-2 rounded-xl border border-[#CBD5E1] bg-white py-1.5 text-[#0F172A] shadow-xl z-40 ${isCollapsed ? "left-2 w-56" : "left-2 right-2"}`}>
              <div className="border-b border-[#E2E8F0] px-3.5 py-2">
                <p className="truncate text-xs font-semibold">{displayName}</p>
                <p className="mt-0.5 truncate text-[11px] text-[#475569]">{currentUser.email}</p>
                <p className="mt-1 text-[11px] text-[#475569]">{displayRole}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2]"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-label="Menu tài khoản"
            aria-expanded={profileMenuOpen}
            title={isCollapsed ? displayName : undefined}
            className={`flex w-full items-center rounded-lg p-2 text-left hover:bg-[#F1F5F9] ${isCollapsed ? "justify-center" : "gap-2.5"}`}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-[#CBD5E1]">
              <AvatarFallback className="bg-[#1D4ED8] text-xs font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#0F172A]">{displayName}</p>
                  <p className="text-[11px] text-[#475569]">{displayRole}</p>
                </div>
                <MoreHorizontal className="h-4 w-4 shrink-0 text-[#64748B]" />
              </>
            )}
          </button>
        </div>
      ) : (
        <Link href={ROUTES.AUTH.LOGIN} onClick={onNavigate} title="Đăng nhập" className="m-2 shrink-0 rounded-lg bg-[#1D4ED8] px-2 py-2 text-center text-xs text-white">
          {isCollapsed ? "Vào" : "Đăng nhập"}
        </Link>
      )}
    </aside>
  );
}
