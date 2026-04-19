import React from 'react';

interface Props {
  status?: 'ok' | 'warning' | 'overflow';
}

const colors = {
  ok: 'bg-green-400',
  warning: 'bg-yellow-400',
  overflow: 'bg-red-500 animate-pulse',
};

const tooltips = {
  ok: 'Fits on one line',
  warning: 'Close to overflow — check preview',
  overflow: 'Overflows to line 2 — shorten this bullet',
};

export const OverflowDot: React.FC<Props> = ({ status = 'ok' }) => {
  return (
    <div
      title={tooltips[status]}
      className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 cursor-help transition-colors ${colors[status]}`}
    />
  );
};
