import { parseBoldMarkdown } from './boldMarkdown';
import type { TextLsStatus } from '../types';

export interface TextLsResult {
  textlsValue: number;        // integer, -60 to +20, to pass to \textls[N]
  letterSpacing: string;      // CSS value, e.g. "-0.04em"
  fitsOnOneLine: boolean;
  status: TextLsStatus;
}

function binarySearchTextLs(
  measureDiv: HTMLDivElement,
  columnWidthPx: number,
  low: number,   // e.g. -60
  high: number   // e.g. 0
): number {
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    measureDiv.style.letterSpacing = `${mid / 1000}em`;
    if (measureDiv.scrollWidth <= columnWidthPx) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low;
}

export function computeHeaderRowTextLs(
  titleHtml: string,
  dateText: string,
  measureDiv: HTMLDivElement,
  columnWidthPx: number
): TextLsResult {
  if (!titleHtml.trim()) {
    return { textlsValue: 0, letterSpacing: '0em', fitsOnOneLine: true, status: 'ok' };
  }

  // Measure date width first
  measureDiv.style.fontFamily = "'Latin Modern', 'Libertinus', Georgia, Cambria, 'Times New Roman', Times, serif";
  measureDiv.style.fontSize = '9pt'; // date-right is 0.9em of 11pt approx (actually \small is 9pt)
  measureDiv.style.lineHeight = '1.2';
  measureDiv.style.width = 'auto';
  measureDiv.style.whiteSpace = 'nowrap';
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.position = 'absolute';
  measureDiv.style.paddingLeft = '0';
  measureDiv.style.margin = '0';
  measureDiv.style.fontStyle = 'italic';
  measureDiv.style.letterSpacing = '0em';
  measureDiv.innerHTML = dateText;

  const dateWidth = measureDiv.scrollWidth;
  
  // Also account for the flex gap or space between title and date. Let's add 8px safe gap.
  const safeColumnWidthPx = Math.max(0, columnWidthPx - dateWidth - 8);

  // Now measure the title
  measureDiv.style.fontSize = '11pt'; // title-left is 1.05em approx, actually let's use 11pt since it's the base, but title-left class has 1.05em. Let's set 11.5pt.
  measureDiv.style.fontSize = '11.5pt';
  measureDiv.style.fontStyle = 'normal';
  measureDiv.style.width = `${safeColumnWidthPx}px`;

  measureDiv.innerHTML = titleHtml;
  
  const naturalWidth = measureDiv.scrollWidth;

  if (naturalWidth <= safeColumnWidthPx) {
    return { textlsValue: 0, letterSpacing: '0em', fitsOnOneLine: true, status: 'ok' };
  }

  const maxCompression = -100;
  measureDiv.style.letterSpacing = `${maxCompression / 1000}em`;
  if (measureDiv.scrollWidth > safeColumnWidthPx) {
    return {
      textlsValue: maxCompression,
      letterSpacing: `${maxCompression / 1000}em`,
      fitsOnOneLine: false,
      status: 'unfixable',
    };
  }

  const bestN = binarySearchTextLs(measureDiv, safeColumnWidthPx, maxCompression, 0);

  return {
    textlsValue: bestN,
    letterSpacing: `${bestN / 1000}em`,
    fitsOnOneLine: true,
    status: 'compressed',
  };
}
export function computeTextLs(
  text: string,
  measureDiv: HTMLDivElement,
  columnWidthPx: number
): TextLsResult {
  if (!text.trim()) {
    return { textlsValue: 0, letterSpacing: '0em', fitsOnOneLine: true, status: 'ok' };
  }

  // Add a small 2px safety buffer to prevent edge-case subpixel wrapping
  const safeColumnWidthPx = Math.max(0, columnWidthPx - 2);

  // 1. Set measureDiv styles: same font/size/lineheight as preview,
  // width: safeColumnWidthPx + 'px', white-space: nowrap, visibility: hidden, position: absolute.
  // Assuming the preview font stack here:
  measureDiv.style.fontFamily = "'Latin Modern', 'Libertinus', Georgia, Cambria, 'Times New Roman', Times, serif";
  measureDiv.style.fontSize = '11pt';
  measureDiv.style.lineHeight = '1.2';
  measureDiv.style.width = `${safeColumnWidthPx}px`;
  measureDiv.style.whiteSpace = 'nowrap';
  measureDiv.style.visibility = 'hidden';
  measureDiv.style.position = 'absolute';
  measureDiv.style.paddingLeft = '0'; // reset any padding
  measureDiv.style.margin = '0'; // reset any margin

  // 2. Set measureDiv.innerHTML = parseBoldMarkdown(text) with letter-spacing: 0em.
  measureDiv.innerHTML = parseBoldMarkdown(text);
  measureDiv.style.letterSpacing = '0em';

  // 3. Measure naturalWidth = measureDiv.scrollWidth.
  const naturalWidth = measureDiv.scrollWidth;

  // 4. If naturalWidth <= safeColumnWidthPx: binary search upward (0 to +20)
  if (naturalWidth <= safeColumnWidthPx) {
    // Actually we only care if it fits at 0. If it fits at 0, we can leave it at 0 as requested:
    // "(N>0, though in practice don't auto-expand — just leave at 0 if it fits)."
    return {
      textlsValue: 0,
      letterSpacing: '0em',
      fitsOnOneLine: true,
      status: 'ok',
    };
  }

  // 5. If naturalWidth > safeColumnWidthPx: binary search downward (0 to -60)
  const maxCompression = -60;
  measureDiv.style.letterSpacing = `${maxCompression / 1000}em`;
  if (measureDiv.scrollWidth > safeColumnWidthPx) {
    // 6. If even at N=-60 the text still overflows: fitsOnOneLine = false
    return {
      textlsValue: maxCompression,
      letterSpacing: `${maxCompression / 1000}em`,
      fitsOnOneLine: false,
      status: 'unfixable',
    };
  }

  // Find tightest fit
  const bestN = binarySearchTextLs(measureDiv, safeColumnWidthPx, maxCompression, 0);

  return {
    textlsValue: bestN,
    letterSpacing: `${bestN / 1000}em`,
    fitsOnOneLine: true,
    status: 'compressed',
  };
}
