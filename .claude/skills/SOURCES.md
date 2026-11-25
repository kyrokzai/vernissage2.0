# Источники навыков (ветка experiment/cinematic)

Навыки скопированы из официальных репозиториев без изменений, с файлами лицензий.

| Навык | Репозиторий | Коммит | Лицензия |
|---|---|---|---|
| impeccable (только навык: без хуков и агентов плагина) | github.com/pbakaus/impeccable · `plugin/skills/impeccable` | 9e460a8 (24.11.2026) | Apache-2.0 |
| emil-design-eng, apple-design, review-animations, animation-performance | github.com/emilkowalski/skills | 64eb3de (15.11.2026) | MIT |
| gsap-core, gsap-scrolltrigger, gsap-timeline, gsap-performance, gsap-plugins | github.com/greensock/gsap-skills | aed9cfd (21.04.2026) | MIT |

**Не в репозитории (по размеру).** Taste Skill (`design-taste-frontend`, github.com/Leonxlnx/taste-skill, MIT) — около 40 МБ с примерами.
Восстанавливается автоматически при старте сессии: хук SessionStart в `.claude/settings.json` запускает `tools/restore-taste-skill.sh`,
который скачивает закреплённый коммит d1a2bb4 в `~/.claude/skills/design-taste-frontend` (≈ 2–3 с; если навык уже на месте — ничего не делает).
Вручную: `bash tools/restore-taste-skill.sh`.

**Безопасность:**
- В навыках нет сетевых вызовов и скриптов, кроме одного случая.
- Impeccable: `scripts/impeccable` по команде навыка скачивает свой движок с github.com/pbakaus/impeccable/releases и сверяет контрольные суммы (`engine-checksums.txt`).
- Хуки Impeccable (SessionStart / PostToolUse Edit|Write / Stop) не подключены: они запускали бы проверку на каждое изменение файла.
