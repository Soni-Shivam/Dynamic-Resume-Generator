import React, { memo } from 'react';
import './preview.css';
import { PreviewHeader } from './PreviewHeader';
import { PreviewSection } from './PreviewSection';
import type { Resume } from '../../types';

interface Props {
  resume: Resume;
}

export const ResumePreview: React.FC<Props> = memo(({ resume }) => {
  const customStyles = {
    '--section-top': `${resume.spacing.sectionTop}px`,
    '--section-bottom': `${resume.spacing.sectionBottom}px`,
    '--project-bottom': `${resume.spacing.projectBottom}px`,
    '--bullet-item-sep': `${resume.spacing.bulletItemSep}px`,
  } as React.CSSProperties;

  return (
    <div className="resume-preview libertine" id="resume-preview-root" style={customStyles}>
      <PreviewHeader personal={resume.personal} academics={resume.academics} />
      {resume.sections.map(section => (
        <PreviewSection key={section.id} section={section} />
      ))}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
