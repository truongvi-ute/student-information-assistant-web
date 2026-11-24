import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Crosshair, Loader2, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import type { AiCitationResponse } from "@/types/chatbot";
import {
  analyzePage,
  applyPageMarks,
  buildChunkPhrases,
  buildNormTextFromTextItems,
  buildPageTextIndex,
  isSameChunk,
  pickChunkPages,
  totalPhraseLength,
  type ChunkPageHighlight,
  type ChunkPhrases,
} from "@/utils/pdf-highlight";

interface PdfHighlightViewerProps {
  pdfBytes: Uint8Array;
  hitChunks: AiCitationResponse[];
  focusedChunk?: AiCitationResponse | null;
  onMatchedPagesChange?: (pages: number[]) => void;
  onRenderStateChange?: (state: { isRendering: boolean; renderError: string | null }) => void;
  onRetry?: () => void;
}

interface ChunkMatch {
  chunkIdx: number;
  pageNumber: number;
}

interface PageMeta {
  width: number;
  height: number;
  normText: string;
}

interface PdfPreparedData {
  pdfjs: typeof import("pdfjs-dist");
  pdfDoc: PDFDocumentProxy;
  pages: PageMeta[];
  chunksByPage: Map<number, Array<{ chunkIdx: number; phrases: ChunkPhrases }>>;
  matchedPages: number[];
  matches: ChunkMatch[];
  initialIdx: number;
}

const TEXT_SCAN_BATCH_SIZE = 8;

