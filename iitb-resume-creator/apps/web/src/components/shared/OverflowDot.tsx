import React from 'react';
import type { TextLsStatus } from '../../types';

interface Props {
  status?: TextLsStatus;
  textlsValue?: number;
}

const config = {
  ok: {
    color: 'bg-green-400',
    tooltip: 'Fits on one line',
    pulse: false,
  },
  compressed: {
    color: 'bg-blue-400',
    tooltip: (v: number) => `Auto-compressed to \\textls[${v}] to fit`,
    pulse: false,
  },
  expanded: {
    color: 'bg-green-300',
    tooltip: 'Fits with room to spare',
    pulse: false,
  },
  unfixable: {
    color: 'bg-red-500',
    tooltip: 'Too long — even maximum compression cannot fit this on one line. Shorten it.',
    pulse: true,
  },
};

export const OverflowDot: React.FC<Props> = ({ status = 'ok', textlsValue = 0 }) => {
  const conf = config[status];
  const tooltipText = typeof conf.tooltip === 'function' ? conf.tooltip(textlsValue) : conf.tooltip;
  return (
    <div
      title={tooltipText}
      className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 cursor-help transition-colors ${conf.color} ${conf.pulse ? 'animate-pulse' : ''}`}
    />
  );
};
