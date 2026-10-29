import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="w-full max-w-[440px] flex flex-col z-20 text-slate-900">
      {/* Tiêu đề & phụ đề */}
      <div className="text-left">
        <h2 className="text-2xl font-semibold leading-8 tracking-tight text-slate-900">
          {header.title}
        </h2>
        <p className="mt-1.5 text-sm leading-5 text-slate-500">
          {header.subtitle}
        </p>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-[7px] bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-start gap-2.5 backdrop-blur-sm animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 leading-snug">{error}</div>
        </div>
      )}

      {/* Thông báo thành công */}
      {successMessage && step !== "SUCCESS" && (
        <div
          role="status"
          className="mt-4 p-3 rounded-[7px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] flex items-start gap-2.5 backdrop-blur-sm"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
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
                <div className="auth-floating-field relative flex items-center w-full h-[52px] rounded-lg border border-[#CBD5E1] bg-white hover:border-[#94A3B8] focus-within:border-[var(--chat-primary)] focus-within:ring-2 focus-within:ring-[var(--chat-primary)]/15 transition-colors duration-150 motion-reduce:transition-none has-[:disabled]:bg-slate-50 has-[:disabled]:hover:border-[#CBD5E1]">
                  <label htmlFor="fp-email" className="auth-floating-label">
                    Email sinh viên HCMUTE
                  </label>
                  <div className="pl-3 pr-2.5 flex items-center pointer-events-none text-slate-600">
                    <Mail className="w-[18px] h-[18px] stroke-[1.8]" />
                  </div>
                  <Input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder=" "
                    value={inputEmail}
                    onChange={(e) => {
                      setInputEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isLoading}
                  required
                    autoFocus
                    className="w-full h-full border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-transparent pr-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none selection:bg-blue-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-[42px] mt-1 rounded-[7px] bg-[var(--chat-primary)] hover:bg-[var(--chat-primary-hover)] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              </Button>

              <div className="text-center mt-3">
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-[13px] text-blue-600 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5"
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
                  <label className="block text-center text-[13px] font-medium text-slate-700 mb-2">
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
                    <span className="text-[12.5px] text-slate-600">
                      Gửi lại mã sau <strong className="text-blue-600 font-mono">{formatCooldown()}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={isLoading}
                      className="text-[12.5px] text-blue-600 hover:text-blue-300 transition-colors font-medium hover:underline flex items-center gap-1 mx-auto"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Gửi lại mã OTP</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <Button
                  type="submit"
                  disabled={isLoading || otpValue.length !== 6}
                  className="w-full h-[42px] rounded-[7px] bg-[var(--chat-primary)] hover:bg-[var(--chat-primary-hover)] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                </Button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full h-[36px] rounded-[7px] bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[13px] flex items-center justify-center gap-1.5 transition-all"
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
                placeholder=" "
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
                variant="default"
                autoComplete="new-password"
                disabled={isLoading}
              />

              <PasswordField
                id="fp-confirm-password"
                label="Xác nhận mật khẩu mới"
                placeholder=" "
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                required
                variant="default"
                autoComplete="new-password"
                disabled={isLoading}
              />

              {/* Hướng dẫn chính sách mật khẩu */}
              <div className="p-2.5 rounded-[7px] bg-slate-50 border border-slate-200 text-[12px] text-slate-600 flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Yêu cầu bảo mật:</span>
                <span className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? "text-emerald-600" : "text-slate-500"}`} />
                  Từ 6 đến 72 ký tự
                </span>
                <span className="flex items-center gap-1.5">
                  <Check
                    className={`w-3.5 h-3.5 ${
                      /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword) ? "text-emerald-600" : "text-slate-500"
                    }`}
                  />
                  Chứa ít nhất 1 chữ cái và 1 chữ số
                </span>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-[42px] mt-1 rounded-[7px] bg-[var(--chat-primary)] hover:bg-[var(--chat-primary-hover)] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              </Button>
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
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <p className="text-[13.5px] text-slate-600 max-w-[280px]">
                Bạn có thể đăng nhập ngay bây giờ bằng mật khẩu mới vừa thiết lập.
              </p>

              <Button
                type="button"
                onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                className="w-full h-[42px] rounded-[7px] bg-[var(--chat-primary)] hover:bg-[var(--chat-primary-hover)] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
