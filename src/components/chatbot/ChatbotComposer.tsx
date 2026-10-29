import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useChatbot } from "@/contexts/ChatbotContext";
import { ArrowUp, FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatbotComposer() {
  const { activeConversation, setDraft, sendQuestion, setSelectedFile } = useChatbot();
  const question = activeConversation?.draft || "";
  const selectedFile = activeConversation?.selectedFile;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<{ id?: string; message: string } | null>(null);
  const errorMessage = fileError?.id === activeConversation?.id ? fileError?.message : null;

  const handleSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      setFileError({ id: activeConversation?.id, message: "Vui lòng chọn file PDF." });
      return;
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      setFileError({ id: activeConversation?.id, message: "File phải có nội dung và không vượt quá 10 MB." });
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() && !selectedFile) return;

    sendQuestion(question.trim());
    setFileError(null);
  };

  return (
    <div className="shrink-0 bg-white px-4 pb-4 pt-2 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-[#CBD5E1] bg-white p-1.5 focus-within:border-[#1D4ED8]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleSelectFile}
          aria-label="Chọn file PDF đính kèm"
          className="hidden"
        />
        {selectedFile && (
          <div className="flex w-full items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2">
            <FileText className="h-5 w-5 shrink-0 text-[#DC2626]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium" title={selectedFile.name}>{selectedFile.name}</p>
              <p className="text-[11px] text-[#64748B]">
                PDF · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Bỏ file đính kèm"
              onClick={() => {
                setSelectedFile(null);
                setFileError(null);
              }}
              className="h-7 w-7 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {errorMessage && <p role="alert" className="px-2 text-xs text-[#B91C1C]">{errorMessage}</p>}
        <div className="flex w-full items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Đính kèm PDF, tối đa 10 MB"
            title="Đính kèm PDF, tối đa 10 MB"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 shrink-0 text-[#64748B]"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            aria-label="Câu hỏi cho Chatbot"
            placeholder="Nhập câu hỏi của bạn tại đây..."
            value={question}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            className="h-9 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-[#94A3B8]"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim() && !selectedFile}
            aria-label="Gửi câu hỏi"
            className="h-9 w-9 shrink-0 rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
