import Link from "next/link";
import { useRouter } from "next/router";
import { Bot, MessagesSquare, LayoutDashboard, FileText, MessageSquare } from "lucide-react";
import { ROUTES } from "@/routes";

interface ChatNavigationProps {
  role?: string;
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

export function ChatNavigation({
  role = "STUDENT",
  isCollapsed = false,
  onNavigate,
}: ChatNavigationProps) {
  const router = useRouter();
  const normalizedRole = role.toUpperCase();

  const items = (() => {
    if (normalizedRole === "ADVISOR") {
      return [
        { href: ROUTES.ADVISOR.DASHBOARD, label: "Bàn làm việc", icon: LayoutDashboard },
        { href: ROUTES.PORTAL.CHAT, label: "Tư vấn trực tiếp", icon: MessageSquare },
        { href: ROUTES.ADVISOR.DOCUMENTS, label: "Quản lý tài liệu", icon: FileText },
      ];
    }
    if (normalizedRole === "ADMIN") {
      return [
        { href: ROUTES.ADMIN.DASHBOARD, label: "Tổng quan hệ thống", icon: LayoutDashboard },
        { href: ROUTES.ADMIN.DOCUMENTS, label: "Kho tài liệu & RAG", icon: FileText },
      ];
    }
    return [
      { href: ROUTES.PUBLIC.CHATBOT, label: "Hội thoại AI", icon: Bot },
      { href: ROUTES.PORTAL.CHAT, label: "Tư vấn trực tiếp", icon: MessagesSquare },
    ];
  })();

  return (
    <nav aria-label="Chức năng điều hướng" className="flex flex-col gap-1 p-2">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          router.pathname === href ||
          (href !== ROUTES.ADVISOR.DASHBOARD &&
            href !== ROUTES.ADMIN.DASHBOARD &&
            router.pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            title={isCollapsed ? label : undefined}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              if (window.innerWidth < 768) onNavigate?.();
            }}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              isCollapsed ? "justify-center px-2" : ""
            } ${
              isActive
                ? "bg-[#DBEAFE] text-[#1D4ED8] font-semibold"
                : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
