/**
 * Parse Markdown-like syntax into HTML for the preview.
 * Supports:
 * **bold** -> <strong>
 * *italic* or _italic_ -> <em>
 * `code` -> <code>
 */
export function parseBoldMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

/**
 * Convert markdown to LaTeX commands.
 */
export function markdownToLatex(text: string): string {
  // Assume text is already escaped
  return text
    .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
    .replace(/\*(.+?)\*/g, '\\textit{$1}')
    .replace(/_(.+?)_/g, '\\textit{$1}')
    .replace(/`(.+?)`/g, '\\texttt{$1}');
}
