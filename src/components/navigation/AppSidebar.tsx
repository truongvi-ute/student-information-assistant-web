import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/routes";
import { ChatNavigation } from "./ChatNavigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  PanelLeftClose,
  PanelLeft,
  LogOut,
  MoreHorizontal,
} from "lucide-react";



import type { ChatConversationItem } from "@/types/chat";
import type { UserProfile } from "@/types/auth";
import { ChatbotConversationList } from "@/components/chatbot/ChatbotConversationList";
import { AdvisorConversationList } from "@/components/chat/AdvisorConversationList";

interface AppSidebarProps {
  role?: "STUDENT" | "ADVISOR";
  isChatbot?: boolean;
  conversations: ChatConversationItem[];
  selectedPartnerId: string | null;
  onSelectConversation: (item: ChatConversationItem) => void;
  onOpenAdvisorDialog?: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCollapse?: () => void;
  className?: string;
}

export function AppSidebar({
  role = "STUDENT",
  isChatbot = false,
  conversations,
  selectedPartnerId,
  onSelectConversation,
  onOpenAdvisorDialog,
  isLoading,
  error,
  onRetry,
  currentUser,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  onCollapse,
  className = "",
}: AppSidebarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isStudent = role === "STUDENT";
  const displayName = currentUser?.fullName || currentUser?.email || "Tài khoản";
  const displayEmail = currentUser?.email || "";
  const displayRole = isStudent ? "Sinh viên" : "Cố vấn";

  if (isCollapsed) {
    return (
      <aside
        className={`w-16 min-h-0 border-r border-[#E2E8F0] flex flex-col h-full bg-white py-3 items-center justify-between shrink-0 select-none ${className}`}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <Link href={ROUTES.PUBLIC.CHATBOT} aria-label="UTEChatBot">
            <Image src="/assets/images/hcmute-logo.png" alt="Logo HCMUTE" width={36} height={40} className="h-10 w-9 object-contain" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse || onCollapse}
            title="Mở rộng danh sách"
            aria-label="Mở rộng danh sách"
            className="h-10 w-10 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
        </div>

      <ChatNavigation isCollapsed={isCollapsed} onNavigate={onCollapse} />

      {isChatbot ? (
        <ChatbotConversationList isCollapsed={isCollapsed} onSelect={onCollapse} />
      ) : (
      <AdvisorConversationList
        role={role}
        conversations={conversations}
        selectedPartnerId={selectedPartnerId}
        onSelectConversation={onSelectConversation}
        onOpenAdvisorDialog={onOpenAdvisorDialog}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isCollapsed={isCollapsed}
      />
      )}

      {currentUser ? (
        <div ref={menuRef} className="relative">
          {profileMenuOpen && (
            <div className="absolute bottom-full left-3 mb-2 w-56 bg-white border border-[#CBD5E1] rounded-xl shadow-xl py-2 z-40 text-[#0F172A]">
              <div className="px-3.5 py-2 border-b border-[#E2E8F0]">
                <p className="text-xs font-semibold text-[#0F172A] truncate">
                  {displayName}
                </p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                  {displayRole}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#B91C1C] hover:bg-[#FEF2F2] text-left font-medium transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            title={displayName}
            className="p-1 rounded-full hover:bg-[#F1F5F9] transition-colors"
          >
            <Avatar className="h-9 w-9 ring-1 ring-[#CBD5E1]">
              <AvatarFallback className="bg-[#1D4ED8] text-white font-semibold text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      ) : (
        <Link
          href={ROUTES.AUTH.LOGIN}
          title="Đăng nhập"
          className="m-2 rounded-lg bg-[#1D4ED8] px-2 py-2 text-center text-xs text-white"
        >
          {isCollapsed ? "Vào" : "Đăng nhập"}
        </Link>
      )}
      </aside>
    );
  }

  return (
    <aside
      className={`w-full md:w-[280px] min-h-0 border-r border-[#E2E8F0] flex flex-col h-full bg-white shrink-0 ${className}`}
    >
      <div className="p-3.5 border-b border-[#E2E8F0] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <Link href={ROUTES.PUBLIC.CHATBOT} className="flex min-w-0 items-center gap-2.5" aria-label="UTEChatBot">
            <Image src="/assets/images/hcmute-logo.png" alt="Logo HCMUTE" width={36} height={40} className="h-10 w-9 shrink-0 object-contain" />
            <span className="truncate text-base font-semibold text-[#0F172A] tracking-tight">UTEChatBot</span>
          </Link>
          <div className="flex items-center gap-1">
            {onCollapse && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCollapse}
                aria-label="Thu gọn danh sách"
                className="h-7 w-7 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

      </div>

      <ChatNavigation isCollapsed={isCollapsed} onNavigate={onCollapse} />

      {isChatbot ? (
        <ChatbotConversationList isCollapsed={isCollapsed} onSelect={onCollapse} />
      ) : (
      <AdvisorConversationList
        role={role}
        conversations={conversations}
        selectedPartnerId={selectedPartnerId}
        onSelectConversation={onSelectConversation}
        onOpenAdvisorDialog={onOpenAdvisorDialog}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isCollapsed={isCollapsed}
      />
      )}

      {currentUser ? (
      <div ref={menuRef} className="p-2 border-t border-[#E2E8F0] relative bg-white">
        {profileMenuOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-white border border-[#CBD5E1] rounded-xl shadow-xl py-1.5 z-40 text-[#0F172A]">
            <div className="px-3.5 py-2 border-b border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#0F172A] truncate">
                {displayName}
              </p>
              {displayEmail && (
                <p className="text-[11px] text-[#475569] truncate mt-0.5">
                  {displayEmail}
                </p>
              )}
              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                {displayRole}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                onLogout?.();
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors text-left font-medium"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 ring-1 ring-[#CBD5E1]">
              <AvatarFallback className="bg-[#1D4ED8] text-white font-semibold text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F172A] truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-[#475569] truncate">
                {displayRole}
              </p>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-[#64748B] shrink-0 ml-1" />
        </button>
      </div>
      ) : (
        <Link
          href={ROUTES.AUTH.LOGIN}
          title="Đăng nhập"
          className="m-2 rounded-lg bg-[#1D4ED8] px-2 py-2 text-center text-xs text-white"
        >
          {isCollapsed ? "Vào" : "Đăng nhập"}
        </Link>
      )}
    </aside>
  );
}
