import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { arrayMove } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import type { Resume, Bullet, ProjectEntry, SectionItem, TextLsStatus, Spacing } from '../types';
import { defaultResume } from '../lib/defaultResume';
import { generateLatex } from '../lib/latexGenerator';
import { computeTextLs, computeHeaderRowTextLs } from '../lib/overflowDetector';

interface ResumeStore {
  resume: Resume;
  focusedBulletId: string | null;
  focusedProjectId: string | null;

  // Section actions
  reorderSections: (oldIndex: number, newIndex: number) => void;
  reorderItems: (sectionId: string, oldIndex: number, newIndex: number) => void;
  reorderBullets: (projectId: string, oldIndex: number, newIndex: number) => void;
  moveBulletAcrossProjects: (bulletId: string, fromProjectId: string, toProjectId: string, toIndex: number) => void;

  // Bullet actions
  updateBulletText: (bulletId: string, text: string) => void;
  updateBulletTextLs: (bulletId: string, value: number, status: TextLsStatus) => void;
  recomputeAllTextLs: (columnWidthPx: number) => void;
  addBullet: (projectId: string) => void;
  deleteBullet: (bulletId: string, projectId: string) => void;

  // Item actions
  addProject: (sectionId: string) => void;
  deleteItem: (sectionId: string, itemId: string) => void;
  updateProjectField: (projectId: string, field: keyof ProjectEntry, value: string) => void;

  // Personal / academic
  updatePersonal: (field: keyof Resume['personal'], value: string) => void;
  updateAcademicRow: (rowId: string, field: string, value: string) => void;

  // Table actions
  updateTableRow: (tableId: string, rowIndex: number, field: 'label' | 'content', value: string) => void;
  addTableRow: (tableId: string) => void;
  deleteTableRow: (tableId: string, rowIndex: number) => void;

  // Section actions
  updateSectionTitle: (sectionId: string, title: string) => void;

  // Focus
  setFocusedBullet: (bulletId: string | null, projectId: string | null) => void;

  // Computed
  generateLatex: () => string;
  updateSpacing: (field: keyof Spacing, value: number) => void;
}

// Helper: find bullet in all projects in all sections
function findBulletLocation(resume: Resume, bulletId: string): { sectionIdx: number; itemIdx: number; bulletIdx: number } | null {
  for (let si = 0; si < resume.sections.length; si++) {
    const section = resume.sections[si];
    for (let ii = 0; ii < section.items.length; ii++) {
      const item = section.items[ii];
      if ('bullets' in item) {
        const bi = (item as { bullets: Bullet[] }).bullets.findIndex(b => b.id === bulletId);
        if (bi !== -1) return { sectionIdx: si, itemIdx: ii, bulletIdx: bi };
      }
    }
  }
  return null;
}

function findItemLocation(resume: Resume, itemId: string): { sectionIdx: number; itemIdx: number } | null {
  for (let si = 0; si < resume.sections.length; si++) {
    const ii = resume.sections[si].items.findIndex(i => i.id === itemId);
    if (ii !== -1) return { sectionIdx: si, itemIdx: ii };
  }
  return null;
}

