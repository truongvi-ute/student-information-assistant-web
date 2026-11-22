import type { ReactNode } from "react";
import { useAppLayout } from "@/layouts/AppLayout";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { openSidebar } = useAppLayout();

  return (
    <>
      <DashboardHeader title={title} onOpenMobile={openSidebar} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </>
  );
}
