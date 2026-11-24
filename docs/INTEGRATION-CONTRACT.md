# Контракт сайт ↔ 3D-конструктор (VERNISSAGE × FORMIQ)

Общий для двух сессий Claude Code: «Vernissage 2.0 development» (сайт) и «FormIQ 3D CONFIGURATOR & SITE» (конструктор).

Изменять только по договорённости обеих сторон. Каждую правку отражать в этом файле и в `docs/VERNISSAGE-INTEGRATION.md` конструктора.

## 1. Адреса и параметры

| | Значение |
|---|---|
| Страница сайта | `<base>create-3d/` |
| Параметры | `?start=` · `&layout=` · `&finish=` |
| `start` | `kitchen` · `wardrobe` · `tv` · `hallway` · `chest` · `shelving` · `desk` · `bathroom` |
| `layout` | только при `start=kitchen`: `straight` · `corner` · `island` |
| `finish` | `oak` · `walnut` · `ivory` · `graphite` |
| Фрейм | `<PUBLIC_VN_CONFIGURATOR_URL>?embed=1&theme=light&lang=ru[&start…]` |

- Неизвестные значения отбрасываются: на сайте — `frameSrc` в `src/data/create3d.ts`, в конструкторе — `app/deepLink.ts`.
- Сайт строит ссылки только через `createLink()` и `CATEGORY_LINKS` из `src/data/create3d.ts`.

## 2. Поведение (решения владельца, 24.11.2026)

- **Режим.** Публичный посетитель получает Easy Mode без регистрации. PRO в сборке покупателя нет.
- **Другой вид мебели** по ссылке заменяет активное изделие. Предыдущее возвращает «Отменить».
- **Заявки из конструктора не подключены** (`orderChannel: none`). Тексты сайта «Демо-версия» и «проект менеджеру не передаётся» остаются до подключения.
- **Брендинг** (окончательное решение владельца для обеих сессий, 24.11.2026):
  - основной бренд — VERNISSAGE; водяной знак на рендерах — «VERNISSAGE»;
  - в 3D-разделе главной и в подвале сайта — деликатная подпись «Технология FORMIQ»;
  - внутри конструктора — небольшая подпись «Powered by FORMIQ»;
  - в описаниях — «Демо-версия 3D-конструктора», без многократного повторения бренда FORMIQ.
- **Тестовый сайт** — Vercel Preview отдельного проекта для `kyrokzai/vernissage2.0`: без домена vernissage.kz, без изменений основного проекта FORMIQ, без публикации для клиентов и без платных услуг.

## 3. Владение файлами в `kyrokzai/vernissage2.0`

| Сессия | Файлы |
|---|---|
| Конструктор (FormIQ) | `src/pages/create-3d/**`, `src/data/create3d.ts`, `src/styles/create3d.css`, `src/layouts/V9.astro`, `src/styles/v9.css`, `docs/CREATE-3D.md` |
| Сайт (Vernissage) | `src/pages/index.astro`, `src/pages/portfolio/**`, `src/pages/legacy/**`, `src/layouts/V9Site.astro`, `src/components/v9/**`, `src/scripts/v9/**`, `src/styles/v9-site.css`, `src/assets/v9/**`, `docs/design/v9/**`, `docs/V9-SITE.md`, `tests/v9/**` |
| Общие (менять с уведомлением) | `astro.config.mjs`, `package.json`, `README.md`, этот файл |

## 4. Ветки

- Сайт v9: `feature/v9-home`.
- Страница конструктора на сайте: `feature/create-3d`.
- Конструктор: `feature/vernissage-embed`.
- Merge, `main`, `gh-pages` и Production — только по решению владельца.
- Синхронизация — merge, без rebase и force-push чужих коммитов.
