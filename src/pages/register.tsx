import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const RegistrationPage = dynamic(
  () =>
    import("@/components/registration/RegistrationPage").then(
      (mod) => mod.RegistrationPage
    ),
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

export default function Register() {
  return (
    <>
      <Head>
        <title>Tạo tài khoản — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Đăng ký tài khoản HCMUTE Student Assistant — Nền tảng hỗ trợ tra cứu thông tin và giải đáp thắc mắc."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <RegistrationPage />
    </>
  );
}
