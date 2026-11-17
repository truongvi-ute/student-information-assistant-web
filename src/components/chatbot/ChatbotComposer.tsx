import { type FormEvent, type KeyboardEvent } from "react";
import { useChatbot } from "@/contexts/ChatbotContext";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatbotComposer() {
  const { draft, setDraft, sendQuestion, canUseChatbot, isSending, authPromptReason } = useChatbot();
  const isDisabled = !canUseChatbot || isSending;

  const placeholder =
    authPromptReason === "guest"
      ? "Đăng nhập tài khoản sinh viên để đặt câu hỏi..."
      : authPromptReason === "non-student"
        ? "Chức năng Trợ lý AI chỉ dành cho Sinh viên..."
        : isSending
          ? "Đang chờ trợ lý AI phản hồi..."
          : "Nhập câu hỏi của bạn tại đây...";

  const submitCurrentQuestion = () => {
    const trimmed = draft.trim();
    if (!trimmed || isDisabled) return;
    void sendQuestion(trimmed);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitCurrentQuestion();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submitCurrentQuestion();
    }
  };

  return (
    <div className="shrink-0 bg-white px-4 pb-4 pt-2 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-[#CBD5E1] bg-white p-1.5 focus-within:border-[#1D4ED8]"
      >
        <div className="flex w-full items-center gap-2">
          <textarea
            aria-label="Câu hỏi cho Chatbot"
            placeholder={placeholder}
            value={draft}
            disabled={isDisabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="h-9 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-5 outline-none placeholder:text-[#94A3B8] disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || isDisabled}
            aria-label="Gửi câu hỏi"
            className="h-9 w-9 shrink-0 rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
