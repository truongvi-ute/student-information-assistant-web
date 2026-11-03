import Head from "next/head";
import Link from "next/link";
import { Users, MessageSquare, Calendar, ArrowRight, ShieldAlert } from "lucide-react";
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
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
          <h3 className="text-base font-semibold text-[#0F172A]">Thao tác nhanh</h3>
          <p className="mt-1 text-sm text-[#475569]">
            Truy cập trực tiếp vào phân hệ tin nhắn tư vấn sinh viên đã tích hợp sẵn.
          </p>
          <div className="mt-4">
            <Link
              href={ROUTES.PORTAL.CHAT}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF]"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Mở hộp thư tư vấn trực tiếp</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

