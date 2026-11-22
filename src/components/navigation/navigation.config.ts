import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  Bot,
} from "lucide-react";
import { ROUTES } from "@/routes";

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  roles: ("ADMIN" | "ADVISOR" | "STUDENT" | "GUEST")[];
}

export const APP_NAV_ITEMS: NavItem[] = [
  {
    title: "Hội thoại AI",
    href: ROUTES.PUBLIC.CHATBOT,
    icon: Bot,
    roles: ["STUDENT", "GUEST"],
  },
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
    title: "Kho tài liệu",
    href: ROUTES.ADMIN.DOCUMENTS,
    icon: FileText,
    roles: ["ADMIN"],
  },

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
    roles: ["ADVISOR", "STUDENT", "GUEST"],
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
  const normalizedRole = role?.toUpperCase() || "GUEST";
  return APP_NAV_ITEMS.filter((item) =>
    item.roles.some((r) => r === normalizedRole)
  );
}
