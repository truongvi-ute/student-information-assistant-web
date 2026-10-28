import { useState, useEffect } from "react";
import { chatService } from "@/services/chat.service";
import type { ChatContact, ChatDepartment } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, UserCheck } from "lucide-react";

interface AdvisorContactDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectAdvisor: (advisor: ChatContact) => void;
  existingAdvisorIds?: string[];
}

export function AdvisorContactDialog({
  open,
  onClose,
  onSelectAdvisor,
  existingAdvisorIds = [],
}: AdvisorContactDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("ALL");
  const [advisors, setAdvisors] = useState<ChatContact[]>([]);
  const [departments, setDepartments] = useState<ChatDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    Promise.all([chatService.getContacts(), chatService.getDepartments()])
      .then(([contactList, departmentList]) => {
        if (cancelled) return;
        const advisorList = contactList.filter((c) => c.role === "ADVISOR");
        setAdvisors(advisorList);
        setDepartments(departmentList);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được danh sách cố vấn");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const filteredAdvisors = advisors.filter((adv) => {
    const matchesName = adv.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDepartmentId === "ALL" ||
      adv.departmentId === selectedDepartmentId ||
      adv.departmentName === selectedDepartmentId;
    return matchesName && matchesDept;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 duration-150">
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] tracking-wide">
              Liên hệ cố vấn học tập
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Chọn cố vấn để bắt đầu trao đổi hoặc tiếp tục hội thoại
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3.5 border-b border-[#E2E8F0] space-y-2.5 bg-[#F8FAFC]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên cố vấn..."
              className="pl-9 h-9 text-xs border-[#CBD5E1] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
            />
          </div>

          {departments.length > 0 && (
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 min-h-[220px] bg-white">
          {isLoading ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-14 w-full bg-[#F1F5F9]" />
              <Skeleton className="h-14 w-full bg-[#F1F5F9]" />
              <Skeleton className="h-14 w-full bg-[#F1F5F9]" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-xs text-[#B91C1C]">
              {error}
            </div>
          ) : filteredAdvisors.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#64748B]">
              Không tìm thấy cố vấn phù hợp
            </div>
          ) : (
            filteredAdvisors.map((advisor) => {
              const hasExisting = existingAdvisorIds.includes(advisor.accountId);

              return (
                <button
                  key={advisor.accountId}
                  type="button"
                  onClick={() => {
                    onSelectAdvisor(advisor);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] hover:border-[#BFDBFE] transition-colors flex items-center justify-between gap-3 group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-semibold text-sm">
                        {advisor.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] group-hover:text-[#1D4ED8] truncate">
                        {advisor.fullName}
                      </p>
                      {advisor.departmentName && (
                        <p className="text-[11px] text-[#475569] truncate mt-0.5">
                          {advisor.departmentName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasExisting && (
                      <span className="text-[10px] text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <UserCheck className="w-3 h-3" />
                        Đã có chat
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-medium">
                      Cố vấn
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
