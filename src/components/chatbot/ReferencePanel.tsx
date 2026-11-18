import { useMemo } from "react";
import { BookOpen, Eye, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiCitationResponse } from "@/types/chatbot";

export interface GroupedCitationDocument {
  key: string;
  documentId: string | null;
  sourceTitle: string;
  originalFilename: string | null;
  maxScore: number | null;
  chunks: AiCitationResponse[];
}

interface ReferencePanelProps {
  citations: AiCitationResponse[];
  onClose: () => void;
  onOpenDocument?: (
    group: GroupedCitationDocument,
    focusedChunk?: AiCitationResponse
  ) => void;
}

export function groupCitationsByDocument(
  citations: AiCitationResponse[]
): GroupedCitationDocument[] {
  const map = new Map<string, GroupedCitationDocument>();

  for (const citation of citations) {
    const key = citation.documentId
      ? `doc:${citation.documentId}`
      : `title:${citation.sourceTitle.trim().toLowerCase()}`;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        documentId: citation.documentId,
        sourceTitle: citation.sourceTitle,
        originalFilename: citation.originalFilename ?? null,
        maxScore: citation.relevanceScore,
        chunks: [citation],
      });
      continue;
    }

    if (!existing.originalFilename && citation.originalFilename) {
      existing.originalFilename = citation.originalFilename;
    }
    existing.chunks.push(citation);
    if (citation.relevanceScore != null) {
      existing.maxScore =
        existing.maxScore == null
          ? citation.relevanceScore
          : Math.max(existing.maxScore, citation.relevanceScore);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const scoreA = a.maxScore ?? -1;
    const scoreB = b.maxScore ?? -1;
    return scoreB - scoreA;
  });
}

export function ReferencePanel({
  citations,
  onClose,
  onOpenDocument,
}: ReferencePanelProps) {
  const groupedDocuments = useMemo(
    () => groupCitationsByDocument(citations),
    [citations]
  );

  return (
    <aside className="flex h-full w-full flex-col border-l border-[#E2E8F0] bg-white lg:w-72">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold">Nguồn tài liệu tham khảo</h2>
          {groupedDocuments.length > 0 && (
            <span className="shrink-0 rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[11px] font-medium text-[#1D4ED8]">
              {groupedDocuments.length}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Đóng tài liệu tham khảo"
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {groupedDocuments.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] p-4 text-center">
            <FileText className="mx-auto mb-3 h-7 w-7 text-[#94A3B8]" />
            <p className="text-xs leading-relaxed text-[#64748B]">
              Tài liệu liên quan sẽ xuất hiện tại đây khi câu trả lời có nguồn tham khảo.
            </p>
          </div>
        ) : (
          groupedDocuments.map((group) => (
            <div
              key={group.key}
              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left"
            >
              <div className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
                <div className="min-w-0 flex-1">
                  <p
                    className="break-words text-xs font-semibold text-[#0F172A]"
                    title={group.sourceTitle}
                  >
                    {group.sourceTitle}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-[#475569] ring-1 ring-[#E2E8F0]">
                      {group.chunks.length} đoạn liên quan
                    </span>
                    {group.maxScore != null && (
                      <span className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[11px] font-medium text-[#1D4ED8]">
                        {Math.round(group.maxScore * 100)}% phù hợp
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {group.documentId && onOpenDocument && (
                <button
                  type="button"
                  onClick={() => onOpenDocument(group)}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#EFF6FF] px-2.5 py-1.5 text-xs font-medium text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem &amp; đánh dấu trong tài liệu</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
