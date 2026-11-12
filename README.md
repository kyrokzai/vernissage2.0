# VERNISSAGE 2.0

Сайт VERNISSAGE на [Astro](https://astro.build): дизайн, ремонт и мебель на заказ в Астане.
Основа — утверждённый HTML-референс «Vernissage (Copy).html». Собственная идентичность VERNISSAGE:
оригинальные SVG-логотипы, реальные фото и видео компании, авторский блок «От детали — к целому».

> Ветка разработки: `codex/reference-rebuild`. Опубликованная прежняя версия сохранена в `backup/gh-pages-2026-11-11`.
> Публикация на GitHub Pages — только после отдельного согласования.

## Локальный просмотр

Нужен Node.js 22.22+.

```bash
npm install
npm run build      # сборка в dist/ (первая сборка ~2 мин: генерация AVIF/WebP)
npm run preview    # http://127.0.0.1:4321/vernissage2.0/
```

Режим разработки с автообновлением: `npm run dev` → http://localhost:4321/vernissage2.0/

Полезные адреса:
- `?nointro` — открыть сайт без вступления «двери» (то же при переходе по якорю, например `#quiz`);
- `#quiz`, `#portfolio`, `#b2b`, `#contact` — сразу к нужному разделу.

## Структура

```
src/
├─ pages/index.astro        # страница: порядок секций, данные галерей
├─ layouts/Base.astro       # <head>, SEO, JSON-LD, тема и вступление до отрисовки
├─ components/              # секции: Intro, Header, Hero, Strip, Problem, Services, Furniture,
│                           # DetailToWhole, Statement, Quiz, Why, Process, Portfolio, Cases,
│                           # Offer, Faq, Contacts, Lightbox; ImageStyles генерирует AVIF/WebP
├─ scripts/                 # поведение на TypeScript без библиотек:
│  ├─ core.ts               # появление, параллакс, счётчики, карточки услуг, таймлайн, прогресс
│  ├─ lazy.ts  intro.ts  theme.ts  menu.ts  herocard.ts
│  ├─ quiz.ts               # квиз, маска +7, расчёт, сообщение в WhatsApp
│  ├─ gallery.ts            # полноэкранные галереи (свайп, клавиатура, видео)
│  └─ detail.ts             # «От детали — к целому»
├─ data/site.ts             # ВСЕ тексты, контакты, галереи, кейсы, ставка расчёта
├─ data/media.ts            # реестр изображений (ключ = имя файла)
├─ styles/global.css        # дизайн-система референса
├─ styles/identity.css      # дополнения VERNISSAGE
└─ assets/
   ├─ vn/                   # реальные фото VERNISSAGE (из gh-pages)
   ├─ ref/                  # фото из референса — ДЕМОНСТРАЦИОННЫЕ, права не подтверждены
   ├─ logo/                 # оригинальные SVG-логотипы (+ знак и надпись по отдельности)
   └─ fonts/                # Unbounded и Manrope (OFL), раздаются самим сайтом
public/media/video/         # видео (подгружаются только при показе)
tests/                      # Playwright: qa.cjs, perf.cjs, compare.cjs (+ pair.py)
```

## Как изменить данные

- Контакты, ставка «от 70 000 ₸/м²», FAQ, кейсы, подписи — `src/data/site.ts`.
- Пометки «демо» на неподтверждённых материалах включаются флагом `SHOW_DEMO_MARKS`.
  Кейс становится реальным, если поставить `demo: false`; фото из `assets/ref` всегда считаются демо.
- Заменить фото: положить файл в `src/assets/vn/` и указать его имя (без расширения) в `site.ts`.

## Проверки

```bash
npm run build && npm run preview                         # в отдельном терминале
node tests/qa.cjs                                         # Chromium и WebKit, 1920/1440/768/390/375
node tests/perf.cjs                                       # LCP, CLS, объём, плавность
node tests/compare.cjs <URL_референса> http://127.0.0.1:4321/vernissage2.0/ test-results/cmp 1440,390
python3 tests/pair.py test-results/cmp test-results/pairs # склейка «референс | новая версия»
```

Playwright в проект не устанавливается: тесты используют глобально доступный `playwright`
(`npm i -g playwright && npx playwright install chromium webkit`).

## Приватное превью (claude.ai Artifact)

Для визуальной приёмки без публикации на GitHub Pages:

```bash
npx astro build --base / --outDir /tmp/vn-preview
python3 tools/preview-artifact.py /tmp/vn-preview
```

Папка `/tmp/vn-preview` публикуется как приватный Artifact (страница видна только владельцу аккаунта).
Точка возврата перед превью: ветка `checkpoint/stage-b-69a1eaa`.
