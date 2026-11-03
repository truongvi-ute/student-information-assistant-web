import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Settings,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { ROUTES } from "@/routes";

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  roles: ("ADMIN" | "ADVISOR")[];
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  // --- Phân hệ ADMIN ---
  {
    title: "Tổng quan",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    title: "Quản lý người dùng",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Khoa & Ngành",
    href: "/admin/departments",
    icon: BookOpen,
    roles: ["ADMIN"],
  },
  {
    title: "Tài liệu đào tạo",
    href: "/admin/documents",
    icon: FileText,
    roles: ["ADMIN"],
  },
  {
    title: "Cấu hình hệ thống",
    href: "/admin/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },

  // --- Phân hệ ADVISOR ---
  {
    title: "Bàn làm việc",
    href: "/advisor",
    icon: LayoutDashboard,
    roles: ["ADVISOR"],
  },
  {
    title: "Sinh viên phụ trách",
    href: "/advisor/students",
    icon: Users,
    roles: ["ADVISOR"],
  },
  {
    title: "Tư vấn & Tin nhắn",
    href: ROUTES.PORTAL.CHAT,
    icon: MessageSquare,
    roles: ["ADVISOR"],
  },
  {
    title: "Lịch tiếp sinh viên",
    href: "/advisor/appointments",
    icon: Calendar,
    roles: ["ADVISOR"],
  },
];

/**
 * Lọc danh sách menu theo quyền (Role) của người dùng hiện tại
 */
export function getNavItemsByRole(role?: string): NavItem[] {
  if (!role) return [];
  const normalizedRole = role.toUpperCase();
  return DASHBOARD_NAV_ITEMS.filter((item) =>
    item.roles.some((r) => r === normalizedRole)
  );
}

