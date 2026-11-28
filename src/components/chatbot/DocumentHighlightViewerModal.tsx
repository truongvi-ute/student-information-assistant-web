import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, FileText, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfHighlightViewer } from "@/components/chatbot/PdfHighlightViewer";
import { documentService } from "@/services/document.service";
import type { AiCitationResponse } from "@/types/chatbot";
import type { DocumentContentResponse } from "@/types/document";

interface DocumentHighlightViewerModalProps {
  documentId: string;
  sourceTitle: string;
  originalFilename?: string | null;
  hitChunks: AiCitationResponse[];
  focusedChunk?: AiCitationResponse | null;
  onClose: () => void;
}

interface OffsetInterval {
  start: number;
  end: number;
}

interface MarkdownBlock {
  index: number;
  text: string;
  start: number;
  end: number;
  isHit: boolean;
  isFocused: boolean;
  highlightFragments: string[];
}

interface PdfPreviewData {
  bytes: Uint8Array;
  filename: string;
  allowDownload: boolean;
}

function mergeHitIntervals(chunks: AiCitationResponse[]): OffsetInterval[] {
  const raw = chunks
    .filter(
      (c): c is AiCitationResponse & { charStart: number; charEnd: number } =>
        c.charStart != null &&
        c.charEnd != null &&
        c.charStart >= 0 &&
        c.charEnd > c.charStart
    )
    .map((c) => ({ start: c.charStart, end: c.charEnd }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: OffsetInterval[] = [];
  for (const interval of raw) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
    } else {
      last.end = Math.max(last.end, interval.end);
    }
  }
  return merged;
}

function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function splitMarkdownBlocksWithOffsets(markdown: string): Array<{
  text: string;
  start: number;
  end: number;
}> {
  const blocks: Array<{ text: string; start: number; end: number }> = [];
  const separatorRe = /\n{2,}/g;
  let cursor = 0;

  const pushSegment = (segStart: number, segEnd: number) => {
    const raw = markdown.slice(segStart, segEnd);
    const trimmed = raw.trim();
    if (!trimmed) return;
    const leading = raw.length - raw.replace(/^\s+/, "").length;
    const trailing = raw.length - raw.replace(/\s+$/, "").length;
    blocks.push({
      text: trimmed,
      start: segStart + leading,
      end: segEnd - trailing,
    });
  };

  let match: RegExpExecArray | null;
  while ((match = separatorRe.exec(markdown)) !== null) {
    pushSegment(cursor, match.index);
    cursor = match.index + match[0].length;
  }
  pushSegment(cursor, markdown.length);
  return blocks;
}

function extractInlineTerms(fragment: string): string[] {
  return fragment
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*+]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .trim()
    )
    .flatMap((line) => (line.includes("|") ? line.split("|").map((c) => c.trim()) : [line]))
    .filter((term) => term.length >= 4 && !/^[-:\s]+$/.test(term));
}

function buildHighlightedBlocks(
  markdown: string,
  hitChunks: AiCitationResponse[],
  focusedChunk?: AiCitationResponse | null
): MarkdownBlock[] {
  const rawBlocks = splitMarkdownBlocksWithOffsets(markdown);
  const intervals = mergeHitIntervals(hitChunks);

  const focusedHasOffsets =
    focusedChunk?.charStart != null &&
    focusedChunk?.charEnd != null &&
    focusedChunk.charEnd > focusedChunk.charStart;

  const fallbackNeedles = hitChunks
    .filter((c) => c.charStart == null || c.charEnd == null)
    .map((c) => normalizeForMatch(c.quotedContent ?? ""))
    .filter((q) => q.length >= 16);

  const focusedFallbackNeedle =
    !focusedHasOffsets && focusedChunk?.quotedContent
      ? normalizeForMatch(focusedChunk.quotedContent)
      : "";

  return rawBlocks.map((block, index) => {
    const overlapping = intervals.filter(
      (iv) => block.start < iv.end && iv.start < block.end
    );

    let isHit = overlapping.length > 0;
    const highlightFragments = overlapping.map((iv) =>
      markdown.slice(Math.max(block.start, iv.start), Math.min(block.end, iv.end))
    );

    let isFocused =
      focusedHasOffsets &&
      focusedChunk?.charStart != null &&
      focusedChunk?.charEnd != null &&
      block.start < focusedChunk.charEnd &&
      focusedChunk.charStart < block.end;

    if (!isHit && fallbackNeedles.length > 0) {
      const normBlock = normalizeForMatch(block.text);
      for (const needle of fallbackNeedles) {
        const probe = needle.slice(0, Math.min(needle.length, 80));
        if (normBlock.includes(probe) || (normBlock.length >= 20 && needle.includes(normBlock))) {
          isHit = true;
          highlightFragments.push(block.text);
          break;
        }
      }
    }

    if (!isFocused && focusedFallbackNeedle.length >= 16) {
      const normBlock = normalizeForMatch(block.text);
      const probe = focusedFallbackNeedle.slice(
        0,
        Math.min(focusedFallbackNeedle.length, 80)
      );
      if (normBlock.includes(probe) || (normBlock.length >= 20 && focusedFallbackNeedle.includes(normBlock))) {
        isFocused = true;
      }
    }

    return {
      index,
      text: block.text,
      start: block.start,
      end: block.end,
      isHit,
      isFocused,
      highlightFragments,
    };
  });
}

