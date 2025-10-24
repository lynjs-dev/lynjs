import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import * as viteTSConfigPaths from 'vite-tsconfig-paths';
import lynPlugin from 'vite-plugin-lynjs';

console.log('Load package.json...');
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));
const VERSION = JSON.stringify(pkg?.version ?? '');
console.log(`LynJS Version: ${VERSION}`);

const reactiveEntry = resolve(__dirname, 'src/reactive.ts');

export default defineConfig({
  define: {
    __LYNJS_DEV__: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    __LYNJS_TEST__: process.env.NODE_ENV === 'test',
    __LYNJS_BROWSER__: process.env.NODE_ENV === 'browser',
    __LYNJS_VERSION__: JSON.stringify(pkg?.version ?? ''),
  },

  esbuild: {
    jsx: 'preserve', // disable jsx from being converted by esbuild
  },

  plugins: [viteTSConfigPaths.default(), lynPlugin({ moduleName: 'dom' })],

  resolve: {
    alias: [{ find: /^rxcore$/, replacement: reactiveEntry }],
    conditions: ['module', 'import', 'browser', 'default'],
  },

  optimizeDeps: {
    include: ['dom-expressions/src/client.js'],
  },

  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**'],
    // environment: 'jsdom',
    browser: {
      enabled: true,
      // headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});
