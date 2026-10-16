"use client";
import dynamic from "next/dynamic";
import Head from "next/head";

const ChatView = dynamic(
    () => import("@/components/chat/ChatContainer").then((mod) => mod.ChatContainer),
    {
        ssr: false,
        loading: () => (
            <div
                className="w-full min-h-screen bg-[#071a3d]"
                suppressHydrationWarning
            />
        ),
    }
);

export default function ChatPage() {
    return (
        <>
            <Head>
                <title>Chat — HCMUTE Student Assistant</title>
                <meta
                    name="description"
                    content="Chat với trợ lý học tập thông minh cùng trí tuệ nhân tạo."
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <ChatView username="Nhat Anh" />
        </>
    );
}