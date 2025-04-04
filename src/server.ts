import 'zone.js/node';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import bootstrap from './main.server'; // Correct import
import 'node-fetch'
global.fetch = require('node-fetch');
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/Pfe-v0/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index';

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Serve static files
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // All regular routes
  server.get('*', (req, res) => {
    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: req.url,
        publicPath: distFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: req.baseUrl }
        ]
      })
      .then((html: string) => res.send(html))
      .catch((err: any) => {
        console.error('SSR Error:', err);
        res.status(500).send(err);
      });
  });

  return server;
}

// Add this to export a request handler
export const reqHandler = (req: any, res: any) => {
  const server = app();
  return server(req, res);
};

// Start the server
// Check for production environment correctly
if (process.env['NODE_ENV'] === 'production') {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export default app;