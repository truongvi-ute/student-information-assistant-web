import Head from "next/head";
import Link from "next/link";
import { Users, MessageSquare, Calendar, ArrowRight, ShieldAlert, FileText, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/routes";

export default function AdvisorDashboardPage() {
  const { user } = useAuth();

  // Kiểm tra cảnh báo nếu vai trò hiện tại không phải ADVISOR
  if (user && user.role !== "ADVISOR") {
    return (
      <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-[#B91C1C]" />
        <h2 className="mt-3 text-lg font-semibold text-[#B91C1C]">Không có quyền truy cập</h2>
        <p className="mt-1 text-sm text-[#7F1D1D]">
          Khu vực này chỉ dành riêng cho Cố vấn học tập (ADVISOR).
        </p>
      </div>
    );
  }

  const statCards = [
    { title: "Sinh viên phụ trách", value: "--", desc: "Lớp học & Chuyên ngành", icon: Users, color: "text-[#1D4ED8] bg-[#EFF6FF]" },
    { title: "Tin nhắn tư vấn", value: "--", desc: "Đang chờ giải đáp", icon: MessageSquare, color: "text-[#15803D] bg-[#F0FDF4]" },
    { title: "Lịch hẹn sinh viên", value: "--", desc: "Trong tuần này", icon: Calendar, color: "text-[#D97706] bg-[#FFFBEB]" },
  ];

  return (
    <>
      <Head>
        <title>Cổng Cố vấn học tập — HCMUTE Student Assistant</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
            Bàn làm việc Cố vấn
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Chào mừng Thầy/Cô {user?.fullName || "Cố vấn"}. Theo dõi danh sách sinh viên và các yêu cầu tư vấn học tập.
          </p>
        </div>

        {/* Lưới thống kê */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#64748B]">{card.title}</p>
                  <p className="text-xl font-bold text-[#0F172A]">{card.value}</p>
                  <p className="truncate text-xs text-[#94A3B8]">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thao tác nhanh */}
        <div>
          <h3 className="text-base font-semibold text-[#0F172A] mb-3">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Thẻ 1: Tư vấn */}
            <div className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1D4ED8]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-[#0F172A]">Hộp thư tư vấn sinh viên</h4>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Trao đổi, giải đáp trực tiếp các câu hỏi và thắc mắc đào tạo từ sinh viên phụ trách.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
                <Link
                  href={ROUTES.PORTAL.CHAT}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1E40AF]"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Mở hộp thư tư vấn</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </Link>
              </div>
            </div>

            {/* Thẻ 2: Quản lý & Tải lên tài liệu */}
            <div className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#15803D]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-[#0F172A]">Quản lý & Tải lên tài liệu</h4>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Tải lên tài liệu hướng dẫn đào tạo (.pdf, .docx) và gửi yêu cầu phê duyệt nguồn tri thức RAG.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
                <Link
                  href={ROUTES.ADVISOR.DOCUMENTS}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#166534]"
                >
                  <Upload className="h-4 w-4" />
                  <span>Đi đến Kho tài liệu & Tải lên</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

