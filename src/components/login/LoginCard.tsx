import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
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
import { useLogin } from "@/hooks/useLogin";

interface LoginCardProps {
  onLoginSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    errorMessage,
    setErrorMessage,
    successMessage,
    needsVerification,
    handleLogin,
  } = useLogin({ onLoginSuccess });



  return (
    <div className="w-full max-w-[440px] flex flex-col z-20 text-slate-900">
      {/* Title & Subtitle */}
      <div className="text-left">
        <h2 className="text-2xl font-semibold leading-8 tracking-tight text-slate-900">
          Đăng nhập tài khoản
        </h2>
        <p className="mt-1.5 text-sm leading-5 text-slate-500">
          Chào mừng bạn trở lại.
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col flex-1" style={{ marginTop: "24px" }}>
        <div className="flex flex-col gap-4">
          {/* Email / MSSV Input */}
          <div className="w-full">
            <div className="auth-floating-field relative flex items-center w-full h-[52px] rounded-lg border border-[#CBD5E1] bg-white hover:border-[#94A3B8] focus-within:border-[var(--chat-primary)] focus-within:ring-2 focus-within:ring-[var(--chat-primary)]/15 transition-colors duration-150 motion-reduce:transition-none has-[:disabled]:bg-slate-50 has-[:disabled]:hover:border-[#CBD5E1]">
              <label
                htmlFor="login-identifier"
                className="auth-floating-label"
              >
                Email sinh viên hoặc MSSV
              </label>
              <div className="pl-3 pr-2.5 flex items-center pointer-events-none text-slate-600">
                <Mail className="w-[18px] h-[18px] stroke-[1.8]" aria-hidden="true" />
              </div>
              <Input
                id="login-identifier"
                name="identifier"
                type="text"
                placeholder=" "
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={isLoading}
                required
                autoComplete="username"
                className="w-full h-full border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-transparent pr-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none selection:bg-blue-500"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="w-full">
            <div className="auth-floating-field relative flex items-center w-full h-[52px] rounded-lg border border-[#CBD5E1] bg-white hover:border-[#94A3B8] focus-within:border-[var(--chat-primary)] focus-within:ring-2 focus-within:ring-[var(--chat-primary)]/15 transition-colors duration-150 motion-reduce:transition-none has-[:disabled]:bg-slate-50 has-[:disabled]:hover:border-[#CBD5E1]">
              <label
                htmlFor="login-password"
                className="auth-floating-label"
              >
                Mật khẩu
              </label>
              <div className="pl-3 pr-2.5 flex items-center pointer-events-none text-slate-600">
                <LockKeyhole className="w-[18px] h-[18px] stroke-[1.8]" aria-hidden="true" />
              </div>
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={isLoading}
                required
                autoComplete="current-password"
                className="w-full h-full border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-transparent pr-10 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none selection:bg-blue-500"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 p-1 text-slate-600 hover:text-slate-900 transition-colors rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-blue-400 cursor-pointer"

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
                ? "bg-[var(--chat-primary)] border-[var(--chat-primary)] text-white"
                : "bg-slate-50 border-slate-300 hover:border-slate-400"
                }`}
            >
              {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
            <span className="text-slate-600 font-normal">Ghi nhớ đăng nhập</span>
          </label>

          <Link
            href={ROUTES.AUTH.FORGOT_PASSWORD}
            className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-medium text-[13px] transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex flex-col gap-2 p-3 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[13px] leading-relaxed animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>

            {needsVerification && (
              <div className="mt-1 pt-2 border-t border-red-200 flex items-center justify-between">
                <span className="text-red-700 text-[12.5px] font-medium">
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
            className="mt-4 flex items-start gap-2.5 p-3 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] leading-relaxed animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Primary CTA Submit Button */}
        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-primary-hover)] w-full h-[48px] rounded-[9px] text-white font-semibold text-[15.5px] flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            style={{
              marginTop: "22px",
            }}
          >
            <span>{isLoading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />}
          </Button>
        </div>

        {/* Footer: Don't have an account */}
        <div className="mt-5 text-center text-[13px] text-slate-600">
          <span>Chưa có tài khoản? </span>
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-semibold cursor-pointer transition-colors"
            >
              Đăng ký ngay
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.REGISTER}
              className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-semibold"
            >
              Đăng ký ngay
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};
