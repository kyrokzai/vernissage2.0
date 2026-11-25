#!/usr/bin/env bash
# Восстанавливает Taste Skill (design-taste-frontend) в ~/.claude/skills после пересоздания контейнера.
# 40 МБ примеров навыка не хранятся в репозитории: скачивается закреплённый коммит официального репозитория (MIT).
# Идемпотентно: если навык уже на месте, ничего не делает. Запускается хуком SessionStart (.claude/settings.json) или вручную.
set -u
REPO="https://github.com/Leonxlnx/taste-skill"
PIN="d1a2bb41d927083ac7118f60cfc9cdf711810ea0"   # 24.11.2026, tasteskill 2.5.1
DEST="${HOME}/.claude/skills/design-taste-frontend"

if [ -f "${DEST}/SKILL.md" ] && [ "$(cat "${DEST}/.pin" 2>/dev/null)" = "${PIN}" ]; then
  exit 0
fi
command -v git >/dev/null 2>&1 || { echo "restore-taste-skill: нет git, навык не восстановлен"; exit 0; }

TMP="$(mktemp -d)"
trap 'rm -rf -- "${TMP:?}"' EXIT
if ! timeout 90 git -C "${TMP}" init -q \
   || ! timeout 90 git -C "${TMP}" remote add origin "${REPO}" \
   || ! timeout 90 git -C "${TMP}" fetch -q --depth 1 origin "${PIN}" \
   || ! timeout 90 git -C "${TMP}" checkout -q FETCH_HEAD; then
  echo "restore-taste-skill: не удалось скачать ${REPO}@${PIN:0:7} (сеть?) — навык не восстановлен"
  exit 0
fi
[ -f "${TMP}/skills/taste-skill/SKILL.md" ] || { echo "restore-taste-skill: в коммите нет skills/taste-skill"; exit 0; }

mkdir -p "${HOME}/.claude/skills"
NEW="${DEST}.new.$$"
cp -R "${TMP}/skills/taste-skill" "${NEW}"
cp "${TMP}/LICENSE" "${NEW}/LICENSE" 2>/dev/null || true
echo "${PIN}" > "${NEW}/.pin"
if [ -d "${DEST}" ]; then mv "${DEST}" "${DEST}.old.$$" && rm -rf -- "${DEST:?}.old.$$"; fi
mv "${NEW}" "${DEST}"
echo "restore-taste-skill: Taste Skill восстановлен (${PIN:0:7}) в ${DEST}"
