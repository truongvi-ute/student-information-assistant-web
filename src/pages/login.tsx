import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const LoginView = dynamic(
  () => import("@/components/login/LoginView").then((mod) => mod.LoginView),
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

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Đăng nhập tài khoản — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Đăng nhập tài khoản HCMUTE Student Assistant để truy cập nền tảng trợ lý học tập thông minh cùng trí tuệ nhân tạo."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <LoginView />
    </>
  );
}
