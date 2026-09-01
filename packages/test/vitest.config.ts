import { playwright } from '@vitest/browser-playwright';
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  optimizeDeps: {
    exclude: ['dom-expressions', '@lynjs/core', '@lynjs/core/jsx-runtime', '@lynjs/core/rxcore'],
  },
  resolve: {
    alias: {
      rxcore: '@lynjs/core/rxcore',
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
