import Head from "next/head";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export default function AdminDashboardPage() {
  return (
    <>
      <Head>
        <title>Tổng quan hệ thống — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Bảng tổng quan quản trị hệ thống, người dùng, danh mục đào tạo và nguồn tri thức RAG."
        />
      </Head>

      <AdminDashboardView />
    </>
  );
}
