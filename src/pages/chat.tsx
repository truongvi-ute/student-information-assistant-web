import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { authStorage } from "@/utils/auth-storage";
import { ROUTES } from "@/routes";

const ChatView = dynamic(
  () => import("@/components/chat/ChatContainer").then((mod) => mod.ChatContainer),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full min-h-screen bg-[#F8FAFC]"
        suppressHydrationWarning
      />
    ),
  }
);

export default function ChatPage() {
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();
  const [accountId, setAccountId] = useState(() => {
    if (typeof window !== "undefined") {
      return authStorage.getAccountId() || "";
    }
    return "";
  });

  useEffect(() => {
    if (!user || !user.fullName) {
      void refreshProfile();
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    const handleStorage = () => {
      setAccountId(authStorage.getAccountId() || "");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = () => {
    logout();
    void router.push(ROUTES.AUTH.LOGIN);
  };

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
        username={user?.fullName || user?.email || ""}
        accountId={accountId}
        currentUser={user}
        onLogout={handleLogout}
      />
    </>
  );
}
