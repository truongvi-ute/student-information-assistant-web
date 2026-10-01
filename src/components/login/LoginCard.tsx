"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ROUTES } from "@/routes";
import { buildVerifyOtpUrl } from "@/routes/paths";
import {
  Mail,
  LockKeyhole,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
} from "lucide-react";
import { SocialButton } from "@/components/registration/SocialButton";
import { authService } from "@/services/auth.service";
import { authStorage } from "@/utils/auth-storage";
import { ApiClientError } from "@/lib/api/api-error";

interface LoginCardProps {
  onLoginSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const router = useRouter();

  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);

  // Initialize email from query or remembered storage
  useEffect(() => {
    if (typeof router.query.email === "string" && router.query.email) {
      setIdentifier(router.query.email);
    } else {
      const savedEmail = authStorage.getRememberedEmail();
      if (savedEmail) {
        setIdentifier(savedEmail);
        setRememberMe(true);
      }
    }
  }, [router.query.email]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");
    setNeedsVerification(false);

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setErrorMessage("Vui lòng nhập Email sinh viên hoặc Mã số sinh viên (MSSV).");
      return;
    }

    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await authService.login({
        email: trimmedIdentifier,
        password,
        rememberMe,
      });

      setSuccessMessage(response?.message || "Đăng nhập thành công! Đang chuyển hướng...");

      // Determine redirect target (prioritize query param ?redirect=...)
      const redirectTarget =
        typeof router.query.redirect === "string" && router.query.redirect
          ? decodeURIComponent(router.query.redirect)
          : ROUTES.PORTAL.CHAT;

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      setTimeout(() => {
        router.push(redirectTarget);
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);

        // Detect unverified account state from error code or text
        const isUnverified =
          err.error?.code === "ACCOUNT_NOT_VERIFIED" ||
          err.error?.code === "EMAIL_NOT_VERIFIED" ||
          err.message.toLowerCase().includes("kích hoạt") ||
          err.message.toLowerCase().includes("xác thực") ||
          err.message.toLowerCase().includes("unverified");

        if (isUnverified) {
          setNeedsVerification(true);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] flex flex-col z-20 text-white">
      {/* Title & Subtitle */}
      <div className="text-center">
        <h2 className="text-[26px] sm:text-[28px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          Đăng nhập tài khoản
        </h2>
        <p className="text-[13.5px] text-[#cbd5e1] mt-1.5 font-normal">
          Chào mừng bạn quay trở lại với HCMUTE Student Assistant
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col flex-1" style={{ marginTop: "24px" }}>
        <div className="flex flex-col gap-4">
          {/* Email / MSSV Input */}
          <div className="w-full">
            <label
              htmlFor="login-identifier"
              className="block text-[13px] font-medium text-slate-200 mb-1.5"
            >
              Email sinh viên hoặc MSSV
            </label>
            <div className="relative flex items-center w-full h-[42px] rounded-[7px] border border-white/15 bg-white/[0.07] hover:border-white/25 focus-within:border-blue-400 focus-within:bg-white/[0.12] focus-within:ring-2 focus-within:ring-blue-400/25 transition-all">
              <div className="pl-3 pr-2.5 flex items-center pointer-events-none text-slate-300">
                <Mail className="w-[18px] h-[18px] stroke-[1.8]" aria-hidden="true" />
              </div>
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                placeholder="example@hcmute.edu.vn hoặc 21110xxx"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                required
                autoComplete="username"
                className="w-full h-full pr-3 bg-transparent text-[13.5px] text-white placeholder-slate-400 outline-none selection:bg-blue-500"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="w-full">
            <label
              htmlFor="login-password"
              className="block text-[13px] font-medium text-slate-200 mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative flex items-center w-full h-[42px] rounded-[7px] border border-white/15 bg-white/[0.07] hover:border-white/25 focus-within:border-blue-400 focus-within:bg-white/[0.12] focus-within:ring-2 focus-within:ring-blue-400/25 transition-all">
              <div className="pl-3 pr-2.5 flex items-center pointer-events-none text-slate-300">
                <LockKeyhole className="w-[18px] h-[18px] stroke-[1.8]" aria-hidden="true" />
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                required
                autoComplete="current-password"
                className="w-full h-full pr-10 bg-transparent text-[13.5px] text-white placeholder-slate-400 outline-none selection:bg-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-300 hover:text-white transition-colors rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-blue-400 cursor-pointer"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px] stroke-[1.8]" />
                ) : (
                  <Eye className="w-[18px] h-[18px] stroke-[1.8]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between mt-3 text-[13px]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={rememberMe}
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-[17px] h-[17px] rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${rememberMe
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-white/[0.08] border-white/25 hover:border-white/40"
                }`}
            >
              {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
            <span className="text-slate-300 font-normal">Ghi nhớ đăng nhập</span>
          </label>

          <Link
            href={ROUTES.AUTH.FORGOT_PASSWORD}
            className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-medium text-[13px] transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-2 p-3 rounded-[10px] bg-red-950/70 border border-red-500/40 text-red-200 text-[13px] leading-relaxed animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>

            {needsVerification && (
              <div className="mt-1 pt-2 border-t border-red-500/30 flex items-center justify-between">
                <span className="text-red-200 text-[12.5px] font-medium">
                  Tài khoản của bạn chưa được kích hoạt?
                </span>
                <Link
                  href={buildVerifyOtpUrl({ email: identifier })}
                  className="px-2.5 py-1 rounded-[6px] bg-red-600 hover:bg-red-500 text-white text-[12px] font-semibold transition-colors inline-flex items-center gap-1 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Xác thực OTP</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2.5 p-3 rounded-[10px] bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-[13px] leading-relaxed animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Primary CTA Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="cta-gradient-btn w-full h-[48px] rounded-[9px] text-white font-semibold text-[15.5px] flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(74,92,255,0.4)]"
            style={{
              marginTop: "22px",
            }}
          >
            <span>{isLoading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />}
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex items-center justify-center" style={{ marginTop: "22px" }}>
          <div className="w-full border-t border-white/15" />
          <span className="bg-[#0b234f] px-3.5 py-0.5 text-[12px] text-slate-300 absolute rounded-full border border-white/15">
            Hoặc tiếp tục với
          </span>
        </div>

        {/* Social Login Buttons */}
        <div className="flex items-center gap-3.5" style={{ marginTop: "18px" }}>
          <SocialButton provider="google" actionText="Đăng nhập" variant="glass" />
        </div>

        {/* Footer: Don't have an account */}
        <div className="mt-5 text-center text-[13px] text-slate-300">
          <span>Chưa có tài khoản? </span>
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-semibold cursor-pointer transition-colors"
            >
              Đăng ký ngay
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.REGISTER}
              className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-semibold"
            >
              Đăng ký ngay
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};
