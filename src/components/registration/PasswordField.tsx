import React, { useState } from "react";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
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
  autoComplete = "new-password",
  variant = "glass",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isGlass = variant === "glass";

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={`block text-[13px] font-medium mb-1.5 ${isGlass ? "text-slate-200" : "text-[#0b1f4a] font-semibold"
          }`}
      >
        {label}
      </label>
      <div
        className={`relative flex items-center w-full h-[35px] rounded-[7px] transition-all ${isGlass
          ? "border border-white/15 bg-white/[0.07] hover:border-white/25 focus-within:border-blue-400 focus-within:bg-white/[0.12] focus-within:ring-2 focus-within:ring-blue-400/25"
          : "border border-[#dce5f2] bg-[#fbfdff] hover:border-[#cbd5e1] focus-within:border-[#2f7df7] focus-within:ring-2 focus-within:ring-[#2f7df7]/15"
          }`}
      >
        <div
          className={`pl-3 pr-2.5 flex items-center pointer-events-none ${isGlass ? "text-slate-300" : "text-[#64748b]"
            }`}
        >
          <LockKeyhole className="w-[18px] h-[18px] stroke-[1.8]" aria-hidden="true" />
        </div>
        <input
          id={id}
          name={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          className={`w-full h-full pr-10 bg-transparent text-[13.5px] outline-none ${isGlass
            ? "text-white placeholder-slate-400 selection:bg-blue-500"
            : "text-[#0f172a] placeholder-[#94a3b8]"
            }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute right-3 p-1 transition-colors rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-blue-400 cursor-pointer ${isGlass ? "text-slate-300 hover:text-white" : "text-[#64748b] hover:text-[#1e293b]"
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
    </div>
  );
};
