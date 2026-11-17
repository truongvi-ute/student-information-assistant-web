import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiCitationResponse } from "@/types/chatbot";

interface PdfHighlightViewerProps {
  pdfBytes: Uint8Array;
  hitChunks: AiCitationResponse[];
  focusedChunk?: AiCitationResponse | null;
  onMatchedPagesChange?: (pages: number[]) => void;
}

interface SearchPhrase {
  normalized: string;
  isFocused: boolean;
}

interface SpanMatchRange {
  start: number;
  end: number;
  isFocused: boolean;
}

function cleanMarkdownForPdfSearch(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\|/g, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchPhrases(
  hitChunks: AiCitationResponse[],
  focusedChunk?: AiCitationResponse | null
): SearchPhrase[] {
  const seen = new Set<string>();
  const phrases: SearchPhrase[] = [];

  const addPhrase = (candidate: string, isFocused: boolean) => {
    const normalized = candidate.replace(/\s+/g, " ").trim().toLowerCase();
    if (normalized.length < 10) return;
    if (/^[-:\s.]+$/.test(normalized)) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    phrases.push({ normalized, isFocused });
  };

  for (const chunk of hitChunks) {
    const raw = chunk.quotedContent ?? "";
    if (!raw.trim()) continue;
    const isFocused = Boolean(
      focusedChunk &&
        (focusedChunk === chunk ||
          (focusedChunk.chunkReference &&
            focusedChunk.chunkReference === chunk.chunkReference &&
            focusedChunk.quotedContent === chunk.quotedContent))
    );

    const lines = raw.split(/\n+/);
    for (const line of lines) {
      const cleanedLine = cleanMarkdownForPdfSearch(line);
      if (cleanedLine.length < 10) continue;

      if (cleanedLine.length <= 140) {
        addPhrase(cleanedLine, isFocused);
      } else {
        const clauses = cleanedLine.split(/(?<=[.;:])\s+/);
        for (const clause of clauses) {
          if (clause.length >= 12 && clause.length <= 140) {
            addPhrase(clause, isFocused);
          } else if (clause.length > 140) {
            const words = clause.split(/\s+/);
            for (let i = 0; i < words.length; i += 8) {
              const slice = words.slice(i, i + 10).join(" ");
              addPhrase(slice, isFocused);
            }
          }
        }
      }
    }
  }

  return phrases.sort((a, b) => b.normalized.length - a.normalized.length);
}

function findPhraseOccurrences(
  normText: string,
  phrase: string
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let idx = normText.indexOf(phrase);
  while (idx !== -1) {
    ranges.push({ start: idx, end: idx + phrase.length });
    idx = normText.indexOf(phrase, idx + phrase.length);
  }
  return ranges;
}

function highlightPdfTextLayer(
  textDivs: HTMLElement[],
  phrases: SearchPhrase[]
): { matchCount: number; firstMarkEl: HTMLElement | null; hasFocusedMatch: boolean } {
  const spans = textDivs.filter(
    (el) => el.tagName === "SPAN" && (el.textContent?.length ?? 0) > 0
  );
  if (spans.length === 0 || phrases.length === 0) {
    return { matchCount: 0, firstMarkEl: null, hasFocusedMatch: false };
  }

  let normText = "";
  const charMap: Array<{ spanIdx: number; charIdx: number } | null> = [];
  let prevWasSpace = true;

  for (let spanIdx = 0; spanIdx < spans.length; spanIdx++) {
    const raw = spans[spanIdx].textContent ?? "";
    if (spanIdx > 0 && raw.length > 0 && !prevWasSpace && !/^\s/.test(raw)) {
      normText += " ";
      charMap.push(null);
      prevWasSpace = true;
    }

    for (let charIdx = 0; charIdx < raw.length; charIdx++) {
      const ch = raw[charIdx];
      if (/\s/.test(ch)) {
        if (!prevWasSpace) {
          normText += " ";
          charMap.push({ spanIdx, charIdx });
          prevWasSpace = true;
        }
      } else {
        // Bỏ qua khoảng trắng sau dấu chấm/gạch chéo để khớp giữa "I. 3" (PDF) và "I.3" (Markdown)
        const isSpaceAfterPunct =
          prevWasSpace &&
          normText.length >= 2 &&
          /[./]/.test(normText[normText.length - 2]);
        if (isSpaceAfterPunct && !/\s/.test(ch)) {
          normText = normText.slice(0, -1);
          charMap.pop();
        }
        normText += ch.toLowerCase();
        charMap.push({ spanIdx, charIdx });
        prevWasSpace = false;
      }
    }
  }

  const perSpanRanges = new Map<number, SpanMatchRange[]>();
  let totalMatches = 0;
  let hasFocusedMatch = false;

  const markNormRange = (start: number, end: number, isFocused: boolean) => {
    const localBounds = new Map<number, { min: number; max: number }>();
    for (let pos = start; pos < end; pos++) {
      const mapped = charMap[pos];
      if (!mapped) continue;
      const existing = localBounds.get(mapped.spanIdx);
      if (!existing) {
        localBounds.set(mapped.spanIdx, { min: mapped.charIdx, max: mapped.charIdx + 1 });
      } else {
        existing.min = Math.min(existing.min, mapped.charIdx);
        existing.max = Math.max(existing.max, mapped.charIdx + 1);
      }
    }

    for (const [spanIdx, bound] of localBounds.entries()) {
      const list = perSpanRanges.get(spanIdx) ?? [];
      list.push({ start: bound.min, end: bound.max, isFocused });
      perSpanRanges.set(spanIdx, list);
    }
  };

  for (const phraseObj of phrases) {
    const normalizedPhrase = phraseObj.normalized.replace(/([./])\s+/g, "$1");
    let hits = findPhraseOccurrences(normText, normalizedPhrase);

    // Fallback: nếu dòng trong PDF bị ngắt/lệch một phần, trượt từng cụm 4 từ liên tiếp để giữ đủ đầu/cuối dòng
    if (hits.length === 0 && normalizedPhrase.length >= 20) {
      const words = normalizedPhrase.split(" ").filter(Boolean);
      if (words.length >= 4) {
        for (let i = 0; i <= words.length - 4; i += 2) {
          const sub = words.slice(i, i + 4).join(" ");
          if (sub.length >= 12) {
            hits = hits.concat(findPhraseOccurrences(normText, sub));
          }
        }
      }
    }

    if (hits.length > 0) {
      totalMatches += hits.length;
      if (phraseObj.isFocused) {
        hasFocusedMatch = true;
      }
      for (const hit of hits) {
        markNormRange(hit.start, hit.end, phraseObj.isFocused);
      }
    }
  }

  if (perSpanRanges.size === 0) {
    return { matchCount: 0, firstMarkEl: null, hasFocusedMatch: false };
  }

  let firstMarkEl: HTMLElement | null = null;
  let firstFocusedMarkEl: HTMLElement | null = null;

  for (const [spanIdx, rawRanges] of perSpanRanges.entries()) {
    const span = spans[spanIdx];
    const originalText = span.textContent ?? "";
    if (!originalText) continue;

    rawRanges.sort((a, b) => a.start - b.start || b.end - a.end);
    const merged: SpanMatchRange[] = [];
    for (const r of rawRanges) {
      const last = merged[merged.length - 1];
      if (!last || r.start > last.end) {
        merged.push({ ...r });
      } else {
        last.end = Math.max(last.end, r.end);
        last.isFocused = last.isFocused || r.isFocused;
      }
    }

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const range of merged) {
      if (range.start > cursor) {
        fragment.appendChild(document.createTextNode(originalText.slice(cursor, range.start)));
      }
      const mark = document.createElement("mark");
      mark.className = range.isFocused
        ? "sia-pdf-mark sia-pdf-mark-focused"
        : "sia-pdf-mark";
      mark.textContent = originalText.slice(range.start, range.end);
      fragment.appendChild(mark);

      if (!firstMarkEl) firstMarkEl = mark;
      if (range.isFocused && !firstFocusedMarkEl) firstFocusedMarkEl = mark;

      cursor = range.end;
    }
    if (cursor < originalText.length) {
      fragment.appendChild(document.createTextNode(originalText.slice(cursor)));
    }

    span.textContent = "";
    span.appendChild(fragment);
  }

  return {
    matchCount: totalMatches,
    firstMarkEl: firstFocusedMarkEl ?? firstMarkEl,
    hasFocusedMatch,
  };
}

