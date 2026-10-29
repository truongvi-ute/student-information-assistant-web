import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, FileText, PanelLeft } from "lucide-react";
import { useChatLayout } from "@/layouts/ChatLayout";
import { ROUTES } from "@/routes";
import { ChatbotComposer } from "./ChatbotComposer";
import { ReferencePanel } from "./ReferencePanel";
import { useChatbot } from "@/contexts/ChatbotContext";

const suggestedQuestions = [
  "Điều kiện xét tốt nghiệp gồm những gì?",
  "Tôi có thể tra cứu quy chế học vụ ở đâu?",
  "Làm thế nào để đăng ký học phần?",
];

export function ChatbotContainer() {
  const { isSidebarOpen, openSidebar } = useChatLayout();
  const { activeConversation, sendQuestion, getScrollPosition, saveScrollPosition } = useChatbot();
  const messages = activeConversation?.messages;
  const messageCount = messages?.length || 0;
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousView = useRef<{ id: string | undefined; count: number } | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const id = activeConversation?.id;
    const previous = previousView.current;
    if (previous && previous.id === id && messageCount > previous.count) {
      content.scrollTop = content.scrollHeight;
    } else {
      content.scrollTop = id ? getScrollPosition(id) ?? content.scrollHeight : 0;
    }
    previousView.current = { id, count: messageCount };
  }, [activeConversation?.id, messageCount, getScrollPosition]);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 bg-white">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#E2E8F0] px-4">
          {!isSidebarOpen && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={openSidebar}
              aria-label="Mở danh sách"
              className="h-8 w-8 md:hidden"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          <Image src="/assets/images/hcmute-logo.png" alt="Logo HCMUTE" width={30} height={34} className="h-8 w-8 shrink-0 object-contain" />
          <div className="flex-1">
            <h1 className="text-sm font-semibold">UTEChatBot</h1>
            <p className="text-[11px] text-[#64748B]">Trợ lý thông tin sinh viên</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsReferenceOpen((current) => !current)}
            aria-label="Nguồn tài liệu tham khảo"
            aria-expanded={isReferenceOpen}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </header>

        <div
          ref={contentRef}
          onScroll={(event) => {
            if (activeConversation) saveScrollPosition(activeConversation.id, event.currentTarget.scrollTop);
          }}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto max-w-3xl space-y-5">
            {messageCount === 0 ? (
              <div className="mx-auto max-w-lg py-10 text-center">
                <Bot className="mx-auto mb-4 h-10 w-10 text-[#2563EB]" />
                <h2 className="text-xl font-semibold">Bạn cần hỗ trợ thông tin gì?</h2>
                <p className="mt-2 text-sm text-[#64748B]">
                  Đặt câu hỏi về học vụ, chương trình đào tạo hoặc các quy định dành cho sinh viên.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendQuestion(question)}
                      className="rounded-xl border border-[#E2E8F0] p-3 text-left text-sm hover:border-[#BFDBFE] hover:bg-[#EFF6FF]"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <Link href={ROUTES.PORTAL.CHAT} className="mt-5 inline-block text-sm text-[#1D4ED8] hover:underline">
                  Liên hệ Cố vấn
                </Link>
              </div>
            ) : (
              <div role="log" aria-label="Nội dung hội thoại AI" className="space-y-5">
                {messages?.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && <Bot aria-label="Chatbot" className="mt-2 h-5 w-5 shrink-0 text-[#2563EB]" />}
                    <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-[#DBEAFE]" : "border border-[#E2E8F0] bg-white"}`}>
                      {message.file && (
                        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white p-2">
                          <FileText className="h-5 w-5 shrink-0 text-[#DC2626]" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium" title={message.file.name}>{message.file.name}</p>
                            <p className="text-[11px] text-[#64748B]">
                              PDF · {(message.file.size / 1024 / 1024).toFixed(2)} MB · Đính kèm minh họa
                            </p>
                          </div>
                        </div>
                      )}
                      {message.content}
                    </div>
                  </div>
                ))}
                <Link href={ROUTES.PORTAL.CHAT} className="inline-block text-xs text-[#1D4ED8] hover:underline">
                  Cần hỗ trợ thêm? Liên hệ Cố vấn
                </Link>
              </div>
            )}
          </div>
        </div>

        <ChatbotComposer />
      </main>

      {isReferenceOpen && (
        <div className="absolute inset-0 z-10 bg-white lg:static lg:w-72 lg:shrink-0">
          <ReferencePanel onClose={() => setIsReferenceOpen(false)} />
        </div>
      )}
    </div>
  );
}
