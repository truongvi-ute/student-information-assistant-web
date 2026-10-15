import { useState } from "react";
import { authService } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/api-error";
import { validateRegisterForm } from "@/validations/auth.validation";
import type { RegisterRequest } from "@/types/auth";

interface UseRegisterOptions {
  onSubmitSuccess?: (data?: { email: string; resendAvailableInSeconds?: number }) => void;
}

export function useRegister(options?: UseRegisterOptions) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateRegisterForm(
      fullName,
      email,
      password,
      confirmPassword,
      consent
    );

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const payload: RegisterRequest = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      majorId: null,
      educationSystemId: null,
      cohortId: null,
      academicContext: studentId.trim() || null,
    };

    try {
      setIsLoading(true);

      const response = await authService.register(payload);
      const cooldown = response?.resendAvailableInSeconds || 60;

      setSuccessMessage(response?.message || "Đăng ký thành công! Mã OTP đã được gửi đến email.");

      options?.onSubmitSuccess?.({
        email: payload.email,
        resendAvailableInSeconds: cooldown,
      });
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    setErrorMessage,
    successMessage,
    handleRegister,
  };
}
