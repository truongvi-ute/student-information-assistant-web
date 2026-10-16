import dynamic from "next/dynamic";
import Head from "next/head";

const OtpView = dynamic(
  () => import("@/components/otp/OtpView").then((mod) => mod.OtpView),
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

export default function VerifyOtpPage() {
  return (
    <>
      <Head>
        <title>Xác thực mã OTP — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Nhập mã xác thực OTP gồm 6 chữ số để kích hoạt tài khoản HCMUTE Student Assistant."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <OtpView />
    </>
  );
}
