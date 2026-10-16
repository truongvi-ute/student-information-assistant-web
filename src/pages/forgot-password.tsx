import dynamic from "next/dynamic";
import Head from "next/head";

const ForgotPasswordView = dynamic(
  () =>
    import("@/components/forgot-password/ForgotPasswordView").then(
      (mod) => mod.ForgotPasswordView
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

export default function ForgotPasswordPage() {
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
      <ForgotPasswordView />
    </>
  );
}
