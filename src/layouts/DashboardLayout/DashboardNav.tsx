import Link from "next/link";
import { useRouter } from "next/router";
import type { NavItem } from "./navigation.config";

interface DashboardNavProps {
  items: NavItem[];
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

export function DashboardNav({
  items,
  isCollapsed = false,
  onItemClick,
}: DashboardNavProps) {
  const router = useRouter();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          router.pathname === item.href ||
          (item.href !== "/admin" &&
            item.href !== "/advisor" &&
            router.pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            title={isCollapsed ? item.title : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#DBEAFE] text-[#1D4ED8]"
                : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            } ${isCollapsed ? "justify-center px-2" : ""}`}
          >
            <Icon className="h-5 w-5 shrink-0" />

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

