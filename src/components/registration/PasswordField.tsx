import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  variant?: "default" | "glass";
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  autoComplete = "new-password",
  variant = "default",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isGlass = variant === "glass";

  return (
    <div className="w-full">
      <div
        className={`auth-floating-field relative flex items-center w-full h-[52px] rounded-lg transition-colors duration-150 motion-reduce:transition-none has-[:disabled]:bg-slate-50 has-[:disabled]:hover:border-[#CBD5E1] ${isGlass
          ? "border border-white/15 bg-white/[0.07] hover:border-white/25 focus-within:border-blue-400 focus-within:bg-white/[0.12] focus-within:ring-2 focus-within:ring-blue-400/25"
          : "border border-[#CBD5E1] bg-white hover:border-[#94A3B8] focus-within:border-[var(--chat-primary)] focus-within:ring-2 focus-within:ring-[var(--chat-primary)]/15"
          }`}
      >
        <label
          htmlFor={id}
          className="auth-floating-label"
        >
          {label}
        </label>
        <div
          className={`pl-3 pr-2.5 flex items-center pointer-events-none ${isGlass ? "text-slate-300" : "text-[#64748b]"
            }`}
        >
          <LockKeyhole className="w-[18px] h-[18px] stroke-[1.8]" aria-hidden="true" />
        </div>
        <Input
          id={id}
          name={id}
          type={showPassword ? "text" : "password"}
          placeholder=" "
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-describedby={autoComplete === "new-password" ? `${id}-hint` : undefined}
          className={`w-full h-full border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-transparent pr-10 bg-transparent text-sm outline-none disabled:opacity-60 disabled:cursor-not-allowed ${isGlass
            ? "text-white placeholder-slate-400 selection:bg-blue-500"
            : "text-[#0f172a] placeholder-[#94a3b8]"
            }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={`absolute right-3 p-1 transition-colors duration-150 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-1 focus-visible:ring-blue-400 cursor-pointer ${isGlass ? "text-slate-300 hover:text-white" : "text-[#64748b] hover:text-[#1e293b]"
            }`}
          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {showPassword ? (
            <EyeOff className="w-[18px] h-[18px] stroke-[1.8]" />
          ) : (
            <Eye className="w-[18px] h-[18px] stroke-[1.8]" />
          )}
        </button>
      </div>
      {autoComplete === "new-password" && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{placeholder}</p>
      )}
    </div>
  );
};
