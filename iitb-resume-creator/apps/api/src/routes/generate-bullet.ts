import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';

const app = new Hono();

const SYSTEM_PROMPT = `You are an expert IIT Bombay resume writer helping students craft strong, single-line bullet points for placement season.

RULES — follow all of these without exception:
1. Start with a strong action verb: Engineered, Developed, Built, Designed, Deployed, Achieved, Optimized, Implemented, Architected, Secured
2. Include at least one quantifiable metric (%, x faster, N users, Nth place, latency in ms, etc.)
3. Bold key technologies and results using **word** markdown syntax
4. The final bullet must fit on a single line of an 11pt LaTeX document — stay under 95 characters total
5. Follow the pattern: [Verb] [what was built] [how/tech used] [quantified result/impact]
6. Match the style of existing bullets in the same project — look at the examples provided
7. Respond with ONLY the bullet text. No prefix, no quotes, no explanation.

If the description is too vague to produce a quantified bullet, produce the best bullet you can and append "(add metric)" at the end.`;

interface GenerateBulletRequest {
  description: string;
  projectTitle: string;
  projectContext: string;
  existingBullets: string[];
  targetMaxChars: number;
}

app.post('/', async (c) => {
  const body = await c.req.json<GenerateBulletRequest>();
  const { description, projectTitle, projectContext, existingBullets } = body;

  if (!description?.trim()) {
    return c.json({ error: 'description is required' }, 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
  }

  const client = new Anthropic({ apiKey });

  const bulletLines = existingBullets.length > 0
    ? existingBullets.map(b => `- ${b}`).join('\n')
    : '(no existing bullets)';

  const userMessage = `Project: ${projectTitle}
Context: ${projectContext || 'N/A'}
Existing bullets for style reference:
${bulletLines}

Write a bullet for: ${description}`;

  // Set up SSE response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        });

        let fullText = '';

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = event.delta.text;
            fullText += chunk;
            sendEvent({ type: 'chunk', text: chunk });
          }
        }

        sendEvent({ type: 'done', fullText, charCount: fullText.length });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        sendEvent({ type: 'error', error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

export default app;