export const useResumeStore = create<ResumeStore>()(
  immer((set, get) => ({
    resume: defaultResume,
    focusedBulletId: null,
    focusedProjectId: null,

    reorderSections: (oldIndex, newIndex) =>
      set(state => {
        state.resume.sections = arrayMove(state.resume.sections, oldIndex, newIndex);
      }),

    reorderItems: (sectionId, oldIndex, newIndex) =>
      set(state => {
        const section = state.resume.sections.find(s => s.id === sectionId);
        if (section) section.items = arrayMove(section.items, oldIndex, newIndex);
      }),

    reorderBullets: (projectId, oldIndex, newIndex) =>
      set(state => {
        for (const section of state.resume.sections) {
          const item = section.items.find(i => i.id === projectId);
          if (item && 'bullets' in item) {
            (item as { bullets: Bullet[] }).bullets = arrayMove(
              (item as { bullets: Bullet[] }).bullets,
              oldIndex,
              newIndex
            );
            return;
          }
        }
      }),

    moveBulletAcrossProjects: (bulletId, fromProjectId, toProjectId, toIndex) =>
      set(state => {
        let bullet: Bullet | null = null;
        // Remove from source
        for (const section of state.resume.sections) {
          const fromItem = section.items.find(i => i.id === fromProjectId);
          if (fromItem && 'bullets' in fromItem) {
            const typed = fromItem as { bullets: Bullet[] };
            const idx = typed.bullets.findIndex(b => b.id === bulletId);
            if (idx !== -1) {
              bullet = typed.bullets.splice(idx, 1)[0];
              break;
            }
          }
        }
        if (!bullet) return;
        // Insert into target
        for (const section of state.resume.sections) {
          const toItem = section.items.find(i => i.id === toProjectId);
          if (toItem && 'bullets' in toItem) {
            const typed = toItem as { bullets: Bullet[] };
            const clampedIndex = Math.min(toIndex, typed.bullets.length);
            typed.bullets.splice(clampedIndex, 0, bullet);
            return;
          }
        }
      }),

    updateBulletText: (bulletId, text) =>
      set(state => {
        const loc = findBulletLocation(state.resume, bulletId);
        if (loc) {
          const item = state.resume.sections[loc.sectionIdx].items[loc.itemIdx] as { bullets: Bullet[] };
          item.bullets[loc.bulletIdx].text = text;
        }
      }),

    updateBulletTextLs: (bulletId, value, status) =>
      set(state => {
        const loc = findBulletLocation(state.resume, bulletId);
        if (loc) {
          const item = state.resume.sections[loc.sectionIdx].items[loc.itemIdx] as { bullets: Bullet[] };
          item.bullets[loc.bulletIdx].textlsValue = value;
          item.bullets[loc.bulletIdx].textlsStatus = status;
        }
      }),

    recomputeAllTextLs: (columnWidthPx) =>
      set(state => {
        const div = document.createElement('div');
        document.body.appendChild(div);
        try {
          for (const section of state.resume.sections) {
            for (const item of section.items) {
              if (item.kind === 'project') {
                const typedProj = item as ProjectEntry;
                let titleHTML = '';
                if (typedProj.title.includes('|')) {
                  const titleParts = typedProj.title.split('|');
                  titleHTML = `<strong>${titleParts[0].trim()}</strong> | <em>${titleParts.slice(1).join('|').trim()}</em>`;
                } else {
                  titleHTML = `<strong>${typedProj.title}</strong>`;
                }
                const parts: string[] = [titleHTML];
                if (typedProj.subtitle) parts.push(`<em>${typedProj.subtitle}</em>`);
                if (typedProj.guide) parts.push(`<em>${typedProj.guide}</em>`);
                if (typedProj.organization) parts.push(`<em>${typedProj.organization}</em>`);
                
                const fullTitleHtml = parts.join(' | ');
                
                const titleResult = computeHeaderRowTextLs(fullTitleHtml, typedProj.date, div, columnWidthPx);
                typedProj.titleTextlsValue = titleResult.textlsValue;

                if (typedProj.contextLine) {
                  // contextLine uses standard bullet computation (full width available)
                  // but we must format it as italic since it's rendered as italic
                  div.style.fontStyle = 'italic';
                  const contextResult = computeTextLs(typedProj.contextLine, div, columnWidthPx);
                  typedProj.contextTextlsValue = contextResult.textlsValue;
                  div.style.fontStyle = 'normal'; // restore for bullets
                } else {
                  typedProj.contextTextlsValue = 0;
                }
              }

              if ('bullets' in item) {
                const typed = item as { bullets: Bullet[] };
                for (const bullet of typed.bullets) {
                  const result = computeTextLs(bullet.text, div, columnWidthPx);
                  bullet.textlsValue = result.textlsValue;
                  bullet.textlsStatus = result.status;
                }
              }
            }
          }
        } finally {
          document.body.removeChild(div);
        }
      }),

    addBullet: (projectId) =>
      set(state => {
        for (const section of state.resume.sections) {
          const item = section.items.find(i => i.id === projectId);
          if (item && 'bullets' in item) {
            (item as { bullets: Bullet[] }).bullets.push({ id: nanoid(), text: '', textlsValue: 0, textlsStatus: 'ok' });
            return;
          }
        }
      }),

    deleteBullet: (bulletId, _projectId) =>
      set(state => {
        const loc = findBulletLocation(state.resume, bulletId);
        if (loc) {
          const item = state.resume.sections[loc.sectionIdx].items[loc.itemIdx] as { bullets: Bullet[] };
          item.bullets.splice(loc.bulletIdx, 1);
        }
      }),

    addProject: (sectionId) =>
      set(state => {
        const section = state.resume.sections.find(s => s.id === sectionId);
        if (!section) return;
        const newItem: ProjectEntry = {
          kind: 'project',
          id: nanoid(),
          title: 'New Project',
          subtitle: 'Course / Competition',
          date: "Jan'26",
          bullets: [{ id: nanoid(), text: 'Describe what you did...', textlsValue: 0, textlsStatus: 'ok' }],
        };
        section.items.push(newItem as SectionItem);
      }),

    deleteItem: (sectionId, itemId) =>
      set(state => {
        const section = state.resume.sections.find(s => s.id === sectionId);
        if (section) {
          section.items = section.items.filter(i => i.id !== itemId);
        }
      }),

    updateProjectField: (projectId, field, value) =>
      set(state => {
        const loc = findItemLocation(state.resume, projectId);
        if (loc) {
          const item = state.resume.sections[loc.sectionIdx].items[loc.itemIdx] as unknown as Record<string, unknown>;
          item[field as string] = value;
        }
      }),

    updatePersonal: (field, value) =>
      set(state => {
        (state.resume.personal as Record<string, string>)[field] = value;
      }),

    updateAcademicRow: (rowId, field, value) =>
      set(state => {
        const row = state.resume.academics.find(r => r.id === rowId);
        if (row) (row as Record<string, string>)[field] = value;
      }),

    updateTableRow: (tableId, rowIndex, field, value) =>
      set(state => {
        for (const section of state.resume.sections) {
          const item = section.items.find(i => i.id === tableId);
          if (item && item.kind === 'table') {
            item.rows[rowIndex][field] = value;
            return;
          }
        }
      }),

    addTableRow: (tableId) =>
      set(state => {
        for (const section of state.resume.sections) {
          const item = section.items.find(i => i.id === tableId);
          if (item && item.kind === 'table') {
            item.rows.push({ label: 'New Category', content: '' });
            return;
          }
        }
      }),

    deleteTableRow: (tableId, rowIndex) =>
      set(state => {
        for (const section of state.resume.sections) {
          const item = section.items.find(i => i.id === tableId);
          if (item && item.kind === 'table') {
            item.rows.splice(rowIndex, 1);
            return;
          }
        }
      }),

    updateSectionTitle: (sectionId, title) =>
      set(state => {
        const section = state.resume.sections.find(s => s.id === sectionId);
        if (section) section.displayTitle = title;
      }),

    setFocusedBullet: (bulletId, projectId) =>
      set(state => {
        state.focusedBulletId = bulletId;
        state.focusedProjectId = projectId;
      }),

    updateSpacing: (field, value) =>
      set(state => {
        (state.resume.spacing as any)[field] = value;
      }),

    generateLatex: () => generateLatex(get().resume),
  }))
);
