#!/usr/bin/env bash
# Build one lesson into the full vault source and re-encrypt the vault.
#
#   .claude/skills/english-room/scripts/publish.sh <content.py> [curriculum-file plan-number]
#   e.g. publish.sh $W/g12_content.py curriculum-grammar.json 12
#
# Run from the site repo root. Uses $VSRC (default: $TMPDIR/english-room-vsrc): if it does not
# exist yet, it is decrypted from study/vault first, so it always holds EVERY lesson (vault.mjs
# deletes ciphertexts of files missing from its source).
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"
VSRC="${VSRC:-${TMPDIR:-/tmp}/english-room-vsrc}"
export VAULT_PASSWORD="${VAULT_PASSWORD:-english}"
[ -f tools/vault.mjs ] || { echo "Run from the hailc2407.github.io root"; exit 1; }

if [ ! -d "$VSRC/lessons" ]; then
  node tools/unvault.mjs study/vault "$VSRC"
fi
python3 "$KIT/build_lesson.py" "$1" "$VSRC"
if [ $# -ge 3 ]; then
  python3 "$KIT/curriculum.py" "$VSRC/$2" mark "$3"
fi
node tools/vault.mjs "$VSRC" study/vault
git status --short study/vault | head -5
