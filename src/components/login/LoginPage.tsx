"use client";

import React from "react";
import { AuthContainer } from "@/components/auth/AuthContainer";

export const LoginPage: React.FC = () => {
  return <AuthContainer initialMode="login" />;
};
