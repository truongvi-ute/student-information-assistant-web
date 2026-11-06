import { useState, useMemo, type FormEvent } from "react";
import {
  Search,
  UserPlus,
  Eye,
  Lock,
  Unlock,
  ShieldAlert,
  X,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type {
  ManagedUser,
  UserRoleType,
  AccountStatusType,
} from "@/types/admin";

const INITIAL_USERS: ManagedUser[] = [];

const ACTIVE_DEPARTMENTS: string[] = [];

export function AdminUsersView() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRoleType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AccountStatusType>("ALL");

  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [confirmToggleUser, setConfirmToggleUser] = useState<ManagedUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newAdvisor, setNewAdvisor] = useState({
    fullName: "",
    email: "",
    initialPassword: "",
    departmentName: "",
    phoneNumber: "",
    note: "",
  });
  const [formError, setFormError] = useState("");

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  if (user && user.role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-[#B91C1C]" />
        <h2 className="mt-3 text-lg font-semibold text-[#B91C1C]">
          Không có quyền truy cập
        </h2>
        <p className="mt-1 text-sm text-[#7F1D1D]">
          Chức năng quản lý người dùng chỉ dành cho Quản trị viên (ADMIN).
        </p>
      </div>
    );
  }

  const handleConfirmToggleStatus = () => {
    if (!confirmToggleUser) return;
    setUsers((prev) =>
      prev.map((item) =>
        item.id === confirmToggleUser.id
          ? {
              ...item,
              status: item.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
            }
          : item
      )
    );
    setConfirmToggleUser(null);
  };

  const handleCreateAdvisor = (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanName = newAdvisor.fullName.trim();
    const cleanEmail = newAdvisor.email.trim().toLowerCase();
    const password = newAdvisor.initialPassword;

    if (!cleanName || !cleanEmail || !password) {
      setFormError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu khởi tạo.");
      return;
    }

    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password);
    if (!hasLetterAndNumber) {
      setFormError(
        "Mật khẩu khởi tạo phải tối thiểu 6 ký tự và chứa cả chữ lẫn số (QĐ02)."
      );
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setFormError("Email này đã tồn tại trong hệ thống (QĐ01).");
      return;
    }

    const created: ManagedUser = {
      id: `USR-00${users.length + 1}`,
      fullName: cleanName,
      email: cleanEmail,
      role: "ADVISOR",
      status: "ACTIVE",
      mustChangePassword: true,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      departmentName: newAdvisor.departmentName,
      phoneNumber: newAdvisor.phoneNumber.trim() || undefined,
      note: newAdvisor.note.trim() || undefined,
    };

    setUsers((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewAdvisor({
      fullName: "",
      email: "",
      initialPassword: "",
      departmentName: "",
      phoneNumber: "",
      note: "",
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header trang */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
              Quản lý người dùng
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Tra cứu hồ sơ Sinh viên, Tư vấn viên, quản lý trạng thái truy cập và khởi tạo tài khoản Tư vấn viên (UC11).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E40AF]"
          >
            <UserPlus className="h-4 w-4" />
            Khởi tạo Tư vấn viên
          </button>
        </div>

        {/* Thanh công cụ tìm kiếm & bộ lọc */}
        <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo họ tên hoặc email..."
              className="w-full rounded-lg border border-[#CBD5E1] py-2 pl-9 pr-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "ALL" | UserRoleType)
              }
              aria-label="Lọc theo vai trò"
              className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên (STUDENT)</option>
              <option value="ADVISOR">Tư vấn viên (ADVISOR)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | AccountStatusType)
              }
              aria-label="Lọc theo trạng thái"
              className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="BLOCKED">Đã khóa (BLOCKED)</option>
            </select>
          </div>
        </div>

        {/* Bảng danh sách người dùng */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-[#475569]">
                  <th className="px-4 py-3.5">Người dùng</th>
                  <th className="px-4 py-3.5">Vai trò</th>
                  <th className="px-4 py-3.5">Đơn vị / Ngành học</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Ngày tạo</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-[#64748B]"
                    >
                      Không tìm thấy người dùng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#0F172A]">
                          {item.fullName}
                        </p>
                        <p className="text-xs text-[#64748B]">{item.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.role === "ADVISOR"
                              ? "bg-[#E0F2FE] text-[#0369A1]"
                              : "bg-[#F1F5F9] text-[#334155]"
                          }`}
                        >
                          {item.role === "ADVISOR" ? "Tư vấn viên" : "Sinh viên"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#334155]">
                        {item.role === "ADVISOR"
                          ? item.departmentName || "—"
                          : item.majorName || "Chưa cập nhật"}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-xs font-semibold text-[#B91C1C]">
                            <Ban className="h-3.5 w-3.5" />
                            BLOCKED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#64748B]">
                        {item.createdAt}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] px-2.5 py-1.5 text-xs font-medium text-[#334155] transition-colors hover:bg-[#F1F5F9]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmToggleUser(item)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              item.status === "ACTIVE"
                                ? "border border-[#FCA5A5] text-[#B91C1C] hover:bg-[#FEF2F2]"
                                : "border border-[#86EFAC] text-[#15803D] hover:bg-[#F0FDF4]"
                            }`}
                          >
                            {item.status === "ACTIVE" ? (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3.5 w-3.5" />
                                Mở khóa
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal 1: Xem chi tiết hồ sơ (Chỉ đọc theo QĐ04 & UC11) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">
                Chi tiết hồ sơ người dùng
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="text-[#64748B]">Họ và tên:</span>
                <span className="col-span-2 font-semibold text-[#0F172A]">
                  {selectedUser.fullName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="text-[#64748B]">Email:</span>
                <span className="col-span-2 font-mono text-[#0F172A]">
                  {selectedUser.email}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="text-[#64748B]">Vai trò:</span>
                <span className="col-span-2 font-medium text-[#0F172A]">
                  {selectedUser.role === "ADVISOR"
                    ? "Tư vấn viên (ADVISOR)"
                    : "Sinh viên (STUDENT)"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                <span className="text-[#64748B]">Trạng thái:</span>
                <span className="col-span-2 font-semibold">
                  {selectedUser.status}
                </span>
              </div>

              {selectedUser.role === "STUDENT" ? (
                <>
                  <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                    <span className="text-[#64748B]">Ngành đào tạo:</span>
                    <span className="col-span-2 text-[#0F172A]">
                      {selectedUser.majorName || "Chưa khai báo"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                    <span className="text-[#64748B]">Hệ đào tạo:</span>
                    <span className="col-span-2 text-[#0F172A]">
                      {selectedUser.educationSystemName || "Chưa khai báo"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                    <span className="text-[#64748B]">Khóa đào tạo:</span>
                    <span className="col-span-2 text-[#0F172A]">
                      {selectedUser.cohortName || "Chưa khai báo"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                    <span className="text-[#64748B]">Phòng ban / Đơn vị:</span>
                    <span className="col-span-2 text-[#0F172A]">
                      {selectedUser.departmentName || "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                    <span className="text-[#64748B]">Số điện thoại:</span>
                    <span className="col-span-2 text-[#0F172A]">
                      {selectedUser.phoneNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-[#F1F5F9] pb-2">
                    <span className="text-[#64748B]">Đổi MK lần đầu:</span>
                    <span className="col-span-2 text-[#0F172A]">
                      {selectedUser.mustChangePassword
                        ? "Bắt buộc đổi khi đăng nhập (Chưa đổi)"
                        : "Đã hoàn tất"}
                    </span>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#64748B]">Ghi chú:</span>
                <span className="col-span-2 text-[#334155]">
                  {selectedUser.note || "Không có ghi chú"}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
              Lưu ý nghiệp vụ (UC11): Quản trị viên chỉ được quyền tra cứu hồ sơ và thay đổi trạng thái truy cập, không chỉnh sửa thông tin cá nhân của Sinh viên và Tư vấn viên.
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E293B]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Xác nhận Khóa / Mở khóa quyền truy cập */}
      {confirmToggleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#0F172A]">
              {confirmToggleUser.status === "ACTIVE"
                ? "Xác nhận chặn quyền truy cập"
                : "Xác nhận mở lại quyền truy cập"}
            </h3>
            <p className="mt-2 text-sm text-[#475569]">
              Bạn có chắc chắn muốn chuyển trạng thái tài khoản{" "}
              <span className="font-semibold text-[#0F172A]">
                {confirmToggleUser.email}
              </span>{" "}
              sang{" "}
              <span className="font-bold">
                {confirmToggleUser.status === "ACTIVE" ? "BLOCKED" : "ACTIVE"}
              </span>{" "}
              không?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmToggleUser(null)}
                className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${
                  confirmToggleUser.status === "ACTIVE"
                    ? "bg-[#B91C1C] hover:bg-[#991B1B]"
                    : "bg-[#15803D] hover:bg-[#166534]"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Khởi tạo tài khoản Tư vấn viên */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">
                Khởi tạo tài khoản Tư vấn viên
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvisor} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-xs font-medium text-[#B91C1C]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#334155]">
                  Họ và tên Tư vấn viên *
                </label>
                <input
                  type="text"
                  required
                  value={newAdvisor.fullName}
                  onChange={(e) =>
                    setNewAdvisor({ ...newAdvisor, fullName: e.target.value })
                  }
                  placeholder="VD: ThS. Nguyễn Văn A"
                  className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#334155]">
                    Email đăng nhập *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdvisor.email}
                    onChange={(e) =>
                      setNewAdvisor({ ...newAdvisor, email: e.target.value })
                    }
                    placeholder="advisor@hcmute.edu.vn"
                    className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155]">
                    Mật khẩu ban đầu *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdvisor.initialPassword}
                    onChange={(e) =>
                      setNewAdvisor({
                        ...newAdvisor,
                        initialPassword: e.target.value,
                      })
                    }
                    placeholder="Ít nhất 6 ký tự (chữ + số)"
                    className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#334155]">
                    Phòng ban / Đơn vị *
                  </label>
                  <select
                    value={newAdvisor.departmentName}
                    onChange={(e) =>
                      setNewAdvisor({
                        ...newAdvisor,
                        departmentName: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
                  >
                    <option value="">-- Chọn phòng ban / đơn vị --</option>
                    {ACTIVE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155]">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={newAdvisor.phoneNumber}
                    onChange={(e) =>
                      setNewAdvisor({
                        ...newAdvisor,
                        phoneNumber: e.target.value,
                      })
                    }
                    placeholder="090xxxxxxx"
                    className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155]">
                  Ghi chú chuyên môn
                </label>
                <textarea
                  rows={2}
                  value={newAdvisor.note}
                  onChange={(e) =>
                    setNewAdvisor({ ...newAdvisor, note: e.target.value })
                  }
                  placeholder="Lĩnh vực phụ trách tư vấn..."
                  className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <p className="rounded-lg bg-[#EFF6FF] p-2.5 text-xs text-[#1E40AF]">
                Theo quy định QĐ04: Tài khoản Tư vấn viên sau khi khởi tạo sẽ có cờ{" "}
                <code className="font-mono font-bold">
                  must_change_password = true
                </code>
                , buộc đổi mật khẩu trong lần đăng nhập đầu tiên.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

