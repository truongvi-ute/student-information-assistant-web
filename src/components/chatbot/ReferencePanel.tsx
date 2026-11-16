import { BookOpen, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiCitationResponse } from "@/types/chatbot";

interface ReferencePanelProps {
  citations: AiCitationResponse[];
  onClose: () => void;
}

export function ReferencePanel({ citations, onClose }: ReferencePanelProps) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white lg:w-72">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Nguồn tài liệu tham khảo</h2>
          {citations.length > 0 && (
            <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[11px] font-medium text-[#1D4ED8]">
              {citations.length}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Đóng tài liệu tham khảo"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {citations.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] p-4 text-center">
            <FileText className="mx-auto mb-3 h-7 w-7 text-[#94A3B8]" />
            <p className="text-xs leading-relaxed text-[#64748B]">
              Tài liệu liên quan sẽ xuất hiện tại đây khi câu trả lời có nguồn tham khảo.
            </p>
          </div>
        ) : (
          citations.map((citation, index) => (
            <div
              key={`${citation.sourceTitle}-${citation.chunkReference ?? index}-${index}`}
              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left"
            >
              <div className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
                <p
                  className="min-w-0 flex-1 break-words text-xs font-semibold text-[#0F172A]"
                  title={citation.sourceTitle}
                >
                  {citation.sourceTitle}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {citation.pageNumber != null && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-[#475569] ring-1 ring-[#E2E8F0]">
                    Trang {citation.pageNumber}
                  </span>
                )}
                {citation.relevanceScore != null && (
                  <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#1D4ED8]">
                    {Math.round(citation.relevanceScore * 100)}% phù hợp
                  </span>
                )}
              </div>

              {citation.quotedContent && (
                <blockquote className="mt-2.5 border-l-2 border-[#93C5FD] pl-2.5 text-xs leading-relaxed text-[#475569]">
                  {citation.quotedContent}
                </blockquote>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
