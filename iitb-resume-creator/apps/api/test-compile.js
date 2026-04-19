
import latex from 'node-latex';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

const latexSource = `
\\documentclass[11pt]{article}
\\usepackage{graphicx}
\\begin{document}
\\includegraphics[height=2.0cm]{iitb.png}
Hello World
\\end{document}
`;

const input = Readable.from([latexSource]);
const assetsDir = path.resolve('assets');

const pdf = latex(input, {
  inputs: assetsDir,
  cmd: 'pdflatex',
  passes: 1,
  errorLogs: 'error.log', // Attempt to save logs
});

const output = fs.createWriteStream('test.pdf');
pdf.pipe(output);

pdf.on('error', (err) => {
  console.error('Error occurred:');
  console.error(err);
});

pdf.on('finish', () => {
  console.log('PDF generated successfully');
});
