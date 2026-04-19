import React, { useState, useCallback } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { OverflowDot } from '../shared/OverflowDot';
import { measureBulletOverflow } from '../../lib/overflowDetector';

interface Props {
  columnWidthPx: number;
}

export const AIPanel: React.FC<Props> = ({ columnWidthPx }) => {
  const resume = useResumeStore(s => s.resume);
  const focusedProjectId = useResumeStore(s => s.focusedProjectId);
  const addBullet = useResumeStore(s => s.addBullet);
  const updateBulletText = useResumeStore(s => s.updateBulletText);

  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [overflowStatus, setOverflowStatus] = useState<'ok' | 'warning' | 'overflow'>('ok');

  // Collect all project entries for the dropdown
  const projectOptions: { id: string; title: string; bullets: string[]; contextLine?: string }[] = [];
  for (const section of resume.sections) {
    for (const item of section.items) {
      if (item.kind === 'project') {
        projectOptions.push({
          id: item.id,
          title: `${item.title}${item.subtitle ? ` — ${item.subtitle}` : ''}`,
          bullets: item.bullets.map(b => b.text),
          contextLine: item.contextLine,
        });
      }
    }
  }

  const effectiveProjectId = selectedProjectId || focusedProjectId || (projectOptions[0]?.id ?? '');
  const selectedProject = projectOptions.find(p => p.id === effectiveProjectId);

  const generate = useCallback(async () => {
    if (!description.trim() || !selectedProject) return;

    setIsGenerating(true);
    setGeneratedText('');

    try {
      const response = await fetch('/api/generate-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          projectTitle: selectedProject.title,
          projectContext: selectedProject.contextLine ?? '',
          existingBullets: selectedProject.bullets,
          targetMaxChars: 95,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setGeneratedText(`Error: ${err.error ?? 'Unknown error'}`);
        setIsGenerating(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      let accumulated = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'chunk') {
              accumulated += parsed.text;
              setGeneratedText(accumulated);
              if (columnWidthPx > 0) {
                setOverflowStatus(measureBulletOverflow(accumulated, columnWidthPx));
              }
            } else if (parsed.type === 'done') {
              accumulated = parsed.fullText;
              setGeneratedText(accumulated);
              if (columnWidthPx > 0) {
                setOverflowStatus(measureBulletOverflow(accumulated, columnWidthPx));
              }
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }
    } catch (err) {
      setGeneratedText(`Error: ${err instanceof Error ? err.message : 'Request failed'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [description, selectedProject, columnWidthPx]);

  const addToProject = useCallback(() => {
    if (!generatedText.trim() || !effectiveProjectId) return;
    // Add empty bullet then update its text
    addBullet(effectiveProjectId);
    // We need to get the newly created bullet ID — use a short timeout to let store update
    setTimeout(() => {
      const store = useResumeStore.getState();
      for (const section of store.resume.sections) {
        for (const item of section.items) {
          if (item.id === effectiveProjectId && 'bullets' in item) {
            const bullets = (item as { bullets: { id: string }[] }).bullets;
            const lastBullet = bullets[bullets.length - 1];
            if (lastBullet) {
              store.updateBulletText(lastBullet.id, generatedText);
            }
          }
        }
      }
    }, 50);
    setGeneratedText('');
    setDescription('');
  }, [generatedText, effectiveProjectId, addBullet]);

  return (
    <div className="p-3 space-y-2">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Project</label>
        <select
          value={effectiveProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400"
        >
          {projectOptions.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Describe what you did</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Built a recommendation system that reduced latency by 3x using Redis caching..."
          className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:border-blue-400 text-gray-700"
          rows={3}
        />
      </div>

      <button
        onClick={generate}
        disabled={isGenerating || !description.trim()}
        className="w-full text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded px-3 py-1.5 font-medium transition-colors"
      >
        {isGenerating ? 'Generating...' : '✨ Generate bullet'}
      </button>

      {generatedText && (
        <div className="mt-2">
          <div className="flex items-start gap-2 p-2 bg-white border border-gray-200 rounded text-xs text-gray-800">
            <span className="flex-1">{generatedText}</span>
            <OverflowDot status={overflowStatus} />
          </div>
          {!isGenerating && (
            <button
              onClick={addToProject}
              className="mt-1.5 w-full text-xs bg-green-600 hover:bg-green-700 text-white rounded px-3 py-1 font-medium transition-colors"
            >
              + Add to project
            </button>
          )}
        </div>
      )}
    </div>
  );
};
