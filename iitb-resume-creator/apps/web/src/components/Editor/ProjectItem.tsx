import React, { useRef, useState, useCallback } from 'react';
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
import { BulletRow } from './BulletRow';
import { EditableText } from '../shared/EditableText';
import { useResumeStore } from '../../store/resumeStore';
import type { ProjectEntry, SimpleListEntry, BulletOnlyEntry, TableEntry } from '../../types';

interface ProjectProps {
  item: ProjectEntry;
  sectionId: string;
  columnWidthPx: number;
}

export const ProjectItem: React.FC<ProjectProps> = ({ item, sectionId, columnWidthPx }) => {
  const reorderBullets = useResumeStore(s => s.reorderBullets);
  const addBullet = useResumeStore(s => s.addBullet);
  const deleteItem = useResumeStore(s => s.deleteItem);
  const updateProjectField = useResumeStore(s => s.updateProjectField);
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
    id: item.id,
    data: { type: 'project', sectionId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleBulletDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = item.bullets.findIndex(b => b.id === active.id);
      const newIdx = item.bullets.findIndex(b => b.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderBullets(item.id, oldIdx, newIdx);
      }
    }
  }, [item.id, item.bullets, reorderBullets]);

  const bulletIds = item.bullets.map(b => b.id);

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-md mb-2 bg-white shadow-sm">
      <div className="flex items-start gap-1.5 p-2 bg-gray-50 rounded-t-md border-b border-gray-100">
        <DragHandle
          nodeRef={setActivatorNodeRef}
          listeners={listeners as SyntheticListenerMap}
          attributes={attributes as DraggableAttributes}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <EditableText
              value={item.title}
              onChange={v => updateProjectField(item.id, 'title', v)}
              placeholder="Project title"
              className="font-semibold text-sm text-gray-900 flex-1 min-w-[120px]"
              multiline={false}
            />
            <span className="text-gray-300 text-xs">|</span>
            <EditableText
              value={item.subtitle}
              onChange={v => updateProjectField(item.id, 'subtitle', v)}
              placeholder="Course / Competition"
              className="text-xs text-gray-600 flex-1 min-w-[80px]"
              multiline={false}
            />
            {item.guide !== undefined && (
              <>
                <span className="text-gray-300 text-xs">|</span>
                <EditableText
                  value={item.guide ?? ''}
                  onChange={v => updateProjectField(item.id, 'guide', v)}
                  placeholder="Guide (optional)"
                  className="text-xs text-gray-500 flex-1 min-w-[80px]"
                  multiline={false}
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <EditableText
              value={item.date}
              onChange={v => updateProjectField(item.id, 'date', v)}
              placeholder="Date"
              className="text-xs text-gray-500 italic"
              multiline={false}
            />
          </div>
          {item.contextLine !== undefined && (
            <EditableText
              value={item.contextLine ?? ''}
              onChange={v => updateProjectField(item.id, 'contextLine', v)}
              placeholder="Context line (italic, e.g. competition result)"
              className="text-xs text-gray-500 italic mt-0.5 w-full"
              multiline={false}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-gray-400 hover:text-gray-600 text-xs px-1"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <button
            onClick={() => deleteItem(sectionId, item.id)}
            className="text-gray-300 hover:text-red-400 text-xs"
            title="Delete project"
          >
            ×
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-2 pb-2 pt-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleBulletDragEnd}
          >
            <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
              {item.bullets.map(bullet => (
                <BulletRow
                  key={bullet.id}
                  bullet={bullet}
                  projectId={item.id}
                  columnWidthPx={columnWidthPx}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            onClick={() => addBullet(item.id)}
            className="mt-1 text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 hover:border-blue-300 rounded px-2 py-0.5 w-full text-center transition-colors"
          >
            + Add bullet
          </button>
        </div>
      )}
    </div>
  );
};

interface SimpleListProps {
  item: SimpleListEntry;
  sectionId: string;
  columnWidthPx: number;
}

export const SimpleListItem: React.FC<SimpleListProps> = ({ item, sectionId, columnWidthPx }) => {
  const reorderBullets = useResumeStore(s => s.reorderBullets);
  const addBullet = useResumeStore(s => s.addBullet);
  const deleteItem = useResumeStore(s => s.deleteItem);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'simple_list', sectionId } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleBulletDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = item.bullets.findIndex(b => b.id === active.id);
      const newIdx = item.bullets.findIndex(b => b.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderBullets(item.id, oldIdx, newIdx);
      }
    }
  }, [item.id, item.bullets, reorderBullets]);

  const bulletIds = item.bullets.map(b => b.id);

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-md mb-2 bg-white shadow-sm">
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-t-md border-b border-gray-100">
        <span className="text-xs text-gray-500 font-medium">Bullet List</span>
        <button onClick={() => deleteItem(sectionId, item.id)} className="text-gray-300 hover:text-red-400 text-xs">×</button>
      </div>
      <div className="px-2 pb-2 pt-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBulletDragEnd}>
          <SortableContext items={bulletIds} strategy={verticalListSortingStrategy}>
            {item.bullets.map(bullet => (
              <BulletRow key={bullet.id} bullet={bullet} projectId={item.id} columnWidthPx={columnWidthPx} />
            ))}
          </SortableContext>
        </DndContext>
        <button
          onClick={() => addBullet(item.id)}
          className="mt-1 text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 hover:border-blue-300 rounded px-2 py-0.5 w-full text-center transition-colors"
        >
          + Add bullet
        </button>
      </div>
    </div>
  );
};

interface TableItemProps {
  item: TableEntry;
  sectionId: string;
}

export const TableItem: React.FC<TableItemProps> = ({ item, sectionId }) => {
  const updateTableRow = useResumeStore(s => s.updateTableRow);
  const addTableRow = useResumeStore(s => s.addTableRow);
  const deleteTableRow = useResumeStore(s => s.deleteTableRow);
  const deleteItem = useResumeStore(s => s.deleteItem);

  const { setNodeRef, transform, transition } = useSortable({ id: item.id, data: { type: 'table', sectionId } });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-md mb-2 bg-white shadow-sm">
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-t-md border-b border-gray-100">
        <span className="text-xs text-gray-500 font-medium">Table</span>
        <button onClick={() => deleteItem(sectionId, item.id)} className="text-gray-300 hover:text-red-400 text-xs">×</button>
      </div>
      <div className="p-2">
        {item.rows.map((row, i) => (
          <div key={i} className="flex gap-2 mb-1.5 items-start">
            <EditableText
              value={row.label}
              onChange={v => updateTableRow(item.id, i, 'label', v)}
              placeholder="Category"
              className="text-xs font-semibold text-gray-700 w-28 flex-shrink-0"
              multiline={false}
            />
            <EditableText
              value={row.content}
              onChange={v => updateTableRow(item.id, i, 'content', v)}
              placeholder="Content..."
              className="flex-1 text-xs text-gray-600"
            />
            <button onClick={() => deleteTableRow(item.id, i)} className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0">×</button>
          </div>
        ))}
        <button
          onClick={() => addTableRow(item.id)}
          className="text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 hover:border-blue-300 rounded px-2 py-0.5 w-full text-center"
        >
          + Add row
        </button>
      </div>
    </div>
  );
};
