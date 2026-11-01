import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import { ROUTES } from "@/routes";
import {
  User,
  Mail,
  ArrowRight,
  Check,
} from "lucide-react";

import { FormField } from "./FormField";
import { PasswordField } from "./PasswordField";
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
    <div className="w-full max-w-[600px] flex flex-col z-20 text-slate-900">
      {/* Title */}
      <div className="text-left">
        <h2 className="text-2xl font-semibold leading-8 tracking-tight text-slate-900">
          Tạo tài khoản
        </h2>

        <p className="mt-1.5 text-sm leading-5 text-slate-500">
          Tạo tài khoản để kết nối với Cố vấn.
        </p>
      </div>

      <form
        onSubmit={handleRegister}
        className="flex flex-col flex-1"
        style={{ marginTop: "24px" }}
      >
        {/* Fields */}
        <div
          className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2"
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
            disabled={isLoading}
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
            disabled={isLoading}
          />

          <PasswordField
            id="password"
            label="Mật khẩu"
            placeholder="Ít nhất 8 ký tự"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            autoComplete="new-password"
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>


        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="mb-3 text-[13px] font-medium text-slate-700">
            Thông tin học tập <span className="font-normal text-slate-500">(không bắt buộc)</span>
          </p>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            {[
              { id: "majorId", label: "Ngành học", placeholder: "Chọn ngành học" },
              { id: "educationSystemId", label: "Hệ đào tạo", placeholder: "Chọn hệ đào tạo" },
              { id: "cohortId", label: "Khóa đào tạo", placeholder: "Chọn khóa đào tạo" },
            ].map((field) => (
              <div key={field.id} className={field.id === "majorId" ? "min-w-0 sm:col-span-2" : "min-w-0"}>
                <label htmlFor={field.id} className="mb-1.5 block text-[13px] font-medium text-slate-700">
                  {field.label}
                </label>
                <select
                  id={field.id}
                  name={field.id}
                  defaultValue=""
                  disabled
                  className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-slate-500 outline-none focus:border-[var(--chat-primary)] focus:ring-2 focus:ring-[var(--chat-primary)]/15 disabled:cursor-not-allowed"
                >
                  <option value="">{field.placeholder}</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Đồng ý điều khoản sử dụng */}
        <div
          className="flex items-start gap-2.5"
          style={{ marginTop: "11px" }}
        >
          <button
            id="registration-consent"
            type="button"
            role="checkbox"
            aria-checked={consent}
            onClick={() => setConsent((previous) => !previous)}
            className={`w-[18px] h-[18px] shrink-0 rounded-[4px] mt-0.5 flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${consent
              ? "bg-[var(--chat-primary)] text-white border-[var(--chat-primary)]"
              : "border border-slate-300 bg-slate-50 hover:border-slate-400"
              }`}
            aria-label="Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật"
          >
            {consent && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </button>

          <label
            htmlFor="registration-consent"
            className="text-[12.5px] text-slate-600 leading-snug cursor-pointer select-none"
          >
            Tôi đồng ý với{" "}
            <Link
              href={ROUTES.PUBLIC.TERMS}
              onClick={(event) => event.stopPropagation()}
              className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-medium"
            >
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link
              href={ROUTES.PUBLIC.PRIVACY}
              onClick={(event) => event.stopPropagation()}
              className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-medium"
            >
              Chính sách bảo mật
            </Link>{" "}
            của HCMUTE Student Assistant
          </label>
        </div>


        {/* Submit */}
        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-primary-hover)] w-full h-[44px] rounded-[7px] text-white font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
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
          </Button>

          {successMessage && (
            <p className="mt-2.5 p-2 rounded-[7px] text-[13px] bg-emerald-50 border border-emerald-200 text-emerald-700">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-2.5 p-2 rounded-[7px] text-[13px] bg-red-50 border border-red-200 text-red-700"
            >
              {errorMessage}
            </p>
          )}
        </div>

        {/* Footer: Already have an account */}
        <div className="mt-2.5 text-center text-[13px] text-slate-600">
          <span>Đã có tài khoản? </span>
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-semibold cursor-pointer transition-colors"
            >
              Đăng nhập ngay
            </button>
          ) : (
            <Link
              href={ROUTES.AUTH.LOGIN}
              className="text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)] hover:underline font-semibold"
            >
              Đăng nhập ngay
            </Link>
          )}
        </div>
      </form>
    </div>
  );
};