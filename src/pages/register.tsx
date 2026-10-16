import dynamic from "next/dynamic";
import Head from "next/head";

const RegistrationView = dynamic(
  () =>
    import("@/components/registration/RegistrationView").then(
      (mod) => mod.RegistrationView
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-screen bg-[#071a3d]" />
    ),
  }
);

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Tạo tài khoản — HCMUTE Student Assistant</title>
        <meta
          name="description"
          content="Đăng ký tài khoản HCMUTE Student Assistant — Nền tảng hỗ trợ tra cứu thông tin và giải đáp thắc mắc."
          key="description"
        />
      </Head>

      <RegistrationView />
    </>
  );
}
