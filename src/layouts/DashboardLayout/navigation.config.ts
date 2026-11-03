import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
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
  // --- Phân hệ ADMIN (UC10, UC11, UC12) ---
  {
    title: "Tổng quan",
    href: ROUTES.ADMIN.DASHBOARD,
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    title: "Quản lý người dùng",
    href: ROUTES.ADMIN.USERS,
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Danh mục đào tạo",
    href: ROUTES.ADMIN.DEPARTMENTS,
    icon: BookOpen,
    roles: ["ADMIN"],
  },
  {
    title: "Kho tài liệu & RAG",
    href: ROUTES.ADMIN.DOCUMENTS,
    icon: FileText,
    roles: ["ADMIN"],
  },

  // --- Phân hệ ADVISOR (UC08, UC09) ---
  {
    title: "Bàn làm việc",
    href: ROUTES.ADVISOR.DASHBOARD,
    icon: LayoutDashboard,
    roles: ["ADVISOR"],
  },
  {
    title: "Tư vấn trực tiếp",
    href: ROUTES.PORTAL.CHAT,
    icon: MessageSquare,
    roles: ["ADVISOR"],
  },
  {
    title: "Quản lý tài liệu",
    href: ROUTES.ADVISOR.DOCUMENTS,
    icon: FileText,
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