function highlightTextString(text: string, terms: string[]): ReactNode {
  if (!text || terms.length === 0) return text;
  const lowerText = text.toLowerCase();

  const matches: OffsetInterval[] = [];
  for (const term of terms) {
    const needle = term.toLowerCase();
    let idx = lowerText.indexOf(needle);
    while (idx !== -1) {
      matches.push({ start: idx, end: idx + needle.length });
      idx = lowerText.indexOf(needle, idx + needle.length);
    }
  }

  if (matches.length === 0) return text;

  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: OffsetInterval[] = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (!last || m.start >= last.end) {
      merged.push({ ...m });
    } else {
      last.end = Math.max(last.end, m.end);
    }
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  merged.forEach((m, idx) => {
    if (m.start > cursor) {
      parts.push(text.slice(cursor, m.start));
    }
    parts.push(
      <mark
        key={`mark-${idx}-${m.start}`}
        className="rounded bg-[#FDE047]/80 px-0.5 text-[#0F172A]"
      >
        {text.slice(m.start, m.end)}
      </mark>
    );
    cursor = m.end;
  });
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

function highlightReactChildren(children: ReactNode, terms: string[]): ReactNode {
  if (terms.length === 0) return children;
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return highlightTextString(child, terms);
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      return cloneElement(child, {
        ...child.props,
        children: highlightReactChildren(child.props.children, terms),
      });
    }
    return child;
  });
}

