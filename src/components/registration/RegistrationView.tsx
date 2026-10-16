import { AuthContainer } from "@/components/auth/AuthContainer";

export function RegistrationView() {
  return <AuthContainer initialMode="register" />;
}

// Bí danh tương thích
export { RegistrationView as RegistrationPage };