import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onOpenMobile: () => void;
  title?: string;
}

export function DashboardHeader({ onOpenMobile, title }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#E2E8F0] bg-white px-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onOpenMobile}
        className="h-9 w-9 text-[#475569] hover:bg-[#F1F5F9] md:hidden"
        aria-label="Mở thanh điều hướng"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-base font-semibold text-[#0F172A] sm:text-lg">
        {title || "Bảng điều khiển"}
      </h1>
    </header>
  );
}
