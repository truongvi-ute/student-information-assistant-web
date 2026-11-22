import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/router";

interface SidebarControls {
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
}

interface AppLayoutProps {
  sidebar: (controls: SidebarControls) => ReactNode;
  children: ReactNode;
}

const AppLayoutContext = createContext<SidebarControls | undefined>(undefined);

function subscribeToScreen(callback: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia("(min-width: 768px)").matches;
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeToScreen, getDesktopSnapshot, () => true);

  useEffect(() => {
    const closeMobile = () => setIsMobileOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };
    router.events.on("routeChangeStart", closeMobile);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      router.events.off("routeChangeStart", closeMobile);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [router.events]);

  const controls: SidebarControls = {
    isSidebarOpen: isDesktop ? !isCollapsed : isMobileOpen,
    isCollapsed: isDesktop && isCollapsed,
    openSidebar: () => isDesktop ? setIsCollapsed(false) : setIsMobileOpen(true),
    closeSidebar: () => isDesktop ? setIsCollapsed(true) : setIsMobileOpen(false),
    toggleSidebar: () => isDesktop ? setIsCollapsed((current) => !current) : setIsMobileOpen((current) => !current),
    closeMobileSidebar: () => setIsMobileOpen(false),
  };

  return (
    <AppLayoutContext.Provider value={controls}>
      <div className="flex h-dvh w-full overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
        <div
          inert={!isDesktop && !isMobileOpen}
          className={`fixed inset-y-0 left-0 z-40 h-full w-[280px] shrink-0 transition-all duration-200 md:relative ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } ${isCollapsed ? "md:w-16" : "md:w-[280px]"}`}
        >
          {sidebar(controls)}
        </div>
        {isMobileOpen && (
          <button
            type="button"
            aria-label="Đóng thanh điều hướng"
            onClick={controls.closeMobileSidebar}
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
          />
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AppLayoutContext.Provider>
  );
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error("useAppLayout phải được sử dụng bên trong AppLayout");
  }
  return context;
}
