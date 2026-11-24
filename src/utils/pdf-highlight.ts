/**
 * Thuật toán định vị & tô sáng đoạn trích (chunk Markdown) trên PDF.js.
 *
 * - Quét nhanh text từ `page.getTextContent()` (không cần vẽ canvas) để định vị trang chứa từng chunk.
 * - Khi render TextLayer cho một trang cụ thể: nhóm span theo dòng hiển thị và chèn ký tự ngăn cách cứng
 *   giữa các ô bảng trên cùng 1 dòng để cụm của 1 ô không khớp lan sang ô bên cạnh.
 * - Lọc theo vùng liên tục [minY, maxY] của chunk: dùng các cụm đặc trưng (xuất hiện 1 lần trên trang)
 *   và cụm đa từ để xác định dải tọa độ dọc thực sự của chunk, loại bỏ các mã/cụm lặp lại ở dòng khác
 *   (ví dụ mã môn tiên quyết OOPR230279, INPR130285 lặp ở phía dưới bảng).
 * - Khớp 2 tầng + hỗ trợ hàng bảng nhiều dòng: nối xuyên 2 dòng chữ trong cùng 1 ô (như tên học phần bị
 *   xuống dòng) và mở rộng dải Y của hàng để tô đủ STT, số tín chỉ căn giữa ô và phần chữ ở dòng dưới.
 * - Bỏ dòng header bảng (dòng ngay trước |---|) khỏi phần tô sáng, chỉ dùng để chấm điểm trang.
 */
import type { AiCitationResponse } from "@/types/chatbot";

export const HARD_SEP = "\u0001";

const MIN_PHRASE_LEN = 10;
const MAX_PHRASE_LEN = 140;
const WINDOW_WORDS = 5;
const MIN_PAGE_SCORE = 20;
const SPAN_FILL_RATIO = 0.8;

export interface PageTextIndex {
  spans: HTMLElement[];
  /** Tọa độ tương đối theo trục dọc/ngang của từng span */
  spanRects: Array<{ top: number; bottom: number; left: number; right: number; height: number }>;
  normText: string;
  charMap: Array<{ spanIdx: number; charIdx: number } | null>;
  /** Chỉ số dòng hiển thị của span (-1 nếu span chỉ chứa khoảng trắng) */
  spanLine: number[];
  /** Các span không rỗng thuộc từng dòng */
  lineSpans: number[][];
  /** Dải tọa độ dọc (top, bottom) của từng dòng hiển thị */
  lineBounds: Array<{ top: number; bottom: number }>;
  /** Số ô (cụm span cách nhau xa theo chiều ngang) trên từng dòng */
  lineCellCount: number[];
  /** Vị trí ký tự không trắng đầu/cuối của span và số ký tự không trắng */
  spanTrim: Array<{ a: number; b: number; nonSpace: number }>;
}

export interface NormRange {
  start: number;
  end: number;
}

export interface ChunkPhrases {
  /** Cụm dài dùng để định vị & tô sáng */
  strong: string[];
  /** Ô/dòng ngắn, chỉ tô khi nằm trong dòng đã khớp cụm dài */
  short: string[];
  /** Header bảng: chỉ dùng chấm điểm trang, không tô */
  scoreOnly: string[];
}

export interface PageAnalysis {
  exactScore: number;
  windowScore: number;
  exactRanges: NormRange[];
  windowRanges: NormRange[];
  /** Danh sách các vị trí khớp theo từng cụm strong (giữ riêng để biết cụm nào là duy nhất trên trang) */
  exactGroups: Array<{ phrase: string; hits: NormRange[] }>;
}

interface LocalRange {
  start: number;
  end: number;
  exact: boolean;
}

