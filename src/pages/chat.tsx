import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import { authStorage } from "@/utils/auth-storage";

const ChatView = dynamic(
  () => import("@/components/chat/ChatContainer").then((mod) => mod.ChatContainer),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-screen bg-[#F8FAFC]"
      />
    ),
  }
);

export default function ChatPage() {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState(() => {
    if (typeof window !== "undefined") {
      return authStorage.getAccountId() || "";
    }
    return "";
  });

  useEffect(() => {
    const handleStorage = () => {
      setAccountId(authStorage.getAccountId() || "");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <>
      <Head>
        <title>Tin nhắn — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Trao đổi trực tiếp giữa Cố vấn học tập và sinh viên."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ChatView
        accountId={accountId}
        currentUser={user}
      />
    </>
  );
}
