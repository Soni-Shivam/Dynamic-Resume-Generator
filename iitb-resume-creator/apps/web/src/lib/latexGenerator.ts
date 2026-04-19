import type { Resume, Section, SectionItem, ProjectEntry, TableEntry, SimpleListEntry, BulletOnlyEntry } from '../types';
import { markdownToLatex } from './boldMarkdown';

function sectionHeading(title: string): string {
  return `\\section*{\\color{blue}${title}\\xfilll[0pt]{0.5pt}}`;
}

function escapeTex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\^/g, '\\^{}')
    .replace(/~/g, '\\~{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
}

function toBold(text: string): string {
  // Escape first, then convert bold tags
  return markdownToLatex(escapeTex(text));
}

function projectEntry(item: ProjectEntry): string {
  const parts = [item.title, item.subtitle, item.guide, item.organization]
    .filter(Boolean)
    .map(p => escapeTex(p));
  // For the first part use textbf, rest use textit
  const titlePart = `\\textbf{${parts[0]}}`;
  const restParts = parts.slice(1).map(p => `\\textit{${p}}`);
  const allParts = [titlePart, ...restParts].join(' $|$ ');

  const contextBlock = item.contextLine
    ? `\\noindent{\\textls[-20]{\\emph{${toBold(item.contextLine)}}}}\n\n`
    : '';

  const bullets = item.bullets
    .map(b => `    \\item \\textls[${b.textls ?? 0}]{${toBold(b.text)}}`)
    .join('\n');

  return `
{\\flushleft {${allParts} \\hfill{\\sl\\small (${escapeTex(item.date)})}\\\\}}
\\vspace{-3mm}
\\noindent\\rule{\\textwidth}{0.5 pt}
${contextBlock}\\vspace{-10pt}
\\begin{itemize}[itemsep=-1.5mm, leftmargin=*]
${bullets}
\\end{itemize}
`;
}

function tableSection(entry: TableEntry): string {
  const rows = entry.rows
    .map(r => `  \\textbf{${escapeTex(r.label)}} & ${escapeTex(r.content)}\\\\ \\hline`)
    .join('\n');
  return `
\\begin{tabular}{|p{0.2\\textwidth}|p{0.75\\textwidth}|}
  \\hline
${rows}
\\end{tabular}
`;
}

function simpleListSection(entry: SimpleListEntry): string {
  const bullets = entry.bullets
    .map(b => `    \\item \\textls[${b.textls ?? 0}]{${toBold(b.text)}}`)
    .join('\n');
  return `
\\begin{itemize}[itemsep=-1.5mm, leftmargin=*]
\\renewcommand\\labelitemi{$\\bullet$}
${bullets}
\\end{itemize}
`;
}

function bulletListSection(entry: BulletOnlyEntry): string {
  const bullets = entry.bullets
    .map(b => `    \\item \\textls[${b.textls ?? 0}]{${toBold(b.text)}}`)
    .join('\n');
  return `
\\begin{itemize}[itemsep=-1.5mm, leftmargin=*]
${bullets}
\\end{itemize}
`;
}

function renderSectionItem(item: SectionItem): string {
  switch (item.kind) {
    case 'project': return projectEntry(item);
    case 'table': return tableSection(item);
    case 'simple_list': return simpleListSection(item);
    case 'bullet_list': return bulletListSection(item);
  }
}

function renderSection(section: Section): string {
  const heading = sectionHeading(section.displayTitle);
  const items = section.items.map(renderSectionItem).join('\n');
  return `\n${heading}\n\\vspace{-5pt}\n${items}\n`;
}

export function generateLatex(resume: Resume): string {
  const preamble = `\\documentclass[11pt]{article}

% --- Page Setup ---
\\usepackage[a4paper, top=14.11mm, bottom=6.4mm, left=14.11mm, right=14.11mm]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{graphicx}

% Handle specific Unicode characters like Delta
\\usepackage{newunicodechar}
\\newunicodechar{Δ}{\\ensuremath{\\Delta}}
\\newunicodechar{δ}{\\ensuremath{\\delta}}

% --- Packages ---
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{color}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{amsmath}
\\usepackage{xcolor}
\\usepackage{microtype}
\\usepackage{setspace}

% Custom bullet style
\\renewcommand\\labelitemi{\\raisebox{0.4ex}{\\tiny$\\bullet$}}
\\renewcommand{\\labelitemii}{$\\cdot$}

% Section formatting
\\titleformat{\\section}{\\Large\\scshape\\raggedright}{}{0em}{}

% --- TabularX cell alignment tweak ---
\\renewcommand\\tabularxcolumn[1]{m{#1}}

% --- Custom Colors ---
\\definecolor{mygrey}{gray}{0.85}

% --- Custom Commands ---
\\newcommand{\\resitem}[1]{\\item #1 \\vspace{-2pt}}

\\newcommand{\\resheading}[1]{%
  \\noindent
  {\\small
  \\colorbox{mygrey}{%
    \\begin{minipage}{\\dimexpr\\textwidth-2\\fboxsep\\relax}
      \\textbf{#1 \\vphantom{p\\^{E}}}
    \\end{minipage}%
  }}%
}

\\newcommand{\\xfilll}[2][1ex]{%
  \\dimen0=#2\\advance\\dimen0 by #1%
  \\leaders\\hrule height \\dimen0 depth -#1\\hfill%
}

\\newcommand{\\ressubheading}[3]{%
  \\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
    \\textsc{\\textbf{#1}} & \\textsc{\\textit{[#2]}} \\\\
  \\end{tabular*}\\vspace{-8pt}
}

\\thispagestyle{empty}`;

  const { personal, academics, sections } = resume;

  const header = `
\\begin{document}
\\begin{minipage}[c]{0.15\\textwidth}
    \\includegraphics[height=2.0cm]{iitb.png}
\\end{minipage}
\\hfill
\\begin{minipage}[c]{0.8\\textwidth}
\\rmfamily
    \\begin{tabular}{@{}ll@{}}
        \\textbf{${escapeTex(personal.name)}} & \\textbf{${escapeTex(personal.rollNumber)}} \\\\
        \\textbf{${escapeTex(personal.department)}} & \\textbf{${escapeTex(personal.degree)}}\\\\
        \\textbf{${escapeTex(personal.institute)}} & \\textbf{Gender: ${escapeTex(personal.gender)}} \\\\
         & \\textbf{DOB: ${escapeTex(personal.dob)}}\\\\
    \\end{tabular}
\\end{minipage}
\\vspace{0.8cm}`;

  const academicTable = `
\\noindent
\\begin{tabularx}{\\textwidth}{@{}l l X c c@{}}
    \\toprule
    \\textbf{Examination} & \\textbf{University} & \\textbf{Institute} & \\textbf{Year} & \\textbf{CPI \\%} \\\\
    \\midrule
${academics.map(row => `    ${escapeTex(row.examination)} & ${escapeTex(row.university)} & ${escapeTex(row.institute)} & ${escapeTex(row.year)} & ${escapeTex(row.cpi)}\\\\`).join('\n')}
    \\bottomrule
\\end{tabularx}`;

  const minorNote = personal.minorNote
    ? `\n\\vspace{8pt}\n\\noindent \\textls[-10]{${toBold(personal.minorNote)}}\n\\vspace{-5mm}`
    : '';

  const sectionsLatex = sections.map(renderSection).join('\n');

  return `${preamble}

${header}

${academicTable}
${minorNote}

${sectionsLatex}

\\end{document}
`;
}
