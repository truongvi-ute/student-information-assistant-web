import { useState, useRef, useEffect } from "react";
import type { ChatConversationItem } from "@/types/chat";
import type { UserProfile } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";

interface ChatSidebarProps {
  role?: "STUDENT" | "ADVISOR";
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

function formatConversationTime(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function ChatSidebar({
  role = "STUDENT",
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
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
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
  const title = isStudent ? "Tư vấn trực tiếp" : "Tin nhắn sinh viên";
  const searchPlaceholder = isStudent
    ? "Tìm theo tên cố vấn..."
    : "Tìm theo tên sinh viên...";

  const filteredConversations = conversations.filter((item) => {
    return item.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayName = currentUser?.fullName || currentUser?.email || "Tài khoản";
  const displayEmail = currentUser?.email || "";
  const displayRole = isStudent ? "Sinh viên" : "Cố vấn";

  if (isCollapsed) {
    return (
      <aside
        className={`w-[68px] border-r border-[#E2E8F0] flex flex-col h-full bg-white py-3 items-center justify-between shrink-0 select-none ${className}`}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse || onCollapse}
            title="Mở rộng danh sách"
            className="h-10 w-10 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>

          {isStudent && (
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={onOpenAdvisorDialog}
              title="Liên hệ cố vấn"
              className="h-10 w-10 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          )}

          <div className="w-8 h-px bg-[#E2E8F0] my-0.5" />

          <div className="flex flex-col items-center gap-2.5 w-full max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar px-1">
            {conversations.map((conv) => {
              const isSelected = selectedPartnerId === conv.partnerId;

              return (
                <button
                  key={conv.conversationId || conv.partnerId}
                  type="button"
                  onClick={() => onSelectConversation(conv)}
                  title={conv.partnerName}
                  className={`relative p-0.5 rounded-full transition-all ${
                    isSelected
                      ? "ring-2 ring-[#1D4ED8] ring-offset-2 ring-offset-white scale-105"
                      : "opacity-85 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "bg-[#1D4ED8] text-white"
                          : "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                      }`}
                    >
                      {conv.partnerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#15803D] border-2 border-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
      </aside>
    );
  }

  return (
    <aside
      className={`w-full md:w-80 border-r border-[#E2E8F0] flex flex-col h-full bg-white shrink-0 ${className}`}
    >
      <div className="p-3.5 border-b border-[#E2E8F0] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0F172A] tracking-wide">
            {title}
          </h2>
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

        {isStudent && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onOpenAdvisorDialog}
            className="w-full gap-2 h-9 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm transition-all rounded-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>Liên hệ cố vấn</span>
          </Button>
        )}

        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 text-xs rounded-lg border-[#CBD5E1] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white">
        {isLoading ? (
          <div className="space-y-2 p-1">
            <Skeleton className="h-14 w-full rounded-lg bg-[#F1F5F9]" />
            <Skeleton className="h-14 w-full rounded-lg bg-[#F1F5F9]" />
            <Skeleton className="h-14 w-full rounded-lg bg-[#F1F5F9]" />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-xs text-[#B91C1C] mb-2">{error}</p>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8 text-xs border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                Thử lại
              </Button>
            )}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            {isStudent ? (
              <>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Bạn chưa có cuộc trò chuyện nào với cố vấn học tập.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenAdvisorDialog}
                  className="text-xs border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]"
                >
                  Liên hệ cố vấn ngay
                </Button>
              </>
            ) : (
              <p className="text-xs text-[#475569] leading-relaxed">
                Chưa nhận được tin nhắn từ sinh viên.
              </p>
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-xs">
            Không tìm thấy cuộc trò chuyện phù hợp
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedPartnerId === conv.partnerId;
            const timeStr = formatConversationTime(conv.lastMessageAt);

            return (
              <button
                key={conv.conversationId || conv.partnerId}
                type="button"
                onClick={() => onSelectConversation(conv)}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                  isSelected
                    ? "bg-[#DBEAFE] text-[#1E40AF] border-l-4 border-l-[#1D4ED8]"
                    : "hover:bg-[#F1F5F9] text-[#0F172A] border-l-4 border-l-transparent"
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback
                    className={`text-sm font-semibold ${
                      isSelected
                        ? "bg-[#1D4ED8] text-white"
                        : "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                    }`}
                  >
                    {conv.partnerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-xs truncate ${
                        isSelected
                          ? "font-semibold text-[#1E40AF]"
                          : "font-semibold text-[#0F172A]"
                      }`}
                    >
                      {conv.partnerName}
                    </p>
                    {timeStr && (
                      <span
                        className={`text-[11px] shrink-0 ${
                          isSelected ? "text-[#1E40AF]/80 font-medium" : "text-[#475569]"
                        }`}
                      >
                        {timeStr}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs truncate mt-0.5 ${
                      isSelected ? "text-[#1E40AF]/85" : "text-[#475569]"
                    }`}
                  >
                    <span>{conv.partnerDepartment || "Cố vấn"}</span>
                    <span className="mx-1 text-[#94A3B8]">•</span>
                    <span>{conv.lastMessage || "Bắt đầu cuộc trò chuyện..."}</span>
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

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
    </aside>
  );
}