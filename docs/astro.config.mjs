// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

const base = process.env.DOCS_BASE || '/';

// https://astro.build/config
export default defineConfig({
  site: 'https://lynjs-dev.github.id/lynjs/',
  base,
  taillingSlash: 'always',
  integrations: [
    sitemap(),
    starlight({
      title: 'LynJS Documentation',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/lynjs-dev/lynjs' }],
      sidebar: [
        {
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Example Guide', slug: 'guides/example' },
          ],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
