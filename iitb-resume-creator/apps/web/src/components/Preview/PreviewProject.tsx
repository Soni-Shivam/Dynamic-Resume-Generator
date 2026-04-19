import React from 'react';
import type { ProjectEntry, SimpleListEntry, BulletOnlyEntry, TableEntry } from '../../types';
import { parseBoldMarkdown } from '../../lib/boldMarkdown';

function textlsStyle(textls?: number): React.CSSProperties {
  if (!textls) return {};
  return { letterSpacing: `${(textls / 1000).toFixed(5)}em` };
}

interface ProjectProps {
  item: ProjectEntry;
}

export const PreviewProjectEntry: React.FC<ProjectProps> = ({ item }) => {
  const parts: string[] = [item.title];
  if (item.subtitle) parts.push(`<em>${item.subtitle}</em>`);
  if (item.guide) parts.push(`<em>${item.guide}</em>`);
  if (item.organization) parts.push(`<em>${item.organization}</em>`);

  return (
    <div className="project-entry">
      <div className="project-header">
        <span
          className="project-title-left"
          dangerouslySetInnerHTML={{ __html: parts.join(' <span style="font-style:normal;font-weight:bold">|</span> ') }}
        />
        <span className="project-date">{item.date}</span>
      </div>
      <hr className="project-rule" />
      {item.contextLine && (
        <div
          className="project-context"
          dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(item.contextLine) }}
        />
      )}
      <ul className="project-bullets">
        {item.bullets.map(bullet => (
          <li
            key={bullet.id}
            style={textlsStyle(bullet.textls)}
            className={bullet.overflowStatus === 'overflow' ? 'bullet-overflow' : ''}
            dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(bullet.text) }}
          />
        ))}
      </ul>
    </div>
  );
};

export const PreviewSimpleList: React.FC<{ item: SimpleListEntry }> = ({ item }) => (
  <ul className="simple-bullets">
    {item.bullets.map(bullet => (
      <li
        key={bullet.id}
        style={textlsStyle(bullet.textls)}
        className={bullet.overflowStatus === 'overflow' ? 'bullet-overflow' : ''}
        dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(bullet.text) }}
      />
    ))}
  </ul>
);

export const PreviewBulletList: React.FC<{ item: BulletOnlyEntry }> = ({ item }) => (
  <ul className="simple-bullets">
    {item.bullets.map(bullet => (
      <li
        key={bullet.id}
        style={textlsStyle(bullet.textls)}
        dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(bullet.text) }}
      />
    ))}
  </ul>
);

export const PreviewTable: React.FC<{ item: TableEntry }> = ({ item }) => (
  <table className="skills-table">
    <tbody>
      {item.rows.map((row, i) => (
        <tr key={i}>
          <td><strong>{row.label}</strong></td>
          <td>{row.content}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
