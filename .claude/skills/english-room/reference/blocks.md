# Lesson JSON and blocks (study/study.js)

A lesson is `lessons/<id>.json` in the vault source:

```
{ id, no, group: "toeic"|"grammar"|…, groupTitle, minutes, title, subtitle, book (HTML),
  images: "img/<id>/", tracks: { name: "audio/….mp3" }, objectives: [HTML], howto: HTML, vi: HTML,
  sections: [ { id, title, short, minutes, intro?, blocks: [ … ] } ] }
```

`groups.json` lists the courses (`id, title, subtitle, curriculum`); the home page shows one
card per group, `#/g/<id>` shows its lessons and its curriculum table. A lesson belongs to the
group in its `group` field (default toeic). Strings are HTML; `<b>`, `<i>`, `<s>` are used a lot.

## Blocks used by the grammar course

| type | fields | notes |
|---|---|---|
| `vocab` | `title, task, items: [{word, ipa, pos, vi, ex}]` | 🔊 = browser speech, the only TTS allowed |
| `listenPick` | `title, by: "vi", words: [word…]` | hear a vocab word, pick its meaning; words must be in a vocab block of the lesson |
| `photo` | `img` (file name without .jpg, inside `images`), `caption` | click to zoom |
| `table` | `title, head: [..], rows: [[..]], vi?` | `vi` = Vietnamese tip behind the 🇻🇳 toggle |
| `sort` | `title, cats: [..], items: [{t, c, why?}]` | click a card, then a column; `c` = column index |
| `timeline` | `title, items: [{s, opts: [kind…], labels?, a, why}]` | kinds: now, temp, perm, repeat, past, longpast, result, plan, instant |
| `gaps` | `title, task?, bank?, exact?, groups: [{img?, start?, items: [{q, a, opts?, hint?, size?}]}]` | `___` = a blank. One blank: `a` = list of accepted answers. n blanks: `a` = n lists. `opts` (dropdown) = list, or n lists for n blanks. `bank` = one dropdown for all. No opts/bank = typed (case/punctuation-insensitive; give ’ and ' forms with `c()`) |
| `fix` | `title, task?, items: [{s, err|null, fix: [..], why}]` | learner clicks the wrong word(s) `err` (must appear in `s`), types a fix; `err: null` = sentence is OK; `fix: ["—", ""]` = delete the word |
| `order` | `items: [chunks shuffled], answer: [original position of each shown chunk], inline: true, task?` | build with `order()` |
| `duel` | `title, seconds, task?, items: [{q, opts, a, why}]` | two players, timer; build items with `ch()` |
| `test` | `text: "show", seconds?, items: [q(...)/mc(...)]` | answer sheet, score, explanations; `mc()` |
| `review` | `title, task` | redoes every item answered wrongly in the lesson (gaps, order, sort, fix, timeline, duel, text-only test questions) |
| `checklist` | `title, items: [HTML]` | homework |
| `text`, `tip` | `html` (+ `title` for tip) | free HTML |

## Blocks used by the TOEIC course (need audio)

`hear`, `dictation`, `shadow`, `transcript` (track + `seg: [start, end]` clips), `photoMCQ`,
`sounds`, `speak`, `deck`, `survey`, `screen`, `write`, `email`, `essay`, `doc`, `sheet` (paper test with
answer sheet), `scoreboard`, `pick`. Read the block's comment in `study/study.js` and an existing
TOEIC lesson (`node tools/unvault.mjs` → `lessons/l0N.json`) before using one.

## Pitfalls already met

- A sentence that itself contains `___` inside a dropdown item makes two blanks → the page breaks
  (`choices.map is not a function`). `alt()` writes the sentence gap as `……`. build_lesson.py checks this.
- Duel/test answers must not sit in the same position: write them naturally and let `ch()`/`mc()` spread them.
- Sort columns: up to 5 work on desktop and phone.
- `fix` matching ignores case and . , ? ! ; : — keep `err` as the exact words of `s`.
