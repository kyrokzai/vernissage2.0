# VERNISSAGE 2.0 — сайт в дизайне v9

Ветка `feature/v9-home` от `feature/create-3d@78f2013`. `main`, `gh-pages`, Production и vernissage.kz не изменены.

## Что это

Утверждённый дизайн «VERNISSAGE 2.0 Visual Design v9» (24.11.2026) перенесён в Astro.

| Адрес | Страница |
|---|---|
| `/` | Главная v9 |
| `/portfolio/residential/` | Проект «Квартира под ключ» |
| `/create-3d/` | Страница с 3D-конструктором; ведёт сессия FormIQ, см. `docs/CREATE-3D.md` |
| `/legacy/` | Прежняя тёмная главная — для сравнения и отката; `noindex` |

### Решения владельца

- Светлый 3D-раздел.
- Водяной знак — «VERNISSAGE».
- «Технология FORMIQ» — в 3D-разделе и в подвале; внутри конструктора только «Все права защищены © FORMIQ». Окончательные правила — `docs/INTEGRATION-CONTRACT.md`, §2.
- Заявки из конструктора не подключены. Заявка с сайта открывает WhatsApp салона с готовым сообщением, сайт сам ничего не отправляет.

## Источник дизайна

- `docs/design/v9/vernissage-2.0-v9.html` — утверждённый макет, sha256 `ea4fe78f…5307b2`. Открывается в браузере, все фото встроены.
- `docs/design/v9/src/` — исходники макета: сборка, стили, первый экран v4, нижняя панель v5.
- `docs/design/v9/tests/` — Playwright-проверки макета.
- `docs/design/v9/tools/port_v9.py` — однократный перенос: стили → `src/styles/v9-site.css`, разметка → `src/components/v9/*.astro`. После переноса файлы правились вручную; повторный запуск их перезапишет.

## Устройство

```
src/layouts/V9Site.astro        <head>, шрифты, JSON-LD; <main class="site"> + нижняя панель и меню телефона вне .site
src/styles/v9-site.css          стили v9: свет сверху справа, тени --lift-1/2/3, контейнерные запросы ≤600 px (телефон)
src/components/v9/              Header, Hero, Categories, Works, Kit3D, Steps, Lead, Footer, Bar (панель и меню),
                                ProjectArticle, Ph (фото)
src/scripts/v9/site.ts          панель и меню, анфилада арок, галерея, 3D, однократное появление фото, «Рис. N», заявка
src/assets/v9/                  38 фото макета (WebP; реальные работы — мягкая цветокоррекция, рендеры FORMIQ)
src/assets/fonts/               + Cormorant Garamond 600 (кнопки, надзаголовок), SIL OFL
```

- **Фото.** В макете фото были фоном base64. Здесь это `<img>` с `srcset`: `astro:assets`, WebP 360–1920 px, `loading="lazy"`. Первый экран загружается сразу, и браузер скачивает только кадр для своей ширины.
- **Без сдвигов макета.** Арки на компьютере раскладываются через `transform`, поэтому раскрытие при наведении не сдвигает соседей: CLS = 0.
- **iOS.** У кадров-деталей явный порядок слоёв: деталь не уходит под фото. Нижняя панель находится вне `.site`, потому что `container-type` ломает `position: fixed`.
- **Движение.** Только в ответ на действие и одно появление ключевых фото. При «уменьшить движение» его нет.

## Связь с 3D-конструктором

Контракт — `docs/INTEGRATION-CONTRACT.md`. Сайт только ставит ссылки; движок не копируется.

| Где | Ссылка |
|---|---|
| Первый экран, меню, нижняя панель «Создать в 3D» | `create-3d/` |
| Категории (первый экран и арки) | `create-3d/?start=<вид>` по `CATEGORY_LINKS` |
| 3D-раздел «Создать самому в 3D» | `create-3d/?start=kitchen&layout=<выбор>&finish=<выбор>` — меняется вместе с переключателями |

## Vercel Preview

- Тестовый проект Vercel `vernissage-preview` подключён к репозиторию владельцем 25.11.2026: каждая отправка в `feature/v9-home` собирается в окружении Preview. Production, `main` и vernissage.kz не затрагиваются.
- Постоянный адрес для проверки: https://vernissage-preview.vercel.app/ — Production тестового проекта следует за веткой `feature/v9-home` (решение владельца 25.11.2026). Адрес ветки: https://vernissage-preview-git-feature-v9-home-kyrokzai.vercel.app/. Vercel Authentication выключена, все страницы — noindex.
- `astro.config.mjs`: на Vercel (`VERCEL=1`) сайт собирается в корне домена (`base: '/'`). Для GitHub Pages остаётся `/vernissage2.0/`.
- Адрес конструктора — `PUBLIC_VN_CONFIGURATOR_URL`. По умолчанию это Preview ветки `feature/vernissage-embed`.
- Тестовый проект `vernissage-preview` (https://vernissage-preview.vercel.app/) закрыт от поиска: `<meta name="robots" content="noindex">`, пока у проекта нет своего домена. Признак — `import.meta.env.PUBLIC_VN_NOINDEX === '1'` (задаётся в `astro.config.mjs`, переменная проекта `PUBLIC_VN_NOINDEX` его переопределяет).

## Проверка

```bash
npm ci && npm run build && npm run preview            # http://127.0.0.1:4321/vernissage2.0/
node tests/v9/qa.cjs                                  # Chromium + WebKit (глобальный Playwright)
AXE=/путь/axe.min.js node tests/v9/qa.cjs             # + axe-core (WCAG 2.2 AA)
node tests/v9/qa.cjs https://<preview>.vercel.app/    # то же на Vercel Preview
node tests/v9/journey.cjs https://<preview>.vercel.app/  # сквозной путь: главная → каталог → 3D → настройка (посудомойка, интерьер) → заявка → «на весь экран» → главная → панель → проект сохранён
```

Проверки:
- 7 ширин от 320 до 1440 на трёх страницах;
- первый экран 320×568;
- арки, CLS, галерея, 12 сочетаний 3D и ссылки в конструктор;
- заявка → WhatsApp;
- нижняя панель и меню на телефоне;
- «Рис. N»;
- выбор, переданный во фрейм `/create-3d/`;
- клавиатура, уменьшение движения, axe.

Ограничение: это эмуляция Chromium и WebKit, не настоящий iPhone.
