import { Input } from "@/components/ui/input";
import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  variant?: "default" | "glass";
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
  required = false,
  disabled = false,
  autoComplete,
  variant = "default",
}) => {
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
          <Icon className="w-[18px] h-[18px] stroke-[1.8]" aria-hidden="true" />
        </div>
        <Input
          id={id}
          name={id}
          type={type}
          placeholder=" "
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full h-full border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-transparent pr-3 bg-transparent text-sm outline-none disabled:opacity-60 disabled:cursor-not-allowed ${isGlass
            ? "text-white placeholder-slate-400 selection:bg-blue-500"
            : "text-[#0f172a] placeholder-[#94a3b8]"
            }`}
        />
      </div>
    </div>
  );
};
