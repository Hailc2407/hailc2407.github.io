(function christmasTree() {
  /*
   * christmas-tree.js: cây thông Noel ASCII 3D, hiện thành popup nổi trên website.
   * Kèm nhạc nền YouTube, hướng dẫn nút tắt & chế độ quản lý bí mật có mật khẩu (mã hoá cho repo công khai).
   *
   * Gọi bằng JS:  ChristmasTree.open()  .close()  .toggle()  .replay()
   * Phím tắt khi popup đang mở:  Esc đóng · Space tạm dừng · R chạy lại
   * Phím tắt quản lý bí mật:    Ctrl + Shift + H (hoặc Ctrl + Shift + M)
   * Mật khẩu mặc định:          hailc@xmas2026
   */
  'use strict';
  if (window.ChristmasTree) return;

  // ── 1. CRYPTO & CONFIGURATION (Git-Safe: Encrypted for Public Repo) ──
  const APP_CIPHER_KEY = "HailcMathOptimization2026";
  const DEFAULT_SALT = "hailc2407_math_xmas_2026";
  // Salted SHA-256 for default password 'hailc@xmas2026'
  const DEFAULT_ADMIN_HASH = "bcdfbe35bb6dc64ba928a97bb2eb2b8e30b9f98d1ebaec812dad21a2fca2ddda";

  function encryptPayload(dataObj, key = APP_CIPHER_KEY) {
    const jsonStr = JSON.stringify(dataObj);
    const chars = [];
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i);
      const kCode = key.charCodeAt(i % key.length);
      chars.push(String.fromCharCode(charCode ^ kCode ^ ((i * 17) & 0xff)));
    }
    return btoa(unescape(encodeURIComponent(chars.join(""))));
  }

  function decryptPayload(b64Str, key = APP_CIPHER_KEY) {
    try {
      const raw = decodeURIComponent(escape(atob(b64Str)));
      const chars = [];
      for (let i = 0; i < raw.length; i++) {
        const charCode = raw.charCodeAt(i);
        const kCode = key.charCodeAt(i % key.length);
        chars.push(String.fromCharCode(charCode ^ kCode ^ ((i * 17) & 0xff)));
      }
      return JSON.parse(chars.join(""));
    } catch (e) {
      return null;
    }
  }

  async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // Default encrypted payload for git (no raw URLs in public repo)
  const DEFAULT_GIT_PAYLOAD = "M1IyMFJscmGFn77tn5Le1j00N05gJiXE/8P3gMTnxwIxezcBITyjsYeKntHr4VVcdhp7cT2EgJmw3pOEfOb5xtm0jYcPZmCn1Mmq3AEBLzk/OjLb9/ej28Hv8AYJPXMbJjPFwMD23NLs2gobMQBbCSPOs7i8/fyquhlLfWdsUU6NgYfwip/L5BgWJTcFCXh0yavjxdKx319DfTg/Cnt08rWnmdy16lRTI29CUGQribKzydvjgVVQKxZdHDNw1oKt1Yrp+VJENi0iWWd6hr6cqtTaoE1fID5UVX4h0MKo0ZC3zQslMDtqRUMj9dnu9t4=";

  function loadActiveConfig() {
    const basePayload = window.HOLIDAY_CONFIG_PAYLOAD || DEFAULT_GIT_PAYLOAD;
    let config = decryptPayload(basePayload) || {
      youtubeId: "YSLalbZqcqQ",
      title: "1 HOUR christmas music! 🎄🎀✨",
      volume: 40,
      autoplay: true,
      signature: "HaiLC",
      adminHash: DEFAULT_ADMIN_HASH,
      adminSalt: DEFAULT_SALT
    };

    try {
      const local = localStorage.getItem("christmas_tree_custom_cfg");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.youtubeId && parsed.youtubeId !== "gl1aHhXnN1k") {
          config = Object.assign(config, parsed);
        }
      }
    } catch (e) {}
    return config;
  }

  let CONFIG = loadActiveConfig();

  // ── 2. OPTIONS ──
  const tag = document.currentScript;
  const ds = (tag && tag.dataset) || {};
  const cfg = window.ChristmasTreeConfig || {};
  const opt = (key, fallback) => String(cfg[key] != null ? cfg[key] : ds[key] != null ? ds[key] : fallback);
  const today = new Date();
  const YEAR = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const OPT = {
    open: opt('open', 'always'),
    delay: Math.max(0, parseInt(opt('delay', 800), 10) || 0),
    message: opt('message', 'MERRY CHRISTMAS ' + YEAR).normalize('NFC').trim().slice(0, 40),
    signature: CONFIG.signature || opt('signature', 'HaiLC').slice(0, 48),
    button: opt('button', 'true') !== 'false',
    position: opt('position', 'right') === 'left' ? 'left' : 'right',
    fps: Math.min(60, Math.max(12, parseInt(opt('fps', 30), 10) || 30)),
  };

  // ── 3. YOUTUBE AUDIO CONTROLLER ──
  class YouTubeMusic {
    constructor() {
      this.isPlaying = false;
      this.isMuted = false;
      this.volume = CONFIG.volume !== undefined ? CONFIG.volume : 35;
      this.iframe = null;
      this.createIframe();
    }

    createIframe() {
      let iframe = document.getElementById("christmas-tree-yt-player");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "christmas-tree-yt-player";
        iframe.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;opacity:0;pointer-events:none;";
        iframe.src = `https://www.youtube-nocookie.com/embed/${CONFIG.youtubeId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&playsinline=1&controls=0&loop=1&playlist=${CONFIG.youtubeId}`;
        iframe.allow = "autoplay";
        document.body.appendChild(iframe);
      }
      this.iframe = iframe;
    }

    cmd(func, args = "") {
      if (!this.iframe || !this.iframe.contentWindow) return;
      this.iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
    }

    play() {
      this.cmd("playVideo");
      this.cmd("unMute");
      this.cmd("setVolume", [this.volume]);
      this.isPlaying = true;
      updateMusicUI(true);
    }

    pause() {
      this.cmd("pauseVideo");
      this.isPlaying = false;
      updateMusicUI(false);
    }

    toggle() {
      if (this.isPlaying) this.pause();
      else this.play();
    }

    setVolume(vol) {
      this.volume = Math.max(0, Math.min(100, vol));
      this.cmd("setVolume", [this.volume]);
    }

    changeTrack(videoId, title) {
      CONFIG.youtubeId = videoId;
      CONFIG.title = title || "Custom Holiday Music";
      if (this.iframe) {
        this.iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&playsinline=1&controls=0&loop=1&playlist=${videoId}`;
        setTimeout(() => {
          if (this.isPlaying) this.play();
        }, 1200);
      }
    }
  }

  let YT = null;
  function updateMusicUI(playing) {
    if (ui && ui.musicBtn) {
      ui.musicBtn.innerHTML = playing ? `<span>🎵</span>` : `<span style="opacity:0.4;">🔇</span>`;
      ui.musicBtn.classList.toggle("active", playing);
    }
  }

  // ── 4. PALETTE ── colours as 0..1 RGB triples
  const TAU = Math.PI * 2;
  const GREEN = [0.13, 0.6, 0.24], DEEP = [0.05, 0.24, 0.1], SNOW = [0.88, 0.93, 1];
  const BARK = [0.5, 0.3, 0.15], GOLD = [1, 0.75, 0.24], RED = [0.98, 0.16, 0.14];
  const SILVER = [0.8, 0.86, 0.98], BLUE = [0.2, 0.42, 1], PINK = [1, 0.45, 0.66];
  const WARM = [1, 0.74, 0.32], SOFT = [1, 0.94, 0.82], LEAF = [0.25, 0.85, 0.4];
  const BOX_GREEN = [0.12, 0.66, 0.32], BOX_WHITE = [0.92, 0.94, 0.98], GROUND = [0.52, 0.6, 0.8];

  // ── 5. TIMELINE ──
  const T = {
    ground: [0.1, 1.4], grow: [1, 6], garland: [6, 8.4], balls: [7, 9.4],
    lights: [8.2, 10.6], gifts: [9.4, 11.3], star: 11.8, msg: 12.9,
  };
  const SPIN = 0.31;
  const FLASH = 0.38;

  // ── 6. GLYPHS ──
  const CHARS = [' '];
  for (let i = 33; i < 127; i++) CHARS.push(String.fromCharCode(i));
  for (const c of OPT.message) if (!CHARS.includes(c)) CHARS.push(c);
  const IDX = new Map(CHARS.map((c, i) => [c, i]));
  const idx = c => IDX.get(c) || 0;
  const M = { NEEDLE: 0, SNOW: 1, BARK: 2, TINSEL: 3, BALL: 4, LIGHT: 5, BOX: 6, RIBBON: 7, BOW: 8 };
  const RAMPS = ['.:^~=*vxo%&#W@', '.:*xX#W@', '.:=|I#', '-~=+*#@', '.:oO0@', 'oO0@', '.:+=%#', '+xX#', 'oO@']
    .map(r => Array.from(r, idx));
  const ramp = (m, b) => { const r = RAMPS[m]; return r[b <= 0 ? 0 : b >= 1 ? r.length - 1 : (b * r.length) | 0]; };
  const HASH = idx('#'), AT = idx('@'), PLUS = idx('+'), DOT = idx('.');
  const RAY = Array.from('-/|\\', idx);
  const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", monospace';

  // ── 7. HELPERS ──
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const backOut = x => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;
  const bounceOut = x => (x < 1 / 2.75 ? 7.5625 * x * x
    : x < 2 / 2.75 ? 7.5625 * (x -= 1.5 / 2.75) * x + 0.75
    : x < 2.5 / 2.75 ? 7.5625 * (x -= 2.25 / 2.75) * x + 0.9375
    : 7.5625 * (x -= 2.625 / 2.75) * x + 0.984375);
  function mulberry32(a) {
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fibSphere(n) {
    return Array.from({ length: n }, (_, i) => {
      const y = 1 - (2 * i + 1) / n, r = Math.sqrt(1 - y * y), a = i * 2.399963;
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    });
  }

  // ── 8. TREE SHAPE ──
  const Y0 = 0.1, Y1 = 1, BASE_R = 0.37, POP = 1, DROP = 2;
  const envelope = y => BASE_R * (1 - clamp((y - Y0) / (Y1 - Y0), 0, 1)) ** 0.95 + 0.01;
  const growTime = y => T.grow[0] + (T.grow[1] - T.grow[0]) * clamp(y / Y1, 0, 1);
  const droop = r => 0.06 * r - 0.3 * r * r;

  function buildScene() {
    const rnd = mulberry32(1225);
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(TAU * rnd());
    const A = { x: [], y: [], z: [], nx: [], ny: [], nz: [], r: [], g: [], b: [], t0: [], m: [], k: [], ph: [], grp: [] };
    const groups = [], tips = [], lightTimes = [];
    const add = (x, y, z, nx, ny, nz, c, m, t0, k = 1, grp = -1, ph = rnd()) => {
      const l = Math.hypot(nx, ny, nz) || 1;
      A.x.push(x); A.y.push(y); A.z.push(z); A.nx.push(nx / l); A.ny.push(ny / l); A.nz.push(nz / l);
      A.r.push(c[0]); A.g.push(c[1]); A.b.push(c[2]);
      A.t0.push(t0); A.m.push(m); A.k.push(k); A.ph.push(ph); A.grp.push(grp);
    };
    const group = (x, y, z, kind, t0) => groups.push({ x, y, z, kind, t0 }) - 1;

    // needles
    const WHORLS = 26;
    for (let i = 0; i < WHORLS; i++) {
      const u = i / (WHORLS - 1), y = Y0 + (Y1 - Y0 - 0.03) * u ** 0.92;
      const R = envelope(y) + 0.035, count = Math.round(6 + 12 * (1 - u));
      for (let j = 0; j < count; j++) {
        const a = TAU * (j + 0.45 * rnd()) / count + i * 2.39996;
        const ca = Math.cos(a), sa = Math.sin(a), L = R * (0.82 + 0.26 * rnd());
        for (let n = Math.round(30 + 330 * L); n > 0; n--) {
          const s = rnd() ** 0.62, r = s * L;
          const w = (0.02 + 0.075 * s) * gauss(), v = (0.008 + 0.03 * s) * gauss();
          const py = y + droop(r) + v;
          const nx = ca * 0.8 + 0.35 * gauss(), ny = 0.55 + 0.35 * gauss(), nz = sa * 0.8 + 0.35 * gauss();
          const snowy = s > 0.55 && ny > 0.5 && rnd() < 0.07 * s;
          const tone = 0.75 + 0.5 * rnd();
          const c = snowy ? SNOW : [GREEN[0] * tone * (0.7 + 0.6 * rnd()), GREEN[1] * tone, GREEN[2] * tone * (0.75 + 0.5 * rnd())];
          add(ca * r - sa * w, py, sa * r + ca * w, nx, ny, nz, c, snowy ? M.SNOW : M.NEEDLE,
            growTime(py) + 0.25 * s, 0.3 + 0.7 * s ** 1.2);
        }
        tips.push([ca * L * 1.03, y + droop(L), sa * L * 1.03]);
      }
    }

    // inner cone
    for (let n = 0; n < 5200; n++) {
      const y = Y0 + (Y1 - Y0 - 0.08) * rnd(), a = TAU * rnd(), r = 0.6 * envelope(y);
      add(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(a), 0.3, Math.sin(a), DEEP, M.NEEDLE, growTime(y), 0.55);
    }

    // trunk
    for (let n = 0; n < 1400; n++) {
      const y = (Y0 + 0.14) * rnd(), a = TAU * rnd();
      const bark = 0.65 + 0.35 * (Math.sin(a * 23 + y * 37) > 0);
      add(Math.cos(a) * 0.05, y, Math.sin(a) * 0.05, Math.cos(a), 0, Math.sin(a), BARK, M.BARK, growTime(y) - 0.2, bark);
    }

    // garland
    for (let n = 0, N = 2600; n < N; n++) {
      const u = n / N, a = TAU * 3.4 * u + 0.7;
      const y = Y0 + 0.1 + (Y1 - Y0 - 0.34) * u - 0.05 * (1 - 0.5 * u) * Math.abs(Math.sin(a * 2.5));
      const r = envelope(y) * 1.03 + 0.03;
      add(Math.cos(a) * r + 0.012 * gauss(), y + 0.012 * gauss(), Math.sin(a) * r + 0.012 * gauss(),
        Math.cos(a), 0.4, Math.sin(a), GOLD, M.TINSEL, T.garland[0] + u * (T.garland[1] - T.garland[0]));
    }

    // baubles
    const ball = fibSphere(150), BALLS = [RED, GOLD, RED, SILVER, RED, GOLD, PINK];
    for (let b = 0; b < 34; b++) {
      const u = (b + rnd()) / 34, y = Y0 + 0.06 + u * (Y1 - Y0 - 0.3);
      const a = b * 2.39996 + 0.5 * rnd(), R = envelope(y) + 0.02, rad = 0.032 + 0.026 * (1 - u);
      const cx = Math.cos(a) * R, cy = y - 0.03, cz = Math.sin(a) * R;
      const g = group(cx, cy, cz, POP, T.balls[0] + rnd() * (T.balls[1] - T.balls[0]));
      for (const [px, py, pz] of ball) {
        add(cx + px * rad, cy + py * rad, cz + pz * rad, px, py, pz, BALLS[b % BALLS.length], M.BALL, groups[g].t0, 1, g);
      }
    }

    // lights
    const bulb = fibSphere(14);
    for (let i = tips.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [tips[i], tips[j]] = [tips[j], tips[i]];
    }
    for (const [x, y, z] of tips.slice(0, 170)) {
      const t0 = T.lights[0] + rnd() * (T.lights[1] - T.lights[0]), c = rnd() < 0.8 ? WARM : SOFT, ph = rnd();
      for (const [px, py, pz] of bulb) add(x + px * 0.022, y + py * 0.022, z + pz * 0.022, px, py, pz, c, M.LIGHT, t0, 1, -1, ph);
      lightTimes.push(t0);
    }

    // gifts
    const GIFTS = [
      [0.35, 0.5, 0.2, 0.15, 0.18, 0.4, RED, GOLD], [1.55, 0.47, 0.15, 0.22, 0.15, 0.9, BLUE, SILVER],
      [2.7, 0.52, 0.22, 0.13, 0.19, -0.3, GOLD, RED], [3.9, 0.46, 0.17, 0.17, 0.17, 0.25, BOX_GREEN, GOLD],
      [5.1, 0.5, 0.14, 0.11, 0.14, -0.7, BOX_WHITE, RED]
    ];
    GIFTS.forEach(([ang, dist, w, h, d, tw, body, rib], i) => {
      const gx = Math.cos(ang) * dist, gz = Math.sin(ang) * dist, ct = Math.cos(tw), st = Math.sin(tw);
      const g = group(gx, 0, gz, DROP, T.gifts[0] + i * (T.gifts[1] - T.gifts[0]) / GIFTS.length);
      const t0 = groups[g].t0, band = 0.13 * Math.min(w, d), bow = Math.min(w, d) / 0.17;
      const put = (lx, ly, lz, nx, ny, nz, c, m) => add(gx + lx * ct - lz * st, ly, gz + lx * st + lz * ct,
        nx * ct - nz * st, ny, nx * st + nz * ct, c, m, t0, 1, g);
      const faces = [w * h, w * h, d * h, d * h, w * d];
      const total = faces.reduce((s, f) => s + f, 0);
      for (let n = Math.round(9000 * total); n > 0; n--) {
        let pick = rnd() * total, f = 0;
        while (f < 4 && pick > faces[f]) pick -= faces[f++];
        const p = rnd() - 0.5, q = rnd() - 0.5;
        if (f < 2) {
          const x = p * w, on = Math.abs(x) < band;
          put(x, (q + 0.5) * h, f ? -d / 2 : d / 2, 0, 0, f ? -1 : 1, on ? rib : body, on ? M.RIBBON : M.BOX);
        } else if (f < 4) {
          const z = p * d, on = Math.abs(z) < band;
          put(f === 3 ? -w / 2 : w / 2, (q + 0.5) * h, z, f === 3 ? -1 : 1, 0, 0, on ? rib : body, on ? M.RIBBON : M.BOX);
        } else {
          const x = p * w, z = q * d, on = Math.abs(x) < band || Math.abs(z) < band;
          put(x, h, z, 0, 1, 0, on ? rib : body, on ? M.RIBBON : M.BOX);
        }
      }
      for (const side of [-1, 1]) {
        for (let n = 0; n < 90; n++) {
          const a = TAU * n / 90;
          put(side * bow * (0.03 + 0.028 * Math.cos(a)), h + bow * (0.028 + 0.022 * Math.sin(a)), 0.006 * gauss(),
            side * Math.cos(a), Math.sin(a), 0.3 * gauss(), rib, M.BOW);
        }
      }
    });

    const F32 = a => Float32Array.from(a);
    return {
      n: A.x.length, x: F32(A.x), y: F32(A.y), z: F32(A.z), nx: F32(A.nx), ny: F32(A.ny), nz: F32(A.nz),
      r: F32(A.r), g: F32(A.g), b: F32(A.b), t0: F32(A.t0), k: F32(A.k), ph: F32(A.ph),
      m: Uint8Array.from(A.m), grp: Int16Array.from(A.grp), groups, lightTimes,
      gs: new Float32Array(groups.length), gdy: new Float32Array(groups.length),
    };
  }

  // ── 9. LAYOUT ──
  const CAM = { y: 0.46, d: 3.3, pitch: 0.035 };
  let G = null, S = null;
  function layout(wCss, hCss) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(2, Math.round(wCss * dpr)), H = Math.max(2, Math.round(hCss * dpr));
    const cw = Math.max(dpr >= 2 ? 3 : 6, Math.round(clamp(wCss / 84, 4.4, 7.5) * dpr)), ch = Math.round(cw / 0.6);
    const cols = Math.max(20, Math.floor(W / cw)), rows = Math.max(20, Math.floor(H / ch));
    const ox = (W - cols * cw) >> 1, oy = (H - rows * ch) >> 1, N = cols * rows;
    const sp = Math.sin(CAM.pitch), cp = Math.cos(CAM.pitch);
    const view = y => { const qy = y - CAM.y, qz = -CAM.d; return (qy * cp - qz * sp) / -(qy * sp + qz * cp); };
    const Wg = cols * cw, Hg = rows * ch;
    const F = Math.min(0.64 * Hg / (view(Y1 + 0.09) - view(0)), 0.47 * Wg * CAM.d / 0.7);
    const baseY = oy + 0.76 * Hg, cy = baseY + F * view(0), starY = cy - F * view(Y1 + 0.04);
    G = {
      wCss, hCss, dprRaw: window.devicePixelRatio, W, H, cw, ch, cols, rows, ox, oy, N, sp, cp, F, cx: ox + Wg / 2, cy,
      starY, starR: 0.072 * (baseY - starY), glyph: new Uint16Array(N), zbuf: new Float32Array(N), owner: new Int32Array(N),
      img: new ImageData(cols, rows), letters: 0, lit: 0, deg: 0,
    };
    G.px = G.img.data;
    for (let j = 3; j < G.px.length; j += 4) G.px[j] = 255;
    const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    ui.canvas.width = W; ui.canvas.height = H;
    G.ctx = ui.canvas.getContext('2d');
    G.gcan = canvas(W, H); G.gctx = G.gcan.getContext('2d'); G.gctx.imageSmoothingEnabled = false;
    G.tiny = canvas(cols, rows); G.tctx = G.tiny.getContext('2d');
    G.bloom = [2, 4, 8].map(s => { const c = canvas(Math.ceil(W / s), Math.ceil(H / s)); return { c, ctx: c.getContext('2d'), w: c.width, h: c.height }; });
    G.atlas = buildAtlas(cw, ch);
    const chars = Array.from(OPT.message);
    G.msgText = chars.length * 2 - 1 <= cols - 6 ? Array.from(chars.join(' ')) : chars.slice(0, cols - 4);
    G.msgCol = Math.max(0, (cols - G.msgText.length) >> 1);
    G.msgRow = rows - 8;
    buildSky();
  }

  function buildAtlas(cw, ch) {
    const c = document.createElement('canvas');
    c.width = cw * CHARS.length; c.height = ch;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `600 ${Math.round(ch * 0.84)}px ${MONO}`;
    for (let i = 1; i < CHARS.length; i++) {
      x.save(); x.beginPath(); x.rect(i * cw, 0, cw, ch); x.clip();
      x.fillText(CHARS[i], i * cw + cw / 2, ch * 0.55);
      x.restore();
    }
    return c;
  }

  // ── 10. SKY & GROUND ──
  function buildSky() {
    const { cols, rows, N, cw, ch, ox, oy, F, cx, cy, sp, cp } = G;
    const rnd = mulberry32(2512);
    G.stars = [];
    for (let k = 0; k < N; k++) {
      if (rnd() < 0.05) G.stars.push({ k, b: 0.3 + 0.7 * rnd() * rnd(), sp: 0.7 + 2.3 * rnd(), ph: TAU * rnd() });
    }
    G.flakes = Array.from({ length: Math.round(N * 0.007) }, () => ({
      x: rnd() * cols, y: rnd() * (rows + 6), vy: 1.4 + 2.8 * rnd(), amp: 0.4 + 1.4 * rnd(),
      fr: 0.3 + 0.9 * rnd(), ph: TAU * rnd(), b: 0.45 + 0.5 * rnd(), ch: idx('*+.'[Math.floor(rnd() * 3)]),
    }));
    const gd = G.ground = { on: new Uint8Array(N), ch: new Uint16Array(N), base: new Float32Array(N), at: new Float32Array(N), warm: new Float32Array(N) };
    const horizon = cy - F * Math.tan(CAM.pitch), bottom = oy + rows * ch;
    for (let r = 0; r < rows; r++) {
      const py = oy + (r + 0.5) * ch;
      if (py < horizon + ch * 0.5) continue;
      const dy = -(py - cy) / F, wy = dy * cp - sp, wz = -dy * sp - cp;
      if (wy > -1e-4) continue;
      const dist = -CAM.y / wy;
      const near = clamp((py - horizon) / (bottom - horizon), 0, 1);
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c, gx = (ox + (c + 0.5) * cw - cx) / F * dist, gz = CAM.d + wz * dist;
        gd.on[k] = 1;
        gd.at[k] = T.ground[0] + (T.ground[1] - T.ground[0]) * (1 - near);
        const h = rnd();
        if (h < 0.35) continue;
        const rr = Math.hypot(gx, gz), fog = clamp(2.4 / dist, 0, 1);
        const stripe = Math.abs((((gz * 9) % 1) + 1) % 1 - 0.5) < 0.2;
        gd.ch[k] = idx(h > 0.985 ? '*' : stripe ? '-' : '.');
        gd.base[k] = (0.2 + 0.2 * rnd()) * fog * (0.3 + 0.7 * smooth(0.2, 0.75, rr)) * (h > 0.985 ? 2 : 1);
        gd.warm[k] = Math.exp(-rr * rr * 3.5) * fog;
      }
    }
  }

  // ── 11. FRAME LOOP & SHADING ──
  const LX = -0.48, LY = 0.62, LZ = 0.62;
  const HX = -0.267, HY = 0.344, HZ = 0.9;
  function renderGrid(t) {
    const { cols, rows, N, cw, ch, ox, oy, F, cx, cy, sp, cp, glyph, px, zbuf, owner } = G;
    glyph.fill(0); zbuf.fill(Infinity); owner.fill(-1);
    const put = (k, a, r, g, b) => { glyph[k] = a; const j = k << 2; px[j] = r * 255; px[j + 1] = g * 255; px[j + 2] = b * 255; };

    for (const s of G.stars) {
      const w = s.b * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
      if (w > 0.2) put(s.k, w > 0.5 ? PLUS : DOT, 0.8 * w, 0.86 * w, w);
    }

    let lit = 0;
    for (const lt of S.lightTimes) if (lt <= t) lit++;
    const warmth = 0.45 * lit / S.lightTimes.length, gd = G.ground;
    for (let k = 0; k < N; k++) {
      if (!gd.on[k]) continue;
      const a = smooth(gd.at[k], gd.at[k] + 0.45, t);
      if (a <= 0) continue;
      const b = gd.base[k] * a, w = gd.warm[k] * warmth * a;
      put(k, gd.ch[k], GROUND[0] * b + w, GROUND[1] * b + w * 0.72, GROUND[2] * b + w * 0.4);
    }

    const { groups, gs, gdy } = S;
    for (let i = 0; i < groups.length; i++) {
      const e = t - groups[i].t0;
      if (e < 0) gs[i] = 0;
      else if (groups[i].kind === POP) { gs[i] = backOut(Math.min(1, e / 0.5)); gdy[i] = 0; }
      else { gs[i] = 1; gdy[i] = 0.9 * (1 - bounceOut(Math.min(1, e / 0.85))); }
    }

    const th = t * SPIN, co = Math.cos(th), si = Math.sin(th);
    const X = S.x, Y = S.y, Z = S.z, B0 = S.t0, GR = S.grp, camY = CAM.y, camD = CAM.d;
    for (let i = 0, n = S.n; i < n; i++) {
      if (B0[i] > t) continue;
      let x = X[i], y = Y[i], z = Z[i];
      const gi = GR[i];
      if (gi >= 0) {
        const sc = gs[gi];
        if (sc <= 0) continue;
        if (sc !== 1) { const o = groups[gi]; x = o.x + (x - o.x) * sc; y = o.y + (y - o.y) * sc; z = o.z + (z - o.z) * sc; }
        y += gdy[gi];
      }
      const xr = x * co + z * si, zr = z * co - x * si;
      const qy = y - camY, qz = zr - camD, depth = -(qy * sp + qz * cp);
      if (depth < 0.3) continue;
      const f = F / depth;
      const c = Math.floor((cx + xr * f - ox) / cw), r = Math.floor((cy - (qy * cp - qz * sp) * f - oy) / ch);
      if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
      const k = r * cols + c;
      if (depth < zbuf[k]) { zbuf[k] = depth; owner[k] = i; }
    }

    const NX = S.nx, NY = S.ny, NZ = S.nz, CR = S.r, CG = S.g, CB = S.b, MT = S.m, KK = S.k, PH = S.ph;
    for (let k = 0; k < N; k++) {
      const i = owner[k];
      if (i < 0) continue;
      const m = MT[i];
      const nx = NX[i] * co + NZ[i] * si, ny = NY[i], nz = NZ[i] * co - NX[i] * si;
      const lam = nx * LX + ny * LY + nz * LZ;
      let r = CR[i], g = CG[i], b = CB[i], br;
      if (m === M.LIGHT) br = 0.8 + 0.3 * Math.sin(t * (2.2 + 3 * PH[i]) + PH[i] * 40);
      else if (m === M.BALL || m === M.BOW) {
        const spec = Math.max(0, nx * HX + ny * HY + nz * HZ) ** 16;
        br = 0.25 + 0.8 * Math.max(0, lam) + 0.5 * spec;
        r += spec; g += spec; b += spec;
      } else if (m === M.TINSEL) br = 0.5 + 0.45 * Math.max(0, lam) + 0.4 * Math.max(0, Math.sin(t * 7 + PH[i] * 40));
      else br = KK[i] * (0.3 + 0.8 * clamp((lam + 0.4) / 1.4, 0, 1));
      let a;
      const age = t - B0[i];
      if (age < FLASH && m !== M.BOX && m !== M.RIBBON && m !== M.BOW) {
        const f = 1 - age / FLASH;
        r += (1 - r) * f; g += (1 - g) * f; b += (1 - b) * f;
        br = Math.max(br, 0.75 + 0.45 * f);
        a = f > 0.35 ? HASH : ramp(m, br);
      } else a = ramp(m, br);
      put(k, a, r * br, g * br, b * br);
    }

    for (const fl of G.flakes) {
      const r = Math.round(((fl.y + fl.vy * t) % (rows + 6)) - 3);
      const c = Math.round(fl.x + fl.amp * Math.sin(t * fl.fr + fl.ph));
      if (r < 0 || r >= rows || c < 0 || c >= cols || owner[r * cols + c] >= 0) continue;
      put(r * cols + c, fl.ch, 0.82 * fl.b, 0.88 * fl.b, fl.b);
    }

    drawStar(t, put);
    drawMessage(t, put);

    let letters = 0;
    for (let k = 0; k < N; k++) if (glyph[k]) letters++;
    G.letters = letters; G.lit = lit; G.deg = (th * 180 / Math.PI) % 360;
  }

  // ── 12. STAR ──
  const STAR = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 0.44 : 1, a = -Math.PI / 2 + i * Math.PI / 5;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  function inStar(x, y) {
    let inside = false;
    for (let i = 0, j = 9; i < 10; j = i++) {
      const [xi, yi] = STAR[i], [xj, yj] = STAR[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function drawStar(t, put) {
    if (t < T.star - 0.6) return;
    const { cols, rows, cw, ch, ox, oy, cx: sx, starY: sy, starR: R0 } = G;
    const flash = t < T.star ? 0 : clamp(1 - (t - T.star) / 1.2, 0, 1) ** 2;
    const col = GOLD.map(v => v + (1 - v) * flash);
    const rayIn = smooth(T.star - 0.6, T.star, t);
    for (let k = 0; k < 8; k++) {
      const ang = k * TAU / 8 + 0.06 * Math.sin(t * 0.7);
      if (Math.sin(ang) < -0.3) continue;
      const reach = R0 * rayIn * (2.4 + 0.7 * Math.sin(t * 2.6 + k * 1.3)) * (k % 2 ? 0.6 : 1) * (1 + 2.5 * flash);
      const sym = RAY[Math.round((((ang * 180 / Math.PI) % 180) + 180) % 180 / 45) % 4];
      for (let d = R0 * 0.9; d < reach; d += cw * 0.7) {
        const c = Math.floor((sx + Math.cos(ang) * d - ox) / cw), r = Math.floor((sy - Math.sin(ang) * d - oy) / ch);
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        const fade = 0.3 + 0.6 * (1 - d / reach);
        put(r * cols + c, sym, col[0] * fade, col[1] * fade, col[2] * fade);
      }
    }
    const on = smooth(T.star, T.star + 0.3, t);
    if (on <= 0) return;
    const size = R0 * on * (1 + 0.3 * flash) * (1 + 0.04 * Math.sin(t * 2.3));
    const r0 = Math.max(0, Math.floor((sy - size - oy) / ch)), r1 = Math.min(rows - 1, Math.ceil((sy + size - oy) / ch));
    const c0 = Math.max(0, Math.floor((sx - size - ox) / cw)), c1 = Math.min(cols - 1, Math.ceil((sx + size - ox) / cw));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const dx = ox + (c + 0.5) * cw - sx, dy = oy + (r + 0.5) * ch - sy;
        if (!inStar(dx / size, dy / size)) continue;
        const core = Math.hypot(dx, dy) < 0.36 * size, b = core ? 1.15 : 0.95 + 0.1 * Math.sin(t * 5 + c);
        put(r * cols + c, core ? AT : HASH, col[0] * b, col[1] * b, col[2] * b);
      }
    }
  }

  // ── 13. MESSAGE ──
  function drawMessage(t, put) {
    if (t < T.msg) return;
    const { cols, rows, glyph, msgText: text, msgRow: row, msgCol: x0 } = G;
    const shown = Math.min(text.length, Math.floor((t - T.msg) * 12));
    for (let r = row - 1; r <= row + 1; r++) {
      if (r < 0 || r >= rows) continue;
      for (let c = Math.max(0, x0 - 2); c < Math.min(cols, x0 + shown + 2); c++) glyph[r * cols + c] = 0;
    }
    const PAL = [RED, GOLD, LEAF];
    for (let i = 0, n = 0; i < shown; i++) {
      if (text[i] === ' ') continue;
      const c = PAL[(n++ + Math.floor(t * 1.5)) % 3], b = 0.95 + 0.2 * Math.sin(t * 4 + i * 0.5);
      put(row * cols + x0 + i, idx(text[i]), c[0] * b, c[1] * b, c[2] * b);
    }
    if (shown < text.length && Math.floor(t * 4) % 2 === 0) put(row * cols + x0 + shown, idx('_'), 0.9, 0.9, 0.95);
  }

  // ── 14. PAINT & BLOOM ──
  function paint() {
    const { W, H, cols, rows, cw, ch, ox, oy, glyph, atlas, gctx, ctx } = G;
    gctx.globalCompositeOperation = 'source-over';
    gctx.clearRect(0, 0, W, H);
    for (let r = 0, k = 0; r < rows; r++) {
      const y = oy + r * ch;
      for (let c = 0; c < cols; c++, k++) {
        const a = glyph[k];
        if (a) gctx.drawImage(atlas, a * cw, 0, cw, ch, ox + c * cw, y, cw, ch);
      }
    }
    G.tctx.putImageData(G.img, 0, 0);
    gctx.globalCompositeOperation = 'source-in';
    gctx.drawImage(G.tiny, ox, oy, cols * cw, rows * ch);
    gctx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(G.gcan, 0, 0);
    let src = G.gcan;
    for (const b of G.bloom) { b.ctx.clearRect(0, 0, b.w, b.h); b.ctx.drawImage(src, 0, 0, b.w, b.h); src = b.c; }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55; ctx.drawImage(G.bloom[1].c, 0, 0, W, H);
    ctx.globalAlpha = 0.45; ctx.drawImage(G.bloom[2].c, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 15. POPUP DOM & SHADOW ROOT ──
  const ICON = `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
    <path d="M16 6 10 14h3.2L8 21h4l-6 7h20l-6-7h4l-5.2-7H22z" fill="#2bb673"/>
    <rect x="14.6" y="28" width="2.8" height="3" rx=".6" fill="#9a6a3c"/>
    <circle cx="13" cy="17" r="1.1" fill="#ffd36e"/><circle cx="19.5" cy="20.5" r="1.1" fill="#ff5d5d"/>
    <circle cx="12" cy="24.5" r="1.1" fill="#7fb0ff"/><circle cx="20" cy="25.5" r="1.1" fill="#ffd36e"/>
    <path d="m16 1.2 1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" fill="#ffc45a"/></svg>`;

  const CSS = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }
    button { font: inherit; color: inherit; }
    .launch { position: fixed; right: 22px; bottom: 22px; z-index: 2147483000; width: 56px; height: 56px; padding: 0;
      display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(255, 205, 110, .35); cursor: pointer;
      background: radial-gradient(circle at 50% 30%, #17233a, #070a12 72%);
      box-shadow: 0 8px 26px rgba(0, 0, 0, .45), 0 0 22px rgba(255, 190, 80, .2); transition: transform .25s ease, opacity .25s ease; }
    .launch.left { left: 22px; right: auto; }
    .launch:hover { transform: translateY(-2px) scale(1.06); }
    .launch.hide { opacity: 0; transform: scale(.7); pointer-events: none; }
    .launch.off { display: none; }
    .launch:focus-visible, .ctrl button:focus-visible { outline: 2px solid #ffc45a; outline-offset: 2px; }
    .overlay { position: fixed; inset: 0; z-index: 2147483001; display: grid; place-items: center; padding: 12px;
      background: rgba(3, 5, 10, .62); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
      opacity: 0; transition: opacity .28s ease; }
    .overlay[hidden] { display: none; }
    .overlay.show { opacity: 1; }
    .card { position: relative; display: flex; flex-direction: column; overflow: hidden; outline: none;
      width: min(460px, 100%); aspect-ratio: 23 / 33; max-height: 90vh; max-height: 90dvh;
      background: #060911; color: #a9b1c6; border: 1px solid rgba(255, 255, 255, .08); border-radius: 16px;
      box-shadow: 0 30px 90px rgba(0, 0, 0, .65); font: 11px/1.5 ${MONO};
      transform: translateY(10px) scale(.97); transition: transform .35s cubic-bezier(.2, .8, .2, 1); }
    .overlay.show .card { transform: none; }
    .scene { position: relative; flex: 1 1 auto; min-height: 0;
      background: radial-gradient(120% 60% at 50% 100%, #0c1426 0%, #060911 62%) #060911; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .time { position: absolute; top: 12px; left: 14px; color: #ffc45a; font-size: 10.5px; pointer-events: none; }
    .ctrl { position: absolute; top: 7px; right: 7px; display: flex; gap: 6px; z-index: 10; }
    .ctrl button { width: 32px; height: 32px; padding: 0; display: grid; place-items: center; border: 0; border-radius: 9px;
      cursor: pointer; background: rgba(255, 255, 255, .07); color: #cdd5ea; font-size: 15px; line-height: 1; transition: background .2s; }
    .ctrl button:hover { background: rgba(255, 255, 255, .16); }
    .ctrl button.music.active { background: rgba(95, 227, 192, 0.25); color: #5fe3c0; }

    .hud { position: absolute; left: 14px; bottom: 10px; font-size: 10px; line-height: 1.45; white-space: pre; pointer-events: none;
      color: rgba(150, 160, 186, .85); text-shadow: 0 0 8px #060911, 0 0 2px #060911; }
    .sig { cursor: pointer; pointer-events: auto; }
    .sig:hover { color: #5fe3c0; }

    @media (prefers-reduced-motion: reduce) { .launch, .overlay, .card { transition: none; } }
  `;

  // ── 16. ADMIN MODAL UI (HTML & STYLES) ──
  function buildAdminModal() {
    const adminDiv = document.createElement("div");
    adminDiv.id = "holiday-admin-overlay-container";
    adminDiv.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483002; display: none; place-items: center; padding: 16px;
      background: rgba(3, 6, 12, 0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace; color: #e2e8f0;
    `;
    adminDiv.innerHTML = `
      <div style="width: min(480px, 100%); background: #111624; border: 1px solid #5fe3c0; border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.8); overflow: hidden;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #192033; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <div style="font-weight: 600; font-size: 13px; color: #5fe3c0;">⚙️ Quản Lý Cây Thông & Âm Nhạc</div>
          <button id="admin-close-btn" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
        </div>

        <!-- Auth Gate -->
        <div id="admin-gate-box" style="padding: 20px;">
          <p style="font-size: 12px; margin-top: 0; color: #cbd5e1;">Khu vực quản lý được bảo vệ. Vui lòng nhập mật khẩu:</p>
          <form id="admin-auth-form" onsubmit="return false;" style="margin-top: 12px;">
            <input type="password" id="admin-pwd-input" placeholder="Mật khẩu..." style="width: 100%; box-sizing: border-box; padding: 9px 12px; background: #080c14; border: 1px solid #334155; border-radius: 6px; color: #fff; font-family: inherit; font-size: 13px; outline: none;">
            <div id="admin-pwd-err" style="color: #ef4444; font-size: 11px; margin-top: 6px; display: none;">Mật khẩu không chính xác!</div>
            <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
              <button type="submit" style="padding: 8px 16px; background: #5fe3c0; color: #0b0e15; font-weight: 600; border: none; border-radius: 6px; cursor: pointer;">Mở khoá</button>
            </div>
          </form>
        </div>

        <!-- Dashboard -->
        <div id="admin-dash-box" style="padding: 18px; display: none; max-height: 80vh; overflow-y: auto;">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Link YouTube (URL hoặc Video ID):</label>
            <input type="text" id="admin-yt-url" style="width: 100%; box-sizing: border-box; padding: 8px 10px; background: #080c14; border: 1px solid #334155; border-radius: 6px; color: #fff; font-family: inherit; font-size: 12px;" placeholder="https://www.youtube.com/watch?v=...">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Tên bài hát hiển thị:</label>
            <input type="text" id="admin-yt-title" style="width: 100%; box-sizing: border-box; padding: 8px 10px; background: #080c14; border: 1px solid #334155; border-radius: 6px; color: #fff; font-family: inherit; font-size: 12px;">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Âm lượng mặc định: <span id="admin-vol-text">35</span>%</label>
            <input type="range" id="admin-vol-range" min="0" max="100" value="35" style="width: 100%; accent-color: #5fe3c0;">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Chữ ký ở góc dưới (Signature):</label>
            <input type="text" id="admin-sig-input" style="width: 100%; box-sizing: border-box; padding: 8px 10px; background: #080c14; border: 1px solid #334155; border-radius: 6px; color: #fff; font-family: inherit; font-size: 12px;">
          </div>
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Đổi mật khẩu mới (bỏ trống nếu không đổi):</label>
            <input type="password" id="admin-newpwd-input" placeholder="Nhập mật khẩu mới..." style="width: 100%; box-sizing: border-box; padding: 8px 10px; background: #080c14; border: 1px solid #334155; border-radius: 6px; color: #fff; font-family: inherit; font-size: 12px;">
          </div>

          <!-- Encrypted Git Export -->
          <div style="margin-top: 16px; padding: 12px; background: #090e18; border: 1px solid #1e293b; border-radius: 8px;">
            <div style="font-size: 11px; font-weight: 600; color: #5fe3c0;">📦 Mã hoá cho GitHub Public Repo:</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.4;">
              Mọi thay đổi nhạc/mật khẩu được mã hoá thành chuỗi an toàn bên dưới để không lộ trên GitHub:
            </div>
            <div id="admin-export-code" style="margin-top: 8px; padding: 8px; background: #04060a; border-radius: 4px; font-size: 10px; color: #74ecd0; word-break: break-all; max-height: 80px; overflow-y: auto;"></div>
            <button id="admin-copy-code-btn" style="margin-top: 8px; padding: 6px 12px; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 4px; font-size: 11px; cursor: pointer;">📋 Sao chép mã cấu hình Git</button>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px;">
            <button id="admin-dash-close-btn" style="padding: 7px 14px; background: #1e293b; color: #94a3b8; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">Đóng</button>
            <button id="admin-save-local-btn" style="padding: 7px 14px; background: #5fe3c0; color: #0b0e15; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">💾 Lưu trên máy này</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(adminDiv);

    // Bind Admin Modal Events
    const gateBox = adminDiv.querySelector("#admin-gate-box");
    const dashBox = adminDiv.querySelector("#admin-dash-box");
    const pwdInput = adminDiv.querySelector("#admin-pwd-input");
    const pwdErr = adminDiv.querySelector("#admin-pwd-err");
    const authForm = adminDiv.querySelector("#admin-auth-form");
    const closeBtn = adminDiv.querySelector("#admin-close-btn");
    const dashCloseBtn = adminDiv.querySelector("#admin-dash-close-btn");

    function openAdmin() {
      adminDiv.style.display = "grid";
      pwdInput.value = "";
      pwdInput.focus();
    }
    function closeAdmin() {
      adminDiv.style.display = "none";
    }

    closeBtn.addEventListener("click", closeAdmin);
    dashCloseBtn.addEventListener("click", closeAdmin);

    // Shortcut: Ctrl + Shift + H (or Ctrl + Shift + M)
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && (e.code === "KeyH" || e.code === "KeyM")) {
        e.preventDefault();
        openAdmin();
      }
    });

    // Extract YouTube Video ID
    function extractYtId(url) {
      if (!url) return "";
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? match[1] : (url.length === 11 ? url : "");
    }

    // Populate fields
    function populateDash() {
      adminDiv.querySelector("#admin-yt-url").value = CONFIG.youtubeId ? `https://www.youtube.com/watch?v=${CONFIG.youtubeId}` : "";
      adminDiv.querySelector("#admin-yt-title").value = CONFIG.title || "";
      adminDiv.querySelector("#admin-vol-range").value = CONFIG.volume !== undefined ? CONFIG.volume : 35;
      adminDiv.querySelector("#admin-vol-text").textContent = CONFIG.volume !== undefined ? CONFIG.volume : 35;
      adminDiv.querySelector("#admin-sig-input").value = CONFIG.signature || OPT.signature;
      updateExportPreview();
    }

    async function getFormConfig() {
      const url = adminDiv.querySelector("#admin-yt-url").value.trim();
      const ytId = extractYtId(url) || CONFIG.youtubeId;
      const title = adminDiv.querySelector("#admin-yt-title").value.trim() || "Holiday Music";
      const vol = parseInt(adminDiv.querySelector("#admin-vol-range").value, 10);
      const sig = adminDiv.querySelector("#admin-sig-input").value.trim() || "HaiLC";

      let adminHash = CONFIG.adminHash || DEFAULT_ADMIN_HASH;
      const newPwd = adminDiv.querySelector("#admin-newpwd-input").value.trim();
      if (newPwd.length > 0) {
        adminHash = await sha256(newPwd + (CONFIG.adminSalt || DEFAULT_SALT));
      }

      return {
        youtubeId: ytId,
        title: title,
        volume: vol,
        autoplay: true,
        signature: sig,
        adminHash: adminHash,
        adminSalt: CONFIG.adminSalt || DEFAULT_SALT
      };
    }

    async function updateExportPreview() {
      const cfg = await getFormConfig();
      const encrypted = encryptPayload(cfg);
      const box = adminDiv.querySelector("#admin-export-code");
      if (box) {
        box.textContent = `<script>window.HOLIDAY_CONFIG_PAYLOAD = "${encrypted}";<\/script>`;
      }
    }

    adminDiv.querySelector("#admin-vol-range").addEventListener("input", (e) => {
      adminDiv.querySelector("#admin-vol-text").textContent = e.target.value;
      updateExportPreview();
    });
    adminDiv.querySelector("#admin-yt-url").addEventListener("input", updateExportPreview);
    adminDiv.querySelector("#admin-yt-title").addEventListener("input", updateExportPreview);
    adminDiv.querySelector("#admin-sig-input").addEventListener("input", updateExportPreview);

    authForm.addEventListener("submit", async () => {
      const entered = pwdInput.value.trim();
      const computed = await sha256(entered + (CONFIG.adminSalt || DEFAULT_SALT));
      if (computed === (CONFIG.adminHash || DEFAULT_ADMIN_HASH)) {
        pwdErr.style.display = "none";
        gateBox.style.display = "none";
        dashBox.style.display = "block";
        populateDash();
      } else {
        pwdErr.style.display = "block";
        pwdInput.select();
      }
    });

    // Save locally
    const saveBtn = adminDiv.querySelector("#admin-save-local-btn");
    saveBtn.addEventListener("click", async () => {
      const newCfg = await getFormConfig();
      localStorage.setItem("christmas_tree_custom_cfg", JSON.stringify(newCfg));
      CONFIG = newCfg;
      if (YT) {
        YT.setVolume(CONFIG.volume);
        YT.changeTrack(CONFIG.youtubeId, CONFIG.title);
      }
      if (ui && ui.sig) ui.sig.textContent = CONFIG.signature;
      saveBtn.textContent = "✅ Đã lưu!";
      setTimeout(() => {
        saveBtn.textContent = "💾 Lưu trên máy này";
        closeAdmin();
      }, 900);
    });

    // Copy Git code
    const copyBtn = adminDiv.querySelector("#admin-copy-code-btn");
    copyBtn.addEventListener("click", async () => {
      await updateExportPreview();
      const code = adminDiv.querySelector("#admin-export-code").textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = "✅ Đã sao chép!";
          setTimeout(() => { copyBtn.textContent = "📋 Sao chép mã cấu hình Git"; }, 2000);
        });
      }
    });

    return { openAdmin };
  }

  // ── 17. MOUNT UI ──
  let ui = null, isOpen = false, built = false, prevFocus = null;
  function mount() {
    if (ui) return;
    const host = document.createElement('christmas-tree-popup');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>
      <button type="button" class="launch ${OPT.position}${OPT.button ? '' : ' off'}" aria-label="Mở cây thông Noel" title="Cây thông Noel">${ICON}</button>
      <div class="overlay" hidden>
        <div class="card" role="dialog" aria-modal="true" aria-label="Cây thông Noel" tabindex="-1">
          <div class="scene">
            <canvas role="img" aria-label="Cây thông Noel 3D vẽ bằng ký tự ASCII, đang xoay"></canvas>
            <div class="time"></div>
            <div class="hud"><div class="sig" title="Click 5 lần để mở Quản lý"></div><div class="rot"></div><div class="count"></div></div>
            <div class="ctrl">
              <button type="button" class="music" aria-label="Bật/Tắt nhạc" title="Bật/Tắt nhạc">🎵</button>
              <button type="button" class="replay" aria-label="Chạy lại" title="Chạy lại (R)">↻</button>
              <button type="button" class="close" aria-label="Đóng" title="Đóng (Esc)">✕</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host);
    const $ = s => root.querySelector(s);
    ui = {
      root, launch: $('.launch'), overlay: $('.overlay'), card: $('.card'), scene: $('.scene'), canvas: $('canvas'),
      time: $('.time'), sig: $('.sig'), rot: $('.rot'), count: $('.count'), replay: $('.replay'), close: $('.close'),
      musicBtn: $('.music')
    };

    ui.sig.textContent = CONFIG.signature || OPT.signature;

    // Secret easter egg: 5 clicks on signature opens admin
    let sigClicks = 0;
    ui.sig.addEventListener('click', () => {
      sigClicks++;
      if (sigClicks >= 5) {
        sigClicks = 0;
        adminHandlers.openAdmin();
      }
    });

    // YouTube Controller init
    YT = new YouTubeMusic();
    ui.musicBtn.addEventListener('click', () => YT.toggle());

    ui.launch.addEventListener('click', open);
    ui.close.addEventListener('click', close);
    ui.replay.addEventListener('click', replay);
    ui.overlay.addEventListener('click', e => { if (e.target === ui.overlay) close(); });
    const hold = e => { if (isOpen) e.preventDefault(); };
    ui.overlay.addEventListener('wheel', hold, { passive: false });
    ui.overlay.addEventListener('touchmove', hold, { passive: false });
    new ResizeObserver(() => { if (isOpen && relayout()) draw(); }).observe(ui.scene);
  }

  const adminHandlers = buildAdminModal();

  function relayout() {
    const w = ui.scene.clientWidth, h = ui.scene.clientHeight;
    if (!w || !h || (G && G.wCss === w && G.hCss === h && G.dprRaw === window.devicePixelRatio)) return false;
    layout(w, h);
    return true;
  }

  // ── 18. CLOCK & DRAW LOOP ──
  let raf = 0, tStart = 0, pausedAt = 0, userPaused = false, lastPaint = 0, hudText = '';
  const clock = () => ((pausedAt || performance.now()) - tStart) / 1000;
  function draw() {
    if (!G || !S) return;
    const t = clock();
    renderGrid(t);
    paint();
    const text = `● t ${t.toFixed(2)}s${userPaused ? '  paused' : ''}|rotation ${G.deg.toFixed(2).padStart(6, '0')}°   lights ${G.lit}|letters ${G.letters.toLocaleString('en-US')}`;
    if (text !== hudText) {
      hudText = text;
      const [a, b, c] = text.split('|');
      ui.time.textContent = a; ui.rot.textContent = b; ui.count.textContent = c;
    }
  }
  function loop(ms) {
    raf = requestAnimationFrame(loop);
    if (pausedAt || ms - lastPaint < 1000 / OPT.fps - 2) return;
    lastPaint = ms;
    draw();
  }
  function replay() {
    tStart = performance.now(); pausedAt = 0; userPaused = false;
  }
  function togglePause() {
    if (userPaused) { tStart += performance.now() - pausedAt; pausedAt = 0; userPaused = false; }
    else { pausedAt = performance.now(); userPaused = true; draw(); }
  }
  document.addEventListener('visibilitychange', () => {
    if (!isOpen || userPaused) return;
    if (document.hidden) pausedAt = performance.now();
    else if (pausedAt) { tStart += performance.now() - pausedAt; pausedAt = 0; }
  });

  function onKey(e) {
    if (!isOpen) return;
    const onButton = ui.root.activeElement && ui.root.activeElement.tagName === 'BUTTON';
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if ((e.key === ' ' || e.key === 'Spacebar') && !onButton) { e.preventDefault(); togglePause(); }
    else if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); replay(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const order = [ui.musicBtn, ui.replay, ui.close], i = order.indexOf(ui.root.activeElement);
      order[(i + (e.shiftKey ? order.length - 1 : 1) + order.length) % order.length].focus();
    }
  }

  function open() {
    if (isOpen) return;
    if (!ui) mount();
    isOpen = true;
    ui.overlay.hidden = false;
    void ui.overlay.offsetWidth;
    ui.overlay.classList.add('show');
    ui.launch.classList.add('hide');
    if (!built) { built = true; S = buildScene(); }
    relayout();
    replay();
    prevFocus = document.activeElement;
    ui.card.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey, true);
    cancelAnimationFrame(raf);
    lastPaint = 0;
    raf = requestAnimationFrame(loop);

    // Play YouTube music on open!
    if (YT && (CONFIG.autoplay !== false)) {
      YT.play();
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    cancelAnimationFrame(raf);
    ui.overlay.classList.remove('show');
    setTimeout(() => { if (!isOpen) ui.overlay.hidden = true; }, 300);
    ui.launch.classList.remove('hide');
    document.removeEventListener('keydown', onKey, true);
    if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });

    // Stop YouTube music on close!
    if (YT) {
      YT.pause();
    }
  }

  // ── 19. BOOT ──
  function shouldAutoOpen() {
    if (OPT.open === 'never') return false;
    if (OPT.open === 'always') return true;
    try {
      const store = OPT.open === 'once' ? localStorage : sessionStorage, key = 'christmas-tree-popup:seen';
      if (store.getItem(key)) return false;
      store.setItem(key, '1');
    } catch (e) {}
    return true;
  }

  function boot() {
    mount();
    if (shouldAutoOpen()) setTimeout(open, OPT.delay);

    // Autoplay fallback for strict browser audio policy
    const userInteract = () => {
      if (isOpen && YT && !YT.isPlaying && CONFIG.autoplay !== false) {
        YT.play();
      }
      window.removeEventListener('click', userInteract);
      window.removeEventListener('keydown', userInteract);
    };
    window.addEventListener('click', userInteract, { once: true });
    window.addEventListener('keydown', userInteract, { once: true });
  }

  window.ChristmasTree = {
    open: () => { if (document.body) open(); },
    close: () => { if (ui) close(); },
    toggle: () => { if (isOpen) close(); else if (document.body) open(); },
    replay: () => { if (isOpen) replay(); else if (document.body) open(); },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
