import React from 'react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface Props {
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
  nodeRef?: (node: HTMLElement | null) => void;
  size?: 'sm' | 'md';
}

export const DragHandle: React.FC<Props> = ({ listeners, attributes, nodeRef, size = 'sm' }) => {
  const dotSize = size === 'sm' ? 1.5 : 2;
  const gap = size === 'sm' ? 2 : 3;

  return (
    <button
      ref={nodeRef as React.RefCallback<HTMLButtonElement>}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none select-none p-0.5 rounded"
      tabIndex={-1}
      aria-label="Drag to reorder"
    >
      <svg
        width={dotSize * 2 + gap * 1}
        height={dotSize * 3 + gap * 2}
        viewBox={`0 0 ${dotSize * 2 + gap} ${dotSize * 3 + gap * 2}`}
        fill="currentColor"
      >
        {[0, 1, 2].map(row =>
          [0, 1].map(col => (
            <circle
              key={`${row}-${col}`}
              cx={col * (dotSize + gap) + dotSize / 2}
              cy={row * (dotSize + gap) + dotSize / 2}
              r={dotSize / 2}
            />
          ))
        )}
      </svg>
    </button>
  );
};
