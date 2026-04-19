import React, { useEffect, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandle } from './DragHandle';
import { EditableText } from '../shared/EditableText';
import { OverflowDot } from '../shared/OverflowDot';
import { useResumeStore } from '../../store/resumeStore';
import { computeOptimalTextls } from '../../lib/overflowDetector';
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
  const updateBulletOverflow = useResumeStore(s => s.updateBulletOverflow);
  const updateBulletTextls = useResumeStore(s => s.updateBulletTextls);
  const deleteBullet = useResumeStore(s => s.deleteBullet);
  const setFocusedBullet = useResumeStore(s => s.setFocusedBullet);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!text.trim() || columnWidthPx <= 0) {
      updateBulletTextls(bullet.id, 0);
      updateBulletOverflow(bullet.id, 'ok');
      return;
    }
    const { textls, overflow } = computeOptimalTextls(text, columnWidthPx);
    updateBulletTextls(bullet.id, textls);
    // overflow = true means it can't fit even at max compression
    // textls <= -60 = heavily compressed, warn
    const status = overflow ? 'overflow' : textls <= -60 ? 'warning' : 'ok';
    updateBulletOverflow(bullet.id, status);
  }, [bullet.id, columnWidthPx, updateBulletTextls, updateBulletOverflow]);

  const handleChange = useCallback((text: string) => {
    updateBulletText(bullet.id, text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runFitAnalysis(text), 100);
  }, [bullet.id, updateBulletText, runFitAnalysis]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Re-run when column width changes (window resize)
  useEffect(() => {
    if (columnWidthPx > 0 && bullet.text) {
      runFitAnalysis(bullet.text);
    }
  }, [columnWidthPx]); // eslint-disable-line react-hooks/exhaustive-deps

  const textls = bullet.textls ?? 0;
  const showTextls = textls !== 0;

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
      {showTextls && (
        <span
          className={`text-[10px] flex-shrink-0 mt-0.5 font-mono tabular-nums ${
            textls <= -60
              ? 'text-orange-400'
              : textls < 0
              ? 'text-blue-400'
              : 'text-gray-400'
          }`}
          title={`\\textls[${textls}] — letter-spacing auto-adjusted to fit one line`}
        >
          {textls > 0 ? `+${textls}` : textls}
        </span>
      )}
      <OverflowDot status={bullet.overflowStatus} />
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
