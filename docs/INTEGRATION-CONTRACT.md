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

## 2. Поведение (решения владельца, 24–25.11.2026)

- **Режим.** Публичный посетитель получает Easy Mode без регистрации. PRO в сборке покупателя нет.
- **Другой вид мебели** по ссылке заменяет активное изделие. Предыдущее возвращает «Отменить».
- **Заявки из конструктора не подключены** (`orderChannel: none`). Тексты сайта «Демо-версия» и «проект менеджеру не передаётся» остаются до подключения.
- **Окончательные правила интеграции** (решение владельца для обеих сессий, 25.11.2026; к обсуждению подписей не возвращаемся, если реализация им соответствует):
  1. Внутри 3D-конструктора — только существующий копирайт «Все права защищены © FORMIQ». «Powered by FORMIQ» не добавляется.
  2. На сайте VERNISSAGE — неброская подпись «Технология FORMIQ» в 3D-разделе главной и в подвале.
  3. Водяной знак в 3D и на экспортируемых изображениях — только VERNISSAGE.
  4. Сайт — в отдельном тестовом проекте Vercel. Preview открывается без Vercel Authentication и показывает только безопасную клиентскую демоверсию (Easy, без PRO, `orderChannel: none`).
  5. Production, `main`, официальный домен vernissage.kz и закрытый Studio PRO не изменяются. Основной проект Vercel FORMIQ не меняется, платные услуги не подключаются.
  6. На рабочем Preview проверяется весь путь: главная → каталог → 3D-конструктор → настройка мебели → заявка → возврат на главную (`tests/v9/journey.cjs`).
  7. «На сайт салона» в конструкторе ведёт на подтверждённый адрес Preview сайта, а не на предполагаемый URL.
- В описаниях — «Демо-версия 3D-конструктора», без многократного повторения бренда FORMIQ.

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