export interface ChunkPageHighlight {
  chunkIdx: number;
  analysis: PageAnalysis;
  shortPhrases: string[];
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

/** Chuẩn hóa giống normText của TextLayer: gộp khoảng trắng, chữ thường, bỏ khoảng trắng sau "." và "/" */
function normalizePhrase(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase().replace(/([./])\s+/g, "$1");
}

function isTableSeparatorRow(line: string): boolean {
  return line.includes("-") && /^\|?[\s:|-]+\|?$/.test(line);
}

/** Chuẩn hóa nhanh danh sách item từ `page.getTextContent()` (không cần vẽ canvas/DOM) */
export function buildNormTextFromTextItems(
  items: ReadonlyArray<{ str?: string; hasEOL?: boolean }>
): string {
  let normText = "";
  let prevWasSpace = true;

  for (const item of items) {
    const raw = item.str;
    if (!raw) continue;
    if (normText.length > 0 && !prevWasSpace && !/^\s/.test(raw)) {
      normText += " ";
      prevWasSpace = true;
    }

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (/\s/.test(ch)) {
        if (!prevWasSpace) {
          normText += " ";
          prevWasSpace = true;
        }
      } else {
        const isSpaceAfterPunct =
          prevWasSpace &&
          normText.endsWith(" ") &&
          normText.length >= 2 &&
          /[./]/.test(normText[normText.length - 2]);
        if (isSpaceAfterPunct) {
          normText = normText.slice(0, -1);
        }
        normText += ch.toLowerCase();
        prevWasSpace = false;
      }
    }

    if (item.hasEOL && !prevWasSpace) {
      normText += " ";
      prevWasSpace = true;
    }
  }

  return normText;
}

/** Tách nội dung 1 chunk thành các cụm tìm kiếm (dòng, mệnh đề, ô bảng) */
export function buildChunkPhrases(raw: string): ChunkPhrases {
  const seen = new Set<string>();
  const strong: string[] = [];
  const short: string[] = [];
  const scoreOnly: string[] = [];

  const addTo = (target: string[], candidate: string, minLen: number) => {
    const normalized = normalizePhrase(candidate);
    if (normalized.length < minLen) return;
    if (/^[-:\s.|]+$/.test(normalized)) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    target.push(normalized);
  };

  const addLong = (text: string) => {
    if (text.length <= MAX_PHRASE_LEN) {
      addTo(strong, text, MIN_PHRASE_LEN);
      return;
    }
    for (const clause of text.split(/(?<=[.;:])\s+/)) {
      if (clause.length <= MAX_PHRASE_LEN) {
        if (clause.length >= 12) addTo(strong, clause, MIN_PHRASE_LEN);
        continue;
      }
      const words = clause.split(/\s+/);
      for (let i = 0; i < words.length; i += 8) {
        addTo(strong, words.slice(i, i + 10).join(" "), MIN_PHRASE_LEN);
      }
    }
  };

  const addText = (text: string) => {
    if (!text) return;
    if (text.length >= MIN_PHRASE_LEN) addLong(text);
    else addTo(short, text, 1);
  };

  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  lines.forEach((line, i) => {
    if (isTableSeparatorRow(line)) return;
    if (line.includes("|")) {
      const isHeader = i + 1 < lines.length && isTableSeparatorRow(lines[i + 1]);
      // Dòng bảng: thứ tự ô trong PDF có thể khác Markdown nên tìm theo từng ô
      for (const cell of line.split("|")) {
        const cleanedCell = cleanMarkdownForPdfSearch(cell);
        if (!cleanedCell) continue;
        if (isHeader) addTo(scoreOnly, cleanedCell, MIN_PHRASE_LEN);
        else addText(cleanedCell);
      }
      return;
    }
    addText(cleanMarkdownForPdfSearch(line));
  });

  strong.sort((a, b) => b.length - a.length);
  return { strong, short, scoreOnly };
}

export function totalPhraseLength(phrases: ChunkPhrases): number {
  return [...phrases.strong, ...phrases.scoreOnly].reduce((sum, p) => sum + p.length, 0);
}

function findOccurrences(normText: string, phrase: string): NormRange[] {
  const ranges: NormRange[] = [];
  if (!phrase) return ranges;
  let idx = normText.indexOf(phrase);
  while (idx !== -1) {
    ranges.push({ start: idx, end: idx + phrase.length });
    idx = normText.indexOf(phrase, idx + phrase.length);
  }
  return ranges;
}

function cellGapThreshold(a: { height: number }, b: { height: number }): number {
  return Math.max(6, 0.8 * Math.min(a.height, b.height));
}

