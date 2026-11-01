import React, { ReactNode } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  heroContent?: ReactNode;
  wide?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Tạo tài khoản — HCMUTE Student Assistant",
  description = "Nền tảng hỗ trợ sinh viên HCMUTE cùng trí tuệ nhân tạo.",
  heroContent,
  wide = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="registration-scope min-h-dvh bg-[var(--chat-bg)] text-slate-900 selection:bg-[var(--chat-selected-bg)]">
        <main className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
          <Card className={`relative grid w-full gap-0 overflow-hidden border-white p-2 shadow-[0_24px_70px_rgba(8,31,75,0.15)] ${wide ? "max-w-[1024px] lg:grid-cols-[320px_1fr]" : "max-w-[940px] md:grid-cols-[0.85fr_1.15fr]"}`}>
            <aside className={`hidden flex-col gap-6 rounded-lg border border-blue-100 bg-linear-to-br from-[#F4F8FF] via-[var(--chat-info-bg)] to-[var(--chat-selected-bg)] p-5 text-[var(--ink-950)] ${wide ? "lg:flex" : "md:flex"} lg:p-6`}>
              <Link href={ROUTES.PUBLIC.CHATBOT} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-primary)] focus-visible:ring-offset-4">
                <Image src="/assets/images/hcmute-logo.png" alt="Logo HCMUTE" width={48} height={52} className="h-[52px] w-12 shrink-0 object-contain" />
                <span className="flex flex-col gap-1">
                  <span className="text-base font-semibold leading-5 tracking-tight text-[var(--ink-950)]">AIChatBot</span>
                  <span className="text-[11px] font-medium leading-4 tracking-[0.08em] text-[var(--ink-600)]">HCMUTE</span>
                </span>
              </Link>

              {heroContent || (
                <motion.div
                  className="flex flex-1 flex-col pt-4"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                >
                  <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ink-600)]">Trợ lý sinh viên</p>
                  <h2 className="mb-8 text-[36px] font-semibold leading-[1.12] tracking-tight text-[var(--ink-950)] lg:text-[40px]">
                    <span className="block">Thông tin</span>
                    <span className="block">học tập.</span>
                    <span className="mt-2 block text-[var(--chat-primary)]">Trong</span>
                    <span className="block text-[var(--chat-primary)]">tầm tay.</span>
                  </h2>

                  <div className="relative mt-auto">
                    <span aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-blue-200" />
                    <ul className="relative space-y-4 text-sm text-[var(--ink-800)]">
                      {[
                        "Hỏi đáp cùng AI",
                        "Tra cứu thông tin",
                        "Kết nối Cố vấn",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <span aria-hidden="true" className="h-[11px] w-[11px] shrink-0 rounded-full border-2 border-[var(--chat-primary)] bg-white" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </aside>

            <Button asChild variant="ghost" size="icon" className="absolute right-3 top-3 z-30 h-8 w-8 rounded-full text-slate-400 hover:text-slate-700">
              <Link href={ROUTES.PUBLIC.CHATBOT} aria-label="Quay lại Chatbot">
                <X className="h-4 w-4" />
              </Link>
            </Button>

            <CardContent className="flex min-w-0 flex-col items-center justify-center px-5 py-12 sm:px-7 md:pl-8 md:pr-6">
              {children}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};
