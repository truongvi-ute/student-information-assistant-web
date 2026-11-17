import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, BookOpen, FileText, Loader2, PanelLeft, X } from "lucide-react";
import { useChatLayout } from "@/layouts/ChatLayout";
import { ROUTES } from "@/routes";
import { ChatbotComposer } from "./ChatbotComposer";
import { DocumentHighlightViewerModal } from "./DocumentHighlightViewerModal";
import { MarkdownMessage } from "./MarkdownMessage";
import { groupCitationsByDocument, ReferencePanel } from "./ReferencePanel";
import { useChatbot } from "@/contexts/ChatbotContext";
import type { AiCitationResponse } from "@/types/chatbot";

const suggestedQuestions = [
  "Điều kiện xét tốt nghiệp gồm những gì?",
  "Tôi có thể tra cứu quy chế học vụ ở đâu?",
  "Làm thế nào để đăng ký học phần?",
];

export function ChatbotContainer() {
  const { isSidebarOpen, openSidebar } = useChatLayout();
  const {
    activeConversation,
    canUseChatbot,
    isAuthLoading,
    authPromptReason,
    isLoadingMessages,
    isLoadingOlderMessages,
    messagesError,
    loadOlderMessages,
    isSending,
    sendError,
    clearSendError,
    activeCitations,
    selectCitationsForMessage,
    sendQuestion,
    getScrollPosition,
    saveScrollPosition,
  } = useChatbot();
  const messages = activeConversation?.messages;
  const messageCount = messages?.length || 0;
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    documentId: string;
    sourceTitle: string;
    hitChunks: AiCitationResponse[];
    focusedChunk?: AiCitationResponse | null;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousView = useRef<{ id: string | undefined; count: number; sending: boolean } | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const id = activeConversation?.id;
    const previous = previousView.current;
    if (
      (previous && previous.id === id && messageCount > previous.count) ||
      (isSending && (!previous || !previous.sending))
    ) {
      content.scrollTop = content.scrollHeight;
    } else {
      content.scrollTop = id ? getScrollPosition(id) ?? content.scrollHeight : 0;
    }
    previousView.current = { id, count: messageCount, sending: isSending };
  }, [activeConversation?.id, messageCount, isSending, getScrollPosition]);

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
            className="relative"
          >
            <FileText className="h-4 w-4" />
            {activeCitations.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-semibold text-white">
                {groupCitationsByDocument(activeCitations).length}
              </span>
            )}
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
            {!isAuthLoading && authPromptReason === "guest" && (
              <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm text-[#1E3A8A]">
                <p className="font-medium">Bạn đang ở chế độ khách.</p>
                <p className="mt-1 text-xs text-[#1E40AF]">
                  Vui lòng đăng nhập bằng tài khoản Sinh viên để đặt câu hỏi cho Trợ lý AI và lưu lịch sử tra cứu.
                </p>
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="mt-3 inline-flex items-center rounded-lg bg-[#1D4ED8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1E40AF]"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            )}

            {!isAuthLoading && authPromptReason === "non-student" && (
              <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-sm text-[#92400E]">
                <p className="font-medium">Trợ lý AI chỉ dành cho tài khoản Sinh viên.</p>
                <p className="mt-1 text-xs">
                  Bạn có thể chuyển sang mục{" "}
                  <Link href={ROUTES.PORTAL.CHAT} className="font-semibold underline">
                    Tư vấn trực tiếp
                  </Link>{" "}
                  để trao đổi với sinh viên.
                </p>
              </div>
            )}

            {isLoadingMessages ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#64748B]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải lịch sử hội thoại...</span>
              </div>
            ) : messagesError ? (
              <div role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs text-[#B91C1C]">
                {messagesError}
              </div>
            ) : messageCount === 0 ? (
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
                      disabled={!canUseChatbot || isSending}
                      onClick={() => void sendQuestion(question)}
                      className="rounded-xl border border-[#E2E8F0] p-3 text-left text-sm hover:border-[#BFDBFE] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-60"
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
                {activeConversation?.hasNext && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLoadingOlderMessages}
                      onClick={() => void loadOlderMessages()}
                      className="text-xs"
                    >
                      {isLoadingOlderMessages ? "Đang tải..." : "Tải tin nhắn cũ hơn"}
                    </Button>
                  </div>
                )}

                {messages?.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <div
                        className={`max-w-[80%] rounded-2xl bg-[#DBEAFE] px-4 py-2.5 text-sm leading-relaxed text-[#0F172A] ${
                          message.isPending ? "opacity-75" : ""
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] ring-1 ring-[#DBEAFE]">
                        <Bot aria-label="Chatbot" className="h-4 w-4 text-[#2563EB]" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed">
                        <MarkdownMessage content={message.content} />
                        {message.citations.length > 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                selectCitationsForMessage(message.id);
                                setIsReferenceOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFF6FF] px-2.5 py-1 text-xs font-medium text-[#1D4ED8] hover:bg-[#DBEAFE]"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>
                                Nguồn tham khảo ({groupCitationsByDocument(message.citations).length})
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {isSending && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] ring-1 ring-[#DBEAFE]">
                      <Bot aria-label="Chatbot đang xử lý" className="h-4 w-4 text-[#2563EB]" />
                    </div>
                    <div className="flex items-center gap-2 pt-1.5 text-xs text-[#64748B]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" />
                      <span>Đang tra cứu tài liệu và tổng hợp câu trả lời...</span>
                    </div>
                  </div>
                )}

                <Link href={ROUTES.PORTAL.CHAT} className="inline-block text-xs text-[#1D4ED8] hover:underline">
                  Cần hỗ trợ thêm? Liên hệ Cố vấn
                </Link>
              </div>
            )}

            {sendError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#B91C1C]"
              >
                <span>{sendError}</span>
                <button
                  type="button"
                  onClick={clearSendError}
                  aria-label="Đóng thông báo lỗi"
                  className="shrink-0 rounded p-0.5 hover:bg-[#FEE2E2]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <ChatbotComposer />
      </main>

      {isReferenceOpen && (
        <div className="absolute inset-0 z-10 bg-white lg:static lg:w-72 lg:shrink-0">
          <ReferencePanel
            citations={activeCitations}
            onClose={() => setIsReferenceOpen(false)}
            onOpenDocument={(group, focusedChunk) => {
              if (!group.documentId) return;
              setPreviewDocument({
                documentId: group.documentId,
                sourceTitle: group.sourceTitle,
                hitChunks: group.chunks,
                focusedChunk: focusedChunk ?? null,
              });
            }}
          />
        </div>
      )}

      {previewDocument && (
        <DocumentHighlightViewerModal
          key={`${previewDocument.documentId}-${previewDocument.focusedChunk?.chunkReference ?? "all"}`}
          documentId={previewDocument.documentId}
          sourceTitle={previewDocument.sourceTitle}
          hitChunks={previewDocument.hitChunks}
          focusedChunk={previewDocument.focusedChunk}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
