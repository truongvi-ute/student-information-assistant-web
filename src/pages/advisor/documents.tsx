import Head from "next/head";
import { AdvisorDocumentsView } from "@/components/advisor/AdvisorDocumentsView";

/**
 * Trang quản lý tài liệu và gửi yêu cầu xét duyệt RAG dành cho Tư vấn viên (UC09).
 */
export default function AdvisorDocumentsPage() {
  return (
    <>
      <Head>
        <title>Quản lý yêu cầu tài liệu — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Tải lên tài liệu nháp (.pdf, .docx) và gửi yêu cầu ADD, UPDATE, DELETE nguồn tri thức RAG."
        />
      </Head>
      <AdvisorDocumentsView />
    </>
  );
}

