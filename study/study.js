/* ==========================================================================
   study.js: renders an encrypted lesson (lessons/*.json in the vault) into
   interactive exercises. Nothing is saved: reloading starts the lesson fresh.
   ========================================================================== */
(() => {
  "use strict";
  const V = window.Vault;
  const app = document.getElementById("app");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Element builder ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const btn = (label, onclick, cls = "btn", title) => h("button", { type: "button", class: cls, onclick, title }, label);
  const LETTERS = ["A", "B", "C", "D"];
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' /-]/g, " ").replace(/\s+/g, " ").trim();

  /* ---------- Preferences (this tab only) ---------- */
  const pref = (k, d) => { try { return localStorage.getItem("study-" + k) || d; } catch (e) { return d; } };
  const setPref = (k, v) => { try { localStorage.setItem("study-" + k, v); } catch (e) {} };

  /* ---------- Text to speech (new words only) ---------- */
  const Speech = {
    accent: pref("accent", "en-US"),
    voice: null,
    pick() {
      const all = speechSynthesis.getVoices();
      const want = this.accent.toLowerCase();
      const score = (v) => {
        const n = v.name;
        let s = 0;
        if (v.lang.replace("_", "-").toLowerCase() === want) s += 10;
        else if (v.lang.toLowerCase().startsWith("en")) s += 1;
        else return -1;
        if (/natural|neural/i.test(n)) s += 6;
        if (/google/i.test(n)) s += 5;
        if (/premium|enhanced/i.test(n)) s += 4;
        if (/samantha|alex|ava|allison|daniel|serena|kate|oliver|aria|jenny|guy|libby|sonia|ryan/i.test(n)) s += 3;
        return s;
      };
      this.voice = all.map((v) => [score(v), v]).filter((x) => x[0] >= 0).sort((a, b) => b[0] - a[0]).map((x) => x[1])[0] || null;
    },
    say(text, slow) {
      if (!("speechSynthesis" in window)) return toast("Trình duyệt này không có giọng đọc");
      speechSynthesis.cancel();
      if (!this.voice) this.pick();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.accent;
      if (this.voice) u.voice = this.voice;
      u.rate = slow ? 0.6 : 0.92;
      speechSynthesis.speak(u);
    },
  };
  if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", () => Speech.pick());
  const sayBtns = (text) => h("span", { class: "say" },
    btn("🔊", () => Speech.say(text), "icon-btn", "Nghe"),
    btn("🐢", () => Speech.say(text, true), "icon-btn", "Nghe chậm"));

  /* ---------- Toast ---------- */
  let toastTimer = 0;
  function toast(text) {
    let t = $(".toast");
    if (!t) t = document.body.appendChild(h("div", { class: "toast", role: "status" }));
    t.textContent = text;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 2200);
  }

  /* ---------- Beep (timers) ---------- */
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.18, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.22);
      });
    } catch (e) {}
  }

  /* ---------- Lesson state ---------- */
  let L = null; // current lesson

  /* ---------- Images ---------- */
  function img(name, cls = "photo", alt = "") {
    const el = h("img", { class: cls, alt, loading: "lazy", decoding: "async" });
    if (name) V.url(L.images + name + ".jpg").then((u) => { el.src = u; }, () => el.classList.add("missing"));
    return el;
  }
  // Click a photo to view it large.
  document.addEventListener("click", (e) => {
    const im = e.target.closest("img.photo");
    if (!im || !im.src || e.target.closest(".no-zoom")) return;
    const ov = h("div", { class: "zoom", onclick: () => ov.remove() }, h("img", { src: im.src, alt: "" }));
    document.body.appendChild(ov);
  });

  /* ---------- Audio ---------- */
  const players = new Set();
  function trackPath(id) { return L.tracks && L.tracks[id]; }

  /* A player for one track: play/pause, back 5 s, speed, seek; plus clip(s, e). */
  function player(id, opts = {}) {
    const path = trackPath(id);
    const audio = new Audio();
    audio.preload = "none";
    let stopAt = null, ready = null;
    const el = h("div", { class: "player" });
    const label = h("span", { class: "p-label" }, "🎧 Track " + id);
    if (!path || !V.has(path)) {
      el.classList.add("off");
      el.append(label, h("span", { class: "p-note" }, "chưa có audio"));
      return { el, clip() { toast("Track " + id + " chưa có audio"); }, ok: false };
    }
    const load = () => ready || (ready = V.url(path).then((u) => { audio.src = u; return new Promise((r) => {
      if (audio.readyState >= 1) r(); else audio.addEventListener("loadedmetadata", r, { once: true });
      audio.load();
    }); }));
    const playBtn = btn("▶", () => toggle(), "p-btn p-play", "Phát / dừng");
    const back = btn("↺5", () => { load().then(() => { audio.currentTime = Math.max(0, audio.currentTime - 5); }); }, "p-btn", "Lùi 5 giây");
    const seek = h("input", { type: "range", class: "p-seek", min: 0, max: 1000, value: 0, "aria-label": "Vị trí" });
    const time = h("span", { class: "p-time" }, "0:00");
    const speed = h("select", { class: "p-speed", "aria-label": "Tốc độ" },
      ["0.75", "0.9", "1", "1.15"].map((s) => h("option", { value: s, selected: s === "1" }, s + "×")));
    const fmt = (t) => Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
    speed.addEventListener("change", () => { audio.playbackRate = Number(speed.value); });
    seek.addEventListener("input", () => load().then(() => {
      stopAt = null;
      audio.currentTime = (seek.value / 1000) * (audio.duration || 0);
    }));
    audio.addEventListener("timeupdate", () => {
      if (stopAt != null && audio.currentTime >= stopAt) { audio.pause(); stopAt = null; }
      if (audio.duration) seek.value = Math.round((audio.currentTime / audio.duration) * 1000);
      time.textContent = fmt(audio.currentTime) + (audio.duration ? " / " + fmt(audio.duration) : "");
    });
    audio.addEventListener("play", () => {
      players.forEach((p) => { if (p !== audio) p.pause(); });
      playBtn.textContent = "❚❚";
      el.classList.add("on");
    });
    audio.addEventListener("pause", () => { playBtn.textContent = "▶"; el.classList.remove("on"); });
    players.add(audio);
    async function toggle() {
      await load();
      if (audio.paused) { stopAt = null; audio.playbackRate = Number(speed.value); audio.play(); } else audio.pause();
    }
    async function clip(s, e, rate) {
      await load();
      audio.currentTime = s;
      stopAt = e;
      audio.playbackRate = rate || Number(speed.value);
      audio.play();
    }
    el.append(label, playBtn, back, seek, time, speed);
    if (opts.note) el.append(h("span", { class: "p-note" }, opts.note));
    return { el, clip, ok: true };
  }
  const clipBtn = (pl, seg, label = "🔁", title = "Nghe lại câu này") =>
    seg && pl.ok ? btn(label, (e) => { e.stopPropagation(); pl.clip(seg[0], seg[1]); }, "icon-btn clip", title) : null;

  /* ---------- Recorder (kept in memory only) ---------- */
  function recorder() {
    let rec = null, chunks = [], url = null;
    const out = h("audio", { controls: true, class: "rec-audio", hidden: true });
    const go = btn("● Ghi âm", start, "btn rec");
    async function start() {
      if (rec) { rec.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        rec = new MediaRecorder(stream);
        chunks = [];
        rec.ondataavailable = (e) => chunks.push(e.data);
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
          out.src = url;
          out.hidden = false;
          rec = null;
          go.textContent = "● Ghi lại";
          go.classList.remove("live");
        };
        rec.start();
        go.textContent = "■ Dừng";
        go.classList.add("live");
      } catch (e) {
        toast("Không mở được micro. Hãy cho phép micro trong trình duyệt.");
      }
    }
    const el = h("span", { class: "recorder" }, go, out);
    el.begin = () => { if (!rec) start(); };
    el.end = () => { if (rec) rec.stop(); };
    return el;
  }

  /* ---------- Countdown timer ---------- */
  function timer(seconds, cls = "timer") {
    let left = seconds, id = 0;
    const fmt = (t) => Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
    const face = h("span", { class: "t-face" }, fmt(left));
    const go = btn("Start", () => {
      if (id) { clearInterval(id); id = 0; go.textContent = "Start"; return; }
      if (left <= 0) left = seconds;
      go.textContent = "Pause";
      id = setInterval(() => {
        left--;
        face.textContent = fmt(Math.max(left, 0));
        el.classList.toggle("low", left <= 10 && left > 0);
        if (left <= 0) { clearInterval(id); id = 0; go.textContent = "Start"; el.classList.remove("low"); el.classList.add("done"); beep(); }
      }, 1000);
    }, "btn small");
    const reset = btn("↺", () => {
      clearInterval(id); id = 0; left = seconds; face.textContent = fmt(left); go.textContent = "Start";
      el.classList.remove("low", "done");
    }, "btn small ghost", "Đặt lại");
    const el = h("span", { class: cls }, "⏱ ", face, go, reset);
    return el;
  }

  /* ---------- Vietnamese explanation toggle ---------- */
  function viBox(html) {
    if (!html) return null;
    const box = h("div", { class: "vi", lang: "vi", hidden: !document.body.classList.contains("vi-all"), html });
    const t = btn("🇻🇳 Giải thích", () => { box.hidden = !box.hidden; }, "vi-btn");
    return h("div", { class: "vi-wrap" }, t, box);
  }

  /* ---------- Score line ---------- */
  function scoreLine() {
    const el = h("p", { class: "score", hidden: true });
    return {
      el,
      set(ok, total, extra = "") {
        el.hidden = false;
        el.className = "score " + (ok === total ? "good" : ok / total >= 0.6 ? "mid" : "low");
        el.textContent = `${ok}/${total} đúng${extra}`;
      },
    };
  }

  /* ======================================================================
     Blocks
     ====================================================================== */
  const B = {};

  B.text = (b) => h("div", { class: "text", html: b.html });

  B.tip = (b) => h("aside", { class: "tip" }, b.title ? h("strong", {}, b.title) : null, h("div", { html: b.html }));

  B.table = (b) => h("div", { class: "table-wrap" }, h("table", {},
    b.head ? h("thead", {}, h("tr", {}, b.head.map((c) => h("th", { html: c })))) : null,
    h("tbody", {}, b.rows.map((r) => h("tr", {}, r.map((c) => h("td", { html: c })))))));

  /* An on-screen information text (schedule, agenda, itinerary) like the Speaking test shows. */
  B.screen = (b) => h("div", { class: "screen-card" },
    h("div", { class: "screen-bar" }, "Speaking Test"),
    h("div", { class: "screen-body" },
      b.heading ? h("div", { class: "screen-title", html: b.heading }) : null,
      b.lead ? h("div", { class: "screen-lead", html: b.lead }) : null,
      b.rows ? h("table", { class: "screen-table" }, h("tbody", {}, b.rows.map((r) => h("tr", {}, r.map((c) => h("td", { html: c })))))) : null,
      b.foot ? h("div", { class: "screen-foot", html: b.foot }) : null),
    b.seconds ? h("div", { class: "screen-tools" }, timer(b.seconds), h("span", { class: "muted small" }, "thời gian đọc như thi thật")) : null);

  /* Rows of words that sound alike; click a word to hear it. */
  B.sounds = (b) => h("div", { class: "sounds" }, b.rows.map((r) => h("div", { class: "sound-row" },
    r.map((w) => h("button", { type: "button", class: "chip", onclick: () => Speech.say(w) }, w)))));

  B.photo = (b) => h("figure", { class: "figure" }, img(b.img), b.caption ? h("figcaption", { html: b.caption }) : null);

  B.timer = (b) => h("div", { class: "timer-row" }, timer(b.seconds), b.label ? h("span", { class: "muted" }, b.label) : null);

  /* Vocabulary cards: word, IPA, pronunciation, meaning, example. */
  B.vocab = (b) => {
    const grid = h("div", { class: "vocab" });
    const hideBtn = btn("Ẩn nghĩa (tự kiểm tra)", () => {
      grid.classList.toggle("quiz");
      hideBtn.textContent = grid.classList.contains("quiz") ? "Hiện nghĩa" : "Ẩn nghĩa (tự kiểm tra)";
    }, "btn small ghost");
    for (const w of b.items) {
      grid.append(h("article", { class: "card" + (w.img ? "" : " no-img"), onclick: (e) => {
        if (grid.classList.contains("quiz") && !e.target.closest("button")) e.currentTarget.classList.toggle("open");
      } },
        w.img ? img(w.img, "photo card-img") : null,
        h("div", { class: "card-body" },
          h("div", { class: "card-head" }, h("span", { class: "word" }, w.word), sayBtns(w.say || w.word)),
          h("div", { class: "ipa" }, w.ipa, w.pos ? h("span", { class: "pos" }, w.pos) : null),
          h("div", { class: "mean", lang: "vi" }, w.vi),
          w.ex ? h("div", { class: "ex" }, h("span", { html: w.ex }), btn("🔊", () => Speech.say(w.ex.replace(/<[^>]+>/g, "")), "icon-btn tiny", "Nghe câu ví dụ")) : null)));
    }
    return h("div", {}, h("div", { class: "row-end" }, hideBtn), grid);
  };

  /* Listen to a word (TTS) and pick its picture or meaning. */
  B.listenPick = (b) => {
    const pool = L.vocabIndex;
    const sc = scoreLine();
    let ok = 0, done = 0;
    const qs = b.words.map((word, i) => {
      const w = pool[word];
      const others = shuffle(Object.values(pool).filter((x) => x.word !== word && (b.by !== "img" || x.img))).slice(0, 3);
      const opts = shuffle([w, ...others]);
      const opEls = opts.map((o) => {
        const content = b.by === "img" ? img(o.img, "photo no-zoom") : h("span", { lang: "vi" }, o.vi);
        return h("button", { type: "button", class: "pick" + (b.by === "img" ? " pick-img" : ""), onclick: (e) => {
          const q = e.currentTarget.parentElement;
          if (q.dataset.done) return;
          q.dataset.done = 1;
          done++;
          const right = o.word === word;
          if (right) ok++;
          e.currentTarget.classList.add(right ? "ok" : "bad");
          $$(".pick", q)[opts.indexOf(w)].classList.add("ok");
          q.parentElement.append(h("span", { class: "reveal" }, w.word + " " + w.ipa));
          if (done === b.words.length) sc.set(ok, done);
        } }, content);
      });
      return h("div", { class: "lp-q" }, h("div", { class: "lp-head" }, h("b", {}, i + 1 + "."), btn("🔊 Nghe", () => Speech.say(w.say || word), "btn small"), btn("🐢", () => Speech.say(w.say || word, true), "icon-btn")),
        h("div", { class: "lp-opts" + (b.by === "img" ? " imgs" : "") }, opEls));
    });
    return h("div", { class: "listen-pick" }, qs, sc.el);
  };

  /* A photo with statements (A)–(D). Modes for statement text: show | after | hidden. */
  function photoQ(q, pl, opts = {}) {
    const mode = q.text || opts.text || "after";
    const el = h("div", { class: "pq" + (q.img ? "" : " no-img") });
    const choices = h("div", { class: "pq-opts" });
    const analysis = h("div", { class: "pq-why", hidden: true });
    let answered = false;
    const optEls = q.options.map((o, i) => {
      const txt = h("span", { class: "pq-text" + (mode === "show" ? "" : " masked") }, o.t);
      const b = h("button", { type: "button", class: "pq-opt", onclick: () => choose(i) },
        h("span", { class: "pq-letter" }, "(" + LETTERS[i] + ")"), txt);
      return h("div", { class: "pq-row" }, b, clipBtn(pl, o.seg));
    });
    choices.append(...optEls);
    function reveal() {
      $$(".pq-text", el).forEach((t) => t.classList.remove("masked"));
      analysis.hidden = false;
    }
    let picked = -1;
    function grade() {
      answered = true;
      el.classList.add("answered");
      q.options.forEach((o, j) => {
        const b = optEls[j].firstChild;
        b.classList.remove("sel");
        if (o.ok) b.classList.add("ok");
        else if (j === picked) b.classList.add("bad");
      });
    }
    function choose(i) {
      if (answered) return;
      picked = i;
      if (opts.deferred) {
        // Test mode: mark the choice only; grading happens on submit.
        optEls.forEach((r, j) => r.firstChild.classList.toggle("sel", j === i));
        el.classList.add("picked");
        return;
      }
      grade();
      if (mode !== "hidden") reveal();
      if (opts.onAnswer) opts.onAnswer(Boolean(q.options[i].ok));
    }
    for (const [i, o] of q.options.entries()) {
      if (o.why) analysis.append(h("p", { class: o.ok ? "why why-ok" : "why why-bad" }, h("b", {}, (o.ok ? "✓ " : "✗ ") + "(" + LETTERS[i] + ") "), h("span", { html: o.why })));
    }
    if (q.note) analysis.append(h("p", { class: "why note", html: q.note }));
    if (q.img) el.append(h("div", { class: "pq-img" }, img(q.img)));
    el.append(
      h("div", { class: "pq-side" },
        q.n ? h("div", { class: "pq-n" }, q.n, q.seg ? clipBtn(pl, q.seg, ("▶ Nghe câu " + q.n.replace(/\D/g, "")).trim(), "Nghe lại cả câu hỏi") : null) : null,
        q.ask ? h("div", { class: "pq-ask pq-text" + (mode === "show" ? "" : " masked") }, q.ask) : null,
        q.objects ? objects(q.objects) : null,
        choices, analysis,
        q.marks ? markWords(q, el) : null,
        q.classify ? classify(q) : null));
    el.reveal = reveal;
    el.grade = grade;
    el.picked = () => picked >= 0;
    el.isRight = () => picked >= 0 && Boolean(q.options[picked].ok);
    return el;
  }

  /* "Circle the words for the objects you see". */
  function objects(list, label = "Chọn các đồ vật có trong ảnh:") {
    const sc = scoreLine();
    const chips = list.map((o) => h("button", { type: "button", class: "chip", onclick: (e) => e.currentTarget.classList.toggle("on") }, o.w));
    const check = btn("Kiểm tra", () => {
      let ok = 0;
      list.forEach((o, i) => {
        const on = chips[i].classList.contains("on");
        chips[i].classList.remove("ok", "bad", "miss");
        if (on === Boolean(o.ok)) ok++;
        chips[i].classList.add(on && o.ok ? "ok" : on && !o.ok ? "bad" : !on && o.ok ? "miss" : "neutral");
      });
      sc.set(ok, list.length);
    }, "btn small");
    return h("div", { class: "objects" }, h("p", { class: "muted small" }, label), h("div", { class: "chips" }, chips), check, sc.el);
  }

  /* After answering: click the similar-sounding words in the wrong options. */
  function markWords(q, root) {
    const want = new Set(q.marks.map(norm));
    const wrap = h("div", { class: "marks" },
      h("p", { class: "muted small" }, "Bấm vào các từ “nghe giống” (bẫy) trong các câu sai, rồi kiểm tra:"));
    const sc = scoreLine();
    let built = false;
    const go = btn("Đánh dấu từ", () => {
      if (built) return;
      built = true;
      root.querySelectorAll(".pq-text").forEach((t) => {
        t.classList.remove("masked");
        const words = t.textContent.split(/(\s+)/);
        t.textContent = "";
        words.forEach((w) => t.append(/\s+/.test(w) ? w : h("span", { class: "mw", onclick: (e) => { e.stopPropagation(); e.currentTarget.classList.toggle("on"); } }, w)));
      });
      go.replaceWith(check);
    }, "btn small ghost");
    const check = btn("Kiểm tra", () => {
      let hit = 0, wrong = 0;
      $$(".mw", root).forEach((m) => {
        const on = m.classList.contains("on"), yes = want.has(norm(m.textContent));
        m.classList.remove("ok", "bad", "miss");
        if (on && yes) { hit++; m.classList.add("ok"); } else if (on) { wrong++; m.classList.add("bad"); } else if (yes) m.classList.add("miss");
      });
      sc.set(hit, want.size, wrong ? `, ${wrong} từ chọn thừa` : "");
    }, "btn small");
    wrap.append(go, sc.el);
    return wrap;
  }

  /* After answering: name the problem in each wrong option. */
  function classify(q) {
    const sc = scoreLine();
    const rows = q.options.map((o, i) => o.ok ? null : {
      i, o, sel: h("select", { class: "sel" }, h("option", { value: "" }, "— chọn lỗi —"), q.classify.map((c) => h("option", { value: c }, c))),
    }).filter(Boolean);
    const check = btn("Kiểm tra", () => {
      let ok = 0;
      rows.forEach((r) => {
        const good = r.sel.value === r.o.kind;
        if (good) ok++;
        r.sel.classList.toggle("ok", good);
        r.sel.classList.toggle("bad", !good);
        r.sel.title = good ? "" : "Đáp án: " + r.o.kind;
      });
      sc.set(ok, rows.length);
      if (ok < rows.length) rows.forEach((r) => {
        if (r.sel.value !== r.o.kind && !r.sel.nextSibling) r.sel.after(h("span", { class: "fix" }, " → " + r.o.kind));
      });
    }, "btn small");
    return h("div", { class: "classify" }, h("p", { class: "muted small" }, "Mỗi câu sai mắc lỗi gì?"),
      rows.map((r) => h("div", { class: "cl-row" }, h("b", {}, "(" + LETTERS[r.i] + ") "), h("span", {}, r.o.t + " "), r.sel)), check, sc.el);
  }

  /* Choose several right items in each list. */
  B.pick = (b) => h("div", { class: "pick-block" }, b.items.map((it) =>
    h("div", { class: "pick-q" }, h("p", { class: "pick-title", html: it.q }), objects(it.list, it.label || b.label || "Chọn các câu đúng:"))));

  B.photoMCQ = (b) => {
    const pl = player(b.track);
    const sc = scoreLine();
    let ok = 0, n = 0;
    const qs = b.items.map((q) => photoQ(q, pl, { text: b.text, onAnswer: (r) => { n++; if (r) ok++; if (n === b.items.length && b.items.length > 1) sc.set(ok, n); } }));
    return h("div", { class: "mcq" }, b.track ? h("div", { class: "sticky-player" }, pl.el) : null, qs, sc.el);
  };

  /* Fill the gaps: free text, a shared word bank, or choices per item (it.opts).
     An item may have several ___ blanks; then it.a is a list of answer lists.
     b.exact compares case and punctuation too (for capitalisation tasks). */
  const exactNorm = (s) => String(s).replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
  B.gaps = (b) => {
    const sc = scoreLine();
    const fields = [];
    const pl = b.track ? player(b.track) : null;
    const same = (a, v) => (b.exact ? exactNorm(a) === exactNorm(v) : norm(a) === norm(v));
    const groups = b.groups.map((g) => h("div", { class: "gap-group" + (g.img ? "" : " no-img") },
      g.img ? h("div", { class: "gap-img" }, img(g.img)) : null,
      h("ol", { class: "gap-list", start: g.start || 1 }, g.items.map((it) => {
        const parts = it.q.split("___");
        const n = parts.length - 1;
        const answers = n > 1 ? it.a : [it.a];
        const li = h("li", {}, pl && it.seg ? clipBtn(pl, it.seg, "▶", "Nghe câu này") : null, h("span", { html: parts[0] }));
        for (let k = 0; k < n; k++) {
          const choices = it.opts ? (n > 1 ? it.opts[k] : it.opts) : b.bank;
          const input = choices
            ? h("select", { class: "sel" }, h("option", { value: "" }, "…"), choices.map((w) => h("option", { value: w }, w)))
            : h("input", { class: "gap-in" + (it.wide ? " wide" : ""), type: "text", autocomplete: "off", spellcheck: "false", size: it.size || 10, "aria-label": "answer" });
          fields.push({ input, a: answers[k] });
          li.append(input, h("span", { html: parts[k + 1] || "" }));
        }
        if (it.hint) li.append(h("span", { class: "hint" }, " " + it.hint));
        li.dataset.ans = answers.map((a) => a.join(" / ")).join(" · ");
        return li;
      }))));
    const check = btn("Kiểm tra", () => {
      let ok = 0;
      fields.forEach(({ input, a }) => {
        const good = a.some((x) => same(x, input.value));
        if (good) ok++;
        input.classList.toggle("ok", good);
        input.classList.toggle("bad", !good);
      });
      sc.set(ok, fields.length);
    }, "btn");
    const show = btn("Xem đáp án", () => {
      $$(".gap-list > li", wrap).forEach((li) => {
        if (!$(".ans", li)) li.append(h("span", { class: "ans" }, " ✓ " + li.dataset.ans));
      });
    }, "btn ghost");
    const wrap = h("div", { class: "gaps" }, pl ? h("div", { class: "sticky-player" }, pl.el) : null, b.bank ? h("div", { class: "bank" }, b.bank.map((w) => h("span", { class: "chip static" }, w))) : null,
      groups, h("div", { class: "actions" }, check, show, sc.el));
    return wrap;
  };

  /* Put items in order: click them in the order you think is right. */
  B.order = (b) => {
    const pl = b.track ? player(b.track) : null;
    const sc = scoreLine();
    let picked = [];
    const rows = b.items.map((t, i) => {
      const num = h("span", { class: "ord-n" }, "");
      const row = h("button", { type: "button", class: "ord", onclick: () => {
        if (wrap.dataset.done) return;
        const at = picked.indexOf(i);
        if (at >= 0) picked.splice(at, 1); else picked.push(i);
        paint();
      } }, num, h("span", { html: t }));
      return { row, num };
    });
    function paint() {
      rows.forEach((r, i) => {
        const at = picked.indexOf(i);
        r.num.textContent = at >= 0 ? at + 1 : "";
        r.row.classList.toggle("on", at >= 0);
      });
    }
    const check = btn("Kiểm tra", () => {
      if (picked.length < b.items.length) return toast("Hãy đánh số hết các dòng trước");
      let ok = 0;
      rows.forEach((r, i) => {
        const good = picked.indexOf(i) + 1 === b.answer[i];
        if (good) ok++;
        r.row.classList.toggle("ok", good);
        r.row.classList.toggle("bad", !good);
        if (!good) r.num.textContent = picked.indexOf(i) + 1 + "→" + b.answer[i];
      });
      wrap.dataset.done = 1;
      sc.set(ok, rows.length);
    }, "btn");
    const reset = btn("Làm lại", () => {
      picked = [];
      delete wrap.dataset.done;
      rows.forEach((r) => r.row.classList.remove("ok", "bad"));
      paint();
      sc.el.hidden = true;
    }, "btn ghost");
    const wrap = h("div", { class: "order" }, pl ? h("div", { class: "sticky-player" }, pl.el) : null,
      b.img ? h("div", { class: "order-img" }, img(b.img)) : null,
      h("p", { class: "muted small" }, "Bấm lần lượt theo thứ tự đúng (bấm lại để bỏ chọn)."),
      h("div", { class: "ord-list" }, rows.map((r) => r.row)), h("div", { class: "actions" }, check, reset, sc.el));
    return wrap;
  };

  /* Recording of the book + its script, hidden until asked. */
  B.transcript = (b) => {
    const pl = player(b.track);
    const clip = b.seg && pl.ok ? btn(b.segLabel || "▶ Nghe đoạn này", () => pl.clip(b.seg[0], b.seg[1]), "btn small") : null;
    const box = h("div", { class: "script", hidden: !b.open, html: b.html });
    return h("div", { class: "transcript" }, h("div", { class: "row" }, pl.el), clip,
      btn(b.open ? "Ẩn lời" : "📄 Hiện lời (script)", (e) => {
        box.hidden = !box.hidden;
        e.currentTarget.textContent = box.hidden ? "📄 Hiện lời (script)" : "Ẩn lời";
      }, "btn small ghost"), box);
  };

  /* Write one sentence about a photo with the two given words (TOEIC Writing Q1-5). */
  const IRREG = { sit: ["sat"], eat: ["ate", "eaten"], hang: ["hung"], hold: ["held"], take: ["took", "taken"], buy: ["bought"],
    wear: ["wore", "worn"], blow: ["blew", "blown"], stand: ["stood"], read: ["read"], put: ["put"], cut: ["cut"],
    write: ["wrote", "written"], make: ["made"], go: ["went", "gone"], run: ["ran"], fit: ["fit", "fitted"], kick: [], bring: ["brought"] };
  function forms(w) {
    w = w.toLowerCase();
    const f = new Set([w, w + "s", w + "es", w + "ed", w + "d", w + "ing", w + "er", w + "ly"]);
    if (w.endsWith("e")) { f.add(w.slice(0, -1) + "ing"); f.add(w + "d"); }
    if (w.endsWith("y")) { f.add(w.slice(0, -1) + "ies"); f.add(w.slice(0, -1) + "ied"); f.add(w.slice(0, -1) + "ier"); }
    if (/[^aeiou][aeiou][bdgklmnprt]$/.test(w)) { const c = w.slice(-1); f.add(w + c + "ing"); f.add(w + c + "ed"); f.add(w + c + "er"); }
    if (w.endsWith("f")) f.add(w.slice(0, -1) + "ves");
    (IRREG[w] || []).forEach((x) => f.add(x));
    return f;
  }
  function uses(sentence, word) {
    const text = " " + norm(sentence).replace(/[/-]/g, " ") + " ";
    if (word.includes(" ")) return text.includes(" " + norm(word) + " ");
    const fs = forms(word);
    return text.split(" ").some((t) => fs.has(t));
  }
  B.write = (b) => {
    const items = b.items.map((it, i) => {
      const box = h("textarea", { class: "write-in", rows: 2, spellcheck: "false", placeholder: "Write one sentence…" });
      const res = h("ul", { class: "write-res" });
      const sample = h("div", { class: "write-sample", hidden: true }, h("b", {}, "Sample: "), (it.sample || []).map((x) => h("div", { html: x })));
      const check = () => {
        const v = box.value.trim();
        res.textContent = "";
        if (!v) return;
        const rows = it.words.map((w) => [uses(v, w), `uses “${w}”`]);
        rows.push([/^[A-Z]/.test(v), "starts with a capital letter"]);
        rows.push([/[.!]$/.test(v), "ends with a period (.)"]);
        rows.push([(v.match(/[.!?](\s|$)/g) || []).length <= 1, "only one sentence"]);
        rows.forEach(([ok, t]) => res.append(h("li", { class: ok ? "yes" : "no" }, (ok ? "✓ " : "✗ ") + t)));
        res.append(h("li", { class: "self" }, "? Tự kiểm tra: đúng ngữ pháp và đúng với ảnh?"));
      };
      box.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); check(); } });
      return h("div", { class: "write-q" + (it.img ? "" : " no-img") },
        it.img ? h("div", { class: "write-img" }, img(it.img)) : null,
        h("div", { class: "write-side" },
          h("div", { class: "write-head" }, b.items.length > 1 ? h("b", {}, (it.n || i + 1) + ". ") : null,
            h("span", { class: "pair" }, it.words.join(" / "))),
          it.hint ? h("p", { class: "muted small", html: it.hint }) : null,
          box, h("div", { class: "actions" }, btn("Kiểm tra", check, "btn small"),
            it.sample ? btn("Câu mẫu", () => { sample.hidden = !sample.hidden; }, "btn small ghost") : null),
          res, sample));
    });
    return h("div", { class: "write" }, b.seconds ? h("div", { class: "timer-row" }, timer(b.seconds), h("span", { class: "muted small" }, "thời gian làm bài như thi thật")) : null, items);
  };

  /* Hear one statement, pick the word you heard. */
  B.hear = (b) => {
    const pl = player(b.track);
    const sc = scoreLine();
    let ok = 0, n = 0;
    const rows = b.items.map((it, i) => {
      const opts = it.pair.map((w) => h("button", { type: "button", class: "chip big", onclick: (e) => {
        const row = e.currentTarget.parentElement;
        if (row.dataset.done) return;
        row.dataset.done = 1;
        n++;
        const good = w === it.a;
        if (good) ok++;
        e.currentTarget.classList.add(good ? "ok" : "bad");
        $$(".chip", row).forEach((c) => { if (c.textContent === it.a) c.classList.add("ok"); });
        row.append(h("span", { class: "reveal" }, "“" + it.s + "”"));
        if (n === b.items.length) sc.set(ok, n);
      } }, w));
      return h("div", { class: "hear-row" }, h("b", {}, i + 1 + "."), clipBtn(pl, it.seg, "▶", "Nghe câu " + (i + 1)), opts);
    });
    return h("div", { class: "hear" }, h("div", { class: "sticky-player" }, pl.el), rows, sc.el);
  };

  /* Dictation with the real recording: type what you hear. */
  const EXPAND = { "they're": "they are", "there's": "there is", "he's": "he is", "she's": "she is", "it's": "it is", "we're": "we are", "you're": "you are", "i'm": "i am", "isn't": "is not", "aren't": "are not", "don't": "do not", "can't": "can not", "cannot": "can not", "what's": "what is", "that's": "that is" };
  const toks = (s) => norm(s).replace(/[/-]/g, " ").split(" ").filter(Boolean);
  const expand = (t) => (EXPAND[t] || t).split(" ");
  function diff(target, typed) {
    const T = toks(target).map((w) => ({ w, sub: expand(w) }));
    const flatT = [];
    T.forEach((t, i) => t.sub.forEach((s) => flatT.push({ s, i })));
    const U = toks(typed).flatMap(expand);
    const n = flatT.length, m = U.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      dp[i][j] = flatT[i].s === U[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const hit = new Set(), extra = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (flatT[i].s === U[j]) { hit.add(i); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else { extra.push(U[j]); j++; }
    }
    while (j < m) extra.push(U[j++]);
    const okWord = T.map((t, k) => flatT.every((f, idx) => f.i !== k || hit.has(idx)));
    const original = target.split(/\s+/);
    return { words: original.map((w, k) => ({ w, ok: okWord[k] })), extra, score: hit.size / n };
  }
  B.dictation = (b) => {
    const pl = player(b.track);
    const items = b.items.map((it, i) => {
      const box = h("input", { class: "dict-in", type: "text", autocomplete: "off", spellcheck: "false", placeholder: "Gõ lại câu bạn nghe được…" });
      const res = h("div", { class: "dict-res" });
      let tries = 0;
      const check = () => {
        if (!box.value.trim()) return;
        tries++;
        const d = diff(it.text, box.value);
        res.textContent = "";
        res.append(...d.words.map((w) => h("span", { class: w.ok ? "w ok" : "w miss" }, w.w)), " ");
        if (d.extra.length) res.append(h("span", { class: "w extra" }, "thừa: " + d.extra.join(" ")));
        if (d.score === 1 && !d.extra.length) res.append(h("span", { class: "tag good" }, tries === 1 ? "Chuẩn ngay lần đầu!" : "Chuẩn!"));
        if (it.note) res.append(h("div", { class: "muted small", html: it.note }));
      };
      box.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
      return h("div", { class: "dict" }, h("div", { class: "dict-head" }, h("b", {}, i + 1 + "."),
        clipBtn(pl, it.seg, "▶ Nghe", "Nghe câu"), it.seg && pl.ok ? btn("🐢 0.75×", () => pl.clip(it.seg[0], it.seg[1], 0.75), "icon-btn clip", "Nghe chậm") : null,
        h("span", { class: "muted small" }, it.from || "")),
        h("div", { class: "dict-line" }, box, btn("Kiểm tra", check, "btn small"), btn("Đáp án", () => { box.value = it.text; check(); }, "btn small ghost")), res);
    });
    return h("div", { class: "dictation" }, h("div", { class: "sticky-player" }, pl.el), items);
  };

  /* Shadowing: listen, say it at the same time, record and compare. */
  B.shadow = (b) => {
    const pl = player(b.track);
    return h("div", { class: "shadow" }, h("div", { class: "sticky-player" }, pl.el), b.items.map((it, i) =>
      h("div", { class: "sh" },
        h("div", { class: "sh-line" }, h("b", {}, i + 1 + "."), h("span", { class: "sh-text", html: it.marked || it.text })),
        it.note ? h("div", { class: "muted small", html: it.note }) : null,
        h("div", { class: "sh-tools" }, clipBtn(pl, it.seg, "▶ Gốc", "Nghe bản gốc"),
          it.seg && pl.ok ? btn("🐢 0.75×", () => pl.clip(it.seg[0], it.seg[1], 0.75), "icon-btn clip", "Nghe chậm") : null,
          recorder()))));
  };

  /* A speaking task with a countdown and an optional recorder.
     With b.prep: a test-style run, preparation time then response time (recording starts by itself). */
  function examRun(prep, speak, rec) {
    let id = 0, left = 0, phase = "";
    const fmt = (t) => Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
    const label = h("span", { class: "x-phase" }, "Preparation " + fmt(prep) + " · Response " + fmt(speak));
    const face = h("span", { class: "t-face" }, "");
    const stop = () => { clearInterval(id); id = 0; };
    function run(name, secs, next) {
      phase = name; left = secs;
      label.textContent = name === "prep" ? "Chuẩn bị (Preparation)" : "Nói (Response)";
      el.className = "exam " + name;
      face.textContent = fmt(left);
      id = setInterval(() => {
        left--;
        face.textContent = fmt(Math.max(left, 0));
        if (left <= 0) { stop(); beep(); next(); }
      }, 1000);
    }
    const go = btn("▶ Bắt đầu như thi thật", () => {
      stop();
      run("prep", prep, () => {
        if (rec) rec.begin();
        run("speak", speak, () => { if (rec) rec.end(); label.textContent = "Hết giờ: nghe lại bản ghi của bạn"; el.className = "exam done"; face.textContent = ""; });
      });
    }, "btn small");
    const reset = btn("↺", () => { stop(); if (rec) rec.end(); el.className = "exam"; face.textContent = ""; label.textContent = "Preparation " + fmt(prep) + " · Response " + fmt(speak); }, "btn small ghost", "Đặt lại");
    const el = h("span", { class: "exam" }, "⏱ ", label, face, go, reset);
    return el;
  }
  B.speak = (b) => {
    const rec = b.record ? recorder() : null;
    return h("div", { class: "speak" },
      b.prompt ? h("div", { class: "speak-prompt", html: b.prompt }) : null,
      b.img ? h("div", { class: "speak-img" }, img(b.img)) : null,
      b.phrases ? h("div", { class: "phrases" }, h("span", { class: "muted small" }, "Useful language:"),
        b.phrases.map((p) => h("span", { class: "chip static", html: p }))) : null,
      h("div", { class: "speak-tools" }, b.prep ? examRun(b.prep, b.seconds, rec) : b.seconds ? timer(b.seconds) : null, rec),
      b.sample ? h("details", { class: "sample" }, h("summary", {}, "Sample response"), h("div", { html: b.sample })) : null);
  };

  /* A deck of prompts: draw a random card, answer before the timer ends. */
  B.deck = (b) => {
    let order = shuffle(b.cards), k = 0;
    const card = h("div", { class: "deck-card" });
    const count = h("span", { class: "muted small" });
    const t = timer(b.seconds || 10);
    function next() {
      if (k >= order.length) { order = shuffle(b.cards); k = 0; }
      const c = order[k++];
      card.textContent = "";
      if (typeof c === "string") card.append(h("div", { class: "deck-text", html: c }));
      else {
        card.append(h("div", { class: "deck-tag" }, c.tag || ""), h("div", { class: "deck-text", html: c.t }));
        if (c.hint) card.append(h("div", { class: "deck-hint muted small", html: c.hint }));
      }
      count.textContent = `Thẻ ${k}/${order.length}`;
    }
    next();
    return h("div", { class: "deck" }, card, h("div", { class: "actions" }, btn("Thẻ tiếp theo →", next, "btn"), t, count));
  };

  /* TOEIC Speaking Q4-6 style run: each question appears, beep, answer time; one recording. */
  B.survey = (b) => {
    const rec = recorder();
    const stage = h("div", { class: "survey-stage" }, h("p", { class: "muted" }, "Bấm Bắt đầu: từng câu hỏi hiện ra, có tiếng bíp, rồi bạn trả lời ngay (không có thời gian chuẩn bị)."));
    let id = 0;
    const fmt = (t) => Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
    function run(i) {
      if (i >= b.questions.length) {
        rec.end();
        stage.textContent = "";
        stage.append(h("p", { class: "survey-done" }, "Xong! Nghe lại bản ghi âm và tự chấm bằng checklist."));
        return;
      }
      const q = b.questions[i];
      let left = q.seconds;
      const face = h("span", { class: "survey-time" }, fmt(left));
      stage.textContent = "";
      stage.append(h("div", { class: "survey-q" }, h("b", {}, q.label || "Question " + (i + 4)), h("span", { html: " " + q.q })), face);
      beep();
      id = setInterval(() => {
        left--;
        face.textContent = fmt(Math.max(left, 0));
        face.classList.toggle("low", left <= 5);
        if (left <= 0) { clearInterval(id); run(i + 1); }
      }, 1000);
    }
    const go = btn("▶ Bắt đầu", () => { clearInterval(id); rec.begin(); setTimeout(() => run(0), 600); }, "btn");
    const stop = btn("■ Dừng bài", () => { clearInterval(id); rec.end(); }, "btn ghost");
    return h("div", { class: "survey" },
      b.prompt ? h("div", { class: "survey-prompt", html: b.prompt }) : null,
      b.show !== false ? h("ol", { class: "survey-list", start: 4 }, b.questions.map((q) => h("li", { html: q.q + ` <span class="muted small">(${q.seconds}s)</span>` }))) : null,
      stage, h("div", { class: "actions" }, go, stop, rec),
      b.sample ? h("details", { class: "sample" }, h("summary", {}, "Sample responses"), h("div", { html: b.sample })) : null);
  };

  /* Describe & guess: one partner sees a secret photo and describes it. */
  B.guess = (b) => {
    const wrap = h("div", { class: "guess" });
    const msg = h("p", { class: "guess-msg" });
    let round = 0;
    function newRound() {
      round++;
      wrap.textContent = "";
      const four = shuffle(b.photos).slice(0, 4);
      const secret = four[Math.floor(Math.random() * 4)];
      const grid = h("div", { class: "guess-grid" }, four.map((p) => h("button", { type: "button", class: "guess-tile", onclick: (e) => {
        if (grid.dataset.done) return;
        grid.dataset.done = 1;
        const right = p === secret;
        e.currentTarget.classList.add(right ? "ok" : "bad");
        $$(".guess-tile", grid)[four.indexOf(secret)].classList.add("ok");
        msg.textContent = right ? "Đoán đúng! Đổi vai và chơi tiếp." : "Chưa đúng. Ảnh bí mật được viền xanh. Đổi vai và chơi tiếp.";
      } }, img(p, "photo no-zoom"))));
      const show = btn("👀 Người mô tả: xem ảnh bí mật", () => {
        const ov = h("div", { class: "zoom secret" },
          h("div", { class: "secret-card" },
            h("p", {}, "Chỉ người mô tả được xem! Nhớ ảnh rồi bấm Ẩn."),
            img(secret, "photo no-zoom"),
            btn("Ẩn ảnh", () => ov.remove(), "btn")));
        document.body.appendChild(ov);
      }, "btn");
      msg.textContent = "Vòng " + round + ": Người đoán chọn 1 trong 4 ảnh sau khi nghe mô tả.";
      wrap.append(h("div", { class: "actions" }, show, timer(b.seconds || 60), btn("Vòng mới", newRound, "btn ghost")), grid, msg);
    }
    newRound();
    return wrap;
  };

  /* Two truths and a lie: a random photo for the speaker. */
  B.lie = (b) => {
    const wrap = h("div", { class: "lie" });
    let order = shuffle(b.photos), k = 0;
    const frame = h("div", { class: "lie-img" });
    function next() {
      frame.textContent = "";
      frame.append(img(order[k % order.length]));
      k++;
    }
    next();
    wrap.append(frame, h("div", { class: "actions" }, btn("Ảnh khác", next, "btn ghost"), timer(b.seconds || 45)));
    return wrap;
  };

  /* Mini test: the whole track once, answer sheet, then score and review. */
  B.test = (b) => {
    const pl = player(b.track, { note: "Nghe 1 lần, không dừng" });
    const qs = b.items.map((q) => photoQ(q, pl, { text: b.text || "hidden", deferred: true }));
    const sc = scoreLine();
    const submit = btn("Nộp bài", () => {
      const left = qs.filter((q) => !q.picked()).length;
      if (left && !confirm(`Còn ${left} câu chưa làm. Vẫn nộp?`)) return;
      sc.set(qs.filter((q) => q.isRight()).length, qs.length);
      qs.forEach((q) => { q.grade(); q.reveal(); });
      wrapper.classList.add("submitted");
      submit.disabled = true;
    }, "btn");
    const wrapper = h("div", { class: "test" }, h("div", { class: "sticky-player" }, pl.el), h("div", { class: "test-grid" }, qs), h("div", { class: "actions" }, submit, sc.el));
    return wrapper;
  };

  B.checklist = (b) => h("ul", { class: "checklist" }, b.items.map((t) => h("li", {}, h("label", {}, h("input", { type: "checkbox" }), h("span", { html: t })))));

  /* ======================================================================
     Pages
     ====================================================================== */
  function renderBlock(b) {
    const make = B[b.type];
    if (!make) return h("p", { class: "muted" }, "[unknown block " + b.type + "]");
    const body = make(b);
    if (!b.title && !b.vi && !b.task) return body;
    return h("div", { class: "block block-" + b.type },
      b.title ? h("h3", { class: "block-title", html: b.title }) : null,
      b.task ? h("p", { class: "task", html: b.task }) : null,
      viBox(b.vi), body);
  }

  async function showLesson(file) {
    app.textContent = "";
    app.append(h("p", { class: "loading" }, "Đang mở bài học…"));
    L = await V.json(file);
    L.vocabIndex = {};
    for (const s of L.sections) for (const b of s.blocks) if (b.type === "vocab") b.items.forEach((w) => { L.vocabIndex[w.word] = w; });
    players.forEach((p) => p.pause());
    players.clear();
    app.textContent = "";
    document.title = L.title + " · English Room";

    const nav = h("nav", { class: "toc", "aria-label": "Sections" }, L.sections.map((s, i) =>
      h("a", { href: "#" + s.id, class: "toc-item", onclick: (e) => { e.preventDefault(); document.getElementById(s.id).scrollIntoView({ behavior: "smooth" }); } },
        h("span", { class: "toc-n" }, i + 1), h("span", { class: "toc-t" }, s.short || s.title), h("span", { class: "toc-m" }, s.minutes + "′"))));

    const head = h("header", { class: "lesson-head" },
      h("p", { class: "kicker" }, "Lesson " + L.no + " · " + L.minutes + " minutes"),
      h("h1", {}, L.title),
      L.subtitle ? h("p", { class: "lead" }, L.subtitle) : null,
      L.book ? h("p", { class: "muted small", html: "📘 " + L.book }) : null,
      L.objectives ? h("div", { class: "objectives" }, h("h2", {}, "By the end of this lesson you can…"), h("ul", {}, L.objectives.map((o) => h("li", { html: o })))) : null,
      viBox(L.vi),
      L.howto ? h("aside", { class: "tip" }, h("strong", {}, "How to study together"), h("div", { html: L.howto })) : null);

    const sections = L.sections.map((s, i) => h("section", { class: "section", id: s.id },
      h("div", { class: "sec-head" },
        h("span", { class: "sec-n" }, String(i + 1).padStart(2, "0")),
        h("h2", {}, s.title),
        timer(s.minutes * 60, "timer sec-timer")),
      s.intro ? h("p", { class: "sec-intro", html: s.intro }) : null,
      viBox(s.vi),
      s.blocks.map(renderBlock)));

    app.append(h("div", { class: "lesson" }, nav, h("div", { class: "lesson-main" }, head, sections,
      h("footer", { class: "lesson-foot" }, h("a", { href: "#/" }, "← All lessons")))));

    // Highlight the section being read.
    const items = $$(".toc-item", nav);
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) items.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-40% 0px -55% 0px" });
    $$(".section", app).forEach((s) => io.observe(s));
    window.scrollTo(0, 0);
  }

  async function showList() {
    document.title = "English Room";
    const idx = await V.getIndex();
    app.textContent = "";
    app.append(h("div", { class: "home" },
      h("h1", {}, "English Room"),
      h("p", { class: "lead" }, "TOEIC Listening & Reading · Speaking & Writing · học chung 2 người"),
      h("div", { class: "lessons" }, idx.lessons.map((l) => h("a", { class: "lesson-card", href: "#/" + l.id },
        h("span", { class: "kicker" }, "Lesson " + l.no), h("strong", {}, l.title), l.subtitle ? h("span", { class: "muted small" }, l.subtitle) : null)))),
      V.has("curriculum.json") ? await curriculum() : null);
  }

  /* Which parts of the books each lesson has used, and what is planned next. */
  async function curriculum() {
    const c = await V.json("curriculum.json");
    const tag = (r) => r.used ? h("span", { class: "cur-tag used" }, "Lesson " + r.used)
      : r.plan ? h("span", { class: "cur-tag plan" }, "Dự kiến L" + r.plan) : h("span", { class: "cur-tag free" }, "chưa dùng");
    return h("section", { class: "curriculum" },
      h("h2", {}, "Lộ trình & nội dung đã dùng"),
      c.note ? h("p", { class: "muted small", html: c.note }) : null,
      c.books.map((bk) => h("div", { class: "block" },
        h("h3", { class: "block-title" }, bk.title),
        h("div", { class: "table-wrap" }, h("table", {},
          h("thead", {}, h("tr", {}, ["Phần", "Trang sách", "Audio", "Trạng thái"].map((x) => h("th", {}, x)))),
          h("tbody", {}, bk.units.map((u) => h("tr", {},
            h("td", { html: u.name + (u.details ? "<br><span class='muted small'>" + u.details + "</span>" : "") }),
            h("td", {}, u.pages || ""), h("td", {}, u.tracks || ""), h("td", {}, tag(u))))))))));
  }

  async function route() {
    const id = location.hash.replace(/^#\/?/, "");
    const idx = await V.getIndex();
    const l = idx.lessons.find((x) => x.id === id);
    if (l) await showLesson(l.file);
    else if (!id || !document.getElementById(id)) await showList();
  }

  function showLock() {
    app.textContent = "";
    const input = h("input", { class: "gate-input", type: "password", autocomplete: "off", "aria-label": "Password" });
    const msg = h("p", { class: "muted small" });
    const form = h("form", { class: "lock", onsubmit: async (e) => {
      e.preventDefault();
      msg.textContent = "…";
      if (await V.unlock(input.value)) { await V.resume(); start(); } else { msg.textContent = "Wrong password"; input.select(); }
    } }, h("label", { class: "muted small" }, "Password"), input, msg);
    app.append(form);
    input.focus();
  }

  function start() {
    window.addEventListener("hashchange", () => route().catch(fail));
    route().catch(fail);
  }
  function fail(e) {
    console.error(e);
    app.textContent = "";
    app.append(h("p", { class: "loading" }, "Không mở được bài học. Thử tải lại trang."));
  }

  /* ---------- Toolbar ---------- */
  const accentBtn = $("#t-accent");
  const paintAccent = () => { accentBtn.textContent = Speech.accent === "en-GB" ? "UK" : "US"; };
  paintAccent();
  accentBtn.addEventListener("click", () => {
    Speech.accent = Speech.accent === "en-US" ? "en-GB" : "en-US";
    setPref("accent", Speech.accent);
    Speech.pick();
    paintAccent();
    toast("Giọng phát âm: " + (Speech.accent === "en-GB" ? "Anh – Anh (UK)" : "Anh – Mỹ (US)") + (Speech.voice ? " · " + Speech.voice.name : ""));
  });
  $("#t-vi").addEventListener("click", () => {
    const on = document.body.classList.toggle("vi-all");
    $$(".vi").forEach((v) => { v.hidden = !on; });
    toast(on ? "Hiện tất cả giải thích tiếng Việt" : "Ẩn giải thích tiếng Việt");
  });
  $("#t-theme").addEventListener("click", () => {
    const t = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
  });
  $("#t-lock").addEventListener("click", () => { V.lock(); location.href = "../"; });

  if (!V.supported) {
    app.append(h("p", { class: "loading" }, "Trình duyệt này không hỗ trợ. Hãy mở bằng Chrome, Safari hoặc Edge (qua https)."));
  } else {
    V.resume().then((ok) => (ok ? start() : showLock()), showLock);
  }
})();
