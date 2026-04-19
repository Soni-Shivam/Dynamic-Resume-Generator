import React, { memo } from 'react';
import './preview.css';
import { PreviewHeader } from './PreviewHeader';
import { PreviewSection } from './PreviewSection';
import type { Resume } from '../../types';

interface Props {
  resume: Resume;
}

export const ResumePreview: React.FC<Props> = memo(({ resume }) => {
  return (
    <div className="resume-preview" id="resume-preview-root">
      <PreviewHeader personal={resume.personal} academics={resume.academics} />
      {resume.sections.map(section => (
        <PreviewSection key={section.id} section={section} />
      ))}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
