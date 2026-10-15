import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/api-error";
import { buildLoginUrl } from "@/routes/paths";
import { validateOtp } from "@/validations/auth.validation";

interface UseOtpOptions {
  initialEmail?: string;
  initialCooldown?: number;
  onVerifySuccess?: () => void | Promise<void>;
  onResendOtp?: (email: string) => Promise<void> | void;
}

export function useOtp(options?: UseOtpOptions) {
  const router = useRouter();
  const queryEmail = typeof router.query.email === "string" ? router.query.email : "";

  const [customEmail, setCustomEmail] = useState<string>("");
  const email = customEmail || options?.initialEmail || queryEmail || "sinhvien@hcmute.edu.vn";
  const setEmail = (val: string) => setCustomEmail(val);


  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(options?.initialCooldown ?? 60);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Đếm ngược thời gian gửi lại OTP
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const formatSeconds = useCallback((sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const formatCooldown = useCallback((): string => {
    return formatSeconds(cooldown);
  }, [cooldown, formatSeconds]);


  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateOtp(otp);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsLoading(true);

      if (options?.onVerifySuccess) {
        await options.onVerifySuccess();
      } else {
        await authService.verifyRegistration({ email, otp });
        setSuccessMessage("Xác thực tài khoản thành công! Đang chuyển hướng...");

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
      if (options?.onResendOtp) {
        await options.onResendOtp(email);
        setCooldown(60);
        setSuccessMessage("Mã OTP mới đã được gửi lại vào email của bạn.");
      } else {
        const response = await authService.resendRegistrationOtp(email);
        const waitSec = response?.resendAvailableInSeconds || 60;
        setCooldown(waitSec);
        setSuccessMessage(response?.message || "Mã OTP mới đã được gửi lại vào email của bạn.");
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

  return {
    email,
    setEmail,
    otp,
    setOtp,
    isLoading,
    isResending,
    cooldown,
    errorMessage,
    setErrorMessage,
    successMessage,
    formatCooldown,
    formatSeconds,
    handleVerify,
    handleResend,
  };
}

