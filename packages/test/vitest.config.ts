import { fileURLToPath, URL } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  optimizeDeps: {
    exclude: ['dom-expressions', '@lynjs/core', '@lynjs/core/jsx-runtime', '@lynjs/core/rxcore'],
  },
  resolve: {
    alias: [
      {
        find: '@lynjs/core/jsx-runtime',
        replacement: fileURLToPath(new URL('../core/src/jsx-runtime.ts', import.meta.url)),
      },
      {
        find: '@lynjs/core/rxcore',
        replacement: fileURLToPath(new URL('../core/src/reactive/index.ts', import.meta.url)),
      },
      {
        find: '@lynjs/core',
        replacement: fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      },
      {
        find: 'rxcore',
        replacement: fileURLToPath(new URL('../core/src/reactive/index.ts', import.meta.url)),
      },
    ],
  },

  plugins: [
    babel({
      include: /\.tsx(?:$|\?)/,
      exclude: /node_modules/,
      babelConfig: {
        sourceMaps: true,
        retainLines: true,

        presets: [
          [
            '@babel/preset-typescript',
            {
              isTSX: true,
              allExtensions: true,
            },
          ],
        ],
        plugins: [
          ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
          [
            'babel-plugin-jsx-dom-expressions',
            {
              moduleName: '@lynjs/core/jsx-runtime',
              generate: 'dom',
              delegateEvents: false,
            },
          ],
        ],
      },
    }),
  ],

  test: {
    include: ['src/**/*.test.{ts,tsx}'],

    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
