import { useState, useMemo, type FormEvent } from "react";
import {
  Plus,
  Search,
  Edit3,
  Power,
  ShieldAlert,
  X,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type {
  CategoryItem,
  CategoryTabKey,
  CategoryStatus,
} from "@/types/admin";

const CATEGORY_TABS: {
  key: CategoryTabKey;
  label: string;
  singularLabel: string;
  description: string;
}[] = [
  {
    key: "MAJOR",
    label: "Ngành đào tạo",
    singularLabel: "ngành đào tạo",
    description: "Danh mục ngành học phục vụ hồ sơ Sinh viên (Bảng majors).",
  },
  {
    key: "EDUCATION_SYSTEM",
    label: "Hệ đào tạo",
    singularLabel: "hệ đào tạo",
    description:
      "Danh mục hệ đào tạo đại học, chất lượng cao, vừa làm vừa học (Bảng education_systems).",
  },
  {
    key: "COHORT",
    label: "Khóa đào tạo",
    singularLabel: "khóa đào tạo",
    description: "Danh mục niên khóa tuyển sinh của Sinh viên (Bảng cohorts).",
  },
  {
    key: "DEPARTMENT",
    label: "Phòng ban Tư vấn viên",
    singularLabel: "phòng ban / đơn vị",
    description:
      "Danh mục đơn vị chuyên môn giúp Sinh viên chọn đúng Tư vấn viên (Bảng departments).",
  },
];

const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: "MAJ-01",
    categoryType: "MAJOR",
    name: "Công nghệ thông tin",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "MAJ-02",
    categoryType: "MAJOR",
    name: "Kỹ thuật phần mềm",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "MAJ-03",
    categoryType: "MAJOR",
    name: "Trí tuệ nhân tạo",
    status: "ACTIVE",
    createdAt: "05/08/2026",
    updatedAt: "10/08/2026",
  },
  {
    id: "MAJ-04",
    categoryType: "MAJOR",
    name: "An toàn thông tin",
    status: "ACTIVE",
    createdAt: "05/08/2026",
    updatedAt: "05/08/2026",
  },
  {
    id: "MAJ-05",
    categoryType: "MAJOR",
    name: "Mạng máy tính và truyền thông (Cũ)",
    status: "INACTIVE",
    createdAt: "01/08/2025",
    updatedAt: "01/08/2026",
  },
  {
    id: "EDU-01",
    categoryType: "EDUCATION_SYSTEM",
    name: "Đại học chính quy (Tiếng Việt)",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "EDU-02",
    categoryType: "EDUCATION_SYSTEM",
    name: "Đại học chính quy (Tiếng Anh)",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "EDU-03",
    categoryType: "EDUCATION_SYSTEM",
    name: "Vừa làm vừa học",
    status: "INACTIVE",
    createdAt: "01/08/2025",
    updatedAt: "15/08/2026",
  },
  {
    id: "COH-01",
    categoryType: "COHORT",
    name: "Khóa 2023 (K23)",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "COH-02",
    categoryType: "COHORT",
    name: "Khóa 2024 (K24)",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "COH-03",
    categoryType: "COHORT",
    name: "Khóa 2025 (K25)",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "COH-04",
    categoryType: "COHORT",
    name: "Khóa 2026 (K26)",
    status: "ACTIVE",
    createdAt: "15/08/2026",
    updatedAt: "15/08/2026",
  },
  {
    id: "DEP-01",
    categoryType: "DEPARTMENT",
    name: "Phòng Đào tạo",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "DEP-02",
    categoryType: "DEPARTMENT",
    name: "Phòng Công tác Sinh viên",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
  {
    id: "DEP-03",
    categoryType: "DEPARTMENT",
    name: "Khoa Công nghệ thông tin",
    status: "ACTIVE",
    createdAt: "01/08/2026",
    updatedAt: "01/08/2026",
  },
];

