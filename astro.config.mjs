// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: https://kyrokzai.github.io/vernissage2.0/
export default defineConfig({
  site: 'https://kyrokzai.github.io',
  base: '/vernissage2.0/',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'never', assets: '_assets' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
