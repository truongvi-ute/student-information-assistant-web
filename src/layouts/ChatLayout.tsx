import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarControls {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

interface ChatLayoutProps {
  sidebar: (controls: SidebarControls) => ReactNode;
  children: ReactNode;
}

const ChatLayoutContext = createContext<SidebarControls | undefined>(undefined);

export function ChatLayout({ sidebar, children }: ChatLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const controls: SidebarControls = {
    isSidebarOpen,
    openSidebar: () => setIsSidebarOpen(true),
    closeSidebar: () => setIsSidebarOpen(false),
    toggleSidebar: () => setIsSidebarOpen((current) => !current),
  };

  return (
    <ChatLayoutContext.Provider value={controls}>
      <div className="flex h-dvh w-full overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
        <div
          className={`fixed inset-y-0 left-0 z-30 h-full w-[280px] shrink-0 transition-all duration-200 md:relative ${
            isSidebarOpen
              ? "translate-x-0 md:w-[280px]"
              : "-translate-x-full md:w-16 md:translate-x-0"
          }`}
        >
          {sidebar(controls)}
        </div>

        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Đóng danh sách hội thoại"
            onClick={controls.closeSidebar}
            className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs md:hidden"
          />
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </ChatLayoutContext.Provider>
  );
}
export function useChatLayout() {
  const context = useContext(ChatLayoutContext);

  if (!context) {
    throw new Error("useChatLayout phải được sử dụng bên trong ChatLayout");
  }

  return context;
}