function createMarkdownComponents(highlightTerms: string[], isHitBlock: boolean): Components {
  const wrap = (children: ReactNode) => highlightReactChildren(children, highlightTerms);

  return {
    h1: ({ children }) => (
      <h1 className="mt-3 mb-1.5 text-base font-bold text-[#0F172A] first:mt-0">
        {wrap(children)}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-3 mb-1.5 text-sm font-bold text-[#0F172A] first:mt-0">
        {wrap(children)}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-2.5 mb-1 text-sm font-semibold text-[#0F172A] first:mt-0">
        {wrap(children)}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-2 leading-relaxed text-[#1E293B] last:mb-0">{wrap(children)}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-[#0F172A]">{wrap(children)}</strong>
    ),
    ul: ({ children }) => (
      <ul className="mb-2 list-disc space-y-1 pl-5 text-[#1E293B] last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 list-decimal space-y-1 pl-5 text-[#1E293B] last:mb-0">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{wrap(children)}</li>,
    table: ({ children }) => (
      <div
        className={`my-2 overflow-x-auto rounded-lg border ${
          isHitBlock
            ? "border-[#F59E0B]/40 bg-[#FEF3C7]/35"
            : "border-[#E2E8F0] bg-white"
        }`}
      >
        <table className="w-full border-collapse text-left text-xs">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={isHitBlock ? "bg-[#FEF3C7]/60 text-[#0F172A]" : "bg-[#F8FAFC] text-[#0F172A]"}>
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="border-b border-[#E2E8F0] px-3 py-2 font-semibold">
        {wrap(children)}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[#F1F5F9] px-3 py-2 text-[#334155]">
        {wrap(children)}
      </td>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-2 border-[#93C5FD] bg-[#F8FAFC] py-1 pl-3 pr-2 text-xs text-[#475569]">
        {wrap(children)}
      </blockquote>
    ),
    pre: ({ children }) => (
      <pre className="my-2 overflow-x-auto rounded-lg bg-[#0F172A] p-3 text-xs text-[#F8FAFC]">
        {children}
      </pre>
    ),
    hr: () => <hr className="my-3 border-[#E2E8F0]" />,
  };
}

function HighlightMarkdownBlock({ block }: { block: MarkdownBlock }) {
  const components = useMemo(() => {
    if (!block.isHit) {
      return createMarkdownComponents([], false);
    }
    const terms = Array.from(
      new Set(block.highlightFragments.flatMap((frag) => extractInlineTerms(frag)))
    );
    return createMarkdownComponents(terms, true);
  }, [block.isHit, block.highlightFragments]);

  return (
    <div className="min-w-0 break-words text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {block.text}
      </ReactMarkdown>
    </div>
  );
}

export function DocumentHighlightViewerModal({
  documentId,
  sourceTitle,
  originalFilename,
  hitChunks,
  focusedChunk,
  onClose,
}: DocumentHighlightViewerModalProps) {
  const filenameForDetection = originalFilename || sourceTitle;
  const isPdf = filenameForDetection.trim().toLowerCase().endsWith(".pdf");

  const [docContent, setDocContent] = useState<DocumentContentResponse | null>(null);
  const [pdfData, setPdfData] = useState<PdfPreviewData | null>(null);
  const [matchedPdfPages, setMatchedPdfPages] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const targetHitRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    if (isPdf) {
      documentService
        .previewDocument(documentId)
        .then(async (res) => {
          const buffer = await res.blob.arrayBuffer();
          if (active) {
            setPdfData({
              bytes: new Uint8Array(buffer),
              filename: res.filename || sourceTitle,
              allowDownload: res.allowDownload ?? true,
            });
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (active) {
            const message =
              err instanceof Error
                ? err.message
                : "Không thể tải file PDF gốc từ máy chủ.";
            setError(message);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });
    } else {
      documentService
        .getDocumentContent(documentId)
        .then((res) => {
          if (active) {
            setDocContent(res);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (active) {
            const message =
              err instanceof Error
                ? err.message
                : "Không thể tải nội dung tài liệu từ máy chủ.";
            setError(message);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [documentId, isPdf, sourceTitle]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const markdownContent = docContent?.markdownContent;

  const blocks = useMemo(() => {
    if (isPdf || !markdownContent) return [];
    return buildHighlightedBlocks(markdownContent, hitChunks, focusedChunk);
  }, [isPdf, markdownContent, hitChunks, focusedChunk]);

  const targetBlockIndex = useMemo(() => {
    const focusedIdx = blocks.findIndex((b) => b.isFocused);
    if (focusedIdx !== -1) return focusedIdx;
    return blocks.findIndex((b) => b.isHit);
  }, [blocks]);

  const hitCount = useMemo(
    () => blocks.filter((b) => b.isHit).length,
    [blocks]
  );

  useEffect(() => {
    if (!isPdf && !isLoading && targetBlockIndex !== -1 && targetHitRef.current) {
      targetHitRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isPdf, isLoading, targetBlockIndex]);

  const allowDownload = isPdf
    ? Boolean(pdfData?.allowDownload)
    : Boolean(docContent?.allowDownload);

  const handleDownloadOriginal = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { blob, filename } = await documentService.downloadDocument(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        filename ||
        pdfData?.filename ||
        docContent?.originalFilename ||
        sourceTitle;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Không thể tải file gốc.";
      setDownloadError(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Xem tài liệu ${sourceTitle}`}
    >
      <div
        className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-[#0F172A]">
                {docContent?.title || sourceTitle}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                <span>
                  {docContent?.originalFilename || pdfData?.filename || originalFilename || sourceTitle}
                </span>
                {!isLoading && !error && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#92400E]">
                    <Sparkles className="h-3 w-3" />
                    {isPdf
                      ? matchedPdfPages.length > 0
                        ? `Đánh dấu trên ${matchedPdfPages.length} trang PDF gốc`
                        : `${hitChunks.length} đoạn trích từ PDF`
                      : hitCount > 0
                        ? `${hitCount} đoạn được đánh dấu`
                        : `${hitChunks.length} đoạn trích`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allowDownload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDownloading}
                onClick={() => void handleDownloadOriginal()}
                className="h-8 gap-1.5 text-xs"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Tải file gốc</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Đóng cửa sổ xem tài liệu"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {downloadError && (
          <div className="border-b border-[#FECACA] bg-[#FEF2F2] px-5 py-2 text-xs text-[#B91C1C]">
            {downloadError}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[#64748B]">
              <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" />
              <span>
                {isPdf
                  ? "Đang tải file PDF gốc..."
                  : "Đang tải nội dung tài liệu..."}
              </span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
                {error}
              </div>
            </div>
          ) : isPdf && pdfData ? (
            <PdfHighlightViewer
              pdfBytes={pdfData.bytes}
              hitChunks={hitChunks}
              focusedChunk={focusedChunk}
              onMatchedPagesChange={setMatchedPdfPages}
            />
          ) : (
            <div className="h-full overflow-y-auto px-6 py-5">
              {blocks.length === 0 ? (
                <div className="rounded-xl border border-[#E2E8F0] p-6 text-center text-sm text-[#64748B]">
                  Tài liệu chưa có nội dung xem trước.
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-4">
                  {blocks.map((block) => {
                    const isTarget = block.index === targetBlockIndex;
                    return (
                      <div
                        key={block.index}
                        ref={isTarget ? targetHitRef : undefined}
                        className={
                          block.isHit
                            ? `rounded-xl border-l-4 px-4 py-3 transition-colors ${
                                block.isFocused
                                  ? "border-[#D97706] bg-[#FEF3C7]/75 ring-1 ring-[#F59E0B]/40"
                                  : "border-[#F59E0B] bg-[#FEF3C7]/45"
                              }`
                            : ""
                        }
                      >
                        {block.isHit && (
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <mark className="rounded bg-[#FDE68A] px-1.5 py-0.5 text-[10px] font-semibold text-[#92400E]">
                              {block.isFocused ? "Đoạn trích đang chọn" : "Đoạn trích khớp"}
                            </mark>
                          </div>
                        )}
                        <HighlightMarkdownBlock block={block} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
