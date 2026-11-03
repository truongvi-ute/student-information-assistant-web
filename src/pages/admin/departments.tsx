import Head from "next/head";
import { AdminDepartmentsView } from "@/components/admin/AdminDepartmentsView";

export default function AdminDepartmentsPage() {
  return (
    <>
      <Head>
        <title>Quản lý danh mục đào tạo — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Quản lý danh mục Ngành học, Hệ đào tạo, Khóa đào tạo và Phòng ban Tư vấn viên."
        />
      </Head>

      <AdminDepartmentsView />
    </>
  );
}

