import React from "react";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const RegistrationView: React.FC = () => {
  return <AuthContainer initialMode="register" />;
};

// Bí danh tương thích
export { RegistrationView as RegistrationPage };
