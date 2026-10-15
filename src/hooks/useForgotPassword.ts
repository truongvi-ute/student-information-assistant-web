"use client";

import { useState, useEffect, useCallback } from "react";
import { authService } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/api-error";
import { isValidEmail } from "@/validations/auth.validation";
import type { ForgotPasswordStep } from "@/types/auth";

export interface UseForgotPasswordReturn {
  step: ForgotPasswordStep;
  setStep: (step: ForgotPasswordStep) => void;
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  successMessage: string | null;
  cooldown: number;
  formatCooldown: () => string;
  requestOtp: (email: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  resetPassword: (newPassword: string, confirmPassword: string) => Promise<boolean>;
  resendOtp: () => Promise<void>;
  goBack: () => void;
}

export function useForgotPassword(initialEmail: string = ""): UseForgotPasswordReturn {
  const [step, setStep] = useState<ForgotPasswordStep>("EMAIL");
  const [email, setEmail] = useState<string>(initialEmail);
  const [resetToken, setResetToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // Bộ đếm ngược thời gian gửi lại OTP (Cooldown timer)
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Format giây thành chuỗi mm:ss (ví dụ: 01:00)
  const formatCooldown = useCallback((): string => {
    const m = Math.floor(cooldown / 60);
    const s = cooldown % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [cooldown]);

  /**
   * Bước 1: Gửi yêu cầu nhận mã OTP qua Email
   */
  const requestOtp = async (inputEmail: string): Promise<boolean> => {
    const trimmedEmail = inputEmail.trim().toLowerCase();

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return false;
    }


    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authService.forgotPassword({ email: trimmedEmail });
      setEmail(trimmedEmail);
      setCooldown(response.resendAvailableInSeconds || 60);
      setSuccessMessage(response.message || "Mã xác thực OTP đã được gửi về email của bạn.");
      setStep("OTP");
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Không thể gửi mã OTP. Vui lòng kiểm tra lại dịch vụ máy chủ.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gửi lại mã OTP (dùng khi đang ở Bước 2)
   */
  const resendOtp = async (): Promise<void> => {
    if (cooldown > 0 || !email || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.forgotPassword({ email });
      setCooldown(response.resendAvailableInSeconds || 60);
      setSuccessMessage(response.message || "Đã gửi lại mã OTP mới.");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bước 2: Xác thực mã OTP 6 số để lấy resetToken
   */
  const verifyOtp = async (otpInput: string): Promise<boolean> => {
    const cleanOtp = otpInput.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError("Mã OTP phải bao gồm đúng 6 chữ số.");
      return false;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authService.verifyForgotPasswordOtp({
        email,
        otp: cleanOtp,
      });
      setResetToken(response.resetToken);
      setStep("RESET");
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Mã OTP không chính xác hoặc đã hết hạn.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bước 3: Đặt lại mật khẩu mới cùng với resetToken
   */
  const resetPassword = async (
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    // Validate chính sách mật khẩu theo Backend PasswordPolicy
    if (!newPassword || newPassword.length < 6 || newPassword.length > 72) {
      setError("Mật khẩu mới phải có độ dài từ 6 đến 72 ký tự.");
      return false;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    if (!hasLetter || !hasDigit) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return false;
    }

    if (!resetToken) {
      setError("Phiên xác thực đã hết hạn. Vui lòng bắt đầu lại từ bước nhập email.");
      setStep("EMAIL");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });
      setStep("SUCCESS");
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Đổi mật khẩu thất bại. Vui lòng thử lại.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Quay lại bước trước đó
   */
  const goBack = (): void => {
    setError(null);
    setSuccessMessage(null);
    if (step === "OTP") {
      setStep("EMAIL");
    } else if (step === "RESET") {
      setStep("OTP");
    }
  };

  return {
    step,
    setStep,
    email,
    setEmail,
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
  };
}