export function PdfHighlightViewer({
  pdfBytes,
  hitChunks,
  focusedChunk,
  onMatchedPagesChange,
}: PdfHighlightViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstScrollTargetRef = useRef<HTMLElement | null>(null);
  const [scale, setScale] = useState(1.15);
  const [numPages, setNumPages] = useState(0);
  const [matchedPages, setMatchedPages] = useState<number[]>([]);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  const searchPhrases = useMemo(
    () => buildSearchPhrases(hitChunks, focusedChunk),
    [hitChunks, focusedChunk]
  );

  const scrollToFirstMatch = useCallback(() => {
    if (firstScrollTargetRef.current) {
      firstScrollTargetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = containerRef.current;
    if (!host) return;

    let loadingTask: { destroy: () => Promise<void> } | null = null;
    const activeRenderTasks: Array<{ cancel: () => void }> = [];

    const renderPdf = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        if (cancelled) return;
        const task = pdfjs.getDocument({ data: pdfBytes.slice(0) });
        loadingTask = task;

        const pdfDoc = await task.promise;
        if (cancelled) return;

        setNumPages(pdfDoc.numPages);
        host.innerHTML = "";
        firstScrollTargetRef.current = null;

        const foundPages: number[] = [];
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
          if (cancelled) return;

          const page = await pdfDoc.getPage(pageNumber);
          if (cancelled) return;

          const viewport = page.getViewport({ scale });

          const pageCard = document.createElement("div");
          pageCard.className =
            "relative mx-auto overflow-hidden rounded-lg border border-[#CBD5E1] bg-white shadow-sm";
          pageCard.style.width = `${viewport.width}px`;
          pageCard.style.height = `${viewport.height}px`;
          pageCard.dataset.pageNumber = String(pageNumber);

          const pageLabel = document.createElement("div");
          pageLabel.className =
            "pointer-events-none absolute right-2.5 top-2 z-10 rounded bg-[#0F172A]/65 px-2 py-0.5 text-[10px] font-medium text-white";
          pageLabel.textContent = `Trang ${pageNumber}/${pdfDoc.numPages}`;
          pageCard.appendChild(pageLabel);

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.className = "block";
          pageCard.appendChild(canvas);

          const textLayerDiv = document.createElement("div");
          textLayerDiv.className = "sia-pdf-text-layer";
          textLayerDiv.style.setProperty("--total-scale-factor", String(scale));
          pageCard.appendChild(textLayerDiv);

          host.appendChild(pageCard);

          const ctx = canvas.getContext("2d");
          if (ctx) {
            const renderTask = page.render({
              canvas,
              canvasContext: ctx,
              viewport,
              transform:
                outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
            });
            activeRenderTasks.push(renderTask);
            await renderTask.promise;
          }

          if (cancelled) return;

          const textContent = await page.getTextContent();
          if (cancelled) return;

          const textLayer = new pdfjs.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport,
          });
          await textLayer.render();

          if (cancelled) return;

          const result = highlightPdfTextLayer(textLayer.textDivs, searchPhrases);
          if (result.matchCount > 0) {
            foundPages.push(pageNumber);
            if (
              result.firstMarkEl &&
              (!firstScrollTargetRef.current || result.hasFocusedMatch)
            ) {
              firstScrollTargetRef.current = result.firstMarkEl;
            }
          } else if (
            !firstScrollTargetRef.current &&
            focusedChunk?.pageNumber === pageNumber
          ) {
            firstScrollTargetRef.current = pageCard;
          }
        }

        if (!cancelled) {
          setMatchedPages(foundPages);
          onMatchedPagesChange?.(foundPages);
          setRenderError(null);
          setIsRendering(false);
          if (firstScrollTargetRef.current) {
            firstScrollTargetRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Không thể hiển thị file PDF gốc.";
          setRenderError(message);
          setIsRendering(false);
        }
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
      for (const task of activeRenderTasks) {
        try {
          task.cancel();
        } catch {
          // ignore cancel errors on unmount
        }
      }
      if (loadingTask) {
        void loadingTask.destroy().catch(() => undefined);
      }
    };
  }, [pdfBytes, scale, searchPhrases, focusedChunk?.pageNumber, onMatchedPagesChange]);

  return (
    <div className="flex h-full flex-col bg-[#F1F5F9]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-white px-5 py-2 text-xs text-[#475569]">
        <div className="flex flex-wrap items-center gap-2">
          <span>{numPages > 0 ? `${numPages} trang` : "Đang đọc PDF..."}</span>
          {matchedPages.length > 0 && (
            <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#92400E]">
              Đánh dấu tại trang {matchedPages.join(", ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {matchedPages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={scrollToFirstMatch}
              className="h-7 gap-1 px-2 text-[11px]"
            >
              <Crosshair className="h-3 w-3" />
              <span>Tới đoạn khớp</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.max(0.7, Number((s - 0.15).toFixed(2))))}
            aria-label="Thu nhỏ"
            className="h-7 w-7"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-11 text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.min(2.2, Number((s + 0.15).toFixed(2))))}
            aria-label="Phóng to"
            className="h-7 w-7"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto px-4 py-5">
        {isRendering && (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
            <span>Đang dựng trang PDF gốc và đánh dấu đoạn trích...</span>
          </div>
        )}

        {renderError ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
            {renderError}
          </div>
        ) : (
          <div ref={containerRef} className="space-y-4 pb-6" />
        )}
      </div>
    </div>
  );
}
