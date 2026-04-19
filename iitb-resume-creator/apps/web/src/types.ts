export interface Spacing {
  sectionTop: number;    // default 12 (px)
  sectionBottom: number; // default 6 (px)
  projectBottom: number; // default 12 (px)
  bulletItemSep: number; // default 2 (px)
}

export interface Resume {
  personal: {
    name: string;
    rollNumber: string;
    department: string;
    degree: string;
    institute: string;
    gender: string;
    dob: string;
    minorNote: string;
  };
  academics: AcademicRow[];
  sections: Section[];
  spacing: Spacing;
}

export interface AcademicRow {
  id: string;
  examination: string;
  university: string;
  institute: string;
  year: string;
  cpi: string;
}

export interface Section {
  id: string;
  type: 'scholastic' | 'technical_experience' | 'projects' | 'skills' | 'courses' | 'extracurricular' | 'por' | 'custom';
  displayTitle: string;
  color: 'blue';
  items: SectionItem[];
}

export type SectionItem = ProjectEntry | BulletOnlyEntry | TableEntry | SimpleListEntry;

export interface ProjectEntry {
  kind: 'project';
  id: string;
  title: string;
  subtitle: string;
  guide?: string;
  organization?: string;
  date: string;
  contextLine?: string;
  textls?: number;
  titleTextlsValue?: number;
  contextTextlsValue?: number;
  bullets: Bullet[];
}

export interface BulletOnlyEntry {
  kind: 'bullet_list';
  id: string;
  bullets: Bullet[];
}

export interface TableEntry {
  kind: 'table';
  id: string;
  rows: { label: string; content: string }[];
}

export interface SimpleListEntry {
  kind: 'simple_list';
  id: string;
  bullets: Bullet[];
}

export type TextLsStatus = 'ok' | 'compressed' | 'expanded' | 'unfixable';

export interface Bullet {
  id: string;
  text: string;
  textlsValue: number;           // computed \textls[N] value, -60 to +20, default 0
  textlsStatus: TextLsStatus;
}
