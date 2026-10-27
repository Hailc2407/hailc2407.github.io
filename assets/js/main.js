/* ==========================================================================
   main.js: renders content.js into the page and wires up interactions.
   You should not need to edit this file to change text; use content.js.
   ========================================================================== */
(() => {
  "use strict";

  const S = window.SITE;
  const D = window.Diagrams;
  if (!S) {
    console.error("content.js did not load: window.SITE is missing.");
    return;
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pad2 = (n) => String(n).padStart(2, "0");
  const list = (items, fn) => (items || []).map(fn).join("");
  const has = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v);

  /* ---------- UI icons (24×24, stroked) ---------- */
  const ICONS = {
    mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6.5 9 6.5 9-6.5"/>',
    scholar: '<path d="M12 3 1.5 9 12 15l10.5-6z"/><path d="M5.5 11.3v4.6c0 1.6 2.9 3.1 6.5 3.1s6.5-1.5 6.5-3.1v-4.6"/>',
    orcid: '<circle cx="12" cy="12" r="9.5"/><path d="M8.5 10.5v6M8.5 7.6v.1M12 16.5v-6h2a3 3 0 0 1 0 6z"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    researchgate: '<rect x="2.5" y="2.5" width="19" height="19" rx="3"/><path d="M7.5 16.5v-9h2.6a2.3 2.3 0 0 1 0 4.6H7.5M10 12.1l2.6 4.4M17.5 9.4a2 2 0 0 0-3.6 1.2v3.2a2 2 0 0 0 3.6 1.2v-2h-1.5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chevron: '<path d="m6 15 6-6 6 6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>',
    eye: '<path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const icon = (name, size = 18) =>
    `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const LINKS = {
    scholar: ["Google Scholar", "scholar"],
    orcid: ["ORCID", "orcid"],
    github: ["GitHub", "github"],
    linkedin: ["LinkedIn", "linkedin"],
    researchgate: ["ResearchGate", "researchgate"],
  };

  /* ---------- Section registry (order = page order) ---------- */
  // `group` keeps a nav item highlighted while reading a section without its own item.
  const SECTIONS = [
    { id: "about", title: "About", nav: "About" },
    { id: "prospects", title: "Prospects", group: "about" },
    { id: "news", title: "News", nav: "News" },
    { id: "setbacks", title: "Setbacks", group: "news" },
    { id: "education", title: "Education", nav: "Education" },
    { id: "research", title: "Research", nav: "Research" },
    { id: "interests", title: "Research Interests", group: "research" },
    { id: "experience", title: "Experience", nav: "Experience" },
    { id: "honors", title: "Honors &amp; Awards", nav: "Honors" },
    { id: "skills", title: "Skills", group: "honors" },
    { id: "contact", title: "Contact", nav: "Contact" },
  ];

  const entry = (it) => `
    <li class="entry">
      <span class="entry-when">${it.when || ""}</span>
      <div>
        <div class="entry-title">${it.title}</div>
        ${it.org ? `<div class="entry-org">${it.org}</div>` : ""}
        ${it.desc ? `<div class="entry-desc">${it.desc}</div>` : ""}
      </div>
    </li>`;

  const RENDER = {
    about() {
      const a = S.about;
      if (!a) return "";
      const box = a.approach
        ? `<div class="approach reveal"><div class="approach-label">${a.approach.legend}</div>${list(a.approach.paragraphs, (p) => `<p>${p}</p>`)}</div>`
        : "";
      const metrics = has(a.glance)
        ? `<div class="metrics reveal">${list(a.glance, (g) => `<div class="metric"><div class="metric-value">${g.value}</div><div class="metric-label">${g.label}</div></div>`)}</div>`
        : "";
      return `<div class="prose reveal">${list(a.paragraphs, (p) => `<p>${p}</p>`)}</div>${box}${metrics}`;
    },

    prospects() {
      const p = S.prospects;
      return p && has(p.paragraphs) ? `<div class="prose reveal">${list(p.paragraphs, (t) => `<p>${t}</p>`)}</div>` : "";
    },

    news() {
      const items = (S.news && S.news.items) || [];
      if (!items.length) return "";
      const initial = S.news.initial || items.length;
      const extra = Math.max(0, items.length - initial);
      const rows = list(items, (it, i) => `
        <li class="news-item${it.key ? " is-key" : ""}"${i >= initial ? " hidden data-extra" : ""}>
          <span class="news-date">${it.date}</span>
          <div class="news-text">${it.text}</div>
        </li>`);
      const more = extra
        ? `<button class="more-btn" type="button" aria-expanded="false" data-more="${extra}">${icon("chevron", 15)}<span>Show more (${extra} more)</span></button>`
        : "";
      return `<div class="reveal"><ul class="news-list">${rows}</ul>${more}</div>`;
    },

    setbacks() {
      if (!has(S.setbacks)) return "";
      return `<ul class="news-list reveal">${list(S.setbacks, (it) => `
        <li class="news-item"><span class="news-date">${it.date}</span><div class="news-text">${it.text}</div></li>`)}</ul>`;
    },

    education() {
      const e = S.education;
      if (!e) return "";
      const t = e.thesis;
      const thesis = t ? `
        <article class="thesis reveal">
          <div class="eyebrow">${t.label}</div>
          <h3 class="thesis-title">${t.title}</h3>
          <dl class="kv">${list(t.rows, (r) => `<dt>${r[0]}</dt><dd${r[2] ? ` class="${r[2]}"` : ""}>${r[1]}</dd>`)}</dl>
        </article>` : "";
      const timeline = has(e.timeline) ? `
        <ol class="timeline reveal">${list(e.timeline, (it, i) => `
          <li class="tl">
            <span class="tl-date">${it.when}</span>
            <span class="tl-node${i === 0 ? " is-main" : ""}" aria-hidden="true"></span>
            <div class="tl-card">
              ${it.kind ? `<span class="tl-kind">${it.kind}</span>` : ""}
              <h3>${it.title}</h3>
              ${it.detail ? `<div class="sub">${it.detail}</div>` : ""}
              ${it.place ? `<div class="meta">${it.place}</div>` : ""}
              ${has(it.chips) ? `<div class="chips">${list(it.chips, (c) => `<span class="chip">${c}</span>`)}</div>` : ""}
            </div>
          </li>`)}
        </ol>` : "";
      return thesis + timeline;
    },

    research() {
      const r = S.research;
      if (!r || !has(r.items)) return "";
      let lastYear = null;
      const items = r.items.map((p, idx) => {
        const year = p.year !== lastYear ? `<div class="year reveal">${p.year}</div>` : "";
        lastYear = p.year;
        const diagram = p.diagram && D && D.method[p.diagram];
        const panelId = `method-${idx}`;
        const toggle = diagram
          ? `<button class="tag toggle" type="button" aria-expanded="true" aria-controls="${panelId}">Method ${icon("chevron", 12)}</button>`
          : "";
        const absId = `abstract-${idx}`;
        const absToggle = p.abstract
          ? `<button class="tag toggle alt" type="button" aria-expanded="false" aria-controls="${absId}">Abstract ${icon("chevron", 12)}</button>`
          : "";
        const tags = list(p.tags, (t) => `<span class="tag ${t.tone || "paper"}">${t.text}</span>`);
        const links = list(p.links, (l) => l.url
          ? `<a class="tag link" href="${l.url}" target="_blank" rel="noopener">${l.text}</a>`
          : `<span class="tag-note">[${l.text}]</span>`);
        return `${year}
          <article class="pub reveal">
            <h3 class="pub-title">${p.title}</h3>
            ${p.people ? `<div class="pub-people">${p.people}</div>` : ""}
            ${p.venue ? `<div class="pub-venue">${p.venue}</div>` : ""}
            ${has(p.keywords) ? `<div class="pub-kw"><b>Keywords:</b> ${p.keywords.join(", ")}</div>` : ""}
            ${p.msc ? `<div class="pub-kw"><b>MSC 2020:</b> ${p.msc}</div>` : ""}
            <div class="tags">${toggle}${absToggle}${tags}${links}</div>
            ${p.abstract ? `<div class="method is-closed" id="${absId}" inert><div class="method-inner"><p class="pub-abstract">${p.abstract}</p></div></div>` : ""}
            ${has(p.bullets) ? `<ul class="dash-list">${list(p.bullets, (b) => `<li>${b}</li>`)}</ul>` : ""}
            ${diagram ? `<div class="method" id="${panelId}"><div class="method-inner"><div class="method-card" data-diagram="${p.diagram}"></div></div></div>` : ""}
          </article>`;
      }).join("");
      return (r.note ? `<p class="research-note reveal">${r.note}</p>` : "") + items;
    },

    interests() {
      if (!has(S.interests)) return "";
      return list(S.interests, (it) => `
        <article class="interest reveal">
          <header class="interest-head">
            <div>
              ${it.kind ? `<span class="interest-kind ${it.kind.toLowerCase()}">${it.kind}</span>` : ""}
              <h3 class="interest-title">${it.title}</h3>
              <div class="interest-tags">${list(it.topics, (t) => `<span class="pill">${t}</span>`)}</div>
            </div>
            ${it.when ? `<span class="interest-when">${it.when}</span>` : ""}
          </header>
          <div class="interest-body">
            ${D ? D.flow(it.flow) : ""}
            ${has(it.bullets) ? `<ul class="dash-list">${list(it.bullets, (b) => `<li>${b}</li>`)}</ul>` : ""}
          </div>
        </article>`);
    },

    experience() {
      const groups = (S.experience || []).filter((g) => !g.hidden);
      if (!groups.length) return "";
      // a lone group needs no sub-heading
      return list(groups, (g) => `
        <div class="group reveal">
          ${groups.length > 1 ? `<h3 class="group-title">${g.group}</h3>` : ""}
          <ul class="entries">${list(g.items, entry)}</ul>
        </div>`);
    },

    honors() {
      return has(S.honors) ? `<ul class="entries reveal">${list(S.honors, entry)}</ul>` : "";
    },

    skills() {
      if (!has(S.skills)) return "";
      return `<div class="skills reveal">${list(S.skills, (s) => `
        <div class="skill-row">
          <div class="skill-name">${s.group}</div>
          <div class="chips">${list(s.items, (c) => `<span class="chip">${c}</span>`)}</div>
        </div>`)}</div>`;
    },

    contact() {
      const c = S.contact;
      if (!c) return "";
      const email = S.profile && S.profile.email;
      const cv = S.profile && S.profile.cv;
      const map = c.visitorMap && c.visitorMap.src
        ? `<div class="visitor-map reveal" data-provider="${c.visitorMap.provider || "mapmyvisitors"}" data-src="${c.visitorMap.src}"></div>`
        : "";
      return `
        <div class="contact-card reveal">
          <div class="contact-icon" aria-hidden="true">${icon("mail", 22)}</div>
          <div>
            <h3>${c.title}</h3>
            <p>${c.text}</p>
            <div class="contact-actions">
              ${email ? `<a class="btn primary" href="mailto:${email}">${icon("mail", 16)}${email}</a>` : ""}
              ${email ? `<button class="btn" type="button" data-copy="${email}">${icon("copy", 16)}Copy email</button>` : ""}
              ${cv ? `<button class="btn" type="button" data-cv>${icon("eye", 16)}View CV</button>` : ""}
            </div>
          </div>
        </div>${map}`;
    },
  };

  /* ---------- Static regions ---------- */
  function renderSidebar() {
    const p = S.profile;
    const links = [];
    if (p.email) links.push(`<a class="icon-btn" href="mailto:${p.email}" aria-label="Email" title="Email">${icon("mail")}</a>`);
    Object.entries(p.links || {}).forEach(([key, url]) => {
      if (url && LINKS[key]) {
        const [label, ic] = LINKS[key];
        links.push(`<a class="icon-btn" href="${url}" target="_blank" rel="noopener" aria-label="${label}" title="${label}">${icon(ic)}</a>`);
      }
    });
    const ring = p.ring
      ? `<svg class="avatar-ring" viewBox="0 0 240 240" aria-hidden="true"><defs><path id="ring-path" d="M120 120m-106 0a106 106 0 1 1 212 0a106 106 0 1 1-212 0"/></defs><text><textPath href="#ring-path" textLength="660" lengthAdjust="spacing">${p.ring}</textPath></text></svg>`
      : "";

    $("#profile").innerHTML = `
      <div class="avatar-wrap">
        <div class="avatar">
          <div class="avatar-fallback">${D ? D.monogram(p.initials || "") : ""}</div>
          ${p.photo ? `<img src="${p.photo}" alt="Portrait of ${p.name}" decoding="async" onerror="this.remove()">` : ""}
        </div>
        ${ring}
      </div>
      <h1 class="profile-name">${p.name}</h1>
      ${p.subtitle ? `<div class="profile-sub">${p.subtitle}</div>` : ""}
      ${has(p.affiliation) ? `<div class="profile-aff">${p.affiliation.join("<br>")}</div>` : ""}
      ${p.status ? `<div class="profile-status"><i class="live-dot" aria-hidden="true"></i>${p.status}</div>` : ""}
      ${links.length ? `<div class="profile-links">${links.join("")}</div>` : ""}
      ${p.email ? `<button class="email-line" type="button" data-copy="${p.email}" title="Copy email address">${p.email}${icon("copy", 13)}</button>` : ""}
      ${p.cv ? `<button class="btn-cv" type="button" data-cv>${icon("eye")}View CV</button>` : ""}
      <div class="profile-meta">
        ${p.location ? `<span>${icon("pin", 13)}${p.location}</span>` : ""}
        ${p.timezone ? `<span>${icon("clock", 13)}<time data-clock>--:--</time></span>` : ""}
      </div>`;
  }

  function renderHero() {
    const h = S.hero;
    if (!h) return;
    $("#top").innerHTML = `
      <canvas class="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-meta"><span>${h.left || ""}</span><span>${h.right || ""}</span></div>
      <div class="hero-loop" role="img" aria-label="${h.loop.map((c) => c.word).join(", ")}: a research loop">
        ${list(h.loop, (c, i) => `<div class="loop-card l${i + 1}" aria-hidden="true"><span class="word">${c.word}</span><span class="note">${c.note}</span></div>`)}
      </div>
      <div class="hero-foot">${h.footer || ""}</div>`;
  }

  function renderRibbon() {
    const eqs = S.equations;
    if (!has(eqs)) return "";
    const unit = eqs.map((e) => `<span class="eq">${e}</span><span class="sep">◦</span>`).join("");
    const motto = S.motto
      ? `<div class="ribbon-row motto">${Array.from({ length: 12 }, () => `<span>${S.motto}</span>`).join("")}</div>`
      : "";
    return `<div class="ribbon" aria-hidden="true"><div class="ribbon-row">${unit}${unit}</div>${motto}</div>`;
  }

  function renderSections() {
    const out = [];
    const rendered = new Set();
    const hidden = new Set(S.hiddenSections || []);
    const visible = SECTIONS
      .filter((sec) => !hidden.has(sec.id))
      .map((sec) => ({ sec, body: RENDER[sec.id] ? RENDER[sec.id]() : "" }))
      .filter((s) => s.body);
    visible.forEach(({ sec, body }, i) => {
      rendered.add(sec.id);
      out.push(`
        <section class="section" id="${sec.id}" aria-labelledby="${sec.id}-title">
          <header class="section-head reveal">
            <h2 class="section-title" id="${sec.id}-title">${(S.sectionTitles && S.sectionTitles[sec.id]) || sec.title}</h2>
            <span class="section-rule" aria-hidden="true"></span>
            <span class="section-num"><b>${pad2(i + 1)}</b> / ${pad2(visible.length)}</span>
          </header>
          ${body}
        </section>`);
      // the equation ribbon sits after the About / Prospects block
      if (sec.id === "prospects" || (sec.id === "about" && !has(S.prospects && S.prospects.paragraphs))) out.push(renderRibbon());
    });
    $("#sections").innerHTML = out.join("");
    $("#nav-links").innerHTML = SECTIONS
      .filter((s) => s.nav && rendered.has(s.id))
      .map((s) => `<a href="#${s.id}" data-target="${s.id}">${s.nav}</a>`)
      .join("");
  }

  function renderFooter() {
    const year = new Date().getFullYear();
    $("#footer").innerHTML = `
      <p>© ${year} ${S.profile.name}${S.meta && S.meta.lastUpdated ? ` · Last updated ${S.meta.lastUpdated}` : ""}</p>
      <p>Hanoi, Vietnam · <a href="#top">Back to top</a></p>`;
  }

  function mountDiagrams() {
    if (!D) return;
    $$(".method-card[data-diagram]").forEach((el) => {
      try {
        D.method[el.dataset.diagram](el);
      } catch (err) {
        console.error(`Diagram "${el.dataset.diagram}" failed`, err);
      }
    });
    const canvas = $(".hero-canvas");
    if (canvas) D.heroField(canvas);
    if ($(".hero-loop")) D.heroLoop($("#top"));
    D.syncSMIL();
  }

  /* ---------- Interactions ---------- */
  function initTheme() {
    const btn = $("#theme-toggle");
    const meta = $('meta[name="theme-color"]');
    const apply = (theme) => {
      document.documentElement.dataset.theme = theme;
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      if (meta) meta.content = theme === "dark" ? "#0b0e15" : "#ffffff";
      window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
    };
    apply(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
    });
  }

  function initMenu() {
    const header = $(".navbar");
    const btn = $("#menu-btn");
    const setOpen = (open) => {
      header.classList.toggle("nav-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    btn.addEventListener("click", () => setOpen(!header.classList.contains("nav-open")));
    $("#nav-links").addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    document.addEventListener("click", (e) => { if (!header.contains(e.target)) setOpen(false); });
  }

  function initScroll() {
    const bar = $(".progress");
    const toTop = $(".to-top");
    const links = $$("#nav-links a");
    const sections = SECTIONS.map((s) => ({ ...s, el: document.getElementById(s.id) })).filter((s) => s.el);
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      toTop.classList.toggle("is-visible", y > 700);

      const probe = y + window.innerHeight * 0.35;
      let current = null;
      sections.forEach((s) => { if (s.el.getBoundingClientRect().top + y <= probe) current = s; });
      if (max > 0 && y >= max - 2) current = sections[sections.length - 1];
      const active = current ? current.group || current.id : null;
      links.forEach((a) => {
        const on = a.dataset.target === active;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };

    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: motion.matches ? "auto" : "smooth" }));
  }

  // Counts the leading number of each metric up from zero (e.g. 3.89, 03, 1st).
  function countUp(root) {
    $$(".metric-value", root).forEach((el) => {
      const node = el.firstChild;
      const match = node && node.nodeType === 3 && node.nodeValue.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match) return;
      const [, num, rest] = match;
      const target = parseFloat(num);
      const decimals = (num.split(".")[1] || "").length;
      const width = num.length;
      const start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / 1100);
        const eased = 1 - Math.pow(1 - k, 3);
        node.nodeValue = (target * eased).toFixed(decimals).padStart(width, "0") + rest;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function initReveal() {
    if (motion.matches || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          if (e.target.classList.contains("metrics")) countUp(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  function initNewsToggle() {
    $$(".more-btn").forEach((btn) => btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      $$("[data-extra]", btn.parentElement).forEach((li) => { li.hidden = !open; });
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector("span").textContent = open ? "Show less" : `Show more (${btn.dataset.more} more)`;
    }));
  }

  function initMethodToggles() {
    $$(".tag.toggle[aria-controls]").forEach((btn) => btn.addEventListener("click", () => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-closed", !open);
      panel.inert = !open;
    }));
  }

  let toastTimer = 0;
  function toast(message) {
    const el = $(".toast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  function initCopy() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        toast("Email copied to clipboard");
      } catch (err) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;opacity:0;";
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
        ta.remove();
        toast(ok ? "Email copied to clipboard" : `Email: ${text}`);
      }
    });
  }

  function initClock() {
    const el = $("[data-clock]");
    if (!el) return;
    const tz = S.profile.timezone;
    let fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "shortOffset" });
    } catch (e) {
      try { fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }); } catch (e2) { return; }
    }
    const tick = () => {
      const parts = fmt.formatToParts(new Date());
      const get = (type) => (parts.find((p) => p.type === type) || {}).value || "";
      const zone = get("timeZoneName");
      el.textContent = `${get("hour")}:${get("minute")}${zone ? ` ${zone}` : ""}`;
      el.title = "Local time in " + (S.profile.location || tz);
    };
    tick();
    setInterval(tick, 20000);
  }

  function initVisitorMap() {
    const host = $(".visitor-map");
    if (!host) return;
    const script = document.createElement("script");
    script.id = host.dataset.provider;
    script.src = host.dataset.src;
    script.async = true;
    host.appendChild(script);
  }

  /* ---------- CV viewer ----------
     The PDF is drawn on the page with PDF.js (loaded on first use), so the CV
     opens in place; the viewer's bar has a button to download the file. */
  const PDFJS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  let pdfjsReady = null;

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (!pdfjsReady) {
      pdfjsReady = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = PDFJS_SRC;
        script.async = true;
        script.onload = () => {
          if (!window.pdfjsLib) { reject(new Error("PDF.js did not initialise")); return; }
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          resolve(window.pdfjsLib);
        };
        script.onerror = () => { pdfjsReady = null; reject(new Error("PDF.js failed to load")); };
        document.head.appendChild(script);
      });
    }
    return pdfjsReady;
  }

  function initCvViewer() {
    const url = S.profile && S.profile.cv;
    if (!url) return;

    const dialog = document.createElement("dialog");
    dialog.className = "cv-viewer";
    dialog.setAttribute("aria-label", `${S.profile.name}: curriculum vitae`);
    dialog.innerHTML = `
      <div class="cv-bar">
        <span class="cv-title">${S.profile.name} · CV</span>
        <div class="cv-actions">
          <a class="cv-download" href="${url}" download aria-label="Download CV" title="Download CV">${icon("download", 16)}<span>Download</span></a>
          <button class="cv-close" type="button" aria-label="Close CV">${icon("close")}</button>
        </div>
      </div>
      <div class="cv-pages"><p class="cv-status">Loading CV…</p></div>`;
    document.body.appendChild(dialog);

    const pages = dialog.querySelector(".cv-pages");
    let pdf = null, renderedWidth = 0, job = 0, opener = null;

    async function render() {
      const lib = await loadPdfJs();
      if (!pdf) pdf = await lib.getDocument(url).promise;
      const width = Math.min(pages.clientWidth - 32, 900);
      if (width <= 0 || (Math.abs(width - renderedWidth) < 2 && pages.querySelector("canvas"))) return;
      const myJob = ++job;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const frag = document.createDocumentFragment();
      const text = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * dpr });
        const canvas = document.createElement("canvas");
        canvas.className = "cv-page";
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `CV page ${i} of ${pdf.numPages}`);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        if (myJob !== job) return; // a newer render (resize) took over
        frag.appendChild(canvas);
        const content = await page.getTextContent();
        text.push(content.items.map((item) => item.str).join(" "));
      }
      const words = document.createElement("div");
      words.className = "visually-hidden";
      words.textContent = text.join("\n");
      frag.appendChild(words);
      pages.replaceChildren(frag);
      renderedWidth = width;
    }

    const fail = (err) => {
      console.warn("CV viewer:", err);
      pages.innerHTML = `<p class="cv-status">The CV viewer could not load. Please check your connection and try again.</p>`;
    };

    const open = () => {
      opener = document.activeElement;
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute("open", "");
      document.documentElement.classList.add("modal-open");
      render().catch(fail);
    };
    const close = () => {
      if (dialog.close) dialog.close();
      else { dialog.removeAttribute("open"); dialog.dispatchEvent(new Event("close")); }
    };

    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("modal-open");
      if (location.hash === "#cv") history.replaceState(null, "", location.pathname + location.search);
      if (opener && opener.focus) opener.focus();
    });
    dialog.querySelector(".cv-close").addEventListener("click", close);
    pages.addEventListener("click", (e) => { if (e.target === pages) close(); });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-cv]")) return;
      e.preventDefault();
      open();
    });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      if (!dialog.open) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => render().catch(fail), 200);
    });

    if (location.hash === "#cv") open();
  }

  // Content is rendered after the browser tried to jump to #hash, so jump again.
  function restoreHash() {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const go = () => target.scrollIntoView({ block: "start" });
    go();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  }

  /* ---------- Boot ---------- */
  renderSidebar();
  renderHero();
  renderSections();
  renderFooter();
  mountDiagrams();

  initTheme();
  initMenu();
  initScroll();
  initReveal();
  initNewsToggle();
  initMethodToggles();
  initCopy();
  initClock();
  initVisitorMap();
  initCvViewer();
  restoreHash();
})();
