import React, { useRef, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SectionCard } from './SectionCard';
import { useResumeStore } from '../../store/resumeStore';

interface Props {
  previewColumnWidthPx: number;
}

export const SectionList: React.FC<Props> = ({ previewColumnWidthPx }) => {
  const sections = useResumeStore(s => s.resume.sections);
  const reorderSections = useResumeStore(s => s.reorderSections);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sectionIds = sections.map(s => s.id);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveSectionId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = sections.findIndex(s => s.id === active.id);
      const newIdx = sections.findIndex(s => s.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderSections(oldIdx, newIdx);
      }
    }
  };

  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={e => setActiveSectionId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveSectionId(null)}
    >
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        {sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            columnWidthPx={previewColumnWidthPx}
          />
        ))}
      </SortableContext>

      <DragOverlay>
        {activeSection ? (
          <div className="border border-blue-300 rounded-lg bg-blue-50 shadow-lg p-3 opacity-90">
            <span className="font-semibold text-blue-700 text-sm">{activeSection.displayTitle}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
