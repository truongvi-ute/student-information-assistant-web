import React, { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Nhập tin nhắn...",
}: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;

    const sent = onSend(text.trim());
    if (sent) {
      setText("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const canSend = !disabled && text.trim().length > 0;

  return (
    <div className="px-4 pb-4 pt-1 bg-[#F8FAFC]">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto w-full relative flex items-center bg-white border border-[#CBD5E1] rounded-xl shadow-xs transition-colors focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/20 px-3 py-1.5"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 outline-none px-3 py-1.5 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8] disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Gửi tin nhắn"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
            canSend
              ? "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm cursor-pointer"
              : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
          }`}
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
}
