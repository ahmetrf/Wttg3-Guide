import { cpSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const staticDirectories = ['Sites', 'images', 'json'];
const require = createRequire(import.meta.url);
const siteImagesHandler = require('./api/site-images.js');

function configureSiteImagesServer(server) {
  server.middlewares.use('/api/site-images', (request, response, next) => {
    const url = new URL(request.url, 'http://localhost');
    request.query = Object.fromEntries(url.searchParams);
    response.status = (statusCode) => {
      response.statusCode = statusCode;
      return response;
    };
    response.json = (body) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(body));
      return response;
    };
    Promise.resolve(siteImagesHandler(request, response)).catch(next);
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-site-assets',
      configureServer: configureSiteImagesServer,
      configurePreviewServer: configureSiteImagesServer,
      closeBundle() {
        const outputDirectory = resolve(process.cwd(), 'dist');
        for (const directory of staticDirectories) {
          const source = resolve(process.cwd(), directory);
          if (!existsSync(source)) {
            throw new Error(`Required static directory "${directory}" was not found.`);
          }
          cpSync(source, resolve(outputDirectory, directory), { recursive: true });
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
