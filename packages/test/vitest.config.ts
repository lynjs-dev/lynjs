import { fileURLToPath, URL } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      rxcore: fileURLToPath(new URL('./src/rxcore.ts', import.meta.url)),
    },
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
          [
            'babel-plugin-jsx-dom-expressions',
            {
              moduleName: 'dom-expressions/src/client.js',
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
