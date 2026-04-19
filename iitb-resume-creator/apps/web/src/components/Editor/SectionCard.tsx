import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DragHandle } from './DragHandle';
import { ProjectItem, SimpleListItem, TableItem } from './ProjectItem';
import { EditableText } from '../shared/EditableText';
import { useResumeStore } from '../../store/resumeStore';
import type { Section } from '../../types';

interface Props {
  section: Section;
  columnWidthPx: number;
}

export const SectionCard: React.FC<Props> = ({ section, columnWidthPx }) => {
  const reorderItems = useResumeStore(s => s.reorderItems);
  const addProject = useResumeStore(s => s.addProject);
  const updateSectionTitle = useResumeStore(s => s.updateSectionTitle);
  const [collapsed, setCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: 'section' },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = section.items.findIndex(i => i.id === active.id);
      const newIdx = section.items.findIndex(i => i.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderItems(section.id, oldIdx, newIdx);
      }
    }
  };

  const itemIds = section.items.map(i => i.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 rounded-lg mb-3 bg-gray-50 shadow-sm"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 p-2 px-3 border-b border-gray-200 bg-white rounded-t-lg">
        <DragHandle
          nodeRef={setActivatorNodeRef}
          listeners={listeners as SyntheticListenerMap}
          attributes={attributes as DraggableAttributes}
          size="md"
        />
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider w-4">§</span>
        <EditableText
          value={section.displayTitle}
          onChange={v => updateSectionTitle(section.id, v)}
          className="flex-1 font-semibold text-sm text-gray-800"
          multiline={false}
          placeholder="Section title"
        />
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-400 hover:text-gray-600 text-xs px-1 ml-auto"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <div className="p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleItemDragEnd}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {section.items.map(item => {
                if (item.kind === 'project') {
                  return (
                    <ProjectItem
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                      columnWidthPx={columnWidthPx}
                    />
                  );
                }
                if (item.kind === 'simple_list') {
                  return (
                    <SimpleListItem
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                      columnWidthPx={columnWidthPx}
                    />
                  );
                }
                if (item.kind === 'table') {
                  return (
                    <TableItem
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                    />
                  );
                }
                return null;
              })}
            </SortableContext>
          </DndContext>

          <button
            onClick={() => addProject(section.id)}
            className="text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 hover:border-blue-300 rounded px-3 py-1 w-full text-center transition-colors mt-1"
          >
            + Add project entry
          </button>
        </div>
      )}
    </div>
  );
};
