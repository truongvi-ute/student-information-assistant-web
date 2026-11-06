import Link from "next/link";
import {
  Users,
  BookOpen,
  FileText,
  Clock,
  ShieldAlert,
  ArrowRight,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/routes";
import type { PendingRequestSummary, AuditLogEntry } from "@/types/admin";

const PENDING_REQUESTS: PendingRequestSummary[] = [];

const RECENT_AUDIT_LOGS: AuditLogEntry[] = [];

export function AdminDashboardView() {
  const { user } = useAuth();

  if (user && user.role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-[#B91C1C]" />
        <h2 className="mt-3 text-lg font-semibold text-[#B91C1C]">
          Không có quyền truy cập
        </h2>
        <p className="mt-1 text-sm text-[#7F1D1D]">
          Khu vực này chỉ dành riêng cho tài khoản Quản trị viên (ADMIN).
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Tổng người dùng",
      value: "0",
      desc: "0 Sinh viên · 0 Tư vấn viên",
      icon: Users,
      href: ROUTES.ADMIN.USERS,
      color: "text-[#1D4ED8] bg-[#EFF6FF]",
    },
    {
      title: "Danh mục đào tạo",
      value: "0",
      desc: "Ngành, Hệ, Khóa & Phòng ban",
      icon: BookOpen,
      href: ROUTES.ADMIN.DEPARTMENTS,
      color: "text-[#15803D] bg-[#F0FDF4]",
    },
    {
      title: "Nguồn tri thức RAG",
      value: "0",
      desc: "Tài liệu ACTIVE & READY",
      icon: FileText,
      href: ROUTES.ADMIN.DOCUMENTS,
      color: "text-[#0369A1] bg-[#F0F9FF]",
    },
    {
      title: "Yêu cầu chờ duyệt",
      value: "0",
      desc: "Đề xuất từ Tư vấn viên (PENDING)",
      icon: Clock,
      href: ROUTES.ADMIN.DOCUMENTS,
      color: "text-[#D97706] bg-[#FFFBEB]",
    },
  ];

  const getRequestBadge = (type: PendingRequestSummary["type"]) => {
    switch (type) {
      case "ADD":
        return "bg-[#DCFCE7] text-[#15803D]";
      case "UPDATE":
        return "bg-[#DBEAFE] text-[#1D4ED8]";
      case "DELETE":
        return "bg-[#FEE2E2] text-[#B91C1C]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header chào mừng */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
            Tổng quan Quản trị hệ thống
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Xin chào, {user?.fullName || "Quản trị viên"}. Theo dõi hoạt động người dùng, danh mục đào tạo và nguồn tri thức RAG.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={ROUTES.ADMIN.USERS}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
          >
            Quản lý người dùng
          </Link>
          <Link
            href={ROUTES.ADMIN.DEPARTMENTS}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1E40AF]"
          >
            Cấu hình danh mục
          </Link>
        </div>
      </div>

      {/* Lưới thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all hover:border-[#93C5FD] hover:shadow-sm"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#64748B]">
                  {card.title}
                </p>
                <p className="mt-0.5 text-xl font-bold text-[#0F172A] group-hover:text-[#1D4ED8]">
                  {card.value}
                </p>
                <p className="truncate text-xs text-[#94A3B8]">{card.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Khu vực 2 cột: Yêu cầu tài liệu chờ duyệt & Nhật ký hệ thống */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cột 1: Yêu cầu tài liệu chờ duyệt (UC10) */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Yêu cầu tài liệu chờ xét duyệt
              </h3>
              <p className="text-xs text-[#64748B]">
                Các đề xuất ADD / UPDATE / DELETE từ Tư vấn viên
              </p>
            </div>
            <Link
              href={ROUTES.ADMIN.DOCUMENTS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] hover:underline"
            >
              Xem tất cả
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#F1F5F9]">
            {PENDING_REQUESTS.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#64748B]">
                Hiện chưa có yêu cầu tài liệu nào đang chờ xét duyệt.
              </p>
            ) : (
              PENDING_REQUESTS.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-bold ${getRequestBadge(
                          req.type
                        )}`}
                      >
                        {req.type}
                      </span>
                      <p className="truncate text-sm font-medium text-[#0F172A]">
                        {req.title}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Đề xuất bởi:{" "}
                      <span className="font-medium text-[#334155]">
                        {req.advisor}
                      </span>{" "}
                      ({req.department})
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[#94A3B8]">
                    {req.createdAt}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột 2: Nhật ký hệ thống (AuditLog - Bảng 30) */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#1D4ED8]" />
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Nhật ký hoạt động gần đây
                </h3>
                <p className="text-xs text-[#64748B]">
                  Ghi nhận tự động các thao tác quản trị (Audit Log)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-[#F1F5F9]">
            {RECENT_AUDIT_LOGS.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#64748B]">
                Chưa có nhật ký hoạt động nào được ghi nhận.
              </p>
            ) : (
              RECENT_AUDIT_LOGS.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A]">
                      {log.action}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#64748B]">
                      Đối tượng:{" "}
                      <span className="font-mono text-[#334155]">
                        {log.target}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[#94A3B8]">
                    {log.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

