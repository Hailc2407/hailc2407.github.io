---
name: english-room
description: Plan, build, test and publish lessons for the hidden study room (study/) of hailc2407.github.io — the TOEIC and Grammar courses in the encrypted vault. Use when the owner asks "lên kế hoạch cho buổi N grammar/toeic, sau đó làm", asks to add or change a lesson, a course (group) or a block type, or says "tạo PR rồi merge vào main luôn đi" after a lesson.
---

# English Room lessons

The study room is `study/` on hailc2407.github.io (Ctrl + Shift + L on the homepage, or
https://hailc2407.github.io/study/). Lessons live **encrypted** in `study/vault/` (password
`english`; `study/study.js` opens the vault by itself, so the site has no password box).
Book PDFs and audio are in the private repo **Hailc2407/toeic-materials** (clone it to
`/home/user/toeic-materials`; add it with `add_repo` if it is not in the session).

Kit (this folder): `scripts/lessonkit.py` (content helpers), `scripts/build_lesson.py` (render +
check + write JSON), `scripts/murphy.py` (read the grammar book and its key), `scripts/curriculum.py`
(course log), `scripts/publish.sh` (build + encrypt), `scripts/test_lessons.js` (browser test),
`templates/grammar_content.py`, `reference/blocks.md` (every block's fields + pitfalls).
Site tools: `tools/vault.mjs` (encrypt), `tools/unvault.mjs` (decrypt the whole vault).

## What the owner wants (keep every time)

- Reply in Vietnamese; lesson UI text in English with 🇻🇳 tips (`vi` fields).
- Two courses, kept separate: **TOEIC** (l01–l08, Collins *Skills for the TOEIC Test*, both books
  fully used) and **Grammar** (g01–g11, Murphy *English Grammar in Use* 5th ed., plan fully used:
  10 topic lessons + g11 review). A new course = a new group in `groups.json` + its own curriculum file.
- No "Buổi 0". Highly interactive: sorts, timelines, gaps, fix-the-mistake, order, duels, tests, review.
- Every lesson starts with **20 vocabulary words with IPA and 🔊** (browser TTS only for word pronunciation).
- **Do not** add "speak using the target structure" or "write and get it checked" tasks to grammar lessons.
- Use the book pages as images (personal use is fine). Check every answer against the book's key.
- Grammar lesson shape (~120'): vocab → per core unit [photo, rule table + vi, sort/timeline,
  book exercises, fix, duel] → optional extension unit → 15-question TOEIC Part 5 mini test → review +
  summary table + homework (Additional exercise of the book).

## Flow A: "lên kế hoạch cho buổi N …, sau đó làm"

Paths: `K=.claude/skills/english-room/scripts` (run everything from the site repo root),
`W=<scratchpad>/lesson` for content files, `VSRC=<scratchpad>/english-room-vsrc` for the vault source.

1. **Workspace**: `node tools/unvault.mjs study/vault $VSRC` (every lesson, image, audio and curriculum file).
2. **Plan** (short, in Vietnamese, in the reply): `python3 $K/curriculum.py $VSRC/curriculum-grammar.json show`;
   take the units planned for N, or propose them if none are planned (owner's units = core, yours = extension);
   list sections and minutes. Then build without waiting for approval.
3. **Read the book**: `python3 $K/murphy.py unit 69 72 87` (exercise text + key per unit),
   `murphy.py page <pdf page>`, `murphy.py index` / `addkey` for Additional exercises.
   For the TOEIC books use `pdftotext -layout` (L&R: book page = PDF − 9; S&W: PDF − 13).
4. **Write** `$W/gNN_content.py` from `templates/grammar_content.py` (`from lessonkit import *`,
   set `UNITS`/`PAGES`). Copy exercise sentences and keys exactly; accept every alternative the key gives.
5. **Build + encrypt**: `VSRC=$VSRC $K/publish.sh $W/gNN_content.py curriculum-grammar.json N`
   (build_lesson.py stops on wrong blanks/options/fix words/missing images; `mark N` turns plan N into used N).
   If the units had no plan entry, add them first with `curriculum.py $VSRC/curriculum-grammar.json add …`.
6. **Test**: `(python3 -m http.server 8765 >/dev/null 2>&1 &)` then
   `node $K/test_lessons.js gNN` (and with no ids before pushing: all lessons).
   Must print `ALL OK`. Look at one screenshot (`--shots=<dir>`) of a new kind of block. Never `pkill -f http.server`
   inside a chained command (it kills the shell); just leave the server running.
7. **Commit + push** to the session's designated branch: `git add -A study/vault` (+ any code change),
   message "Add Grammar Lesson N: <Topic>" with a short body. Push with `git push -u origin <branch>`.
8. **Hand over**: tar the content file(s) (`tar czf $SCRATCH/lesson_src.tar.gz -C $W .`) and send it with
   SendUserFile (the content `.py` is the editable source; the vault only holds the built JSON). Report in
   Vietnamese: sections, what was tested, anything not tested, then ask whether to create the PR and merge.

## Flow B: "tạo PR rồi merge vào main luôn đi"

1. `mcp__github__create_pull_request` (owner `hailc2407`, repo `hailc2407.github.io`, head = branch, base `main`),
   body: what was added, how it was tested, the attribution footer from the system reminder.
2. `mcp__github__merge_pull_request` with `merge_method: "squash"`, title "<PR title> (#n)".
3. Reset the branch to main (force-push is blocked, so merge `-s ours`):
   `git fetch -q origin main <branch> && git checkout -q -B <branch> origin/main && git merge -q -s ours --no-edit origin/<branch> && git diff origin/main HEAD --quiet && git push -q -u origin <branch>`
4. Reply with the PR link and that the page updates in 1–2 minutes.

## Changing an old lesson

Its content `.py` is in a tarball the owner keeps (lessons_src.tar.gz, files `gNN_content.py`/`lNN_content.py`
written with the old per-lesson `build_gNN.py`; they define their own helpers, so build them with that
`build_gNN.py <toeic-materials> <out>` or replace the helper block with `from lessonkit import *` and use
build_lesson.py). Ask for the tarball (or look for `lessons_src/` in toeic-materials) before editing. For a small fix
you can also edit `$VSRC/lessons/<id>.json` directly and re-encrypt — then tell the owner the source differs.

## Changing the app

`study/study.js` (blocks `B.<type>`, routing `#/g/<group>`, `#<lesson id>`), `study/study.css`,
`assets/js/gate.js` (hotkey). After a change, run test_lessons.js on all lessons (`ALL OK`) and check a phone
width screenshot (390 px).
