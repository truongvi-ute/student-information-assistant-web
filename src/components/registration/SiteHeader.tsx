import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { BookOpen, ArrowRight } from "lucide-react";
import { ROUTES } from "@/routes";

export const SiteHeader: React.FC = () => {
  const router = useRouter();
  const isLoginPage = router.pathname.includes("/login");

  const promptText = isLoginPage ? "Chưa có tài khoản?" : "Đã có tài khoản?";
  const actionText = isLoginPage ? "Đăng ký" : "Đăng nhập";
  const actionHref = isLoginPage ? ROUTES.AUTH.REGISTER : ROUTES.AUTH.LOGIN;

  return (
    <header
      // SiteHeader luôn giữ vị trí khi cuộn thì dùng gì
      className="w-full fixed top-0 left-0 z-30 h-[85px] pointer-events-auto"
      role="banner"
    >
      {/* Desktop Exact Canvas Header (xl) */}
      <div className="relative w-full max-w-[1448px] h-full mx-auto hidden xl:block">
        {/* Brand logo & title */}
        <Link
          href={ROUTES.PUBLIC.HOME}
          className="absolute flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          style={{
            left: "109px",
            top: "37px",
          }}
          aria-label="HCMUTE Student Assistant Trang chủ"
        >
          <BookOpen className="w-[32px] h-[32px] text-white stroke-[2.2]" aria-hidden="true" />
          <span className="font-bold text-[20px] tracking-wide text-white ml-0.5">HCMUTE</span>
          <span className="text-white/40 text-[18px] font-light mx-1" aria-hidden="true">|</span>
          <span className="font-semibold text-[18px] text-white tracking-tight">STUDENT ASSITANT</span>
        </Link>

        {/* Right: Combined Navigation and Auth Action (Keeps center 100% clear over the building) */}
        <div
          className="absolute flex items-center gap-6"
          style={{
            right: "101px",
            top: "32px",
          }}
        >
          <nav
            className="flex items-center gap-6 mr-1"
            aria-label="Điều hướng chính"
          >
            <Link
              href={ROUTES.PUBLIC.ABOUT}
              className="text-white/85 hover:text-white font-medium text-[14.5px] transition-colors"
            >
              Giới thiệu
            </Link>
            <Link
              href={ROUTES.PUBLIC.FEATURES}
              className="text-white/85 hover:text-white font-medium text-[14.5px] transition-colors"
            >
              Tính năng
            </Link>
            <Link
              href={ROUTES.PUBLIC.SUPPORT}
              className="text-white/85 hover:text-white font-medium text-[14.5px] transition-colors"
            >
              Hỗ trợ
            </Link>
          </nav>

          <div className="h-5 w-[1px] bg-white/20" aria-hidden="true" />

          <div className="flex items-center gap-3.5">
            <span className="text-white/80 text-[14px] font-normal">
              {promptText}
            </span>
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-white/85 text-white text-[14.5px] font-medium hover:bg-white/10 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 backdrop-blur-md"
              style={{ width: "130px", height: "43px" }}
            >
              <span>{actionText}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive Header for screens < xl */}
      <div className="w-full h-full flex items-center justify-between px-4 sm:px-8 xl:hidden">
        <Link
          href={ROUTES.PUBLIC.HOME}
          className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          aria-label="HCMUTE TLCN AI Trang chủ"
        >
          <BookOpen className="w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] text-white stroke-[2.2]" aria-hidden="true" />
          <span className="font-bold text-[17px] sm:text-[19px] tracking-wide text-white">HCMUTE</span>
          <span className="text-white/40 text-[16px] font-light" aria-hidden="true">|</span>
          <span className="font-semibold text-[16px] sm:text-[17px] text-white tracking-tight">TLCN AI</span>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <span className="text-white/80 text-[13px] font-normal hidden sm:inline">
            {promptText}
          </span>
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-sm border-[1.5px] border-white/85 text-white text-[13px] sm:text-[14px] font-medium hover:bg-white/10 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ height: "36px" }}
          >
            <span>{actionText}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
};
