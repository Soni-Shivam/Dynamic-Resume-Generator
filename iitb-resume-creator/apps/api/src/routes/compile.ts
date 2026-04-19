import { Hono } from 'hono';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = new Hono();

app.post('/', async (c) => {
  const { latexSource } = await c.req.json<{ latexSource: string }>();

  if (!latexSource) {
    return c.json({ error: 'latexSource is required' }, 400);
  }

  try {
    // Dynamically import node-latex (CommonJS)
    const { default: latex } = await import('node-latex') as { default: (input: Readable, options?: Record<string, unknown>) => NodeJS.ReadableStream };

    const assetsDir = path.join(__dirname, '..', '..', 'assets');
    const pdf = latex(latexSource, {
      inputs: assetsDir,
      cmd: 'pdflatex',
      passes: 2,
    });

    return new Promise<Response>((resolve, reject) => {
      const chunks: Buffer[] = [];

      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new Response(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="resume.pdf"',
            },
          })
        );
      });

      pdf.on('error', (err: Error) => {
        console.error('LaTeX compile error:', err.message);
        resolve(
          new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown compile error';
    console.error('Compile route error:', message);
    return c.json({ error: message }, 500);
  }
});

export default app;
