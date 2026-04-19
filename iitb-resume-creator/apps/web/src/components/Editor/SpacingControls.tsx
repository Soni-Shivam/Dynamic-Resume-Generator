import React from 'react';
import { useResumeStore } from '../../store/resumeStore';

export const SpacingControls: React.FC = () => {
  const spacing = useResumeStore(s => s.resume.spacing);
  const updateSpacing = useResumeStore(s => s.updateSpacing);

  return (
    <div className="p-4 bg-gray-50 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">Inter-Section Spacing</label>
          <span className="text-[10px] text-gray-500 font-mono">{spacing.sectionTop}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          value={spacing.sectionTop}
          onChange={(e) => updateSpacing('sectionTop', Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">Spacing Below Section</label>
          <span className="text-[10px] text-gray-500 font-mono">{spacing.sectionBottom}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          value={spacing.sectionBottom}
          onChange={(e) => updateSpacing('sectionBottom', Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">Inter-Project Spacing</label>
          <span className="text-[10px] text-gray-500 font-mono">{spacing.projectBottom}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          value={spacing.projectBottom}
          onChange={(e) => updateSpacing('projectBottom', Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">Inter-Point Spacing</label>
          <span className="text-[10px] text-gray-500 font-mono">{spacing.bulletItemSep}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="8"
          step="0.5"
          value={spacing.bulletItemSep}
          onChange={(e) => updateSpacing('bulletItemSep', Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>
    </div>
  );
};