export function AdminDepartmentsView() {
  const { user } = useAuth();
  const [items, setItems] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [activeTab, setActiveTab] = useState<CategoryTabKey>("MAJOR");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CategoryStatus>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [formError, setFormError] = useState("");

  const currentTabConfig =
    CATEGORY_TABS.find((t) => t.key === activeTab) ?? CATEGORY_TABS[0];

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchTab = item.categoryType === activeTab;
      const matchSearch = !q || item.name.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchTab && matchSearch && matchStatus;
    });
  }, [items, activeTab, searchQuery, statusFilter]);

  if (user && user.role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-[#B91C1C]" />
        <h2 className="mt-3 text-lg font-semibold text-[#B91C1C]">
          Không có quyền truy cập
        </h2>
        <p className="mt-1 text-sm text-[#7F1D1D]">
          Chức năng quản lý danh mục đào tạo chỉ dành cho Quản trị viên (ADMIN).
        </p>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingItem(null);
    setNameInput("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: CategoryItem) => {
    setEditingItem(item);
    setNameInput(item.name);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanName = nameInput.trim();
    if (!cleanName) {
      setFormError(`Vui lòng nhập tên ${currentTabConfig.singularLabel}.`);
      return;
    }

    const isDuplicate = items.some(
      (i) =>
        i.categoryType === activeTab &&
        i.name.toLowerCase() === cleanName.toLowerCase() &&
        i.id !== editingItem?.id
    );

    if (isDuplicate) {
      setFormError(`Tên ${currentTabConfig.singularLabel} này đã tồn tại.`);
      return;
    }

    const today = new Date().toLocaleDateString("vi-VN");

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, name: cleanName, updatedAt: today }
            : i
        )
      );
    } else {
      const created: CategoryItem = {
        id: `${activeTab.slice(0, 3)}-${Date.now().toString().slice(-3)}`,
        categoryType: activeTab,
        name: cleanName,
        status: "ACTIVE",
        createdAt: today,
        updatedAt: today,
      };
      setItems((prev) => [created, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (target: CategoryItem) => {
    const today = new Date().toLocaleDateString("vi-VN");
    setItems((prev) =>
      prev.map((i) =>
        i.id === target.id
          ? {
              ...i,
              status: i.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              updatedAt: today,
            }
          : i
      )
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header trang */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
              Quản lý danh mục đào tạo & Phòng ban
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Quản lý Ngành, Hệ đào tạo, Khóa đào tạo và Phòng ban Tư vấn viên. Bảo toàn dữ liệu lịch sử bằng trạng thái Ngừng sử dụng (UC12, QĐ12).
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E40AF]"
          >
            <Plus className="h-4 w-4" />
            Thêm {currentTabConfig.singularLabel}
          </button>
        </div>

        {/* Thanh 4 Tabs danh mục */}
        <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3">
          {CATEGORY_TABS.map((tab) => {
            const count = items.filter((i) => i.categoryType === tab.key).length;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery("");
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-[#1D4ED8] text-white shadow-xs"
                    : "bg-white text-[#475569] hover:bg-[#F1F5F9]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[#F1F5F9] text-[#475569]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mô tả tab & Bộ lọc */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm kiếm ${currentTabConfig.singularLabel}...`}
              className="w-full rounded-lg border border-[#CBD5E1] py-2 pl-9 pr-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | CategoryStatus)
            }
            aria-label="Lọc trạng thái danh mục"
            className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Ngừng sử dụng (INACTIVE)</option>
          </select>
        </div>

        {/* Bảng danh sách giá trị danh mục */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
          <div className="border-b border-[#F1F5F9] bg-[#F8FAFC] px-4 py-2.5 text-xs text-[#64748B]">
            {currentTabConfig.description}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-[#475569]">
                  <th className="px-4 py-3.5">Mã</th>
                  <th className="px-4 py-3.5">
                    Tên {currentTabConfig.singularLabel}
                  </th>
                  <th className="px-4 py-3.5">Trạng thái sử dụng</th>
                  <th className="px-4 py-3.5">Cập nhật gần nhất</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-[#64748B]"
                    >
                      Chưa có dữ liệu phù hợp trong danh mục này.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-[#64748B]">
                        {item.id}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#0F172A]">
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ACTIVE (Đang hoạt động)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#64748B]">
                            <PauseCircle className="h-3.5 w-3.5" />
                            INACTIVE (Ngừng sử dụng)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#64748B]">
                        {item.updatedAt}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#CBD5E1] px-2.5 py-1.5 text-xs font-medium text-[#334155] hover:bg-[#F1F5F9]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Đổi tên
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              item.status === "ACTIVE"
                                ? "border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]"
                                : "border border-[#86EFAC] text-[#15803D] hover:bg-[#F0FDF4]"
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {item.status === "ACTIVE"
                              ? "Ngừng sử dụng"
                              : "Kích hoạt lại"}
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

      {/* Modal Thêm / Chỉnh sửa giá trị danh mục */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">
                {editingItem
                  ? `Cập nhật ${currentTabConfig.singularLabel}`
                  : `Thêm ${currentTabConfig.singularLabel} mới`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-xs font-medium text-[#B91C1C]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#334155]">
                  Tên {currentTabConfig.singularLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={`Nhập tên ${currentTabConfig.singularLabel}...`}
                  className="mt-1 w-full rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <div className="rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
                Quy định QĐ12: Các giá trị đang{" "}
                <code className="font-mono font-semibold">ACTIVE</code> sẽ hiển
                thị cho Sinh viên và Tư vấn viên lựa chọn. Giá trị chuyển sang{" "}
                <code className="font-mono font-semibold">INACTIVE</code> vẫn
                được giữ lại để hiển thị cho các hồ sơ cũ.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

