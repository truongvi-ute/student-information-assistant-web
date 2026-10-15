import { useState } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/auth.service";
import { authStorage } from "@/utils/auth-storage";
import { ApiClientError } from "@/lib/api/api-error";
import { ROUTES } from "@/routes";
import { validateLoginForm } from "@/validations/auth.validation";

interface UseLoginOptions {
  onLoginSuccess?: () => void;
}

export function useLogin(options?: UseLoginOptions) {
  const router = useRouter();

  const queryEmail = typeof router.query.email === "string" ? router.query.email : "";
  const [customIdentifier, setCustomIdentifier] = useState<string | null>(null);

  const identifier =
    customIdentifier !== null
      ? customIdentifier
      : queryEmail || (typeof window !== "undefined" ? authStorage.getRememberedEmail() : "");

  const setIdentifier = (val: string) => {
    setCustomIdentifier(val);
  };

  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);


  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setSuccessMessage("");
    setNeedsVerification(false);

    const validationError = validateLoginForm(identifier, password);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsLoading(true);

      const response = await authService.login({
        email: identifier.trim(),
        password,
        rememberMe,
      });

      setSuccessMessage(response?.message || "Đăng nhập thành công! Đang chuyển hướng...");

      // Xác định đường dẫn điều hướng sau khi đăng nhập
      const redirectTarget =
        typeof router.query.redirect === "string" && router.query.redirect
          ? decodeURIComponent(router.query.redirect)
          : ROUTES.PORTAL.CHAT;

      if (options?.onLoginSuccess) {
        options.onLoginSuccess();
      }

      setTimeout(() => {
        router.push(redirectTarget);
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);

        const isUnverified =
          err.error?.code === "ACCOUNT_NOT_VERIFIED" ||
          err.error?.code === "EMAIL_NOT_VERIFIED" ||
          err.message.toLowerCase().includes("kích hoạt") ||
          err.message.toLowerCase().includes("xác thực") ||
          err.message.toLowerCase().includes("unverified");

        if (isUnverified) {
          setNeedsVerification(true);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    toggleShowPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    errorMessage,
    setErrorMessage,
    successMessage,
    needsVerification,
    handleLogin,
  };
}
