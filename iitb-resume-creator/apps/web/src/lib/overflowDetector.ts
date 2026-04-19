import { parseBoldMarkdown } from './boldMarkdown';

// 11pt at 96 dpi = 11 * 96 / 72 = 14.667px
const FONT_SIZE_PX = 14.667;

// textls units: 1 unit = 1/1000 em
// so textls N → letter-spacing = N/1000 em = N * FONT_SIZE_PX / 1000 px
const TEXTLS_MIN = -80;
const TEXTLS_MAX = 50;

function applyBaseStyles(el: HTMLDivElement, letterSpacingEm: number) {
  el.style.fontFamily = "'CMU Serif', 'Computer Modern Serif', Georgia, serif";
  el.style.fontSize = '11pt';
  el.style.lineHeight = '1.2';
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style.top = '-9999px';
  el.style.left = '-9999px';
  el.style.boxSizing = 'border-box';
  el.style.letterSpacing = letterSpacingEm === 0 ? 'normal' : `${letterSpacingEm.toFixed(5)}em`;
}

/** Measure the pixel width of text rendered on a single (no-wrap) line */
function measureSingleLineWidth(html: string, letterSpacingEm: number): number {
  const el = document.createElement('div');
  applyBaseStyles(el, letterSpacingEm);
  el.style.whiteSpace = 'nowrap';
  el.innerHTML = html;
  document.body.appendChild(el);
  const w = el.scrollWidth;
  document.body.removeChild(el);
  return w;
}

/** Check whether text wraps within columnWidthPx at a given letter-spacing */
function fitsOnOneLine(html: string, columnWidthPx: number, letterSpacingEm: number): boolean {
  const el = document.createElement('div');
  applyBaseStyles(el, letterSpacingEm);
  el.style.width = `${columnWidthPx}px`;
  el.style.whiteSpace = 'normal';
  el.style.wordBreak = 'break-word';
  el.style.paddingLeft = '1.5em';
  el.innerHTML = html;
  document.body.appendChild(el);
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || FONT_SIZE_PX * 1.2;
  const height = el.scrollHeight;
  document.body.removeChild(el);
  return height <= lineHeight * 1.1;
}

/**
 * Compute the optimal \textls[N] value that makes the bullet fit on exactly
 * one line. Returns an integer in [-80, +50].
 *
 * Strategy:
 * 1. Measure the single-line pixel width at textls=0
 * 2. If it fits → return 0
 * 3. Compute the required letter-spacing reduction analytically from the
 *    excess width and character count
 * 4. Verify that computed value actually fits (DOM wrapping can differ from
 *    pure width due to word-boundary logic)
 * 5. If not, binary-search downward to find the tightest value that fits
 */
export function computeOptimalTextls(
  text: string,
  columnWidthPx: number
): { textls: number; overflow: boolean } {
  if (!text.trim() || columnWidthPx <= 0) return { textls: 0, overflow: false };

  const html = parseBoldMarkdown(text);

  // Fast path: already fits at textls=0
  if (fitsOnOneLine(html, columnWidthPx, 0)) {
    return { textls: 0, overflow: false };
  }

  // Measure the actual single-line pixel width (no-wrap) at textls=0
  const singleLineWidth = measureSingleLineWidth(html, 0);

  // Available content width (column minus bullet indent ~1.5em)
  const indent = 1.5 * FONT_SIZE_PX;
  const available = columnWidthPx - indent;

  if (available <= 0) return { textls: 0, overflow: true };

  // Excess pixels that need to be removed
  const excess = singleLineWidth - available;

  if (excess <= 0) {
    // Width fits but height didn't — probably a word-break issue. Try anyway.
    return { textls: 0, overflow: false };
  }

  // Approximate number of inter-character gaps (letter-spacing applies between glyphs)
  // Use text.length - 1 as the divisor (last char gets no trailing space)
  const charCount = Math.max(text.replace(/\s/g, '').length - 1, 1);

  // Required letter-spacing reduction in px per gap
  const reductionPx = excess / charCount;

  // Convert to em: reductionPx / FONT_SIZE_PX
  // Convert to textls units: multiply by 1000
  const rawTextls = -Math.ceil((reductionPx / FONT_SIZE_PX) * 1000);

  // Add a small buffer (-2 units) so it's safely inside, not right at the edge
  const candidateTextls = Math.max(rawTextls - 2, TEXTLS_MIN);

  // Verify the candidate actually fits
  const candidateLsEm = candidateTextls / 1000;
  if (fitsOnOneLine(html, columnWidthPx, candidateLsEm)) {
    // Try to relax toward 0 — maybe we over-compressed
    // Binary search between candidateTextls and 0 for the least-negative that fits
    let lo = candidateTextls;
    let hi = 0;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (fitsOnOneLine(html, columnWidthPx, mid / 1000)) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    return { textls: hi, overflow: false };
  }

  // Candidate doesn't fit — something non-linear is happening (e.g. word-break).
  // Binary search downward from candidateTextls.
  let lo = TEXTLS_MIN;
  let hi = candidateTextls;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (fitsOnOneLine(html, columnWidthPx, mid / 1000)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  if (fitsOnOneLine(html, columnWidthPx, hi / 1000)) {
    return { textls: hi, overflow: false };
  }

  // Even TEXTLS_MIN doesn't fit — bullet is genuinely too long to fix
  return { textls: TEXTLS_MIN, overflow: true };
}

/** Legacy helper used by BulletRow for the overflow dot color */
export function measureBulletOverflow(
  text: string,
  columnWidthPx: number,
  textls = 0
): 'ok' | 'warning' | 'overflow' {
  if (!text.trim()) return 'ok';
  const html = parseBoldMarkdown(text);
  const lsEm = textls / 1000;
  if (fitsOnOneLine(html, columnWidthPx, lsEm)) return 'ok';
  // Check if max compression can save it
  if (fitsOnOneLine(html, columnWidthPx, TEXTLS_MIN / 1000)) return 'warning';
  return 'overflow';
}
