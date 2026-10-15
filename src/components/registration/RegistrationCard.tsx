import React from "react";
import Link from "next/link";
import { ROUTES } from "@/routes";
import {
  User,
  Mail,
  IdCard,
  ArrowRight,
  Check,
} from "lucide-react";

import { FormField } from "./FormField";
import { PasswordField } from "./PasswordField";
import { SocialButton } from "./SocialButton";
import { useRegister } from "@/hooks/useRegister";

interface RegistrationCardProps {
  onSubmitSuccess?: (data?: { email: string; resendAvailableInSeconds?: number }) => void;
  onSwitchToLogin?: () => void;
}

export const RegistrationCard: React.FC<RegistrationCardProps> = ({
  onSubmitSuccess,
  onSwitchToLogin,
}) => {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    studentId,
    setStudentId,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    consent,
    setConsent,
    isLoading,
    errorMessage,
    successMessage,
    handleRegister,
  } = useRegister({ onSubmitSuccess });


  return (
    <div className="w-full max-w-[400px] flex flex-col z-20 text-white">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-[25px] sm:text-[26px] font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          Tạo tài khoản
        </h2>

        <p className="text-[13px] text-[#cbd5e1] mt-1 font-normal">
          Bắt đầu hành trình học tập thông minh cùng HCMUTE Student Assistant
        </p>
      </div>

      <form
        onSubmit={handleRegister}
        className="flex flex-col flex-1"
        style={{ marginTop: "14px" }}
      >
        {/* Fields */}
        <div
          className="flex flex-col"
          style={{ gap: "7px" }}
        >
          <FormField
            id="fullName"
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            icon={User}
            required
            autoComplete="name"
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="example@hcmute.edu.vn"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            icon={Mail}
            required
            autoComplete="email"
          />

          <FormField
            id="studentId"
            label="Mã sinh viên (tùy chọn)"
            placeholder="VD: 22123456"
            value={studentId}
            onChange={(event) =>
              setStudentId(event.target.value)
            }
            icon={IdCard}
            autoComplete="off"
          />

          <PasswordField
            id="password"
            label="Mật khẩu"
            placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            autoComplete="new-password"
          />

          <PasswordField
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value,
              )
            }
            required
            autoComplete="new-password"
          />
        </div>

        {/* Consent */}
        <div
          className="flex items-start gap-2.5"
          style={{ marginTop: "11px" }}
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={consent}
            onClick={() =>
              setConsent((previous) => !previous)
            }
            className={`w-[18px] h-[18px] shrink-0 rounded-[4px] mt-0.5 flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${consent
              ? "bg-blue-600 text-white border-blue-500"
              : "border border-white/25 bg-white/[0.08] hover:border-white/40"
              }`}
            aria-label="Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật"
          >
            {consent && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </button>

          <label
            onClick={() =>
              setConsent((previous) => !previous)
            }
            className="text-[12.5px] text-slate-300 leading-snug cursor-pointer select-none"
          >
            Tôi đồng ý với{" "}
            <Link
              href={ROUTES.PUBLIC.TERMS}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-medium"
            >
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link
              href={ROUTES.PUBLIC.PRIVACY}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-medium"
            >
              Chính sách bảo mật
            </Link>{" "}
            của HCMUTE Student Assistant
          </label>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="cta-gradient-btn w-full h-[44px] rounded-[7px] text-white font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(74,92,255,0.4)]"
            style={{
              marginTop: "11px",
            }}
          >
            <span>
              {isLoading
                ? "Đang gửi OTP..."
                : "Đăng ký tài khoản"}
            </span>

            {!isLoading && (
              <ArrowRight
                className="w-4 h-4 stroke-[2.5]"
                aria-hidden="true"
              />
            )}
          </button>

          {successMessage && (
            <p className="mt-2.5 p-2 rounded-[7px] text-[13px] bg-emerald-950/70 border border-emerald-500/40 text-emerald-200">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-2.5 p-2 rounded-[7px] text-[13px] bg-red-950/70 border border-red-500/40 text-red-200"
            >
              {errorMessage}
            </p>
          )}
        </div>

        {/* Separator */}
        <div
          className="relative flex items-center justify-center"
          style={{ marginTop: "12px" }}
        >
          <div className="w-full border-t border-white/15" />

          <span className="bg-[#0b234f] px-3 py-0.5 text-[11.5px] text-slate-300 absolute rounded-full border border-white/15">
            Hoặc đăng ký nhanh với
          </span>
        </div>

        {/* Social */}
        <div
          className="flex items-center gap-3"
          style={{ marginTop: "10px" }}
        >
          <SocialButton provider="google" variant="glass" />
        </div>

        {/* Footer: Already have an account */}
        <div className="mt-2.5 text-center text-[13px] text-slate-300">
          <span>Đã có tài khoản? </span>
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-semibold cursor-pointer transition-colors"
            >
              Đăng nhập ngay
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.LOGIN}
              className="text-[#38bdf8] hover:text-[#7dd3fc] hover:underline font-semibold"
            >
              Đăng nhập ngay
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};