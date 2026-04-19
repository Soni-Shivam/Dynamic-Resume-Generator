import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SectionList } from './components/Editor/SectionList';
import { ResumePreview } from './components/Preview/ResumePreview';
import { AIPanel } from './components/AIAssistant/AIPanel';
import { useResumeStore } from './store/resumeStore';

type ZoomLevel = 'fit' | '75' | '100';

export default function App() {
  const resume = useResumeStore(s => s.resume);
  const generateLatex = useResumeStore(s => s.generateLatex);

  const previewPanelRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<ZoomLevel>('fit');
  const [fitScale, setFitScale] = useState(0.75);
  const [previewColumnWidthPx, setPreviewColumnWidthPx] = useState(0);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showLatex, setShowLatex] = useState(false);

  // Compute fit scale and column width from the preview panel
  const updateLayout = useCallback(() => {
    const panel = previewPanelRef.current;
    if (!panel) return;

    const panelWidth = panel.clientWidth - 48; // subtract padding
    const a4px = 794; // 210mm at 96dpi
    const scale = Math.min(panelWidth / a4px, 1.0);
    setFitScale(scale);

    // Column width for overflow measurement:
    // A4 content width = 210mm - 2*14.11mm = 181.78mm ≈ 686px at 96dpi
    // Bullet indent ≈ 1.5em ≈ 22px at 11pt
    const contentWidthPx = (181.78 / 25.4) * 96 - 24; // subtract bullet indent
    setPreviewColumnWidthPx(contentWidthPx);
  }, []);

  useEffect(() => {
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    if (previewPanelRef.current) observer.observe(previewPanelRef.current);
    return () => observer.disconnect();
  }, [updateLayout]);

  const getScale = () => {
    if (zoom === 'fit') return fitScale;
    if (zoom === '75') return 0.75;
    return 1.0;
  };

  const scale = getScale();
  const a4HeightPx = 1123; // 297mm at 96dpi

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const latexSource = generateLatex();
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexSource }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? 'Compile failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.personal.name.replace(/\s+/g, '_')}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTex = () => {
    const src = generateLatex();
    const blob = new Blob([src], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.personal.name.replace(/\s+/g, '_')}_Resume.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen min-w-[1024px] bg-gray-100 overflow-hidden">
      {/* ─── LEFT: Editor Panel ─── */}
      <div className="flex flex-col w-[40%] min-w-[400px] h-full border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">IITB Resume Editor</span>
            <span className="text-xs text-gray-400">— {resume.personal.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLatex(true)}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
              title="View LaTeX source"
            >
              View .tex
            </button>
            <button
              onClick={handleDownloadTex}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
              title="Download .tex source"
            >
              ↓ .tex
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded px-3 py-1.5 font-medium"
            >
              {isExporting ? 'Compiling...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {exportError && (
          <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex-shrink-0">
            {exportError} — make sure texlive is installed for PDF export.
          </div>
        )}

        {/* Scrollable section list */}
        <div className="flex-1 overflow-y-auto p-3">
          <SectionList previewColumnWidthPx={previewColumnWidthPx} />
        </div>

        {/* AI Panel */}
        <div className="border-t border-gray-200 flex-shrink-0">
          <button
            onClick={() => setAiExpanded(e => !e)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-purple-500">✨</span>
              AI Bullet Assistant
            </span>
            <span className="text-gray-400">{aiExpanded ? '▼' : '▲'}</span>
          </button>
          {aiExpanded && (
            <div className="border-t border-gray-100 max-h-80 overflow-y-auto">
              <AIPanel columnWidthPx={previewColumnWidthPx} />
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Preview Panel ─── */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Preview header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <span className="font-semibold text-gray-700 text-sm">Preview</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Zoom:</span>
            {(['fit', '75', '100'] as ZoomLevel[]).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  zoom === z
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {z === 'fit' ? 'Fit' : `${z}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Preview scroll area */}
        <div ref={previewPanelRef} className="flex-1 overflow-y-auto bg-gray-200 p-6 flex justify-center">
          <div
            className="preview-scaling-container"
            style={{
              width: 794,
              height: a4HeightPx * scale,
              minHeight: a4HeightPx * scale,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={previewContentRef}
              style={{
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <ResumePreview resume={resume} />
            </div>
          </div>
        </div>
      </div>

      {/* LaTeX modal */}
      {showLatex && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Generated LaTeX Source</span>
              <button onClick={() => setShowLatex(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-gray-800 bg-gray-50">
              {generateLatex()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
