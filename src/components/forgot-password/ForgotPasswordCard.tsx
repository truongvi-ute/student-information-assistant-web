"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  Check,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/routes";
import { useForgotPassword } from "@/hooks/useForgotPassword";
import { OtpInput } from "@/components/otp/OtpInput";
import { PasswordField } from "@/components/registration/PasswordField";

export const ForgotPasswordCard: React.FC = () => {
  const router = useRouter();
  const {
    step,
    email,
    isLoading,
    error,
    setError,
    successMessage,
    cooldown,
    formatCooldown,
    requestOtp,
    resendOtp,
    verifyOtp,
    resetPassword,
    goBack,
  } = useForgotPassword();

  // Local state cho các input form
  const [inputEmail, setInputEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Handler bước 1: Gửi OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestOtp(inputEmail);
  };

  // Handler bước 2: Xác thực OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtp(otpValue);
  };

  // Handler bước 3: Đặt lại mật khẩu
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(newPassword, confirmPassword);
  };

  // Tiêu đề & mô tả theo từng bước
  const getHeaderInfo = () => {
    switch (step) {
      case "EMAIL":
        return {
          title: "Quên mật khẩu?",
          subtitle: "Nhập email sinh viên HCMUTE để nhận mã xác thực OTP khôi phục tài khoản.",
        };
      case "OTP":
        return {
          title: "Xác thực mã OTP",
          subtitle: `Mã OTP 6 chữ số đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư.`,
        };
      case "RESET":
        return {
          title: "Đặt lại mật khẩu",
          subtitle: "Thiết lập mật khẩu mới cho tài khoản HCMUTE Student Assistant.",
        };
      case "SUCCESS":
        return {
          title: "Thành công!",
          subtitle: "Mật khẩu tài khoản của bạn đã được cập nhật thành công.",
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="w-full max-w-[400px] flex flex-col z-20 text-white">
      {/* Tiêu đề & phụ đề */}
      <div className="text-center">
        <h2 className="text-[26px] sm:text-[28px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          {header.title}
        </h2>
        <p className="text-[13.5px] text-[#cbd5e1] mt-1.5 font-normal leading-relaxed">
          {header.subtitle}
        </p>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-[7px] bg-red-500/20 border border-red-500/40 text-red-200 text-[13px] flex items-start gap-2.5 backdrop-blur-sm animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      {/* Thông báo thành công */}
      {successMessage && step !== "SUCCESS" && (
        <div
          role="status"
          className="mt-4 p-3 rounded-[7px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-[13px] flex items-start gap-2.5 backdrop-blur-sm"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 leading-snug">{successMessage}</div>
        </div>
      )}

      {/* Content Form theo từng bước với hiệu ứng chuyển trang */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {/* ================= BƯỚC 1: NHẬP EMAIL ================= */}
          {step === "EMAIL" && (
            <motion.form
              key="step-email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailSubmit}
              className="flex flex-col gap-4"
            >
              <div>
                <label htmlFor="fp-email" className="block text-[13px] font-medium text-slate-200 mb-1.5">
                  Email sinh viên HCMUTE
                </label>
                <div className="relative flex items-center w-full h-[42px] rounded-[7px] border border-white/15 bg-white/[0.07] hover:border-white/25 focus-within:border-blue-400 focus-within:bg-white/[0.12] focus-within:ring-2 focus-within:ring-blue-400/25 transition-all">
                  <div className="pl-3 pr-2.5 flex items-center pointer-events-none text-slate-300">
                    <Mail className="w-[18px] h-[18px] stroke-[1.8]" />
                  </div>
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="example@student.hcmute.edu.vn"
                    value={inputEmail}
                    onChange={(e) => {
                      setInputEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    autoFocus
                    className="w-full h-full pr-3 bg-transparent text-[13.5px] text-white placeholder-slate-400 outline-none selection:bg-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[42px] mt-1 rounded-[7px] bg-[#1e56a0] hover:bg-[#16437e] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(30,86,160,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi mã...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi mã xác nhận</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center mt-3">
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-[13px] text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại trang Đăng nhập</span>
                </Link>
              </div>
            </motion.form>
          )}

          {/* ================= BƯỚC 2: NHẬP OTP ================= */}
          {step === "OTP" && (
            <motion.form
              key="step-otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleOtpSubmit}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col items-center">
                <div className="w-full mb-2">
                  <label className="block text-center text-[13px] font-medium text-slate-200 mb-2">
                    Nhập mã 6 chữ số
                  </label>
                  <OtpInput
                    value={otpValue}
                    onChange={(val) => {
                      setOtpValue(val);
                      if (error) setError(null);
                    }}
                    disabled={isLoading}
                    isError={Boolean(error)}
                  />
                </div>

                <div className="mt-3 text-center">
                  {cooldown > 0 ? (
                    <span className="text-[12.5px] text-slate-300">
                      Gửi lại mã sau <strong className="text-blue-400 font-mono">{formatCooldown()}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={isLoading}
                      className="text-[12.5px] text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline flex items-center gap-1 mx-auto"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Gửi lại mã OTP</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={isLoading || otpValue.length !== 6}
                  className="w-full h-[42px] rounded-[7px] bg-[#1e56a0] hover:bg-[#16437e] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(30,86,160,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Xác thực OTP</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full h-[36px] rounded-[7px] bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white text-[13px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Thay đổi email</span>
                </button>
              </div>
            </motion.form>
          )}

          {/* ================= BƯỚC 3: ĐẶT MẬT KHẨU MỚI ================= */}
          {step === "RESET" && (
            <motion.form
              key="step-reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetSubmit}
              className="flex flex-col gap-4"
            >
              <PasswordField
                id="fp-new-password"
                label="Mật khẩu mới"
                placeholder="Tối thiểu 6 ký tự (gồm chữ và số)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
                variant="glass"
                autoComplete="new-password"
              />

              <PasswordField
                id="fp-confirm-password"
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
                variant="glass"
                autoComplete="new-password"
              />

              {/* Hướng dẫn chính sách mật khẩu */}
              <div className="p-2.5 rounded-[7px] bg-white/[0.04] border border-white/10 text-[12px] text-slate-300 flex flex-col gap-1">
                <span className="font-semibold text-slate-200">Yêu cầu bảo mật:</span>
                <span className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? "text-emerald-400" : "text-slate-500"}`} />
                  Từ 6 đến 72 ký tự
                </span>
                <span className="flex items-center gap-1.5">
                  <Check
                    className={`w-3.5 h-3.5 ${
                      /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword) ? "text-emerald-400" : "text-slate-500"
                    }`}
                  />
                  Chứa ít nhất 1 chữ cái và 1 chữ số
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[42px] mt-1 rounded-[7px] bg-[#1e56a0] hover:bg-[#16437e] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(30,86,160,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <LockKeyhole className="w-4 h-4" />
                    <span>Đổi mật khẩu</span>
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* ================= BƯỚC 4: THÀNH CÔNG ================= */}
          {step === "SUCCESS" && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-4 py-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <p className="text-[13.5px] text-slate-300 max-w-[280px]">
                Bạn có thể đăng nhập ngay bây giờ bằng mật khẩu mới vừa thiết lập.
              </p>

              <button
                type="button"
                onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                className="w-full h-[42px] rounded-[7px] bg-[#1e56a0] hover:bg-[#16437e] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(30,86,160,0.3)]"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
