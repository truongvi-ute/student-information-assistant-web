import React from "react";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const LoginView: React.FC = () => {
  return <AuthContainer initialMode="login" />;
};

// Bí danh tương thích
export { LoginView as LoginPage };
