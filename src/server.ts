import 'zone.js/node';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import bootstrap from './main.server';
import 'node-fetch';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

global.fetch = require('node-fetch');

let platformRef: any = null;

export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/Pfe-v0/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index';

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Cleanup function for platform
  const cleanupPlatform = () => {
    if (platformRef) {
      platformRef.destroy();
      platformRef = null;
    }
  };

  // Cleanup on server shutdown
  process.on('SIGINT', cleanupPlatform);
  process.on('SIGTERM', cleanupPlatform);

  // Serve static files
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // All regular routes
  server.get('*', async (req, res) => {
    try {
      // Ensure platform is destroyed before rendering
      cleanupPlatform();

      const html = await commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: req.url,
        publicPath: distFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: req.baseUrl }
        ]
      });

      res.send(html);
    } catch (err: any) {
      console.error('SSR Error:', err);
      res.status(500).send(err);
    }
  });

  return server;
}

// Request handler for serverless environments
export const reqHandler = (req: any, res: any) => {
  const server = app();
  return server(req, res);
};

// Start the server in production
if (process.env['NODE_ENV'] === 'production') {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

export default app;
