import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import compileRoute from './routes/compile.js';
import generateBulletRoute from './routes/generate-bullet.js';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.route('/api/compile', compileRoute);
app.route('/api/generate-bullet', generateBulletRoute);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

const PORT = parseInt(process.env.PORT ?? '3001');

console.log(`API server starting on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});
