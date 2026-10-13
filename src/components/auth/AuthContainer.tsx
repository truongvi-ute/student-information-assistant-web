"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginCard } from "@/components/login/LoginCard";
import { RegistrationCard } from "@/components/registration/RegistrationCard";
import { OtpCard } from "@/components/otp/OtpCard";
import { ROUTES } from "@/routes";
import { authCardVariants, accessibleAuthCardVariants } from "@/animations/variants/auth";

export type AuthMode = "login" | "register";
export type AuthStep = "FORM" | "OTP";

interface AuthContainerProps {
  initialMode?: AuthMode;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  initialMode = "login",
}) => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("FORM");
  const [direction, setDirection] = useState<number>(initialMode === "login" ? 1 : -1);

  const [otpEmail, setOtpEmail] = useState<string>("");
  const [otpCooldown, setOtpCooldown] = useState<number>(60);

  // Sync mode with route changes and router queries
  useEffect(() => {
    if (router.pathname.includes("/register")) {
      setMode("register");
    } else if (router.pathname.includes("/login")) {
      setMode("login");
    }

    if (router.query.step === "otp" || router.query.step === "OTP") {
      setStep("OTP");
    } else {
      setStep("FORM");
    }

    if (typeof router.query.email === "string" && router.query.email) {
      setOtpEmail(router.query.email);
    }
  }, [router.pathname, router.query]);

  // Smooth switch handlers (Shallow routing to avoid full page reloads while animating 60fps)
  const handleSwitchToRegister = () => {
    setDirection(1);
    setMode("register");
    setStep("FORM");
    router.push(ROUTES.AUTH.REGISTER, undefined, { shallow: true });
  };

  const handleSwitchToLogin = () => {
    setDirection(-1);
    setMode("login");
    setStep("FORM");
    router.push(ROUTES.AUTH.LOGIN, undefined, { shallow: true });
  };

  const handleRegisterSuccess = (data?: {
    email: string;
    resendAvailableInSeconds?: number;
  }) => {
    if (data?.email) setOtpEmail(data.email);
    if (data?.resendAvailableInSeconds) setOtpCooldown(data.resendAvailableInSeconds);
    setDirection(1);
    setStep("OTP");

    router.push(
      {
        pathname: ROUTES.AUTH.REGISTER,
        query: { step: "otp", ...(data?.email ? { email: data.email } : {}) },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleBackToRegisterForm = () => {
    setDirection(-1);
    setStep("FORM");
    router.push(ROUTES.AUTH.REGISTER, undefined, { shallow: true });
  };

  const cardVariants = shouldReduceMotion ? accessibleAuthCardVariants : authCardVariants;

  const pageTitle =
    step === "OTP"
      ? "Xác thực mã OTP — HCMUTE Student Assistant"
      : mode === "login"
      ? "Đăng nhập tài khoản — HCMUTE Student Assistant"
      : "Tạo tài khoản — HCMUTE Student Assistant";

  const pageDesc =
    mode === "login"
      ? "Đăng nhập tài khoản HCMUTE Student Assistant để truy cập nền tảng trợ lý học tập thông minh cùng trí tuệ nhân tạo."
      : "Đăng ký tài khoản HCMUTE Student Assistant — Nền tảng hỗ trợ học tập thông minh cùng trí tuệ nhân tạo.";

  return (
    <AuthLayout
      title={pageTitle}
      description={pageDesc}
    >
      <div className="w-full flex justify-center overflow-visible">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === "OTP" ? (
            <motion.div
              key="otp-card"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex justify-center"
            >
              <OtpCard
                initialEmail={otpEmail}
                initialCooldown={otpCooldown}
                onBackToRegister={handleBackToRegisterForm}
              />
            </motion.div>
          ) : mode === "login" ? (
            <motion.div
              key="login-card"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex justify-center"
            >
              <LoginCard onSwitchToRegister={handleSwitchToRegister} />
            </motion.div>
          ) : (
            <motion.div
              key="register-card"
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex justify-center"
            >
              <RegistrationCard
                onSubmitSuccess={handleRegisterSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};
