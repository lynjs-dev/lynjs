import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

// https://astro.build/config
export default defineConfig({
  site: 'https://lynjs-dev.github.io/lynjs',
  base: process.env.DOCS_BASE || '/',
  integrations: [
    sitemap(),
    starlight({
      title: 'LynJS',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/lynjs-dev/lynjs' }],
      customCss: ['./src/styles/global.css'],
      defaultLocale: 'en',
      locales: {
        en: {
          label: 'English',
          lang: 'en',
        },

        ko: {
          label: '한국어',
          lang: 'ko',
        },
      },
      sidebar: [
        {
          label: 'API REFERENCE',
          items: [
            {
              label: 'INTRODUCTION',
              items: [
                { label: 'What is LynJS?', slug: 'introduction/what-is-lynjs' },
                // { label: 'Getting Started', slug: 'api' },
              ],
            },
            {
              label: 'COMPONENTS',
              items: [{ label: 'Defining', slug: 'api/components/define' }],
            },
          ],
        },
      ],
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./src', import.meta.url)), // "~/..." → src/*
      },
    },
  },
});
