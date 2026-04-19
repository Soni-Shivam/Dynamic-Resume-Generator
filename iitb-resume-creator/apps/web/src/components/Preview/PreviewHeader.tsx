import React from 'react';
import type { Resume } from '../../types';
import { parseBoldMarkdown } from '../../lib/boldMarkdown';

interface Props {
  personal: Resume['personal'];
  academics: Resume['academics'];
}

export const PreviewHeader: React.FC<Props> = ({ personal, academics }) => {
  return (
    <>
      <div className="preview-header">
        <img src="/iitb.png" alt="IITB Logo" className="preview-logo" />
        <div style={{ flex: 1 }}>
          <table className="preview-header-table">
            <tbody>
              <tr>
                <td><strong>{personal.name}</strong></td>
                <td><strong>{personal.rollNumber}</strong></td>
              </tr>
              <tr>
                <td><strong>{personal.department}</strong></td>
                <td><strong>{personal.degree}</strong></td>
              </tr>
              <tr>
                <td><strong>{personal.institute}</strong></td>
                <td><strong>Gender: {personal.gender}</strong></td>
              </tr>
              <tr>
                <td></td>
                <td><strong>DOB: {personal.dob}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <table className="academic-table">
        <thead>
          <tr>
            <th>Examination</th>
            <th>University</th>
            <th>Institute</th>
            <th>Year</th>
            <th>CPI %</th>
          </tr>
        </thead>
        <tbody>
          {academics.map(row => (
            <tr key={row.id}>
              <td>{row.examination}</td>
              <td>{row.university}</td>
              <td>{row.institute}</td>
              <td>{row.year}</td>
              <td>{row.cpi}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {personal.minorNote && (
        <div
          className="minor-note"
          dangerouslySetInnerHTML={{ __html: parseBoldMarkdown(personal.minorNote) }}
        />
      )}
    </>
  );
};
