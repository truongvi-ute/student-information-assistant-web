import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import { ROUTES } from "@/routes";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  ArrowLeft,
  Clock,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Edit2,
} from "lucide-react";
import { OtpInput } from "./OtpInput";
import { useOtp } from "@/hooks/useOtp";

interface OtpCardProps {
  initialEmail?: string;
  initialCooldown?: number;
  onVerifySuccess?: () => void | Promise<void>;
  onResendOtp?: (email: string) => Promise<void> | void;
  onBackToRegister?: () => void;
}

export const OtpCard: React.FC<OtpCardProps> = ({
  initialEmail,
  initialCooldown = 60,
  onVerifySuccess,
  onResendOtp,
  onBackToRegister,
}) => {
  const {
    email,
    otp,
    setOtp,
    isLoading,
    isResending,
    cooldown,
    errorMessage,
    setErrorMessage,
    successMessage,
    formatSeconds,
    handleVerify,
    handleResend,
  } = useOtp({
    initialEmail,
    initialCooldown,
    onVerifySuccess,
    onResendOtp,
  });


  return (
    <div className="w-full max-w-[440px] flex flex-col z-20 text-slate-900">
      {/* Icon Badge */}
      <div className="flex justify-center mb-3">
        <div className="w-[54px] h-[54px] rounded-[10px] bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center text-blue-600 shadow-xs">
          <ShieldCheck className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="text-left">
        <h2 className="text-2xl font-semibold leading-8 tracking-tight text-slate-900">
          Xác thực mã OTP
        </h2>
        <p className="mt-1.5 text-sm leading-5 text-slate-500">
          Mã xác thực gồm 6 chữ số đã được gửi đến email
        </p>

        {/* Email Pill Badge with Edit action */}
        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-slate-50 border border-slate-200 text-[13px] text-slate-700 font-medium max-w-full">
          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[240px] sm:max-w-[300px]">{email}</span>
          {onBackToRegister ? (
            <button
              type="button"
              onClick={onBackToRegister}
              className="text-[var(--chat-primary)] hover:underline flex items-center gap-1 text-[12px] font-semibold pl-1.5 border-l border-slate-200 ml-0.5 cursor-pointer outline-none"
              title="Đổi địa chỉ email"
            >
              <Edit2 className="w-3 h-3" />
              <span>Đổi</span>
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.REGISTER}
              className="text-[var(--chat-primary)] hover:underline flex items-center gap-1 text-[12px] font-semibold pl-1.5 border-l border-slate-200 ml-0.5"
              title="Đổi địa chỉ email"
            >
              <Edit2 className="w-3 h-3" />
              <span>Đổi</span>
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col flex-1" style={{ marginTop: "24px" }}>
        {/* 6-Digit OTP Input */}
        <div>
          <label className="block text-center text-[13px] font-medium text-slate-700 mb-3">
            Nhập mã bảo mật
          </label>
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (errorMessage) setErrorMessage("");
            }}
            disabled={isLoading}
            isError={Boolean(errorMessage)}
          />
        </div>

        {/* Cooldown Timer & Resend Button */}
        <div className="mt-5 flex items-center justify-center text-[13.5px]">
          {cooldown > 0 ? (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-4 h-4 text-blue-600 stroke-[2]" aria-hidden="true" />
              <span>Gửi lại mã sau</span>
              <span className="font-semibold text-blue-600 tabular-nums">
                ({formatSeconds(cooldown)})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>Chưa nhận được mã?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 outline-none"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                <span>{isResending ? "Đang gửi lại..." : "Gửi lại mã OTP"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 p-3 rounded-[7px] bg-red-50 border border-red-200 text-red-700 text-[13px] leading-relaxed animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2.5 p-3 rounded-[7px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] leading-relaxed animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Primary CTA */}
        <div style={{ marginTop: "24px" }}>
          <Button
            type="submit"
            disabled={isLoading || otp.length < 6}
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-primary-hover)] w-full h-[48px] rounded-[7px] text-white font-semibold text-[15.5px] flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <span>{isLoading ? "Đang xác thực..." : "Xác nhận & Kích hoạt"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />}
          </Button>
        </div>

        {/* Security Help Note */}
        <p className="mt-4 text-center text-[12px] text-slate-600 leading-normal px-2">
          Mã OTP có thời hạn trong vòng <span className="text-slate-900 font-medium">5 phút</span>.
          Vui lòng kiểm tra kỹ cả thư mục <span className="text-slate-900 font-medium">Spam / Rác</span> nếu
          chưa thấy email.
        </p>

        {/* Divider */}
        <div className="w-full border-t border-slate-200 my-4" />

        {/* Bottom Actions */}
        <div className="flex items-center justify-between text-[13px]">
          {onBackToRegister ? (
            <button
              type="button"
              onClick={onBackToRegister}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
              <span>Quay lại đăng ký</span>
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.REGISTER}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
              <span>Quay lại đăng ký</span>
            </Link>
          )}

          <Link
            href={ROUTES.AUTH.LOGIN}
            className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-semibold"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
};