export function PdfHighlightViewer({
  pdfBytes,
  hitChunks,
  focusedChunk,
  onMatchedPagesChange,
  onRenderStateChange,
  onRetry,
}: PdfHighlightViewerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const focusedChunkRef = useRef(focusedChunk);
  const onMatchedPagesChangeRef = useRef(onMatchedPagesChange);

  const pageCardsRef = useRef<HTMLElement[]>([]);
  const chunkAnchorsRef = useRef<Map<number, HTMLElement>>(new Map());
  const renderPageRef = useRef<((pageIdx: number) => Promise<void>) | null>(null);
  const activeIdxRef = useRef(0);

  const [scale, setScale] = useState(() => typeof window !== "undefined" && window.innerWidth < 640 ? 0.55 : 1.15);
  const [prepared, setPrepared] = useState<PdfPreparedData | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    focusedChunkRef.current = focusedChunk;
  }, [focusedChunk]);

  useEffect(() => {
    onMatchedPagesChangeRef.current = onMatchedPagesChange;
  }, [onMatchedPagesChange]);

  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  const scrollToMatch = useCallback((match: ChunkMatch | undefined) => {
    if (!match) return;
    const pageIdx = match.pageNumber - 1;
    const anchor = chunkAnchorsRef.current.get(match.chunkIdx);
    if (anchor && anchor.isConnected) {
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const pageCard = pageCardsRef.current[pageIdx];
    pageCard?.scrollIntoView({ behavior: "smooth", block: "center" });

    // Nếu trang chưa render kịp, ưu tiên render ngay rồi tinh chỉnh lại vị trí mark
    const renderFn = renderPageRef.current;
    if (renderFn) {
      void renderFn(pageIdx).then(() => {
        const readyAnchor = chunkAnchorsRef.current.get(match.chunkIdx);
        readyAnchor?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, []);

  const goToMatch = useCallback(
    (nextIdx: number) => {
      const list = prepared?.matches ?? [];
      if (list.length === 0) return;
      const normalized = ((nextIdx % list.length) + list.length) % list.length;
      setActiveIdx(normalized);
      scrollToMatch(list[normalized]);
    },
    [prepared, scrollToMatch]
  );

  // Pha 1: Tải PDF + quét nhanh text (getTextContent song song, KHÔNG vẽ canvas) để biết ngay trang khớp
  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;

    const prepareDocument = async () => {
      try {
        onRenderStateChange?.({ isRendering: true, renderError: null });
        setIsLoadingDoc(true);
        setRenderError(null);
        setPrepared(null);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        if (cancelled) return;

        const task = pdfjs.getDocument({ data: pdfBytes.slice(0) });
        loadingTask = task;

        const pdfDoc = await task.promise;
        if (cancelled) return;

        const pages: PageMeta[] = new Array(pdfDoc.numPages);
        for (let start = 1; start <= pdfDoc.numPages; start += TEXT_SCAN_BATCH_SIZE) {
          if (cancelled) return;
          const end = Math.min(start + TEXT_SCAN_BATCH_SIZE - 1, pdfDoc.numPages);
          const batchNums = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          await Promise.all(
            batchNums.map(async (pageNumber) => {
              const page = await pdfDoc.getPage(pageNumber);
              const viewport = page.getViewport({ scale: 1 });
              const textContent = await page.getTextContent();
              const normText = buildNormTextFromTextItems(
                textContent.items as ReadonlyArray<{ str?: string; hasEOL?: boolean }>
              );
              pages[pageNumber - 1] = {
                width: viewport.width,
                height: viewport.height,
                normText,
              };
            })
          );
        }
        if (cancelled) return;

        const chunksByPage = new Map<
          number,
          Array<{ chunkIdx: number; phrases: ChunkPhrases }>
        >();
        const bestPageByChunk = new Map<number, number>();

        hitChunks.forEach((chunk, chunkIdx) => {
          const phrases = buildChunkPhrases(chunk.quotedContent ?? "");
          const totalLen = totalPhraseLength(phrases);
          if (totalLen === 0) return;

          const analyses = pages.map((p) => analyzePage(p.normText, phrases));
          const hintIdx =
            chunk.pageNumber != null && chunk.pageNumber >= 1 ? chunk.pageNumber - 1 : null;
          const picked = pickChunkPages(analyses, totalLen, hintIdx);
          if (!picked) return;

          bestPageByChunk.set(chunkIdx, picked.bestIdx);
          for (const pageIdx of picked.pageIdxs) {
            const analysis = analyses[pageIdx];
            if (analysis.exactRanges.length === 0 && analysis.windowRanges.length === 0) {
              continue;
            }
            const list = chunksByPage.get(pageIdx) ?? [];
            list.push({ chunkIdx, phrases });
            chunksByPage.set(pageIdx, list);
          }
        });

        const matchedPages = Array.from(chunksByPage.keys())
          .sort((a, b) => a - b)
          .map((idx) => idx + 1);

        const rawMatches: ChunkMatch[] = [];
        hitChunks.forEach((chunk, chunkIdx) => {
          const bestIdx = bestPageByChunk.get(chunkIdx);
          if (bestIdx != null) {
            rawMatches.push({ chunkIdx, pageNumber: bestIdx + 1 });
          } else if (
            chunk.pageNumber != null &&
            chunk.pageNumber >= 1 &&
            chunk.pageNumber <= pdfDoc.numPages
          ) {
            rawMatches.push({ chunkIdx, pageNumber: chunk.pageNumber });
          }
        });
        rawMatches.sort((a, b) => a.pageNumber - b.pageNumber || a.chunkIdx - b.chunkIdx);

        const focused = focusedChunkRef.current;
        const focusedChunkIdx = focused
          ? hitChunks.findIndex((c) => isSameChunk(c, focused))
          : -1;
        const initialIdx = Math.max(
          0,
          rawMatches.findIndex((m) => m.chunkIdx === focusedChunkIdx)
        );

        if (!cancelled) {
          onMatchedPagesChangeRef.current?.(matchedPages);
          setActiveIdx(initialIdx);
          setPrepared({
            pdfjs,
            pdfDoc,
            pages,
            chunksByPage,
            matchedPages,
            matches: rawMatches,
            initialIdx,
          });
          setIsLoadingDoc(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Không thể hiển thị file PDF gốc.";
          onRenderStateChange?.({ isRendering: false, renderError: message });
          setRenderError(message);
          setIsLoadingDoc(false);
        }
      }
    };

    void prepareDocument();

    return () => {
      cancelled = true;
      if (loadingTask) {
        void loadingTask.destroy().catch(() => undefined);
      }
    };
  }, [pdfBytes, hitChunks, onRenderStateChange]);

  // Pha 2: Tạo khung placeholder cho mọi trang, ưu tiên render trang khớp + lazy-render khi cuộn
  useEffect(() => {
    if (!prepared) return;
    const host = containerRef.current;
    const scrollRoot = scrollRef.current;
    if (!host || !scrollRoot) return;

    let cancelled = false;
    let pageFailed = false;
    onRenderStateChange?.({ isRendering: true, renderError: null });
    const { pdfjs, pdfDoc, pages, chunksByPage, matches, initialIdx } = prepared;
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);

    host.innerHTML = "";
    chunkAnchorsRef.current = new Map();

    const pageCards: HTMLElement[] = [];
    const pageStates: Array<"idle" | "rendering" | "rendered"> = new Array(pages.length).fill(
      "idle"
    );
    const inFlightPromises = new Map<number, Promise<void>>();
    const activeRenderTasks = new Map<number, { cancel: () => void }>();

    pages.forEach((meta, idx) => {
      const pageNumber = idx + 1;
      const pageCard = document.createElement("div");
      pageCard.className =
        "relative mx-auto overflow-hidden rounded-lg border border-[#CBD5E1] bg-white shadow-sm";
      pageCard.style.width = `${meta.width * scale}px`;
      pageCard.style.height = `${meta.height * scale}px`;
      pageCard.dataset.pageIndex = String(idx);
      pageCard.dataset.pageNumber = String(pageNumber);

      const pageLabel = document.createElement("div");
      pageLabel.className =
        "pointer-events-none absolute right-2.5 top-2 z-10 rounded bg-[#0F172A]/65 px-2 py-0.5 text-[10px] font-medium text-white";
      pageLabel.textContent = `Trang ${pageNumber}/${pages.length}`;
      pageCard.appendChild(pageLabel);

      host.appendChild(pageCard);
      pageCards.push(pageCard);
    });
    pageCardsRef.current = pageCards;

    const renderSinglePage = (pageIdx: number): Promise<void> => {
      if (cancelled || pageIdx < 0 || pageIdx >= pages.length) return Promise.resolve();
      if (pageStates[pageIdx] === "rendered") return Promise.resolve();
      const existing = inFlightPromises.get(pageIdx);
      if (existing) return existing;

      pageStates[pageIdx] = "rendering";
      const promise = (async () => {
        try {
          const page = await pdfDoc.getPage(pageIdx + 1);
          if (cancelled) return;

          const viewport = page.getViewport({ scale });
          const pageCard = pageCards[pageIdx];

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.className = "block";

          const textLayerDiv = document.createElement("div");
          textLayerDiv.className = "sia-pdf-text-layer";
          textLayerDiv.style.setProperty("--total-scale-factor", String(scale));

          pageCard.appendChild(canvas);
          pageCard.appendChild(textLayerDiv);

          const ctx = canvas.getContext("2d");
          if (ctx) {
            const renderTask = page.render({
              canvas,
              canvasContext: ctx,
              viewport,
              transform:
                outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
            });
            activeRenderTasks.set(pageIdx, renderTask);
            await renderTask.promise;
            activeRenderTasks.delete(pageIdx);
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

          const pageChunks = chunksByPage.get(pageIdx);
          if (pageChunks && pageChunks.length > 0) {
            const textIndex = buildPageTextIndex(textLayer.textDivs);
            const inputs: ChunkPageHighlight[] = [];
            for (const { chunkIdx, phrases } of pageChunks) {
              const analysis = analyzePage(textIndex.normText, phrases);
              if (analysis.exactRanges.length > 0 || analysis.windowRanges.length > 0) {
                inputs.push({ chunkIdx, analysis, shortPhrases: phrases.short });
              }
            }
            if (inputs.length > 0) {
              const { exactAnchors, anyAnchors } = applyPageMarks(textIndex, inputs);
              for (const { chunkIdx } of pageChunks) {
                const anchor = exactAnchors.get(chunkIdx) ?? anyAnchors.get(chunkIdx);
                if (anchor && !chunkAnchorsRef.current.has(chunkIdx)) {
                  chunkAnchorsRef.current.set(chunkIdx, anchor);
                }
              }
            }
          }

          pageStates[pageIdx] = "rendered";
        } catch (error: unknown) {
          if (!cancelled) {
            pageFailed = true;
            const message = error instanceof Error ? error.message : "Không thể hiển thị trang PDF.";
            setRenderError(message);
            onRenderStateChange?.({ isRendering: false, renderError: message });
            pageStates[pageIdx] = "idle";
          }
        } finally {
          inFlightPromises.delete(pageIdx);
        }
      })();

      inFlightPromises.set(pageIdx, promise);
      return promise;
    };

    renderPageRef.current = renderSinglePage;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.pageIndex);
          if (!Number.isNaN(idx)) {
            void renderSinglePage(idx);
          }
        }
      },
      { root: scrollRoot, rootMargin: "700px 0px" }
    );
    pageCards.forEach((card) => observer.observe(card));

    // Ưu tiên cuộn tới đoạn đang chọn (hoặc đoạn đầu) và render ngay trang đó + 2 trang kề
    const targetMatch = matches[activeIdxRef.current] ?? matches[initialIdx];
    const targetPageIdx = targetMatch ? targetMatch.pageNumber - 1 : 0;

    if (targetMatch && pageCards[targetPageIdx]) {
      pageCards[targetPageIdx].scrollIntoView({ behavior: "auto", block: "center" });
    }

    void renderSinglePage(targetPageIdx).then(() => {
      if (cancelled || !targetMatch) return;
      const anchor = chunkAnchorsRef.current.get(targetMatch.chunkIdx);
      anchor?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    if (targetPageIdx > 0) void renderSinglePage(targetPageIdx - 1);
    if (targetPageIdx + 1 < pages.length) void renderSinglePage(targetPageIdx + 1);

    if (onRenderStateChange) {
      void (async () => {
        for (let idx = 0; idx < pages.length; idx++) {
          if (cancelled || pageFailed) return;
          await renderSinglePage(idx);
        }
        if (!cancelled && !pageFailed) {
          onRenderStateChange({ isRendering: false, renderError: null });
        }
      })();
    }

    return () => {
      cancelled = true;
      renderPageRef.current = null;
      observer.disconnect();
      activeRenderTasks.forEach((task) => {
        try {
          task.cancel();
        } catch {
          // ignore cancel errors on cleanup
        }
      });
      activeRenderTasks.clear();
    };
  }, [prepared, scale, onRenderStateChange]);

  const numPages = prepared?.pages.length ?? 0;
  const matchedPages = prepared?.matchedPages ?? [];
  const matches = prepared?.matches ?? [];
  const activeMatch = matches[activeIdx];

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
          {!isLoadingDoc && hitChunks.length > 0 && matches.length < hitChunks.length && (
            <span className="text-[11px] text-[#94A3B8]">
              (định vị được {matches.length}/{hitChunks.length} đoạn)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {matches.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => goToMatch(activeIdx - 1)}
                disabled={matches.length < 2}
                aria-label="Đoạn khớp trước"
                className="h-7 w-7"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => scrollToMatch(activeMatch)}
                title="Cuộn tới đoạn khớp đang chọn"
                className="h-7 gap-1 px-2 text-[11px]"
              >
                <Crosshair className="h-3 w-3" />
                <span>
                  Đoạn {activeIdx + 1}/{matches.length}
                  {activeMatch ? ` · Tr. ${activeMatch.pageNumber}` : ""}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => goToMatch(activeIdx + 1)}
                disabled={matches.length < 2}
                aria-label="Đoạn khớp tiếp theo"
                className="h-7 w-7"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
            aria-label="Thu nhỏ"
            className="h-7 w-7"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-11 text-center font-medium">{Math.round(scale * 100)}%</span>
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

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto px-2 py-4 sm:px-4 sm:py-5">
        {isLoadingDoc && (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
            <span>{hitChunks.length > 0 ? "Đang quét tài liệu PDF và định vị đoạn trích..." : "Đang đọc tài liệu PDF..."}</span>
          </div>
        )}

        {renderError ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
            <p>{renderError}</p>
            {onRetry && (
              <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-3 gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Thử lại
              </Button>
            )}
          </div>
        ) : (
          <div ref={containerRef} className="space-y-4 pb-6" />
        )}
      </div>
    </div>
  );
}