/** Dựng chỉ mục văn bản của 1 trang. Gọi sau khi TextLayer đã được gắn vào DOM. */
export function buildPageTextIndex(textDivs: HTMLElement[]): PageTextIndex {
  const spans = textDivs.filter(
    (el) => el.tagName === "SPAN" && (el.textContent?.length ?? 0) > 0
  );
  const rawRects = spans.map((s) => s.getBoundingClientRect());
  const spanRects = rawRects.map((r) => ({
    top: r.top,
    bottom: r.bottom,
    left: r.left,
    right: r.right,
    height: Math.max(1, r.height),
  }));

  const spanTrim = spans.map((s) => {
    const t = s.textContent ?? "";
    const a = t.search(/\S/);
    if (a === -1) return { a: 0, b: 0, nonSpace: 0 };
    let b = t.length;
    while (b > a && /\s/.test(t[b - 1])) b--;
    return { a, b, nonSpace: t.slice(a, b).replace(/\s/g, "").length };
  });

  // 1. Nhóm span theo dòng hiển thị (cùng tâm theo chiều dọc)
  const lines: Array<{ cy: number; h: number }> = [];
  const spanLine: number[] = new Array(spans.length).fill(-1);
  spans.forEach((_, i) => {
    if (spanTrim[i].nonSpace === 0) return;
    const r = spanRects[i];
    const cy = r.top + r.height / 2;
    let found = -1;
    for (let l = lines.length - 1; l >= 0; l--) {
      if (Math.abs(lines[l].cy - cy) < 0.5 * Math.min(r.height, lines[l].h)) {
        found = l;
        break;
      }
    }
    if (found === -1) {
      lines.push({ cy, h: r.height });
      found = lines.length - 1;
    }
    spanLine[i] = found;
  });

  const lineSpans: number[][] = lines.map(() => []);
  const lineBounds: Array<{ top: number; bottom: number }> = lines.map(() => ({
    top: Infinity,
    bottom: -Infinity,
  }));
  spanLine.forEach((l, i) => {
    if (l >= 0) {
      lineSpans[l].push(i);
      const r = spanRects[i];
      if (r.top < lineBounds[l].top) lineBounds[l].top = r.top;
      if (r.bottom > lineBounds[l].bottom) lineBounds[l].bottom = r.bottom;
    }
  });

  const lineCellCount = lineSpans.map((ids) => {
    if (ids.length === 0) return 0;
    const sorted = [...ids].sort((x, y) => spanRects[x].left - spanRects[y].left);
    let cells = 1;
    for (let k = 1; k < sorted.length; k++) {
      const p = spanRects[sorted[k - 1]];
      const c = spanRects[sorted[k]];
      if (c.left - p.right > cellGapThreshold(p, c)) cells++;
    }
    return cells;
  });

  // 2. Nối văn bản chuẩn hóa, chèn HARD_SEP giữa các ô trên cùng một dòng
  let normText = "";
  const charMap: PageTextIndex["charMap"] = [];
  let prevWasSpace = true;
  let prevNonBlank = -1;

  for (let spanIdx = 0; spanIdx < spans.length; spanIdx++) {
    const raw = spans[spanIdx].textContent ?? "";
    const isBlank = spanTrim[spanIdx].nonSpace === 0;

    if (!isBlank && prevNonBlank >= 0) {
      const p = spanRects[prevNonBlank];
      const c = spanRects[spanIdx];
      const threshold = cellGapThreshold(p, c);
      const isCellBreak =
        spanLine[prevNonBlank] === spanLine[spanIdx] &&
        (c.left - p.right > threshold || p.left - c.right > threshold);

      if (isCellBreak) {
        if (normText.endsWith(" ")) {
          normText = normText.slice(0, -1);
          charMap.pop();
        }
        if (normText.length > 0 && !normText.endsWith(HARD_SEP)) {
          normText += HARD_SEP;
          charMap.push(null);
        }
        prevWasSpace = true;
      } else if (!prevWasSpace && !/^\s/.test(raw)) {
        normText += " ";
        charMap.push(null);
        prevWasSpace = true;
      }
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
        // Bỏ khoảng trắng sau dấu chấm/gạch chéo để khớp giữa "I. 3" (PDF) và "I.3" (Markdown)
        const isSpaceAfterPunct =
          prevWasSpace &&
          normText.endsWith(" ") &&
          normText.length >= 2 &&
          /[./]/.test(normText[normText.length - 2]);
        if (isSpaceAfterPunct) {
          normText = normText.slice(0, -1);
          charMap.pop();
        }
        normText += ch.toLowerCase();
        charMap.push({ spanIdx, charIdx });
        prevWasSpace = false;
      }
    }

    if (!isBlank) prevNonBlank = spanIdx;
  }

  return {
    spans,
    spanRects,
    normText,
    charMap,
    spanLine,
    lineSpans,
    lineBounds,
    lineCellCount,
    spanTrim,
  };
}

