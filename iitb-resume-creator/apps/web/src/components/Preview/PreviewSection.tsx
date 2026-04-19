import React from 'react';
import type { Section, SectionItem } from '../../types';
import {
  PreviewProjectEntry,
  PreviewSimpleList,
  PreviewBulletList,
  PreviewTable,
} from './PreviewProject';

function renderItem(item: SectionItem) {
  switch (item.kind) {
    case 'project': return <PreviewProjectEntry key={item.id} item={item} />;
    case 'simple_list': return <PreviewSimpleList key={item.id} item={item} />;
    case 'bullet_list': return <PreviewBulletList key={item.id} item={item} />;
    case 'table': return <PreviewTable key={item.id} item={item} />;
  }
}

interface Props {
  section: Section;
}

export const PreviewSection: React.FC<Props> = ({ section }) => {
  return (
    <div>
      <div className="section-heading">{section.displayTitle}</div>
      <div>
        {section.items.map(renderItem)}
      </div>
    </div>
  );
};
