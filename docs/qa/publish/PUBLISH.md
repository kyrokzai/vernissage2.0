# Публикация VERNISSAGE 2.0 на GitHub Pages — 12.11.2026

- Публичный адрес: https://kyrokzai.github.io/vernissage2.0/
- Источник: `codex/reference-rebuild`, коммит `07f1916`
- Коммит публикации в `gh-pages`: `aaccc6d` (предыдущий — `7dc61be`)
- GitHub Actions: «pages build and deployment» №4 (run 43204205397) — success
- Сохранены: `backup/gh-pages-2026-11-11` (7dc61be), `checkpoint/stage-b-69a1eaa` (69a1eaa); `main` не изменялся
- Старые файлы в `gh-pages` не удалялись: заменён только `index.html`, добавлено 178 файлов новой сборки
  (старые страницы `portfolio/…`, `media/…`, `logo/…`, `404.html` остаются доступны по прямым ссылкам)
- Пометки «Демо» сохранены (`SHOW_DEMO_MARKS = true`)

## Проверки
| Проверка | Результат |
|---|---|
| Локальная сборка перед публикацией: Chromium / WebKit, 1920–375 | 272/272 и 272/272 |
| Все 179 файлов по публичному адресу: HTTP 200, побайтное совпадение со сборкой, верные MIME | без ошибок |
| Публичный сайт: Chromium / WebKit, 1920/1440/768/390/375 | 272/272 и 272/272 |
| Производительность по сети (см. `perf-public.txt`) | LCP 0,7 с (ПК), 1,0 с (смартфон, CPU ×4, 4G); CLS 0 / 0,018 |

Журналы: `qa-chromium-public.txt`, `qa-webkit-public.txt`, `perf-public.txt`. Снимки: `desktop-1440-*.jpg`, `iphone-*.jpg`.
