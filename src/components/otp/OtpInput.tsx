import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isError?: boolean;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  disabled = false,
  isError = false,
  length = 6,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into individual character array
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  // Auto-focus first input on mount
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleaned = rawVal.replace(/\D/g, "");

    if (!cleaned) {
      // User cleared input
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join(""));
      return;
    }

    if (cleaned.length === 1) {
      // Single digit entered
      const newDigits = [...digits];
      newDigits[index] = cleaned;
      const combined = newDigits.join("");
      onChange(combined);

      // Auto-advance to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Multiple digits entered (or browser autofill)
      handleMultiDigits(cleaned, index);
    }
  };

  const handleMultiDigits = (pastedDigits: string, startIndex: number) => {
    const newDigits = [...digits];
    for (let i = 0; i < pastedDigits.length && startIndex + i < length; i++) {
      newDigits[startIndex + i] = pastedDigits[i];
    }
    const combined = newDigits.join("");
    onChange(combined);

    // Focus next available empty box or last box
    const nextIndex = Math.min(startIndex + pastedDigits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current box is empty, jump to previous box and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain");
    const cleaned = pastedText.replace(/\D/g, "").slice(0, length);
    if (cleaned) {
      handleMultiDigits(cleaned, index === 0 ? 0 : index);
    }
  };

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3 w-full"
      role="group"
      aria-label="Nhập mã xác thực OTP 6 chữ số"
    >
      {Array.from({ length }).map((_, idx) => {
        const isFilled = Boolean(digits[idx]);
        return (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={idx === 0 ? "one-time-code" : "off"}
            value={digits[idx]}
            disabled={disabled}
            aria-invalid={isError}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={(e) => handlePaste(e, idx)}
            aria-label={`Số thứ ${idx + 1}`}
            className={`w-0 min-w-0 flex-1 max-w-[44px] h-[48px] sm:max-w-[54px] sm:h-[54px] text-center text-[22px] sm:text-[26px] font-bold rounded-lg transition-colors duration-150 motion-reduce:transition-none outline-none select-none ${isError
              ? "border-2 border-red-500 bg-red-50 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
              : isFilled
                ? "border border-[var(--chat-primary)] bg-[var(--chat-info-bg)] text-slate-900 focus:border-[var(--chat-primary)] focus:ring-2 focus:ring-[var(--chat-primary)]/15"
                : "border border-[#CBD5E1] bg-white text-slate-900 hover:border-[#94A3B8] focus:border-[var(--chat-primary)] focus:ring-2 focus:ring-[var(--chat-primary)]/15"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        );
      })}
    </div>
  );
};
