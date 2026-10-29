import Head from "next/head";
import { ChatbotContainer } from "@/components/chatbot/ChatbotContainer";

export default function ChatbotPage() {
  return (
    <>
      <Head>
        <title>Hội thoại AI — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Tra cứu thông tin sinh viên cùng trợ lý AI."
        />
      </Head>

      <ChatbotContainer />
    </>
  );
}
