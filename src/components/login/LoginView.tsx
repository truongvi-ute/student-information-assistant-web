import { AuthContainer } from "@/components/auth/AuthContainer";

export function LoginView() {
  return <AuthContainer initialMode="login" />;
}

// Giữ tương thích với những nơi sử dụng tên LoginPage.
export { LoginView as LoginPage };