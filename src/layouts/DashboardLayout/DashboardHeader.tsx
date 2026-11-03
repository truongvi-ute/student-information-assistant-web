import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/routes";

interface DashboardHeaderProps {
  onOpenMobile: () => void;
  title?: string;
}

export function DashboardHeader({ onOpenMobile, title }: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown menu khi click ra bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    void router.push(ROUTES.AUTH.LOGIN);
  };

  const displayName = user?.fullName || user?.email || "Tài khoản";
  const displayRole = user?.role === "ADMIN" ? "Quản trị viên" : "Cố vấn học tập";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6">
      {/* Nút mở menu trên Mobile & Tiêu đề trang */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenMobile}
          className="h-9 w-9 text-[#475569] hover:bg-[#F1F5F9] lg:hidden"
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="text-base font-semibold text-[#0F172A] sm:text-lg">
          {title || "Bảng điều khiển"}
        </h1>
      </div>

      {/* Cụm thông tin tài khoản bên phải */}
      <div className="flex items-center gap-3">
        {/* Huy hiệu vai trò (Role Badge) */}
        <span
          className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-block ${
            user?.role === "ADMIN"
              ? "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
              : "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]"
          }`}
        >
          {displayRole}
        </span>

        {/* Menu thông tin người dùng */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-[#F1F5F9] focus:outline-none"
            aria-expanded={isMenuOpen}
            aria-label="Menu tài khoản"
          >
            <Avatar className="h-8 w-8 ring-1 ring-[#CBD5E1]">
              <AvatarFallback className="bg-[#1D4ED8] text-xs font-bold text-white">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-xs font-medium text-[#0F172A] md:inline-block">
              {displayName}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#64748B] md:inline-block" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
              <div className="border-b border-[#E2E8F0] px-3 py-2">
                <p className="truncate text-sm font-semibold text-[#0F172A]">{displayName}</p>
                <p className="truncate text-xs text-[#64748B]">{user?.email}</p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

