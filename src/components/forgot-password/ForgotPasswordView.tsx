import React from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ForgotPasswordCard } from "./ForgotPasswordCard";

export const ForgotPasswordView: React.FC = () => {
  return (
    <AuthLayout
      title="Khôi phục mật khẩu — HCMUTE Student Assistant"
      description="Đặt lại mật khẩu tài khoản HCMUTE Student Assistant qua mã xác thực OTP."
    >
      <div className="w-full flex justify-center overflow-visible">
        <ForgotPasswordCard />
      </div>
    </AuthLayout>
  );
};

// Bí danh tương thích
export { ForgotPasswordView as ForgotPasswordPage };
