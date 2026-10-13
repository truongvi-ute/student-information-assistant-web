import React, { ReactNode, useEffect } from "react";
import Head from "next/head";
import { SiteHeader } from "@/components/registration/SiteHeader";
interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  heroContent?: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Tạo tài khoản — HCMUTE Student Assistant",
  description = "Nền tảng hỗ trợ sinh viên HCMUTE cùng trí tuệ nhân tạo.",
}) => {
  useEffect(() => {
    // Ẩn thanh cuộn trên html và body khi ở trang Auth nhưng vẫn giữ chức năng cuộn
    document.documentElement.classList.add("no-scrollbar");
    document.body.classList.add("no-scrollbar");

    return () => {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        className="registration-scope no-scrollbar w-full min-h-screen bg-[#071a3d] text-white flex justify-center items-start overflow-x-hidden relative selection:bg-blue-600 selection:text-white"
        suppressHydrationWarning
      >
        {/* Full-bleed responsive background layer covering 100% of viewport */}
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/images/hcmute-panoramic-new.jpg')",
            backgroundPosition: "center center",
          }}
          aria-hidden="true"
        >
          {/* Lớp phủ giảm độ sáng toàn màn hình (Tăng/giảm độ tối bằng cách chỉnh sửa /60 hoặc /70) */}
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />

          {/* Lớp phủ bổ sung trên mobile (giữ nguyên của bạn) */}
          <div className="absolute inset-0 bg-[#071a3d]/45 xl:hidden pointer-events-none" />
        </div>

        {/* Unified Site Header */}
        <SiteHeader />

        {/* Unified Main Viewport */}
        <main className="relative z-10 w-full min-h-screen flex items-center justify-center pt-12 pb-8 xl:pt-[88px] xl:pb-6 px-4 sm:px-6 xl:px-8">
          {/* Trending Dual-Panel Glass Shell */}
          <div className="w-full max-w-[500px] mx-auto rounded-[10px] sm:rounded-[15px] border border-white/20 shadow-[0_28px_90px_rgba(0,0,0,0.6),0_0_35px_rgba(56,189,248,0.12)] flex flex-col xl:flex-row items-stretch overflow-hidden relative">
            {/* Sleek top edge accent light sheen */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none z-30" />
            {/* Right Panel: Compact Form Card Side (40% split) */}
            <div className="w-full px-5 py-4 sm:px-7 sm:py-6 flex flex-col justify-center items-center bg-[#071a3d]/45 backdrop-blur-2xl relative z-20">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};
