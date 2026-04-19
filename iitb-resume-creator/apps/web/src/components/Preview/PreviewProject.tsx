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
  let titleHTML = '';
  if (item.title.includes('|')) {
    const titleParts = item.title.split('|');
    titleHTML = `<strong>${titleParts[0].trim()}</strong> | <em>${titleParts.slice(1).join('|').trim()}</em>`;
  } else {
    titleHTML = `<strong>${item.title}</strong>`;
  }

  const parts: string[] = [titleHTML];
  if (item.subtitle) parts.push(`<em>${item.subtitle}</em>`);
  if (item.guide) parts.push(`<em>${item.guide}</em>`);
  if (item.organization) parts.push(`<em>${item.organization}</em>`);

  return (
    <div className="project-entry">
      <div className="header-row">
        <span
          className="title-left"
          style={textlsStyle(item.titleTextlsValue)}
          dangerouslySetInnerHTML={{ __html: parts.join(' | ') }}
        />
        <span className="date-right">{item.date}</span>
      </div>
      <hr className="separator-rule" />
      {item.contextLine && (
        <span
          className="impact-statement"
          style={textlsStyle(item.contextTextlsValue)}
          dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(item.contextLine) }}
        />
      )}
      <ul className="tight-list">
        {item.bullets.map(bullet => (
          <li key={bullet.id} className={bullet.textlsStatus === 'unfixable' ? 'bullet-overflow' : ''}>
            <span
              style={textlsStyle(bullet.textlsValue)}
              dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(bullet.text) }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export const PreviewSimpleList: React.FC<{ item: SimpleListEntry }> = ({ item }) => (
  <ul className="tight-list">
    {item.bullets.map(bullet => (
      <li key={bullet.id} className={bullet.textlsStatus === 'unfixable' ? 'bullet-overflow' : ''}>
        <span
          style={textlsStyle(bullet.textlsValue)}
          dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(bullet.text) }}
        />
      </li>
    ))}
  </ul>
);

export const PreviewBulletList: React.FC<{ item: BulletOnlyEntry }> = ({ item }) => (
  <ul className="tight-list">
    {item.bullets.map(bullet => (
      <li key={bullet.id} className={bullet.textlsStatus === 'unfixable' ? 'bullet-overflow' : ''}>
        <span
          style={textlsStyle(bullet.textlsValue)}
          dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(bullet.text) }}
        />
      </li>
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
