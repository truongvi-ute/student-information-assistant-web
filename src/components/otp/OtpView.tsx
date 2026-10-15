import React from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { OtpCard } from "./OtpCard";

interface OtpViewProps {
  email?: string;
  cooldown?: number;
}

export const OtpView: React.FC<OtpViewProps> = ({ email, cooldown }) => {
  return (
    <AuthLayout
      title="Xác thực mã OTP — HCMUTE Student Assistant"
      description="Nhập mã xác thực OTP gồm 6 chữ số để hoàn tất đăng ký tài khoản HCMUTE Student Assistant."
    >
      <OtpCard initialEmail={email} initialCooldown={cooldown} />
    </AuthLayout>
  );
};

// Bí danh tương thích
export { OtpView as OtpPage };
