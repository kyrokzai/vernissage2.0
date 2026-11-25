# Источники навыков (ветка experiment/cinematic)

Навыки скопированы из официальных репозиториев без изменений, с файлами лицензий.

| Навык | Репозиторий | Коммит | Лицензия |
|---|---|---|---|
| impeccable (только навык: без хуков и агентов плагина) | github.com/pbakaus/impeccable · `plugin/skills/impeccable` | 9e460a8 (24.11.2026) | Apache-2.0 |
| emil-design-eng, apple-design, review-animations, animation-performance | github.com/emilkowalski/skills | 64eb3de (15.11.2026) | MIT |
| gsap-core, gsap-scrolltrigger, gsap-timeline, gsap-performance, gsap-plugins | github.com/greensock/gsap-skills | aed9cfd (21.04.2026) | MIT |

**Не в репозитории — по размеру.** Taste Skill (`design-taste-frontend`, github.com/Leonxlnx/taste-skill, MIT, коммит d1a2bb4) весит около 40 МБ вместе с примерами, поэтому ставится в пользовательскую папку на время сессии:

```bash
git clone --depth 1 https://github.com/Leonxlnx/taste-skill /tmp/taste && cp -r /tmp/taste/skills/taste-skill ~/.claude/skills/design-taste-frontend
```

**Безопасность:**
- В навыках нет сетевых вызовов и скриптов, кроме одного случая.
- Impeccable: `scripts/impeccable` по команде навыка скачивает свой движок с github.com/pbakaus/impeccable/releases и сверяет контрольные суммы (`engine-checksums.txt`).
- Хуки Impeccable (SessionStart / PostToolUse Edit|Write / Stop) не подключены: они запускали бы проверку на каждое изменение файла.
