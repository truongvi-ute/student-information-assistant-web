import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
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
  const { login: completeLogin } = useAuth();
  const queryEmail = typeof router.query.email === "string" ? router.query.email : "";
  const [customIdentifier, setCustomIdentifier] = useState<string | null>(null);
  const [rememberedEmail, setRememberedEmail] = useState("");

  useEffect(() => {
    setRememberedEmail(authStorage.getRememberedEmail());
  }, []);

  const identifier =
    customIdentifier !== null ? customIdentifier : queryEmail || rememberedEmail;

  const setIdentifier = (val: string) => {
    setCustomIdentifier(val);
  };

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current !== null) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
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

    let redirectScheduled = false;

    try {
      setIsLoading(true);

      const response = await authService.login({
        email: identifier.trim(),
        password,
        rememberMe,
      });

      const token = response.accessToken || response.token;

      if (!token) {
        throw new Error(
          "Đăng nhập thành công nhưng không nhận được token."
        );
      }

      const redirectTarget =
        typeof router.query.redirect === "string" && router.query.redirect
          ? router.query.redirect
          : ROUTES.PORTAL.CHAT;

      setSuccessMessage(
        response.message || "Đăng nhập thành công! Đang chuyển hướng..."
      );

      options?.onLoginSuccess?.();
      redirectTimer.current = setTimeout(() => {
        redirectTimer.current = null;

        try {
          // Service đã lưu token và user vào storage.
          // Context đồng bộ state và thông tin chuyển hướng.
          completeLogin(
            token,
            undefined,
            undefined,
            redirectTarget
          );
        } catch (error) {
          setSuccessMessage("");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể hoàn tất đăng nhập."
          );
          setIsLoading(false);
        }
      }, 1000);

      redirectScheduled = true;
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
      if (!redirectScheduled) {
        setIsLoading(false);
      }
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
