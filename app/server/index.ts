import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createApp } from './app';
import { startDemo } from './demo';
import { seedDemoGroup } from './groups';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8787);
const prod = process.env.NODE_ENV === 'production';

const app = createApp();
startDemo();
seedDemoGroup();

if (prod) {
  app.use(express.static(path.join(root, 'dist'), { maxAge: '7d', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, () => console.log(`Moallem ready on http://localhost:${port}  (demo family code: 786786)`));
