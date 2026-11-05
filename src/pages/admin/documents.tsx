import Head from "next/head";
import { AdminDocumentsView } from "@/components/admin/AdminDocumentsView";

/**
 * Trang quản lý kho tài liệu đào tạo và xét duyệt yêu cầu RAG dành cho Quản trị viên (UC10).
 */
export default function AdminDocumentsPage() {
  return (
    <>
      <Head>
        <title>Quản lý kho tài liệu — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Quản lý kho tài liệu đào tạo RAG và xét duyệt các yêu cầu thay đổi từ Tư vấn viên."
        />
      </Head>
      <AdminDocumentsView />
    </>
  );
}

