"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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

import { authService } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/api-error";
import { buildLoginUrl } from "@/routes/paths";

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
  const router = useRouter();
  const queryEmail = typeof router.query.email === "string" ? router.query.email : "";

  // Email state: prefer prop, then query param, then fallback
  const [email, setEmail] = useState<string>(
    initialEmail || queryEmail || "sinhvien@hcmute.edu.vn"
  );

  useEffect(() => {
    if (queryEmail && !initialEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail, initialEmail]);

  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(initialCooldown);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Countdown timer for resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const formatSeconds = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (otp.length < 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 chữ số mã OTP.");
      return;
    }

    try {
      setIsLoading(true);

      if (onVerifySuccess) {
        await onVerifySuccess();
      } else {
        await authService.verifyRegistration({ email, otp });
        setSuccessMessage(
          "Xác thực tài khoản thành công! Đang chuyển hướng..."
        );
        setTimeout(() => {
          router.push(buildLoginUrl({ email }));
        }, 1500);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Mã xác thực không chính xác hoặc đã hết hạn.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setErrorMessage("");
    setSuccessMessage("");
    setIsResending(true);

    try {
      if (onResendOtp) {
        await onResendOtp(email);
        setCooldown(60);
        setSuccessMessage("Mã OTP mới đã được gửi lại vào email của bạn.");
      } else {
        const response = await authService.resendRegistrationOtp(email);
        const waitSec = response?.resendAvailableInSeconds || 60;
        setCooldown(waitSec);
        setSuccessMessage(
          response?.message || "Mã OTP mới đã được gửi lại vào email của bạn."
        );
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] flex flex-col z-20 text-white">
      {/* Icon Badge */}
      <div className="flex justify-center mb-3">
        <div className="w-[54px] h-[54px] rounded-[10px] bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-xs">
          <ShieldCheck className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="text-center">
        <h2 className="text-[26px] sm:text-[28px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          Xác thực mã OTP
        </h2>
        <p className="text-[13.5px] text-[#cbd5e1] mt-1.5 font-normal">
          Mã xác thực gồm 6 chữ số đã được gửi đến email
        </p>

        {/* Email Pill Badge with Edit action */}
        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-white/[0.08] border border-white/15 text-[13px] text-slate-200 font-medium max-w-full">
          <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[240px] sm:max-w-[300px]">{email}</span>
          {onBackToRegister ? (
            <button
              type="button"
              onClick={onBackToRegister}
              className="text-[#38bdf8] hover:underline flex items-center gap-1 text-[12px] font-semibold pl-1.5 border-l border-white/20 ml-0.5 cursor-pointer outline-none"
              title="Đổi địa chỉ email"
            >
              <Edit2 className="w-3 h-3" />
              <span>Đổi</span>
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.REGISTER}
              className="text-[#38bdf8] hover:underline flex items-center gap-1 text-[12px] font-semibold pl-1.5 border-l border-white/20 ml-0.5"
              title="Đổi địa chỉ email"
            >
              <Edit2 className="w-3 h-3" />
              <span>Đổi</span>
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col flex-1" style={{ marginTop: "28px" }}>
        {/* 6-Digit OTP Input */}
        <div>
          <label className="block text-center text-[13px] font-medium text-slate-200 mb-3">
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
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-blue-400 stroke-[2]" aria-hidden="true" />
              <span>Gửi lại mã sau</span>
              <span className="font-semibold text-blue-400 tabular-nums">
                ({formatSeconds(cooldown)})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>Chưa nhận được mã?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold text-[#38bdf8] hover:text-[#7dd3fc] hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 outline-none"
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
            className="mt-4 flex items-start gap-2.5 p-3 rounded-[7px] bg-red-950/70 border border-red-500/40 text-red-200 text-[13px] leading-relaxed animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2.5 p-3 rounded-[7px] bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-[13px] leading-relaxed animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Primary CTA */}
        <div style={{ marginTop: "24px" }}>
          <button
            type="submit"
            disabled={isLoading || otp.length < 6}
            className="cta-gradient-btn w-full h-[48px] rounded-[7px] text-white font-semibold text-[15.5px] flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(74,92,255,0.4)]"
          >
            <span>{isLoading ? "Đang xác thực..." : "Xác nhận & Kích hoạt"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />}
          </button>
        </div>

        {/* Security Help Note */}
        <p className="mt-4 text-center text-[12px] text-slate-300 leading-normal px-2">
          Mã OTP có thời hạn trong vòng <span className="text-white font-medium">5 phút</span>.
          Vui lòng kiểm tra kỹ cả thư mục <span className="text-white font-medium">Spam / Rác</span> nếu
          chưa thấy email.
        </p>

        {/* Divider */}
        <div className="w-full border-t border-white/15 my-4" />

        {/* Bottom Actions */}
        <div className="flex items-center justify-between text-[13px]">
          {onBackToRegister ? (
            <button
              type="button"
              onClick={onBackToRegister}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition-colors cursor-pointer outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
              <span>Quay lại đăng ký</span>
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.REGISTER}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
              <span>Quay lại đăng ký</span>
            </Link>
          )}

          <Link
            href={ROUTES.AUTH.LOGIN}
            className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-semibold"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
};
