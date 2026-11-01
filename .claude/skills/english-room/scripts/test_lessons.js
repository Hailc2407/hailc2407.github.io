// Browser check of the study room (Playwright + the pre-installed Chromium).
//
//   cd <site repo> && (python3 -m http.server 8765 >/dev/null 2>&1 &)
//   node .claude/skills/english-room/scripts/test_lessons.js [g05 g06 …] [--shots=<dir>]
//
// With no ids it opens every lesson in the vault index. For each lesson: the page must render
// (no "null/undefined/[object" or raw <b>/<i>/<span> in the text), then every `gaps` block is
// filled from its own answer key and checked: each must show full marks ("n/n đúng").
// A gaps item whose answer is missing from its dropdown is reported. Page errors fail the run.
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const shots = (args.find((a) => a.startsWith("--shots=")) || "").slice(8);
let ids = args.filter((a) => !a.startsWith("--"));
const BASE = process.env.BASE || "http://localhost:8765/study/";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errs = [];
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("dialog", (d) => d.accept());
  let bad = 0;
  if (!ids.length) {
    await p.goto(BASE); await p.waitForTimeout(2500);
    ids = await p.evaluate(() => [...document.querySelectorAll("a[href*='#']")].map((a) => a.getAttribute("href").split("#").pop())
      .filter((h) => /^[a-z]\d\d$/.test(h)));
    if (!ids.length) for (const g of ["g/toeic", "g/grammar"]) {
      await p.goto(BASE + "#/" + g); await p.waitForTimeout(1500);
      ids.push(...await p.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href").split("#").pop().replace(/^\//, ""))
        .filter((h) => /^[a-z]\d\d$/.test(h))));
    }
    ids = [...new Set(ids)];
  }
  for (const id of ids) {
    await p.goto(BASE + "#" + id); await p.waitForTimeout(2500);
    const t = await p.evaluate(() => document.body.innerText);
    const raw = /\bnull\b|undefined|\[object|<span|<b>|<i>/.test(t);
    if (t.length < 500 || raw) { bad++; console.log(`${id}: NOT RENDERED or raw text (length ${t.length})`); continue; }
    const res = await p.evaluate(async () => {
      const out = [];
      for (const blk of document.querySelectorAll(".gaps")) {
        for (const li of blk.querySelectorAll("li[data-a]")) {
          const ans = JSON.parse(li.dataset.a);
          li.querySelectorAll("select, input.gap-in").forEach((el, k) => {
            const v = ans[k][0];
            if (el.tagName === "SELECT" && ![...el.options].some((o) => o.value === v)) out.push("MISSING OPTION " + v + " in " + li.dataset.q);
            el.value = v;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          });
        }
        const btn = blk.querySelector(".actions .btn"); if (btn) btn.click();
        await new Promise((r) => setTimeout(r, 30));
        const sc = (blk.querySelector(".score") || {}).textContent || "?";
        const m = sc.match(/(\d+)\/(\d+)/);
        out.push(((blk.closest("section") || {}).id || "?") + ": " + sc + (m && m[1] !== m[2] ? "   <-- NOT FULL" : ""));
      }
      return out;
    });
    const fails = res.filter((r) => /NOT FULL|MISSING/.test(r));
    bad += fails.length;
    console.log(`${id}: ${t.length} chars, ${res.length} gaps blocks` + (fails.length ? "\n  " + fails.join("\n  ") : ", all full marks"));
    if (shots) await p.screenshot({ path: `${shots}/${id}.png`, fullPage: false });
  }
  if (errs.length) { bad++; console.log("page errors:", errs); }
  console.log(bad ? `FAILED (${bad})` : "ALL OK");
  await b.close();
  process.exit(bad ? 1 : 0);
})();
