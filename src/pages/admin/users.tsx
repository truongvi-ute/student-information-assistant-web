import Head from "next/head";
import { AdminUsersView } from "@/components/admin/AdminUsersView";

export default function AdminUsersPage() {
  return (
    <>
      <Head>
        <title>Quản lý người dùng — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Tra cứu hồ sơ Sinh viên, Tư vấn viên, quản lý trạng thái truy cập và khởi tạo tài khoản Tư vấn viên."
        />
      </Head>

      <AdminUsersView />
    </>
  );
}