/** Chấm điểm mức độ khớp của 1 chunk trên 1 trang (khớp nguyên cụm + khớp cửa sổ 5 từ) */
export function analyzePage(normText: string, phrases: ChunkPhrases): PageAnalysis {
  const result: PageAnalysis = {
    exactScore: 0,
    windowScore: 0,
    exactRanges: [],
    windowRanges: [],
    exactGroups: [],
  };
  if (!normText) return result;

  for (const phrase of phrases.scoreOnly) {
    if (normText.includes(phrase)) result.exactScore += phrase.length;
  }

  for (const phrase of phrases.strong) {
    const hits = findOccurrences(normText, phrase);
    if (hits.length > 0) {
      result.exactScore += phrase.length;
      result.exactRanges.push(...hits);
      result.exactGroups.push({ phrase, hits });
      continue;
    }

    // Dòng PDF bị ngắt/lệch: trượt cửa sổ 5 từ, chỉ dùng trên trang đã xác định chứa chunk
    const words = phrase.split(" ").filter(Boolean);
    if (words.length < WINDOW_WORDS) continue;
    for (let i = 0; i <= words.length - WINDOW_WORDS; i += 2) {
      const sub = words.slice(i, i + WINDOW_WORDS).join(" ");
      if (sub.length < 15) continue;
      const subHits = findOccurrences(normText, sub);
      if (subHits.length > 0) {
        result.windowScore += sub.length;
        result.windowRanges.push(...subHits);
      }
    }
  }

  return result;
}

/** Chọn trang chứa chunk (trang có điểm cao nhất + trang kề nếu chunk bị cắt qua 2 trang) */
export function pickChunkPages(
  analyses: PageAnalysis[],
  totalPhraseLen: number,
  hintPageIdx: number | null
): { bestIdx: number; pageIdxs: number[] } | null {
  const tryPick = (scoreOf: (a: PageAnalysis) => number) => {
    let bestIdx = -1;
    let bestScore = 0;
    analyses.forEach((a, idx) => {
      const s = scoreOf(a);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = idx;
      }
    });

    const minScore = Math.max(MIN_PAGE_SCORE, totalPhraseLen * 0.12);
    if (bestIdx < 0 || bestScore < minScore) return null;

    if (
      hintPageIdx != null &&
      hintPageIdx !== bestIdx &&
      analyses[hintPageIdx] &&
      scoreOf(analyses[hintPageIdx]) >= bestScore * 0.8
    ) {
      bestIdx = hintPageIdx;
      bestScore = scoreOf(analyses[hintPageIdx]);
    }

    const pageIdxs = [bestIdx];
    for (const adj of [bestIdx - 1, bestIdx + 1]) {
      const a = analyses[adj];
      if (a && scoreOf(a) >= Math.max(MIN_PAGE_SCORE, bestScore * 0.25)) {
        pageIdxs.push(adj);
      }
    }
    return { bestIdx, pageIdxs };
  };

  return tryPick((a) => a.exactScore) ?? tryPick((a) => a.exactScore + a.windowScore);
}

