import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const ForgotPasswordPage = dynamic(
  () =>
    import("@/components/forgot-password/ForgotPasswordPage").then(
      (mod) => mod.ForgotPasswordPage
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

export default function ForgotPassword() {
  return (
    <>
      <Head>
        <title>Khôi phục mật khẩu — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Khôi phục và đặt lại mật khẩu tài khoản HCMUTE Student Assistant qua mã xác thực OTP."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ForgotPasswordPage />
    </>
  );
}
