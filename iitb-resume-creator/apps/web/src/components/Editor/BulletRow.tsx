import React, { useEffect, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandle } from './DragHandle';
import { EditableText } from '../shared/EditableText';
import { OverflowDot } from '../shared/OverflowDot';
import { useResumeStore } from '../../store/resumeStore';
import { computeTextLs } from '../../lib/overflowDetector';
import type { Bullet } from '../../types';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface Props {
  bullet: Bullet;
  projectId: string;
  columnWidthPx: number;
}

export const BulletRow: React.FC<Props> = ({ bullet, projectId, columnWidthPx }) => {
  const updateBulletText = useResumeStore(s => s.updateBulletText);
  const updateBulletTextLs = useResumeStore(s => s.updateBulletTextLs);
  const deleteBullet = useResumeStore(s => s.deleteBullet);
  const setFocusedBullet = useResumeStore(s => s.setFocusedBullet);

  const measureDivRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    measureDivRef.current = document.createElement('div');
    document.body.appendChild(measureDivRef.current);
    return () => {
      if (measureDivRef.current) {
        document.body.removeChild(measureDivRef.current);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bullet.id,
    data: { type: 'bullet', projectId, bulletId: bullet.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const runFitAnalysis = useCallback((text: string) => {
    if (!measureDivRef.current || columnWidthPx <= 0) return;
    const result = computeTextLs(text, measureDivRef.current, columnWidthPx);
    updateBulletTextLs(bullet.id, result.textlsValue, result.status);
  }, [bullet.id, columnWidthPx, updateBulletTextLs]);

  const handleChange = useCallback((text: string) => {
    updateBulletText(bullet.id, text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runFitAnalysis(text), 50);
  }, [bullet.id, updateBulletText, runFitAnalysis]);

  const textls = bullet.textlsValue ?? 0;
  const isCompressed = bullet.textlsStatus === 'compressed';

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1.5 group/bullet py-0.5">
      <DragHandle
        nodeRef={setActivatorNodeRef}
        listeners={listeners as SyntheticListenerMap}
        attributes={attributes as DraggableAttributes}
        size="sm"
      />
      <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0 select-none">•</span>
      <EditableText
        value={bullet.text}
        onChange={handleChange}
        placeholder="Write bullet point... (use **bold** for emphasis)"
        className="flex-1 text-sm text-gray-800"
        multiline={false}
        onFocus={() => setFocusedBullet(bullet.id, projectId)}
      />
      {isCompressed && (
        <span
          className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded flex-shrink-0 mt-0.5 font-mono tabular-nums"
          title={`Auto-compressed letter spacing`}
        >
          textls[{textls}]
        </span>
      )}
      <OverflowDot status={bullet.textlsStatus} textlsValue={textls} />
      <button
        onClick={() => deleteBullet(bullet.id, projectId)}
        className="opacity-0 group-hover/bullet:opacity-100 text-gray-300 hover:text-red-400 transition-opacity flex-shrink-0 mt-0.5 text-xs"
        title="Delete bullet"
      >
        ×
      </button>
    </div>
  );
};
