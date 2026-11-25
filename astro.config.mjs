// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: https://kyrokzai.github.io/vernissage2.0/ (base /vernissage2.0/).
// Vercel (Preview веток): сайт в корне домена, base '/'. Vercel задаёт VERCEL=1 и VERCEL_URL при сборке;
// canonical — постоянный адрес проекта (VERCEL_PROJECT_PRODUCTION_URL), а не адрес отдельной сборки.
const onVercel = !!process.env.VERCEL;
export default defineConfig({
  site: onVercel ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}` : 'https://kyrokzai.github.io',
  base: onVercel ? '/' : '/vernissage2.0/',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'never', assets: '_assets' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