/** Lấy dải tọa độ dọc (top, bottom) của một NormRange trên trang */
function getNormRangeYBounds(
  index: PageTextIndex,
  range: NormRange
): { top: number; bottom: number } | null {
  let top = Infinity;
  let bottom = -Infinity;
  for (let pos = range.start; pos < range.end; pos++) {
    const mapped = index.charMap[pos];
    if (!mapped) continue;
    const r = index.spanRects[mapped.spanIdx];
    if (r.top < top) top = r.top;
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return top <= bottom ? { top, bottom } : null;
}

/**
 * Xác định dải tọa độ dọc [minY, maxY] liên tục thực sự thuộc chunk trên trang.
 *
 * Dùng các cụm xuất hiện duy nhất 1 lần trên trang (unique anchors — tên môn học, câu văn, mã không lặp).
 * Nếu có nhiều cụm duy nhất bị chia cụm rời rạc (ví dụ tiêu đề lặp hoặc đầu mục khác), chọn cụm dày đặc nhất.
 * Nhờ đó các mã học phần lặp lại ở cột "Mã HP trước" của các hàng nằm ngoài chunk sẽ bị loại bỏ hoàn toàn.
 */
function resolveChunkYBand(
  index: PageTextIndex,
  analysis: PageAnalysis
): { minY: number; maxY: number } | null {
  const uniqueAnchors: Array<{ top: number; bottom: number; weight: number }> = [];

  for (const group of analysis.exactGroups) {
    if (group.hits.length !== 1) continue;
    const bounds = getNormRangeYBounds(index, group.hits[0]);
    if (!bounds) continue;
    uniqueAnchors.push({ ...bounds, weight: group.phrase.length });
  }

  if (uniqueAnchors.length === 0) return null;

  // Nhóm các anchor duy nhất theo khoảng cách dọc: một chunk liên tục không có khoảng trống lớn bất thường
  uniqueAnchors.sort((a, b) => a.top - b.top);
  const avgHeight =
    uniqueAnchors.reduce((s, a) => s + Math.max(8, a.bottom - a.top), 0) / uniqueAnchors.length;
  // Cho phép khoảng hở tối đa ~6 dòng giữa 2 anchor kế tiếp trong cùng 1 chunk (đề phòng vài dòng ngắn không có anchor)
  const maxGap = Math.max(75, avgHeight * 6.5);

  const clusters: Array<{ minY: number; maxY: number; weight: number; count: number }> = [];
  for (const a of uniqueAnchors) {
    const last = clusters[clusters.length - 1];
    if (!last || a.top - last.maxY > maxGap) {
      clusters.push({ minY: a.top, maxY: a.bottom, weight: a.weight, count: 1 });
    } else {
      last.maxY = Math.max(last.maxY, a.bottom);
      last.weight += a.weight;
      last.count += 1;
    }
  }

  clusters.sort((a, b) => b.weight - a.weight || b.count - a.count);
  const best = clusters[0];
  const pad = Math.max(10, avgHeight * 1.1);
  return { minY: best.minY - pad, maxY: best.maxY + pad };
}

/** Tính các khoảng ký tự cần tô trên từng span của 1 trang cho 1 chunk */
function computeChunkSpanRanges(
  index: PageTextIndex,
  input: ChunkPageHighlight
): Map<number, LocalRange[]> {
  const { normText, charMap, spanLine, spanRects, lineBounds, spanTrim, spans } = index;
  const local = new Map<number, LocalRange[]>();

  // Xác định vùng dọc liên tục [minY, maxY] của chunk để loại bỏ các cụm lặp (như mã môn tiên quyết) ngoài chunk
  const yBand = resolveChunkYBand(index, input.analysis);
  const isInsideBand = (bounds: { top: number; bottom: number } | null): boolean => {
    if (!yBand || !bounds) return true;
    return bounds.bottom >= yBand.minY && bounds.top <= yBand.maxY;
  };

  const addNorm = (range: NormRange, exact: boolean) => {
    const bounds = new Map<number, { min: number; max: number }>();
    for (let pos = range.start; pos < range.end; pos++) {
      const mapped = charMap[pos];
      if (!mapped) continue;
      const b = bounds.get(mapped.spanIdx);
      if (!b) {
        bounds.set(mapped.spanIdx, { min: mapped.charIdx, max: mapped.charIdx + 1 });
      } else {
        b.min = Math.min(b.min, mapped.charIdx);
        b.max = Math.max(b.max, mapped.charIdx + 1);
      }
    }
    for (const [spanIdx, b] of bounds.entries()) {
      const list = local.get(spanIdx) ?? [];
      list.push({ start: b.min, end: b.max, exact });
      local.set(spanIdx, list);
    }
  };

  // Tầng 1: cụm dài — chỉ giữ các hit nằm trong dải [minY, maxY] của chunk
  for (const group of input.analysis.exactGroups) {
    if (group.hits.length === 1) {
      const hit = group.hits[0];
      if (isInsideBand(getNormRangeYBounds(index, hit))) {
        addNorm(hit, true);
      }
      continue;
    }

    // Cụm xuất hiện nhiều lần trên trang (ví dụ mã HP tiên quyết): chỉ giữ hit nằm trong vùng chunk
    for (const hit of group.hits) {
      if (isInsideBand(getNormRangeYBounds(index, hit))) {
        addNorm(hit, true);
      }
    }
  }

  for (const r of input.analysis.windowRanges) {
    if (isInsideBand(getNormRangeYBounds(index, r))) {
      addNorm(r, false);
    }
  }

  // Fallback an toàn nếu lọc quá chặt làm rỗng (chưa từng có unique anchor khớp)
  if (local.size === 0) {
    input.analysis.exactRanges.forEach((r) => addNorm(r, true));
    input.analysis.windowRanges.forEach((r) => addNorm(r, false));
  }

  // Tập hợp các dòng mạnh (đã khớp cụm dài trong vùng chunk)
  const strongLines = new Set<number>();
  for (const [spanIdx, list] of local.entries()) {
    if (spanLine[spanIdx] >= 0 && list.some((r) => r.exact)) {
      strongLines.add(spanLine[spanIdx]);
    }
  }

  // Hỗ trợ hàng bảng nhiều dòng: nếu cụm dài khớp xuyên qua 2 dòng (ví dụ tên học phần bị xuống dòng),
  // hoặc dòng liền kề bị kẹp trong cùng 1 ô nhiều dòng (số STT, số tín chỉ căn giữa theo chiều dọc),
  // mở rộng strongLines cho các dòng nằm trong dải dọc của các hàng bảng đó.
  const multiLineRowBands: Array<{ top: number; bottom: number }> = [];
  for (const group of input.analysis.exactGroups) {
    for (const hit of group.hits) {
      const bounds = getNormRangeYBounds(index, hit);
      if (!bounds || !isInsideBand(bounds)) continue;

      const hitLines = new Set<number>();
      for (let pos = hit.start; pos < hit.end; pos++) {
        const m = charMap[pos];
        if (m && spanLine[m.spanIdx] >= 0) hitLines.add(spanLine[m.spanIdx]);
      }
      if (hitLines.size >= 2) {
        hitLines.forEach((l) => strongLines.add(l));
        multiLineRowBands.push(bounds);
      }
    }
  }

  // Các dòng nằm lọt trong dải dọc của một ô nhiều dòng (như STT `2`, `3`, `9` hoặc tín chỉ `2` căn giữa)
  if (multiLineRowBands.length > 0) {
    lineBounds.forEach((lb, lineIdx) => {
      if (lb.top > lb.bottom) return;
      const midY = (lb.top + lb.bottom) / 2;
      if (multiLineRowBands.some((band) => midY >= band.top - 2 && midY <= band.bottom + 2)) {
        strongLines.add(lineIdx);
      }
    });
  }

  // Tầng 2: ô/dòng ngắn, chỉ trong các dòng mạnh (và nằm trong vùng chunk)
  const isBoundary = (ch: string | undefined) => ch === undefined || ch === " " || ch === HARD_SEP;
  for (const phrase of input.shortPhrases) {
    for (const hit of findOccurrences(normText, phrase)) {
      if (!isBoundary(normText[hit.start - 1]) || !isBoundary(normText[hit.end])) continue;
      const first = charMap[hit.start];
      const last = charMap[hit.end - 1];
      if (!first || !last) continue;

      let inStrongLine = true;
      for (let pos = hit.start; pos < hit.end; pos++) {
        const m = charMap[pos];
        if (m && !strongLines.has(spanLine[m.spanIdx])) {
          inStrongLine = false;
          break;
        }
      }
      if (!inStrongLine) continue;

      if (phrase.length <= 3) {
        // Ô rất ngắn (STT, số tín chỉ) phải chiếm trọn 1 ô/span
        const cellStart =
          hit.start === 0 ||
          normText[hit.start - 1] === HARD_SEP ||
          first.charIdx === spanTrim[first.spanIdx].a;
        const cellEnd =
          hit.end === normText.length ||
          normText[hit.end] === HARD_SEP ||
          last.charIdx + 1 === spanTrim[last.spanIdx].b;
        if (!cellStart || !cellEnd) continue;
      }
      addNorm(hit, false);
    }
  }

  // Tô trọn span khi phần khớp phủ >= 80% ký tự
  for (const [spanIdx, list] of local.entries()) {
    const t = spanTrim[spanIdx];
    if (t.nonSpace === 0) continue;
    const text = spans[spanIdx].textContent ?? "";
    let covered = 0;
    for (let i = t.a; i < t.b; i++) {
      if (/\s/.test(text[i])) continue;
      if (list.some((r) => i >= r.start && i < r.end)) covered++;
    }
    if (covered / t.nonSpace >= SPAN_FILL_RATIO) {
      local.set(spanIdx, [{ start: t.a, end: t.b, exact: list.some((r) => r.exact) }]);
    }
  }

  // Tô đều cả dòng bảng khi dòng có >= 2 span khớp
  for (const line of strongLines) {
    if (index.lineCellCount[line] < 2) continue;
    const ids = index.lineSpans[line];
    const hitCount = ids.filter((id) => local.has(id)).length;
    if (hitCount < 2) continue;
    for (const id of ids) {
      const t = spanTrim[id];
      if (t.nonSpace === 0) continue;
      const existing = local.get(id);
      local.set(id, [{ start: t.a, end: t.b, exact: existing?.some((r) => r.exact) ?? false }]);
    }
  }

  // Tô đủ các span căn giữa ô (STT, số tín chỉ) nằm trong dải dọc của hàng bảng nhiều dòng đã khớp
  for (const band of multiLineRowBands) {
    for (let spanIdx = 0; spanIdx < spans.length; spanIdx++) {
      const t = spanTrim[spanIdx];
      if (t.nonSpace === 0) continue;
      const r = spanRects[spanIdx];
      const midY = r.top + r.height / 2;
      if (midY >= band.top - 2 && midY <= band.bottom + 2) {
        const existing = local.get(spanIdx);
        local.set(spanIdx, [
          { start: t.a, end: t.b, exact: existing?.some((item) => item.exact) ?? false },
        ]);
      }
    }
  }

  return local;
}

/** Bọc <mark> lên các span của 1 trang; trả về mark neo đầu tiên của từng chunk */
export function applyPageMarks(
  index: PageTextIndex,
  inputs: ChunkPageHighlight[]
): { exactAnchors: Map<number, HTMLElement>; anyAnchors: Map<number, HTMLElement> } {
  const exactAnchors = new Map<number, HTMLElement>();
  const anyAnchors = new Map<number, HTMLElement>();

  interface SpanRange {
    start: number;
    end: number;
    chunks: Set<number>;
    exactChunks: Set<number>;
  }
  const perSpan = new Map<number, SpanRange[]>();

  for (const input of inputs) {
    const local = computeChunkSpanRanges(index, input);
    for (const [spanIdx, list] of local.entries()) {
      const target = perSpan.get(spanIdx) ?? [];
      for (const r of list) {
        target.push({
          start: r.start,
          end: r.end,
          chunks: new Set([input.chunkIdx]),
          exactChunks: r.exact ? new Set([input.chunkIdx]) : new Set(),
        });
      }
      perSpan.set(spanIdx, target);
    }
  }

  const spanIdxs = Array.from(perSpan.keys()).sort((a, b) => a - b);
  for (const spanIdx of spanIdxs) {
    const span = index.spans[spanIdx];
    const originalText = span.textContent ?? "";
    if (!originalText) continue;

    const rawRanges = perSpan.get(spanIdx) ?? [];
    rawRanges.sort((a, b) => a.start - b.start || b.end - a.end);
    const merged: SpanRange[] = [];
    for (const r of rawRanges) {
      const last = merged[merged.length - 1];
      if (!last || r.start > last.end) {
        merged.push({
          start: r.start,
          end: r.end,
          chunks: new Set(r.chunks),
          exactChunks: new Set(r.exactChunks),
        });
      } else {
        last.end = Math.max(last.end, r.end);
        r.chunks.forEach((c) => last.chunks.add(c));
        r.exactChunks.forEach((c) => last.exactChunks.add(c));
      }
    }

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const range of merged) {
      if (range.start > cursor) {
        fragment.appendChild(document.createTextNode(originalText.slice(cursor, range.start)));
      }
      const mark = document.createElement("mark");
      mark.className = "sia-pdf-mark";
      mark.dataset.chunks = Array.from(range.chunks).join(",");
      mark.textContent = originalText.slice(range.start, range.end);
      fragment.appendChild(mark);

      range.exactChunks.forEach((c) => {
        if (!exactAnchors.has(c)) exactAnchors.set(c, mark);
      });
      range.chunks.forEach((c) => {
        if (!anyAnchors.has(c)) anyAnchors.set(c, mark);
      });
      cursor = range.end;
    }
    if (cursor < originalText.length) {
      fragment.appendChild(document.createTextNode(originalText.slice(cursor)));
    }

    span.textContent = "";
    span.appendChild(fragment);
  }

  return { exactAnchors, anyAnchors };
}

export function isSameChunk(a: AiCitationResponse, b: AiCitationResponse): boolean {
  return (
    a === b ||
    (a.chunkReference != null &&
      a.chunkReference === b.chunkReference &&
      a.documentId === b.documentId &&
      a.quotedContent === b.quotedContent)
  );
}
