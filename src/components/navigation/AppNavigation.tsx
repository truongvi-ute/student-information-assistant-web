import Link from "next/link";
import { useRouter } from "next/router";
import type { NavItem } from "./navigation.config";

interface AppNavigationProps {
  items: NavItem[];
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

export function AppNavigation({
  items,
  isCollapsed = false,
  onItemClick,
}: AppNavigationProps) {
  const router = useRouter();

  return (
    <nav aria-label="Điều hướng chính" className="flex shrink-0 flex-col gap-1 p-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          router.pathname === item.href ||
          (item.href !== "/admin" &&
            item.href !== "/advisor" &&
            router.pathname.startsWith(`${item.href}/`));

        const navLabel = item.badge
          ? `${item.title} (${item.badge} chưa đọc)`
          : item.title;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            aria-label={navLabel}
            aria-current={isActive ? "page" : undefined}
            title={isCollapsed ? navLabel : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#DBEAFE] text-[#1D4ED8]"
                : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            } ${isCollapsed ? "justify-center px-2" : ""}`}
          >
            <span className="relative inline-flex shrink-0">
              <Icon className="h-5 w-5 shrink-0" />
              {isCollapsed && item.badge && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1D4ED8] px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                  {item.badge}
                </span>
              )}
            </span>

            {!isCollapsed && (
              <span className="flex-1 truncate">{item.title}</span>
            )}

            {!isCollapsed && item.badge && (
              <span className="rounded-full bg-[#1D4ED8] px-2 py-0.5 text-[11px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

