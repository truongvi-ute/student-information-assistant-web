import Link from "next/link";
import { useRouter } from "next/router";
import { Bot, MessagesSquare } from "lucide-react";
import { ROUTES } from "@/routes";

interface ChatNavigationProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

export function ChatNavigation({ isCollapsed = false, onNavigate }: ChatNavigationProps) {
  const router = useRouter();
  const items = [
    { href: ROUTES.PUBLIC.CHATBOT, label: "Hội thoại AI", icon: Bot },
    { href: ROUTES.PORTAL.CHAT, label: "Tư vấn trực tiếp", icon: MessagesSquare },
  ];

  return (
    <nav aria-label="Chức năng trò chuyện" className="flex flex-col gap-1 p-2">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          title={isCollapsed ? label : undefined}
          aria-label={label}
          aria-current={router.pathname === href ? "page" : undefined}
          onClick={() => {
            if (window.innerWidth < 768) onNavigate?.();
          }}
          className={`flex items-center gap-2 rounded-lg p-2 text-xs ${isCollapsed ? "justify-center" : ""} ${router.pathname === href ? "bg-[#DBEAFE] text-[#1D4ED8]" : "text-[#475569] hover:bg-[#F1F5F9]"}`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && label}
        </Link>
      ))}
    </nav>
  );
}
