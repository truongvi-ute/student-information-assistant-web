import Head from "next/head";
import { Users, BookOpen, FileText, Settings, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Kiểm tra cảnh báo nếu vai trò hiện tại không phải ADMIN
  if (user && user.role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-[#B91C1C]" />
        <h2 className="mt-3 text-lg font-semibold text-[#B91C1C]">Không có quyền truy cập</h2>
        <p className="mt-1 text-sm text-[#7F1D1D]">
          Khu vực này chỉ dành riêng cho tài khoản Quản trị viên (ADMIN).
        </p>
      </div>
    );
  }

  const statCards = [
    { title: "Tổng người dùng", value: "--", desc: "Sinh viên & Cố vấn", icon: Users, color: "text-[#1D4ED8] bg-[#EFF6FF]" },
    { title: "Khoa & Ngành", value: "--", desc: "Đang hoạt động", icon: BookOpen, color: "text-[#15803D] bg-[#F0FDF4]" },
    { title: "Tài liệu đào tạo", value: "--", desc: "Quy chế & Chương trình", icon: FileText, color: "text-[#D97706] bg-[#FFFBEB]" },
    { title: "Cấu hình hệ thống", value: "Sẵn sàng", desc: "Auth, WebSocket, AI", icon: Settings, color: "text-[#7C3AED] bg-[#F5F3FF]" },
  ];

  return (
    <>
      <Head>
        <title>Quản trị hệ thống — HCMUTE Student Assistant</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
            Tổng quan Quản trị
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Chào mừng trở lại, {user?.fullName || "Quản trị viên"}. Quản lý tài khoản, khoa ngành và hệ thống trợ lý.
          </p>
        </div>

        {/* Lưới thẻ thống kê nhanh */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Khu vực nội dung tính năng sắp triển khai */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
          <h3 className="text-base font-semibold text-[#0F172A]">Bắt đầu thiết kế các chức năng Admin</h3>
          <p className="mt-2 text-sm text-[#475569] leading-relaxed">
            Layout Dashboard dùng chung đã được tích hợp thành công. Bạn có thể tiếp tục tạo các trang quản lý người dùng tại{" "}
            <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-xs font-mono text-[#0F172A]">/admin/users</code>, khoa ngành tại{" "}
            <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-xs font-mono text-[#0F172A]">/admin/departments</code> và tài liệu tại{" "}
            <code className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-xs font-mono text-[#0F172A]">/admin/documents</code>.
          </p>
        </div>
      </div>
    </>
  );
}

