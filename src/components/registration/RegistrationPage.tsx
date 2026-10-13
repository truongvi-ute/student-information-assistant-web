"use client";

import React from "react";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const RegistrationPage: React.FC = () => {
  return <AuthContainer initialMode="register" />;
};
