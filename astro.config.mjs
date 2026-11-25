// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: https://kyrokzai.github.io/vernissage2.0/ (base /vernissage2.0/).
// Vercel (Preview веток): сайт в корне домена, base '/'. Vercel задаёт VERCEL=1 и VERCEL_URL при сборке;
// canonical — постоянный адрес проекта (VERCEL_PROJECT_PRODUCTION_URL), а не адрес отдельной сборки.
const onVercel = !!process.env.VERCEL;
// Тестовый сайт на Vercel не индексируется: noindex, если у проекта нет своего домена (адрес *.vercel.app).
// Явное PUBLIC_VN_NOINDEX=1 или =0 в переменных проекта имеет приоритет. GitHub Pages и рабочий домен — без изменений.
const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || '';
const noindex = process.env.PUBLIC_VN_NOINDEX ?? (onVercel && (!prodHost || prodHost.endsWith('.vercel.app')) ? '1' : '0');
export default defineConfig({
  site: onVercel ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}` : 'https://kyrokzai.github.io',
  base: onVercel ? '/' : '/vernissage2.0/',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'never', assets: '_assets' },
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 }, define: { 'import.meta.env.PUBLIC_VN_NOINDEX': JSON.stringify(noindex), 'import.meta.env.PUBLIC_VN_BUILD': JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)) } },
});
