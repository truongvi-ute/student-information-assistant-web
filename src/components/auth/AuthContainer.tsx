import React, { useState } from "react";
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

  // Xác định chế độ hiển thị và bước từ URL
  const mode: AuthMode = router.pathname === ROUTES.AUTH.REGISTER
    ? "register"
    : router.pathname === ROUTES.AUTH.LOGIN 
    ? "login" 
    : initialMode;

  const isOtpStep = router.query.step === "otp" || router.query.step === "OTP";
  const step: AuthStep = isOtpStep ? "OTP" : "FORM";

  const [direction, setDirection] = useState<number>(initialMode === "login" ? 1 : -1);
  const [customOtpEmail, setCustomOtpEmail] = useState<string>("");
  const [otpCooldown, setOtpCooldown] = useState<number>(60);

  const queryEmail = typeof router.query.email === "string" ? router.query.email : "";
  const otpEmail = customOtpEmail || queryEmail;

  // Điều hướng chuyển đổi mượt mà giữa Đăng nhập và Đăng ký
  const handleSwitchToRegister = () => {
    setDirection(1);
    void router.push(ROUTES.AUTH.REGISTER);
  };

  const handleSwitchToLogin = () => {
    setDirection(-1);
    void router.push(ROUTES.AUTH.LOGIN);
  };

  const handleRegisterSuccess = (data?: {
    email: string;
    resendAvailableInSeconds?: number;
  }) => {
    if (data?.email) setCustomOtpEmail(data.email);
    if (data?.resendAvailableInSeconds !== undefined) {
      setOtpCooldown(data.resendAvailableInSeconds);
    }

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
