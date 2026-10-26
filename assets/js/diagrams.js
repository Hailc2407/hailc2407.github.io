/* ==========================================================================
   diagrams.js: animated mathematical diagrams used by main.js
     Diagrams.monogram(initials)   avatar placeholder (until a photo exists)
     Diagrams.flow(nodes)          small icon pipelines (research interests)
     Diagrams.method[name](el)     research "Method" panels: fishery, svi
     Diagrams.heroField(canvas)    Hopf flow field behind the hero cards
   ========================================================================== */
(() => {
  "use strict";

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const strip = (s) => String(s).replace(/<[^>]*>/g, "");
  let counter = 0;
  const uid = () => `dg${++counter}`;

  // Calls start()/stop() so animations only run while `el` is on screen,
  // the tab is visible, and the visitor has not asked for reduced motion.
  function whenVisible(el, start, stop) {
    let onScreen = !("IntersectionObserver" in window);
    let running = false;
    const sync = () => {
      const want = onScreen && !document.hidden && !motion.matches;
      if (want && !running) { running = true; start(); }
      else if (!want && running) { running = false; stop(); }
    };
    if (!onScreen) {
      new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1].isIntersecting;
        sync();
      }, { rootMargin: "120px" }).observe(el);
    }
    document.addEventListener("visibilitychange", sync);
    if (motion.addEventListener) motion.addEventListener("change", sync);
    sync();
  }

  /* ---------- Icon set for flow nodes (32×32, stroked) ---------- */
  const glyph = (s, size = 18, y = 22, x = 16) =>
    `<text class="glyph" x="${x}" y="${y}" text-anchor="middle" font-size="${size}">${s}</text>`;

  const ICONS = {
    operator: glyph("B", 18, 22.5),
    projection: '<path class="soft" d="M5 25 8.5 9.5 20.5 6.5l4 12.5-9 8z"/><path d="M29 12 23.2 13.9" stroke-dasharray="1.8 2.2"/><circle class="dot" cx="29" cy="12" r="1.9"/><circle class="dot" cx="22.9" cy="14" r="2.3"/>',
    iterates: '<path d="M6 7 24 10 9 23 21 19 14.5 14.5" stroke-dasharray="1.8 2.4" opacity=".6"/><circle class="dot" cx="6" cy="7" r="1.7"/><circle class="dot" cx="24" cy="10" r="1.7"/><circle class="dot" cx="9" cy="23" r="1.7"/><circle class="dot" cx="21" cy="19" r="1.7"/><circle class="dot" cx="14.5" cy="14.5" r="2.7"/>',
    solution: '<circle cx="16" cy="16" r="9"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5"/><circle class="dot" cx="16" cy="16" r="3"/>',
    equilibrium: '<path d="M5 5l6 6M27 5l-6 6M5 27l6-6M27 27l-6-6"/><path d="M8 11h3V8M24 11h-3V8M8 21h3v3M24 21h-3v3"/><circle class="dot" cx="16" cy="16" r="3"/>',
    jacobian: '<path d="M10 6H6.5v20H10M22 6h3.5v20H22"/>' + glyph("J", 16, 21.5),
    eigen: '<path d="M3 16h26M16 3v26" opacity=".45"/><circle class="dot" cx="12" cy="9" r="2.3"/><circle class="dot" cx="12" cy="23" r="2.3"/><path d="M15.5 9h5.5M18.5 6.5 21 9l-2.5 2.5M15.5 23h5.5M18.5 20.5 21 23l-2.5 2.5"/>',
    cycle: '<circle cx="16" cy="16" r="10.5"/><circle cx="16" cy="16" r="2" stroke-dasharray="1.4 1.6"/><path d="M13.6 3.4 16.2 5.5l-2.6 2.1"/><circle class="dot" cx="26.5" cy="16" r="2.6"/>',
    fish: '<path d="M3.5 16c4-6.5 12-7.5 17.5-3 1.8-2.2 4-3.4 7.5-3.4-1.2 2.2-1.6 4.2-1.6 6.4s.4 4.2 1.6 6.4c-3.5 0-5.7-1.2-7.5-3.4-5.5 4.5-13.5 3.5-17.5-3z"/><circle class="dot" cx="9" cy="14.6" r="1.2"/>',
    assumptions: '<path d="M12 9.5h14M12 16h14M12 22.5h9"/><circle class="dot" cx="7" cy="9.5" r="1.6"/><circle class="dot" cx="7" cy="16" r="1.6"/><circle class="dot" cx="7" cy="22.5" r="1.6"/>',
    ode: glyph("x", 20, 23) + '<circle class="dot" cx="16.8" cy="8.3" r="1.6"/>',
    msy: '<path d="M5 4v23h23" opacity=".55"/><path d="M7 26C10 10 21 10 25 26"/><path d="M15.6 14v12" stroke-dasharray="1.6 2" opacity=".6"/><circle class="dot" cx="15.6" cy="14" r="2.3"/>',
    theorem: '<path d="M8 3.5h11l5 5v20H8z"/><path d="M19 3.5v5h5"/><path d="M11.5 18.5l3 3 6-7"/>',
    code: '<path d="M12 7.5c-2.6 0-3 1.6-3 3.6v1.6c0 1.4-.6 2.6-2.2 3.3 1.6.7 2.2 1.9 2.2 3.3v1.6c0 2 .4 3.6 3 3.6M20 7.5c2.6 0 3 1.6 3 3.6v1.6c0 1.4.6 2.6 2.2 3.3-1.6.7-2.2 1.9-2.2 3.3v1.6c0 2-.4 3.6-3 3.6"/>',
    simulate: '<path d="M3 16c2-10 4-10 6 0s3.5 7 5.5 0 3-5 5 0 3 3 4.5 0 2-2 3 0"/>',
    compare: '<path d="M4 18.5c4-9 8-9 12-2s8 7 12-2"/><path d="M4 22.5c4-9 8-9 12-2s8 7 12-2" stroke-dasharray="2 2.4" opacity=".55"/>',
    momentum: '<circle class="dot" cx="6" cy="25" r="2" opacity=".35"/><circle class="dot" cx="12.5" cy="19" r="2.3" opacity=".7"/><path d="M14.6 17 25 7.5M19.5 7h6v6"/>',
    tseng: '<path d="M3 25.5h26" opacity=".5"/><circle class="dot" cx="9" cy="6.5" r="2.2"/><path d="M9 9v12" stroke-dasharray="2 2"/><circle class="dot" cx="9" cy="23" r="2"/><path d="M11 21.5 22.5 13M17.5 12.3l5 .7-.7 5"/>',
    adjoint: '<rect x="2.5" y="8.5" width="9" height="15" rx="2.5"/><rect x="20.5" y="8.5" width="9" height="15" rx="2.5"/><path d="M20 16h-7.5M15.5 13l-3 3 3 3"/>' + glyph("*", 12, 8, 16),
    split: '<rect x="2.5" y="8.5" width="9" height="15" rx="2.5"/><rect x="20.5" y="8.5" width="9" height="15" rx="2.5"/><path d="M12 16h7.5M16.5 13l3 3-3 3"/>',
    step: glyph("λ", 18, 22, 12.5) + '<path d="M25 5v8M22.5 7.5 25 5l2.5 2.5M25 27v-8M22.5 24.5 25 27l2.5-2.5"/>',
    network: '<path d="M6 16 15 7M6 16l9 9M15 7l11 9M15 25l11-9M15 7v18" opacity=".75"/><circle class="dot" cx="6" cy="16" r="2.7"/><circle class="hole" cx="15" cy="7" r="2.3"/><circle class="hole" cx="15" cy="25" r="2.3"/><circle class="dot" cx="26" cy="16" r="2.7"/>',
    price: '<path d="M4 15.5V6a2 2 0 0 1 2-2h9.5L28 16.5 16.5 28z"/><circle cx="10" cy="10" r="2"/>',
    boat: '<path d="M3.5 20h25l-4.5 6.5H8z"/><path d="M15.5 20V4.5l9 11.5h-9"/>',
    net: '<path d="M5 6h22l-3 9a8 8 0 0 1-16 0z"/><path d="M7 11h18M9.5 17h13M12 6l2 16M20 6l-2 16M16 6v17"/>',
    mpa: '<circle cx="16" cy="16" r="11.5" stroke-dasharray="3 2.6"/><path d="M16 9.5c2.6 1.4 4.6 1.6 6 1.6 0 5.6-2.3 9-6 10.9-3.7-1.9-6-5.3-6-10.9 1.4 0 3.4-.2 6-1.6z"/>',
  };

  const icon = (name) => `<svg viewBox="0 0 32 32" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  /* ---------- Flow: icon → icon → icon with travelling dots ---------- */
  function flow(nodes, opts = {}) {
    if (!nodes || !nodes.length) return "";
    const parts = [];
    nodes.forEach((n, i) => {
      if (i) parts.push(`<span class="flow-arrow" style="--i:${i - 1}" aria-hidden="true"><i></i></span>`);
      parts.push(
        `<div class="flow-node ${n.tone || ""}"><div class="flow-icon">${icon(n.icon)}</div>` +
        `<div class="flow-text"><div class="flow-label">${n.label}</div>${n.sub ? `<div class="flow-sub">${n.sub}</div>` : ""}</div></div>`
      );
    });
    const label = nodes.map((n) => strip(n.label)).join(" → ");
    const cls = ["flow", nodes.length > 4 ? "long" : "", opts.cls || ""].join(" ").trim();
    return `<div class="${cls}" role="img" aria-label="${label}">${parts.join("")}</div>`;
  }

  /* ---------- Avatar placeholder ---------- */
  const spin = (dur, reverse) =>
    `<animateTransform attributeName="transform" type="rotate" from="${reverse ? 360 : 0} 100 100" to="${reverse ? 0 : 360} 100 100" dur="${dur}s" repeatCount="indefinite"/>`;

  function monogram(initials) {
    return `<svg class="monogram" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="orbit" cx="100" cy="100" r="76"/>
      <circle class="orbit dashed" cx="100" cy="100" r="56"/>
      <g><circle class="sat" cx="176" cy="100" r="5.5"/>${spin(16)}</g>
      <g><circle class="sat gold" cx="44" cy="100" r="4"/>${spin(11, true)}</g>
      <text x="100" y="116" text-anchor="middle">${initials}</text>
    </svg>`;
  }

  // Ellipse of the hero's limit cycle, in coordinates of a box w x h centred on the hero.
  // On wide screens it is narrowed so the orbiting cards stay inside the column.
  function heroGeometry(w, h, heroWidth) {
    const wide = heroWidth >= 640;
    return {
      cx: w / 2,
      cy: h / 2,
      sx: wide ? Math.min(heroWidth / 2 - 125, 430) : Math.min(w * 0.42, 430),
      sy: Math.min(h * 0.31, 250),
    };
  }

  /* ---------- Hero: particles in the Hopf normal form (mu = 1) ----------
     r' = r - r^3, theta' = omega: every orbit is drawn to the unit circle,
     stretched into an ellipse that wraps the card stack. */
  function heroField(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const OMEGA = 1.1;
    const DT = 0.0065;
    const TRAIL = 24;
    const parts = [];
    let w = 0, h = 0, cx = 0, cy = 0, sx = 1, sy = 1, raf = 0, colors = [];

    const readColors = () => { colors = [css("--coral"), css("--gold"), css("--faint")]; };
    const target = () => (w < 640 ? 90 : w < 1000 ? 150 : 210);

    function spawn(p, scatter) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() < 0.3 ? 0.05 + Math.random() * 0.55 : 1.2 + Math.random() * 1.2;
      p.x = r * Math.cos(a);
      p.y = r * Math.sin(a);
      p.trail = [];
      p.age = scatter ? Math.floor(Math.random() * 300) : 0;
      p.life = 320 + Math.random() * 380;
      p.c = Math.random() < 0.5 ? 2 : Math.random() < 0.55 ? 0 : 1;
      p.wid = 0.7 + Math.random() * 0.9;
      return p;
    }

    function advance(p) {
      const r2 = p.x * p.x + p.y * p.y;
      const dx = p.x - OMEGA * p.y - p.x * r2;
      const dy = OMEGA * p.x + p.y - p.y * r2;
      p.x += dx * DT;
      p.y += dy * DT;
      p.trail.push(p.x, p.y);
      if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2);
      if (++p.age > p.life) spawn(p, false);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const p of parts) {
        const t = p.trail;
        if (t.length < 4) continue;
        const life = p.age / p.life;
        const fade = Math.max(0, Math.min(1, life * 6, (1 - life) * 4));
        ctx.globalAlpha = fade * (p.c === 2 ? 0.3 : 0.5);
        ctx.strokeStyle = colors[p.c];
        ctx.lineWidth = p.wid;
        ctx.beginPath();
        ctx.moveTo(cx + t[0] * sx, cy + t[1] * sy);
        for (let i = 2; i < t.length; i += 2) ctx.lineTo(cx + t[i] * sx, cy + t[i + 1] * sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ({ cx, cy, sx, sy } = heroGeometry(w, h, canvas.parentElement.clientWidth));
      const n = target();
      while (parts.length < n) parts.push(spawn({}, true));
      parts.length = n;
      draw();
    }

    const loop = () => {
      for (const p of parts) advance(p);
      draw();
      raf = requestAnimationFrame(loop);
    };

    readColors();
    resize();
    for (let i = 0; i < 160; i++) parts.forEach(advance); // start with trails already flowing
    draw();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    window.addEventListener("themechange", () => { readColors(); draw(); });
    whenVisible(canvas, () => { raf = requestAnimationFrame(loop); }, () => cancelAnimationFrame(raf));
  }

  /* ---------- Hero: the research loop ----------
     Three cards ride the same limit cycle as the particles, clockwise like the
     flow, so Model -> Analyze -> Optimize -> Model reads in the direction of motion. */
  function heroLoop(hero) {
    const cards = Array.from(hero.querySelectorAll(".loop-card"));
    const canvas = hero.querySelector(".hero-canvas");
    if (!cards.length || !canvas) return;
    const PERIOD = 120000; // one revolution every two minutes
    let phase = 0, last = 0, raf = 0, paused = false, compact = false;
    let geo = null, sizes = [], tilt = { x: 0, y: 0 };

    function place() {
      if (compact || !geo) return;
      cards.forEach((card, i) => {
        const a = -Math.PI / 2 + phase + (i * 2 * Math.PI) / cards.length;
        const depth = (Math.sin(a) + 1) / 2; // 0 at the top of the orbit, 1 at the bottom
        const x = geo.cx + geo.sx * Math.cos(a) - sizes[i][0] / 2 + tilt.x * (0.4 + depth);
        const y = geo.cy + geo.sy * Math.sin(a) - sizes[i][1] / 2 + tilt.y * (0.4 + depth);
        card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.9 + 0.12 * depth).toFixed(3)})`;
        card.style.zIndex = String(10 + Math.round(depth * 10));
      });
    }

    function measure() {
      compact = hero.clientWidth < 640;
      hero.classList.toggle("is-compact", compact);
      if (compact) {
        cards.forEach((card) => { card.style.transform = ""; card.style.zIndex = ""; });
        return;
      }
      const c = canvas.getBoundingClientRect();
      const r = hero.getBoundingClientRect();
      const g = heroGeometry(c.width, c.height, hero.clientWidth);
      geo = { cx: g.cx + (c.left - r.left), cy: g.cy + (c.top - r.top), sx: g.sx, sy: g.sy };
      sizes = cards.map((card) => [card.offsetWidth, card.offsetHeight]);
      place();
    }

    const loop = (now) => {
      if (!last) last = now;
      if (!paused) phase += ((now - last) / PERIOD) * 2 * Math.PI;
      last = now;
      place();
      raf = requestAnimationFrame(loop);
    };

    hero.addEventListener("pointerover", (e) => { if (e.target.closest(".loop-card")) paused = true; });
    hero.addEventListener("pointerout", (e) => { if (e.target.closest(".loop-card")) paused = false; });
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect();
      tilt = { x: -((e.clientX - r.left) / r.width - 0.5) * 16, y: -((e.clientY - r.top) / r.height - 0.5) * 16 };
      if (motion.matches) place();
    });
    hero.addEventListener("pointerleave", () => { tilt = { x: 0, y: 0 }; });

    measure();
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(hero);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    hero.classList.add("loop-ready");
    whenVisible(hero, () => { last = 0; raf = requestAnimationFrame(loop); }, () => cancelAnimationFrame(raf));
  }

  /* ======================================================================
     Method panel 1: fishery with a rarity-dependent price (COSMOS project).
     Notation follows the manuscript: biomass N, effort E, price p(N) = a + b/N.
     ====================================================================== */
  function feedbackLoopSVG(id) {
    const cx = 220, cy = 108, rx = 150, ry = 70;
    const pt = (deg) => {
      const t = (deg * Math.PI) / 180;
      return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
    };
    const arc = (a, b) => {
      const [x1, y1] = pt(a);
      const [x2, y2] = pt(b);
      return `<path class="line-2" d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${rx} ${ry} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" marker-end="url(#${id}-ah)"/>`;
    };
    const ring = `M${cx} ${cy - ry} A${rx} ${ry} 0 1 1 ${cx} ${cy + ry} A${rx} ${ry} 0 1 1 ${cx} ${cy - ry}`;
    const dot = (cls, begin) =>
      `<circle class="${cls}" r="4"><animateMotion dur="10s" begin="${begin}s" repeatCount="indefinite" path="${ring}"/></circle>`;
    const node = ([x, y], w, name, sym) =>
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect class="box" x="${-w / 2}" y="-17" width="${w}" height="34" rx="10"/>` +
      `<text text-anchor="middle" y="4.5"><tspan class="t-strong">${name}</tspan>${sym ? ` <tspan class="math sm">${sym}</tspan>` : ""}</text></g>`;
    const note = (x, y, anchor, key, rest, tone) =>
      `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${tone}">${key}</text>` +
      `<text x="${x}" y="${y + 14}" text-anchor="${anchor}" class="t-faint">${rest}</text>`;

    return `<svg class="dg wide" viewBox="0 0 440 206" role="img" aria-label="Feedback loop: rarity raises the price, profit attracts fishing effort, effort raises the catch, and the catch depletes the biomass.">
      <defs><marker id="${id}-ah" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="fill-muted" d="M0 0 10 5 0 10z"/></marker></defs>
      <ellipse class="line dash-s" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" opacity=".6"/>
      ${arc(-62, -18)}${arc(18, 62)}${arc(118, 162)}${arc(198, 242)}
      ${dot("fill-coral", 0)}${dot("fill-gold", -3.33)}${dot("fill-paper", -6.67)}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="t-faint">price rises as biomass falls</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" class="math">p(N) = a + b/N</text>
      ${node(pt(-90), 108, "biomass", "N")}
      ${node(pt(0), 100, "price", "p(N)")}
      ${node(pt(90), 92, "effort", "E")}
      ${node(pt(180), 92, "catch", "")}
      ${note(322, 30, "start", "rarity", "raises price", "t-coral")}
      ${note(322, 178, "start", "profit", "attracts effort", "t-gold")}
      ${note(118, 178, "end", "effort", "raises catch", "t-gold")}
      ${note(118, 30, "end", "catch", "depletes biomass", "t-coral")}
    </svg>`;
  }

  // Saturated-catch open-access model without a reserve (Section 4 of the manuscript):
  //   N' = rN(1 - N/K) - qNE/(N + D),   E' = E[q(aN + b)/(N + D) - c]
  // with the parameter set of the manuscript's figures.
  const FP = { r: 1, K: 10, q: 1, a: 1, b: 0.5, D: 2 };
  const F_C0 = (FP.q * FP.b) / FP.D;                                          // interior equilibrium appears
  const F_C1 = (FP.q * (FP.a * FP.K + FP.b)) / (FP.K + FP.D);                 // fishing stops paying
  const F_CH = (FP.q * (FP.a * (FP.K - FP.D) + 2 * FP.b)) / (FP.K + FP.D);    // Hopf cost
  const F_COPT = (FP.q * (FP.a * FP.K + 2 * FP.b)) / (FP.K + 2 * FP.D);      // MSY cost
  const F_NH = (FP.K - FP.D) / 2;
  const C_MIN = 0.55, C_MAX = 0.95, N_MAX = 10.5, E_MAX = 8;

  const nStar = (c) => (c * FP.D - FP.q * FP.b) / (FP.q * FP.a - c);
  const phiN = (N) => (FP.r / FP.q) * (1 - N / FP.K) * (N + FP.D); // biomass nullcline E = Φ(N)

  function fishField(N, E, c) {
    const { r, K, q, a, b, D } = FP;
    return [r * N * (1 - N / K) - (q * N * E) / (N + D), E * ((q * (a * N + b)) / (N + D) - c)];
  }

  function rk4(s, c, h) {
    const k1 = fishField(s[0], s[1], c);
    const k2 = fishField(s[0] + (h / 2) * k1[0], s[1] + (h / 2) * k1[1], c);
    const k3 = fishField(s[0] + (h / 2) * k2[0], s[1] + (h / 2) * k2[1], c);
    const k4 = fishField(s[0] + h * k3[0], s[1] + h * k3[1], c);
    return [s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
  }

  // The attracting limit cycle for c0 < c < cH: integrate past the transient, then record one period.
  function limitCycle(c) {
    const ns = nStar(c);
    let s = [ns + 0.4, phiN(ns)];
    const h = 0.04;
    for (let i = 0; i < 15000; i++) s = rk4(s, c, h);
    const pts = [];
    let crossings = 0, prev = s[0], nmin = Infinity, nmax = -Infinity;
    for (let i = 0; i < 20000 && crossings < 2; i++) {
      s = rk4(s, c, h);
      if (prev < ns && s[0] >= ns) crossings += 1;
      prev = s[0];
      if (crossings >= 1) {
        pts.push(s);
        nmin = Math.min(nmin, s[0]);
        nmax = Math.max(nmax, s[0]);
      }
    }
    return { pts, nmin, nmax };
  }

  // Bifurcation diagram in the cost c: equilibrium biomass and the range of the cycle.
  const BX = (c) => 40 + ((c - C_MIN) / (C_MAX - C_MIN)) * 248;
  const BY = (N) => 206 - (N / N_MAX) * 186;

  function fisheryBifurcationSVG(band) {
    const path = (cs, f) => cs.map((c, i) => `${i ? "L" : "M"}${BX(c).toFixed(1)} ${BY(f(c)).toFixed(1)}`).join(" ");
    const range = (from, to, n) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);
    const unstable = path(range(C_MIN, F_CH, 30), nStar);
    const stable = path(range(F_CH, F_C1, 30), nStar);
    const upper = band.map((p) => `${BX(p.c).toFixed(1)} ${BY(p.nmax).toFixed(1)}`);
    const lower = band.map((p) => `${BX(p.c).toFixed(1)} ${BY(p.nmin).toFixed(1)}`);
    const region = `M${upper.join(" L")} L${lower.slice().reverse().join(" L")} Z`;
    const tick = (c, label) =>
      `<path class="line" d="M${BX(c).toFixed(1)} 206v5"/><text x="${BX(c).toFixed(1)}" y="224" text-anchor="middle">${label}</text>`;
    return `<svg class="dg" viewBox="0 0 300 240" role="img" aria-label="Bifurcation diagram in the cost c: below the Hopf cost the equilibrium is unstable and biomass oscillates within a band; above it the equilibrium is stable, with maximum sustainable yield at biomass K/2; above c1 fishing stops and biomass equals K.">
      <path class="line" d="M40 14V206H290"/>
      ${tick(0.6, "0.6")}${tick(0.7, "0.7")}${tick(0.8, "0.8")}${tick(0.9, "0.9")}
      <text x="294" y="236" class="math sm" text-anchor="end">c</text>
      <text x="34" y="${BY(FP.K) + 4}" text-anchor="end" class="t-faint">K</text>
      <text x="34" y="${BY(FP.K / 2) + 4}" text-anchor="end" class="t-faint">K/2</text>
      <text x="34" y="${BY(0) + 4}" text-anchor="end" class="t-faint">0</text>
      <text x="44" y="12" class="math sm">N</text>
      <path class="fill-coral-soft" d="${region}"/>
      <path class="line-coral" d="M${upper.join(" L")}"/>
      <path class="line-coral" d="M${lower.join(" L")}"/>
      <path class="line-2 dash" d="${unstable}"/>
      <path class="line-text" d="${stable}"/>
      <path class="line dash-s" d="M${BX(C_MIN)} ${BY(FP.K)}H${BX(F_C1).toFixed(1)}"/>
      <path class="line-text" d="M${BX(F_C1).toFixed(1)} ${BY(FP.K)}H${BX(C_MAX)}"/>
      <path class="line dash-s" d="M${BX(F_COPT).toFixed(1)} ${BY(FP.K / 2)}H40"/>
      <g class="bif-marker"><path class="line-gold dash-s" d="M0 14V206"/></g>
      <text x="${(BX(F_CH) - 8).toFixed(1)}" y="${(BY(F_NH) + 18).toFixed(1)}" class="t-gold halo" text-anchor="end">Hopf c<tspan baseline-shift="sub" font-size="8">H</tspan></text>
      <text x="${(BX(F_COPT) + 8).toFixed(1)}" y="${(BY(FP.K / 2) + 4).toFixed(1)}" class="t-strong halo">MSY</text>
      <text x="${(BX(F_C1) - 6).toFixed(1)}" y="${(BY(FP.K) - 8).toFixed(1)}" class="t-faint halo" text-anchor="end">c<tspan baseline-shift="sub" font-size="8">1</tspan></text>
      <text x="${BX(0.62).toFixed(1)}" y="${(BY(9.8)).toFixed(1)}" class="t-coral halo">limit cycle</text>
      <circle class="node gold" cx="${BX(F_CH).toFixed(1)}" cy="${BY(F_NH).toFixed(1)}" r="4.5"/>
      <rect class="fill-paper" x="${(BX(F_COPT) - 3.5).toFixed(1)}" y="${(BY(FP.K / 2) - 3.5).toFixed(1)}" width="7" height="7" transform="rotate(45 ${BX(F_COPT).toFixed(1)} ${BY(FP.K / 2).toFixed(1)})"/>
      <g class="bif-states"></g>
    </svg>`;
  }

  function initFisheryDynamics(root, band) {
    const canvas = root.querySelector(".hopf-phase");
    const ctx = canvas.getContext("2d");
    const input = root.querySelector(".hopf-ctrl input");
    const output = root.querySelector(".hopf-ctrl output");
    const status = root.querySelector(".hopf-status");
    const marker = root.querySelector(".bif-marker");
    const states = root.querySelector(".bif-states");
    const H = 0.025, STEPS = 4, TRAIL = 90, COUNT = 14;
    let c = parseFloat(input.value);
    let cycle = null, size = 0, pad = 0, raf = 0, running = false, C = {};

    const readColors = () => {
      C = { axis: css("--border"), field: css("--faint"), null: css("--muted"), coral: css("--coral"), gold: css("--gold"), text: css("--text-2"), bg: css("--bg") };
    };

    function seed(p) {
      p.N = 0.4 + Math.random() * 9.6;
      p.E = 0.3 + Math.random() * 7.2;
      p.trail = [];
      p.age = 0;
      p.life = 520 + Math.random() * 320;
      return p;
    }
    const parts = Array.from({ length: COUNT }, () => seed({}));

    function advance(p) {
      let s = [p.N, p.E];
      for (let i = 0; i < STEPS; i++) s = rk4(s, c, H);
      p.N = Math.max(0, s[0]);
      p.E = Math.max(0, s[1]);
      p.trail.push(p.N, p.E);
      if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2);
      if (++p.age > p.life || p.E > E_MAX * 1.4) seed(p);
    }

    const X = (N) => pad + (N / N_MAX) * (size - 2 * pad);
    const Y = (E) => size - pad - (E / E_MAX) * (size - 2 * pad);

    function draw() {
      if (!size) return;
      ctx.clearRect(0, 0, size, size);

      ctx.lineWidth = 1;
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(X(0), Y(E_MAX)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(N_MAX), Y(0));
      ctx.stroke();
      ctx.fillStyle = C.field;
      ctx.font = `italic 13px ${css("--serif")}`;
      ctx.fillText("N", X(N_MAX) - 10, Y(0) - 6);
      ctx.fillText("E", X(0) + 6, Y(E_MAX) + 12);

      // direction field
      const n = 9, len = ((size - 2 * pad) / n) * 0.4;
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = C.field;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const N = ((i + 0.5) * N_MAX) / n, E = ((j + 0.5) * E_MAX) / n;
          const [u, v] = fishField(N, E, c);
          const sx = u / N_MAX, sy = -v / E_MAX, m = Math.hypot(sx, sy) || 1;
          const dx = (sx / m) * len, dy = (sy / m) * len, px = X(N), py = Y(E);
          ctx.beginPath(); ctx.moveTo(px - dx / 2, py - dy / 2); ctx.lineTo(px + dx / 2, py + dy / 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(px + dx / 2, py + dy / 2, 1.2, 0, Math.PI * 2); ctx.fillStyle = C.field; ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // nullclines: E = Φ(N) and N = N*
      ctx.strokeStyle = C.null;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const N = (FP.K * i) / 60;
        if (i) ctx.lineTo(X(N), Y(phiN(N))); else ctx.moveTo(X(N), Y(phiN(N)));
      }
      ctx.stroke();
      const interior = c > F_C0 && c < F_C1;
      if (interior) {
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(X(nStar(c)), Y(0)); ctx.lineTo(X(nStar(c)), Y(E_MAX)); ctx.stroke();
      }
      ctx.setLineDash([]);

      if (cycle && c < F_CH) {
        ctx.strokeStyle = C.coral;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        cycle.pts.forEach(([N, E], i) => (i ? ctx.lineTo(X(N), Y(E)) : ctx.moveTo(X(N), Y(E))));
        ctx.closePath();
        ctx.stroke();
      }

      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = C.gold;
      ctx.fillStyle = C.gold;
      for (const p of parts) {
        const t = p.trail;
        if (t.length < 4) continue;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(X(t[0]), Y(t[1]));
        for (let i = 2; i < t.length; i += 2) ctx.lineTo(X(t[i]), Y(t[i + 1]));
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(X(p.N), Y(p.E), 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // equilibria: H* (filled when stable), HK = (K, 0) (filled when stable)
      ctx.lineWidth = 2;
      if (interior) {
        const hx = X(nStar(c)), hy = Y(phiN(nStar(c)));
        ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        if (c > F_CH) { ctx.fillStyle = C.text; ctx.fill(); } else { ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.text; ctx.stroke(); }
        ctx.fillStyle = C.text;
        ctx.font = `italic 13px ${css("--serif")}`;
        ctx.fillText("H*", hx + 7, hy - 7);
      }
      ctx.beginPath(); ctx.rect(X(FP.K) - 4, Y(0) - 4, 8, 8);
      if (c >= F_C1) { ctx.fillStyle = C.text; ctx.fill(); } else { ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.text; ctx.stroke(); }
    }

    function settle() {
      parts.forEach(seed);
      for (let i = 0; i < 260; i++) parts.forEach(advance);
      draw();
    }

    function update() {
      output.textContent = c.toFixed(3);
      const x0 = BX(c);
      marker.setAttribute("transform", `translate(${x0.toFixed(1)} 0)`);
      cycle = c < F_CH - 0.002 ? limitCycle(c) : null;
      const dotAt = (N, cls) => `<circle class="${cls}" cx="${x0.toFixed(1)}" cy="${BY(N).toFixed(1)}" r="5"/>`;
      let text;
      if (c >= F_C1) {
        states.innerHTML = dotAt(FP.K, "fill-gold");
        text = `<b>c ≥ c₁ ≈ ${F_C1.toFixed(3)}</b> · fishing does not pay: effort dies out and biomass returns to K.`;
      } else if (c >= F_CH) {
        const N = nStar(c), Y = FP.r * N * (1 - N / FP.K);
        states.innerHTML = dotAt(N, "fill-gold");
        const msy = Math.abs(c - F_COPT) < 0.003;
        text = `<b>c<sub>H</sub> &lt; c &lt; c₁</b> · H* is stable: N* = ${N.toFixed(2)}, yield ${Y.toFixed(2)}${msy ? " = rK/4, the maximum sustainable yield." : "."}`;
      } else {
        const lo = cycle ? cycle.nmin : F_NH, hi = cycle ? cycle.nmax : F_NH;
        states.innerHTML = dotAt(hi, "fill-coral") + dotAt(lo, "fill-coral") + `<circle class="node" cx="${x0.toFixed(1)}" cy="${BY(nStar(c)).toFixed(1)}" r="4"/>`;
        text = `<b>c &lt; c<sub>H</sub> = ${F_CH.toFixed(2)}</b> · H* is unstable: biomass and effort cycle, with N between ${lo.toFixed(2)} and ${hi.toFixed(2)}.`;
      }
      status.innerHTML = text;
    }

    function resize() {
      const w = canvas.clientWidth;
      if (!w) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = w;
      pad = Math.round(w * 0.06);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    let pending = 0;
    const setCost = (value) => {
      c = Math.min(C_MAX, Math.max(C_MIN, value));
      input.value = String(c);
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        update();
        if (!running) settle(); else draw();
      });
    };
    input.addEventListener("input", () => setCost(parseFloat(input.value)));
    root.querySelectorAll("[data-cost]").forEach((btn) => btn.addEventListener("click", () => setCost(parseFloat(btn.dataset.cost))));

    readColors();
    update();
    resize();
    settle();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    window.addEventListener("themechange", () => { readColors(); draw(); });

    const loop = () => {
      parts.forEach(advance);
      draw();
      raf = requestAnimationFrame(loop);
    };
    whenVisible(canvas, () => { running = true; raf = requestAnimationFrame(loop); }, () => { running = false; cancelAnimationFrame(raf); });
  }

  function fishery(el) {
    const id = uid();
    // range of the limit cycle below the Hopf cost, closed at the Hopf point
    const band = [];
    for (let c = C_MIN; c < F_CH - 0.004; c += 0.01) {
      const { nmin, nmax } = limitCycle(c);
      band.push({ c, nmin, nmax });
    }
    band.push({ c: F_CH, nmin: F_NH, nmax: F_NH });

    el.innerHTML = `
      <div class="mp-row">
        <div class="mp-title">Model · open-access fishery with a rarity-dependent price</div>
        ${feedbackLoopSVG(id)}
        <div class="mp-chips"><span class="chip">bilinear catch <span class="m">qNE</span></span><span class="chip">saturated catch <span class="m">qNE/(N + D)</span></span><span class="chip">with / without a marine reserve</span></div>
      </div>
      <div class="mp-row">
        <div class="mp-title">Dynamics · saturated catch, no reserve</div>
        <div class="hopf">
          <figure><canvas class="hopf-phase" role="img" aria-label="Phase plane of biomass N and fishing effort E for the saturated-catch model"></canvas><figcaption>phase plane (N, E)</figcaption></figure>
          <figure>${fisheryBifurcationSVG(band)}<figcaption>bifurcation diagram in the cost c</figcaption></figure>
        </div>
        <div class="hopf-ctrl">
          <label for="${id}-c">c</label>
          <input id="${id}-c" type="range" min="${C_MIN}" max="${C_MAX}" step="0.002" value="0.68" aria-describedby="${id}-status">
          <output for="${id}-c">0.680</output>
        </div>
        <div class="hopf-presets" role="group" aria-label="Preset costs">
          <button type="button" data-cost="0.66">limit cycle</button>
          <button type="button" data-cost="${F_CH.toFixed(3)}">Hopf c<sub>H</sub></button>
          <button type="button" data-cost="${F_COPT.toFixed(3)}">MSY</button>
          <button type="button" data-cost="0.9">c &gt; c₁</button>
        </div>
        <p class="hopf-status" id="${id}-status" aria-live="polite"></p>
        <p class="mp-caption">Simulation of the saturated-catch model <span class="m">N′ = rN(1 − N/K) − qNE/(N + D)</span>, <span class="m">E′ = E[q(aN + b)/(N + D) − c]</span> with r = 1, K = 10, q = 1, a = 1, b = 0.5, D = 2. A supercritical Hopf bifurcation occurs at c<sub>H</sub> = 0.75: for lower costs H* is unstable and a stable limit cycle appears. The MSY cost c ≈ 0.786 lies above c<sub>H</sub>, so the MSY equilibrium is stable; for c ≥ c₁ ≈ 0.875 fishing stops.</p>
      </div>`;
    initFisheryDynamics(el, band);
  }

  /* ======================================================================
     Method panel 2: split variational inequality, Algorithm 3.1 of the
     manuscript. Notation follows the paper: H0, H1, C0, C1, B0, B1, F.
     ====================================================================== */
  function sviProblemSVG(id) {
    const arrow = "M146 55 C 200 4, 262 4, 309 75";
    return `<svg class="dg wide" viewBox="0 0 460 172" role="img" aria-label="Two real Hilbert spaces: x star lies in C0 inside H0, and its image under the bounded linear operator F lies in C1 inside H1.">
      <defs><marker id="${id}-ah" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="fill-gold" d="M0 0 10 5 0 10z"/></marker></defs>
      <rect class="region" x="8" y="10" width="180" height="152" rx="18"/>
      <rect class="region" x="272" y="10" width="180" height="152" rx="18"/>
      <text x="24" y="36" class="math">H₀</text>
      <text x="288" y="36" class="math">H₁</text>
      <polygon class="set-coral" points="50,122 66,58 122,42 160,80 132,134"/>
      <polygon class="set-gold" points="306,112 324,54 384,46 424,92 380,136"/>
      <text x="70" y="114" class="math t-coral">C₀</text>
      <text x="380" y="118" class="math t-gold">C₁</text>
      <path class="line-gold" d="${arrow}" marker-end="url(#${id}-ah)"/>
      <circle class="fill-gold" r="3.5"><animateMotion dur="2.8s" repeatCount="indefinite" path="${arrow}"/></circle>
      <text x="228" y="38" class="math" text-anchor="middle">F</text>
      <text x="229" y="54" class="t-faint" text-anchor="middle" font-size="10">bounded linear</text>
      <circle class="fill-coral" cx="141" cy="61" r="4.5"/>
      <text x="124" y="80" class="math sm">x*</text>
      <circle class="fill-gold" cx="315" cy="83" r="4.5"/>
      <text x="306" y="104" class="math sm" text-anchor="end">Fx*</text>
    </svg>`;
  }

  // Grows a polyline through `pts` dot by dot, replaying while on screen.
  function animateIterates(svg, pts) {
    const g = svg.querySelector(".iter-g");
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    g.innerHTML =
      `<path class="line-gold iter-path" d="${d}" stroke-width="1.3" opacity=".8"/>` +
      pts.map((p, i) => `<circle class="fill-gold iter-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i ? 2.2 : 3}"/>`).join("");

    const path = g.querySelector(".iter-path");
    const dots = Array.from(g.querySelectorAll(".iter-dot"));
    if (!path.animate) return;

    // cumulative length at each vertex, so the line reaches each dot as it appears
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = cum[cum.length - 1];
    const STEP = 230;
    const duration = STEP * (pts.length - 1);
    let anims = [], timer = 0;

    const play = () => {
      anims.forEach((a) => a.cancel());
      anims = [];
      anims.push(path.animate(
        cum.map((c, i) => ({ offset: i / (cum.length - 1), strokeDasharray: `${total}`, strokeDashoffset: `${total - c}` })),
        { duration, fill: "both" }
      ));
      dots.forEach((dot, i) => anims.push(dot.animate(
        [{ opacity: 0, transform: "scale(0.2)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 300, delay: i * STEP, fill: "both", easing: "cubic-bezier(.2,.8,.2,1)" }
      )));
      timer = setTimeout(play, duration + 3200);
    };
    whenVisible(svg, play, () => clearTimeout(timer));
  }

  // Theorem 3.2 illustration: a solution set Gamma (drawn as a segment) and the
  // anchor at the origin. The Halpern-type inertial step of Algorithm 3.1,
  //   w = (1 - a_k) x_k + t_k (x_k - x_{k-1}),  x_{k+1} = (1 - p_k) w + p_k P_Gamma(w),
  // with the paper's default a_k = 1/(k+1), p_k = (k+1)/(2k+3), drives x_k to P_Gamma(0).
  const ORIGIN = [30, 128];
  const GAMMA = [[75, 15], [160, 100]];

  function projectToSegment(p, a, b) {
    const ab = [b[0] - a[0], b[1] - a[1]];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)));
    return [a[0] + t * ab[0], a[1] + t * ab[1]];
  }

  function minNormIterates() {
    const rel = (p) => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];
    const [a, b] = GAMMA.map(rel);
    let prev = rel([205, 140]);
    let x = prev;
    const pts = [x];
    for (let k = 1; k <= 24; k++) {
      const dist = Math.hypot(x[0] - prev[0], x[1] - prev[1]);
      const tau = k / (k + 1);
      const theta = dist > 0 ? Math.min(30 / (k + 1) ** 1.01 / dist, tau) : tau;
      const alpha = 1 / (k + 1);
      const w = [(1 - alpha) * x[0] + theta * (x[0] - prev[0]), (1 - alpha) * x[1] + theta * (x[1] - prev[1])];
      const p = projectToSegment(w, a, b);
      const phi = (k + 1) / (2 * k + 3);
      prev = x;
      x = [(1 - phi) * w[0] + phi * p[0], (1 - phi) * w[1] + phi * p[1]];
      pts.push(x);
    }
    return pts.map((p) => [p[0] + ORIGIN[0], p[1] + ORIGIN[1]]);
  }

  function minNormSVG() {
    const [a, b] = GAMMA;
    const u = projectToSegment(ORIGIN, a, b);
    const mid = [(ORIGIN[0] + u[0]) / 2 - 6, (ORIGIN[1] + u[1]) / 2 - 6];
    return `<svg class="dg small iter-svg" viewBox="0 0 230 160" role="img" aria-label="Iterates anchored at the origin converge to u star, the point of the solution set Gamma with the smallest norm.">
      <path class="gamma-band" d="M${a} L${b}"/>
      <path class="line-coral" d="M${a} L${b}" stroke-width="2"/>
      <text x="166" y="112" class="math t-coral">Γ</text>
      <path class="line dash" d="M${ORIGIN} L${u[0].toFixed(1)} ${u[1].toFixed(1)}"/>
      <text class="t-faint" font-size="10" text-anchor="middle" transform="translate(${mid[0].toFixed(1)} ${mid[1].toFixed(1)}) rotate(-45)">min ‖u‖</text>
      <path class="line-2" d="M24 128h12M30 122v12"/>
      <text x="14" y="148" class="math sm">0</text>
      <text x="198" y="157" class="math sm">x₁</text>
      <g class="iter-g"></g>
      <circle class="line-text" cx="${u[0].toFixed(1)}" cy="${u[1].toFixed(1)}" r="7" stroke-width="1.6"/>
      <text x="${(u[0] + 10).toFixed(1)}" y="${(u[1] + 22).toFixed(1)}" class="math sm">u*</text>
    </svg>`;
  }

  // Example 5.2: the two-city network of Figure 6 (adapted from Singh, Gibali & Qin).
  const CITIES = [
    {
      name: "X₀", labelY: 75,
      nodes: { 1: [95, 22], 2: [185, 22], 3: [225, 70], 4: [185, 118], 5: [95, 118], 6: [55, 70] },
      edges: [[1, 2], [1, 6], [2, 3], [3, 6], [6, 5], [5, 2], [3, 4], [4, 5]],
      sources: [1, 2], sinks: [3, 5],
      routes: [[1, 2, 3, "coral"], [1, 6, 5, 2, 3, "coral"], [2, 3, 6, 5, "gold"], [2, 3, 4, 5, "gold"]],
    },
    {
      name: "X₁", labelY: 217,
      nodes: { 1: [75, 172], 2: [150, 172], 3: [225, 172], 4: [75, 252], 5: [225, 252] },
      edges: [[1, 2], [2, 3], [1, 4], [4, 2], [2, 5], [4, 5], [5, 3]],
      sources: [1, 4], sinks: [2, 3],
      routes: [[1, 2, "coral"], [1, 4, 2, "coral"], [4, 2, 3, "gold"], [4, 5, 3, "gold"], [4, 2, 5, 3, "gold"]],
    },
  ];

  function twoCitySVG(id) {
    const R = 9;
    const city = (c) => {
      const P = c.nodes;
      const edges = c.edges.map(([i, j]) => {
        const [x1, y1] = P[i], [x2, y2] = P[j];
        const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
        return `<path class="line" d="M${(x1 + ux * (R + 1)).toFixed(1)} ${(y1 + uy * (R + 1)).toFixed(1)} L${(x2 - ux * (R + 2)).toFixed(1)} ${(y2 - uy * (R + 2)).toFixed(1)}" marker-end="url(#${id}-nh)"/>`;
      }).join("");
      const movers = c.routes.map((route, k) => {
        const tone = route[route.length - 1];
        const stops = route.slice(0, -1).map((n) => P[n]);
        let len = 0;
        for (let i = 1; i < stops.length; i++) len += Math.hypot(stops[i][0] - stops[i - 1][0], stops[i][1] - stops[i - 1][1]);
        const dur = len / 36;
        const path = "M" + stops.map((p) => p.join(" ")).join(" L");
        return [0, 0.5].map((f) =>
          `<circle class="fill-${tone}" r="3"><animateMotion dur="${dur.toFixed(2)}s" begin="${(-(f * dur) - k * 0.4).toFixed(2)}s" repeatCount="indefinite" path="${path}"/></circle>`
        ).join("");
      }).join("");
      const nodes = Object.keys(P).map((n) => {
        const [x, y] = P[n];
        const role = c.sources.includes(+n) ? " src" : c.sinks.includes(+n) ? " dst" : "";
        return `<circle class="node${role}" cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" class="t-strong" font-size="10">${n}</text>`;
      }).join("");
      return `<text x="12" y="${c.labelY}" class="math">${c.name}</text>${edges}${movers}${nodes}`;
    };
    return `<svg class="dg small" viewBox="0 0 300 276" role="img" aria-label="Two traffic networks: city X0 with 6 nodes and 8 links, city X1 with 5 nodes and 7 links, coupled by the transfer operator F. Flows move from source nodes to destination nodes.">
      <defs>
        <marker id="${id}-nh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="fill-muted" d="M0 0 10 5 0 10z"/></marker>
        <marker id="${id}-fh" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="fill-gold" d="M0 0 10 5 0 10z"/></marker>
      </defs>
      <path class="line-gold" d="M262 46 C 292 96, 292 146, 262 196" marker-end="url(#${id}-fh)"/>
      <text x="286" y="126" class="math">F</text>
      ${CITIES.map(city).join("")}
    </svg>`;
  }

  function svi(el) {
    const id = uid();
    el.innerHTML = `
      <div class="mp-row">
        <div class="mp-title">Problem · split variational inequality</div>
        ${sviProblemSVG(id)}
        <div class="mp-formula">
          <div>find <i>x</i>* ∈ <i>C</i>₀ with ⟨<i>B</i>₀<i>x</i>*, <i>x</i> − <i>x</i>*⟩ ≥ 0 for all <i>x</i> ∈ <i>C</i>₀,</div>
          <div>such that <i>y</i>* = <i>Fx</i>* ∈ <i>C</i>₁ with ⟨<i>B</i>₁<i>y</i>*, <i>y</i> − <i>y</i>*⟩ ≥ 0 for all <i>y</i> ∈ <i>C</i>₁.</div>
        </div>
        <p class="mp-caption"><i>B</i>₀, <i>B</i>₁ monotone and Lipschitz continuous, <i>F</i> bounded linear. With <i>B</i>₀ = <i>B</i>₁ = 0 this is the split feasibility problem.</p>
      </div>
      <div class="mp-row">
        <div class="mp-title">Algorithm 3.1 · one iteration</div>
        ${flow([
          { icon: "momentum", label: "inertia + anchor", sub: "→ w<sub>k</sub>", tone: "gold" },
          { icon: "projection", label: "projection", sub: "→ y<sub>j</sub>", tone: "coral" },
          { icon: "tseng", label: "Tseng step", sub: "→ u<sub>j</sub>" },
          { icon: "adjoint", label: "adjoint pull", sub: "→ z<sub>k</sub>" },
          { icon: "solution", label: "update", sub: "→ x<sub>k+1</sub>", tone: "paper" },
        ], { cls: "algo" })}
        <div class="mp-formula small">
          <i>w<sub>k</sub></i> = (1 − α<sub>k</sub>)<i>x<sub>k</sub></i> + θ<sub>k</sub>(<i>x<sub>k</sub></i> − <i>x</i><sub>k−1</sub>) <span class="sep">·</span> <i>x</i><sub>k+1</sub> = (1 − φ<sub>k</sub>)<i>w<sub>k</sub></i> + φ<sub>k</sub><i>z<sub>k</sub></i>
        </div>
        <div class="mp-chips">
          <span class="grp"><span class="k">needs no</span><span class="chip strike">co-coercivity</span><span class="chip strike">Lipschitz constants</span><span class="chip strike">‖F‖</span></span>
          <span class="grp"><span class="k">proves</span><span class="chip ok">strong convergence</span></span>
        </div>
        <p class="mp-caption">Steps 2–4 run for <i>j</i> = 0, 1 with <i>F</i>₀ = <i>I</i> and <i>F</i>₁ = <i>F</i>. The step sizes λ, β, γ update themselves from quantities already computed, so no problem constants are needed.</p>
      </div>
      <div class="mp-row mp-split">
        <figure><div class="mp-title">Theorem 3.2 · minimum norm</div>${minNormSVG()}<figcaption>The anchor (1 − α<sub>k</sub>) pulls the iterates toward 0, so they converge strongly to <i>u</i>*, the solution of smallest norm.</figcaption></figure>
        <figure><div class="mp-title">Example 5.2 · two cities</div>${twoCitySVG(id)}<figcaption>City X₀ (6 nodes, 8 links) and city X₁ (5 nodes, 7 links), coupled by <i>F</i>. Coral: sources · green: destinations.</figcaption></figure>
      </div>`;
    animateIterates(el.querySelector(".iter-svg"), minNormIterates());
  }

  // Freeze SVG (SMIL) animations for visitors who prefer reduced motion.
  function syncSMIL(root = document) {
    root.querySelectorAll("svg").forEach((svg) => {
      if (!svg.pauseAnimations || svg.ownerSVGElement) return;
      if (motion.matches) svg.pauseAnimations();
      else svg.unpauseAnimations();
    });
  }
  if (motion.addEventListener) motion.addEventListener("change", () => syncSMIL());

  window.Diagrams = { flow, icon, monogram, heroField, heroLoop, syncSMIL, method: { fishery, svi } };
})();
