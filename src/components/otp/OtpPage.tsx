"use client";

import React from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { OtpCard } from "./OtpCard";

interface OtpPageProps {
  email?: string;
  cooldown?: number;
}

export const OtpPage: React.FC<OtpPageProps> = ({ email, cooldown }) => {
  return (
    <AuthLayout
      title="Xác thực mã OTP — HCMUTE Student Assistant"
      description="Nhập mã xác thực OTP gồm 6 chữ số để hoàn tất đăng ký tài khoản HCMUTE Student Assistant."
    >
      <OtpCard initialEmail={email} initialCooldown={cooldown} />
    </AuthLayout>
  );
};
