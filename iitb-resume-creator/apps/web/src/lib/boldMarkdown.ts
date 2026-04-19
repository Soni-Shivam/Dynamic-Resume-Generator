/**
 * Parse **word** markdown bold syntax into HTML <strong> tags.
 * Used for both preview rendering and overflow measurement.
 */
export function parseBoldMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Convert **word** markdown to LaTeX \textbf{word}
 */
export function markdownToLatex(text: string): string {
  // text has already been escaped by escapeTex
  return text.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
}
