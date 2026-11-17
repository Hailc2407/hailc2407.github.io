/**
 * holiday-widget.js
 * 3D ASCII Christmas Tree, YouTube Background Music & Secret Admin Management
 * Designed for Le Canh Hai Academic Homepage
 * 
 * Secret Shortcut to Admin: Ctrl + Shift + H (or Ctrl + Shift + M)
 * Default Password: hailc@xmas2026
 */
(() => {
  "use strict";

  /* ==========================================================================
     1. CRYPTOGRAPHY & CONFIGURATION ENCRYPTION
     ========================================================================== */
  const APP_CIPHER_KEY = "HailcMathOptimization2026";
  const DEFAULT_SALT = "hailc2407_math_xmas_2026";
  // Default password 'hailc@xmas2026' with DEFAULT_SALT
  const DEFAULT_ADMIN_HASH = "bcdfbe35bb6dc64ba928a97bb2eb2b8e30b9f98d1ebaec812dad21a2fca2ddda";

  // Light, fast, dependency-free reversible cipher for public repo obfuscation
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
      console.warn("Failed to decrypt holiday payload:", e);
      return null;
    }
  }

  // SHA-256 Hash using browser Web Crypto API
  async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /* ==========================================================================
     2. DEFAULT ENCRYPTED CONFIGURATION (Git-Safe: No Plaintext Info)
     ========================================================================== */
  // Raw default config:
  // youtubeId: "gl1aHhXnN1k" (Lofi Christmas Chill Beats)
  // title: "Christmas Lofi Chill Beats"
  // volume: 35
  // autoplay: true, animation: "tree3d", treeSpeed: 1.0, snowDensity: 50, position: "bottom-right", enabled: true
  const DEFAULT_GIT_PAYLOAD = "M1IyMFJscmGFn77tn5Cl4h1kOmRSDyj7n4r5jpCsxwcgNWgBKjzJvbqq18H3/l1cIjt1ZHTJtoKw0d6EzhwWNloJLyfPjKfpjYa5kVdUcWkxICSKrqGt3tnh+UhSZCVTJySchc61wdLm1R8GKxwcETnOj6uw1IzstBcKO353WmO/goq31J+Tp01ed34WHml4kLjEloig1xIIZ2MmCCk64PK1xM3k+w4ML3QeSX4t16Olx9Otyw0FJwMbAiIzgYqv1tTo+RQfNHVyTWY7z/Kur9XH7D8cOzcfAz0xhpH76J+zilYYKmBvVSolp4rh5pvXs1cEKGlOBmUoh7f55cOExFhdLk1RQ25/gtv6/cHT5P8RcjZtVm0ogLGsr4G/vagHKTVRXEN9hY24s9jPzP0OHzA+BycrlYuypczs6fAYBB8cU2B3kPHn/NfSyOgMFhQ7BjI/yK2wsMKc1KBSSG9dZitg";

  function loadActiveConfig() {
    // 1. Check external payload if defined in HTML or window
    const basePayload = window.HOLIDAY_CONFIG_PAYLOAD || DEFAULT_GIT_PAYLOAD;
    let config = decryptPayload(basePayload) || {
      youtubeId: "gl1aHhXnN1k",
      title: "Christmas Lofi Chill Beats",
      volume: 35,
      autoplay: true,
      animation: "tree3d",
      treeSpeed: 1.0,
      snowDensity: 50,
      position: "bottom-right",
      enabled: true,
      adminHash: DEFAULT_ADMIN_HASH,
      adminSalt: DEFAULT_SALT
    };

    // 2. Override with localStorage if user customized on this browser
    try {
      const local = localStorage.getItem("holiday_custom_config");
      if (local) {
        const parsed = JSON.parse(local);
        config = Object.assign(config, parsed);
      }
    } catch (e) {}

    return config;
  }

  let CONFIG = loadActiveConfig();

  /* ==========================================================================
     3. 3D ASCII CHRISTMAS TREE GENERATIVE ENGINE
     ========================================================================== */
  class AsciiTreeEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.cols = 46;
      this.rows = 38;
      this.points = [];
      this.snow = [];
      this.rotation = 0;
      this.rotationSpeed = 0.016 * (CONFIG.treeSpeed || 1.0);
      this.time = 0;
      this.isRunning = false;
      this.isDragging = false;
      this.lastMouseX = 0;

      this.initGeometry();
      this.initSnow();
      this.bindEvents();
    }

    initGeometry() {
      this.points = [];
      const prng = (seed) => {
        let s = seed;
        return () => {
          s = (s * 9301 + 49297) % 233280;
          return s / 233280;
        };
      };
      const rand = prng(42);

      // 1. Needles / Branch whorls (Conical pine structure)
      const whorls = 24;
      const y0 = -1.25;
      const y1 = 1.65;
      for (let i = 0; i < whorls; i++) {
        const u = i / (whorls - 1);
        const y = y0 + u * (y1 - y0);
        // Envelope curve: wider base, gentle flare
        const R = (1.45 * Math.pow(1 - u, 0.92) + 0.08) * (1 + 0.12 * Math.sin(u * 14));
        const nb = Math.round(5 + 13 * (1 - u));

        for (let b = 0; b < nb; b++) {
          const a = (2 * Math.PI * (b + 0.5 * rand())) / nb + i * 0.77;
          const branchLen = R * (0.86 + 0.22 * rand());
          const steps = 6 + Math.floor((1 - u) * 4);

          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const r_curr = branchLen * t;
            // Drooping branch parabola: y drops slightly towards tips
            const pt_y = y - 0.22 * Math.pow(t, 2.1) + (rand() - 0.5) * 0.04;
            const pt_x = r_curr * Math.cos(a) + (rand() - 0.5) * 0.04;
            const pt_z = r_curr * Math.sin(a) + (rand() - 0.5) * 0.04;

            // Character based on branch density and t
            const needleChars = ["*", "&", "%", "X", "W", "v", "x", "#", "~", "^"];
            const char = needleChars[Math.floor(rand() * needleChars.length)];

            // Color gradient: minty emerald, bright tips, deeper core
            const greenShades = ["#22c55e", "#10b981", "#34d399", "#4ade80", "#16a34a", "#86efac"];
            const color = greenShades[Math.floor(rand() * greenShades.length)];

            this.points.push({
              x: pt_x,
              y: pt_y,
              z: pt_z,
              char: char,
              color: color,
              type: "needle"
            });

            // Fairy light at branch tip
            if (s === steps && rand() < 0.7) {
              this.points.push({
                x: pt_x * 1.02,
                y: pt_y,
                z: pt_z * 1.02,
                char: "@",
                color: "#fde047",
                type: "light",
                phase: rand() * Math.PI * 2
              });
            }
          }
        }
      }

      // 2. Baubles / Ornaments on tree exterior
      const baublesCount = 34;
      for (let k = 0; k < baublesCount; k++) {
        const u = (k + rand()) / baublesCount;
        const y = y0 + 0.12 + u * (y1 - y0 - 0.28);
        const a = k * 2.39996 + rand() * 0.4;
        const R = (1.45 * Math.pow(1 - u, 0.92) + 0.06);
        const pt_x = R * Math.cos(a);
        const pt_z = R * Math.sin(a);
        const pt_y = y - 0.06;

        const isRed = k % 2 === 0;
        this.points.push({
          x: pt_x,
          y: pt_y,
          z: pt_z,
          char: isRed ? "O" : "o",
          color: isRed ? "#ef4444" : "#fbbf24",
          type: "bauble",
          pulse: rand() * 2
        });
      }

      // 3. Glowing Golden Star at the top
      const starY = y1 + 0.15;
      const starPoints = [
        { x: 0, y: starY + 0.2, z: 0, char: "#", color: "#fef08a" },
        { x: -0.08, y: starY + 0.12, z: 0, char: "@", color: "#fbbf24" },
        { x: 0.08, y: starY + 0.12, z: 0, char: "@", color: "#fbbf24" },
        { x: 0, y: starY + 0.1, z: 0, char: "#", color: "#fff" },
        { x: -0.15, y: starY + 0.06, z: 0, char: "*", color: "#facc15" },
        { x: 0.15, y: starY + 0.06, z: 0, char: "*", color: "#facc15" },
        { x: 0, y: starY, z: 0, char: "+", color: "#fbbf24" },
        { x: 0, y: starY + 0.08, z: 0.1, char: "*", color: "#fef08a" },
        { x: 0, y: starY + 0.08, z: -0.1, char: "*", color: "#fef08a" }
      ];
      starPoints.forEach(p => {
        p.type = "star";
        this.points.push(p);
      });

      // 4. Wooden Trunk at the bottom
      for (let ty = -1.25; ty >= -1.68; ty -= 0.08) {
        const trunkR = 0.24;
        for (let ta = 0; ta < Math.PI * 2; ta += 0.5) {
          this.points.push({
            x: trunkR * Math.cos(ta),
            y: ty,
            z: trunkR * Math.sin(ta),
            char: ["#", "X", "%", "H"][Math.floor(rand() * 4)],
            color: "#92400e",
            type: "trunk"
          });
        }
      }

      // 5. Gift box at base
      const giftColors = ["#dc2626", "#fbbf24", "#3b82f6"];
      for (let gx = -0.4; gx <= -0.1; gx += 0.12) {
        for (let gy = -1.68; gy <= -1.45; gy += 0.1) {
          this.points.push({
            x: gx,
            y: gy,
            z: 0.55,
            char: gx === -0.25 || gy === -1.55 ? "+" : "#",
            color: gx === -0.25 || gy === -1.55 ? "#fbbf24" : giftColors[0],
            type: "gift"
          });
        }
      }
    }

    initSnow() {
      this.snow = [];
      const count = CONFIG.snowDensity || 50;
      for (let i = 0; i < count; i++) {
        this.snow.push({
          x: (Math.random() - 0.5) * 4.6,
          y: (Math.random() - 0.5) * 4.2,
          z: (Math.random() - 0.5) * 4.6,
          speed: 0.008 + Math.random() * 0.014,
          sway: Math.random() * Math.PI * 2,
          char: ["*", "+", ".", "·", "'"][Math.floor(Math.random() * 5)],
          color: Math.random() > 0.4 ? "#e2e8f0" : "#94a3b8"
        });
      }
    }

    bindEvents() {
      const container = this.canvas.parentElement;
      container.addEventListener("mousedown", (e) => {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
      });
      window.addEventListener("mousemove", (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - this.lastMouseX;
        this.rotation += dx * 0.02;
        this.lastMouseX = e.clientX;
      });
      window.addEventListener("mouseup", () => {
        this.isDragging = false;
      });
      // Touch support
      container.addEventListener("touchstart", (e) => {
        if (e.touches.length > 0) {
          this.isDragging = true;
          this.lastMouseX = e.touches[0].clientX;
        }
      }, { passive: true });
      window.addEventListener("touchmove", (e) => {
        if (!this.isDragging || e.touches.length === 0) return;
        const dx = e.touches[0].clientX - this.lastMouseX;
        this.rotation += dx * 0.02;
        this.lastMouseX = e.touches[0].clientX;
      }, { passive: true });
      window.addEventListener("touchend", () => {
        this.isDragging = false;
      });
    }

    render() {
      if (!this.isRunning) return;

      this.time += 0.03;
      if (!this.isDragging) {
        this.rotation += this.rotationSpeed;
      }

      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      // Clear Canvas
      ctx.fillStyle = "#07090e";
      ctx.fillRect(0, 0, w, h);

      // Terminal Monospace Grid Buffer
      // cols x rows
      const cols = this.cols;
      const rows = this.rows;
      const cellW = w / cols;
      const cellH = (h - 22) / rows; // reserve bottom row for Merry Christmas text

      const grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => null)
      );

      const cos = Math.cos(this.rotation);
      const sin = Math.sin(this.rotation);
      const camDist = 3.9;

      // 1. Project Snow
      for (let s of this.snow) {
        s.y -= s.speed;
        s.sway += 0.03;
        const sx = s.x + Math.sin(s.sway) * 0.08;
        if (s.y < -2.1) {
          s.y = 2.2;
          s.x = (Math.random() - 0.5) * 4.6;
        }

        const rotZ = sx * sin + s.z * cos;
        const rotX = sx * cos - s.z * sin;
        const depth = camDist + rotZ;
        if (depth > 0.4) {
          const px = Math.round(cols / 2 + (rotX * 24) / depth);
          const py = Math.round(rows / 2 - (s.y * 19) / depth);
          if (px >= 0 && px < cols && py >= 0 && py < rows) {
            if (!grid[py][px] || grid[py][px].z < rotZ) {
              grid[py][px] = {
                char: s.char,
                color: s.color,
                z: rotZ
              };
            }
          }
        }
      }

      // 2. Project Tree Points
      for (let pt of this.points) {
        const rotX = pt.x * cos - pt.z * sin;
        const rotZ = pt.x * sin + pt.z * cos;
        const depth = camDist + rotZ;
        if (depth <= 0.4) continue;

        const px = Math.round(cols / 2 + (rotX * 28) / depth);
        const py = Math.round(rows / 2 - (pt.y * 22) / depth - 1);

        if (px >= 0 && px < cols && py >= 0 && py < rows) {
          // Z-buffer check
          if (!grid[py][px] || grid[py][px].z < rotZ) {
            let char = pt.char;
            let color = pt.color;

            // Twinkle fairy lights
            if (pt.type === "light") {
              const pulse = Math.sin(this.time * 5 + pt.phase);
              if (pulse < -0.2) {
                char = ".";
                color = "#854d0e";
              } else if (pulse > 0.6) {
                char = "*";
                color = "#fef08a";
              }
            } else if (pt.type === "star") {
              const starPulse = Math.sin(this.time * 3);
              color = starPulse > 0.2 ? "#fff" : "#fbbf24";
            }

            grid[py][px] = {
              char: char,
              color: color,
              z: rotZ
            };
          }
        }
      }

      // 3. Draw Grid to Canvas
      ctx.font = "bold 11px 'JetBrains Mono', Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell) {
            ctx.fillStyle = cell.color;
            ctx.fillText(cell.char, c * cellW + cellW / 2, r * cellH + cellH / 2);
          }
        }
      }

      // 4. Draw Festive Banner at Bottom
      const bannerText = "M E R R Y   C H R I S T M A S";
      const bannerY = h - 11;
      const startX = (w - bannerText.length * 7.5) / 2;
      for (let i = 0; i < bannerText.length; i++) {
        const ch = bannerText[i];
        if (ch === " ") continue;
        const hue = ((this.time * 40 + i * 22) % 360);
        ctx.fillStyle = `hsl(${hue}, 85%, 65%)`;
        ctx.fillText(ch, startX + i * 7.5, bannerY);
      }

      requestAnimationFrame(() => this.render());
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.render();
    }

    stop() {
      this.isRunning = false;
    }
  }

  /* ==========================================================================
     4. ALTERNATIVE ANIMATION: MATRIX MATH RAIN (For Applied Mathematics)
     ========================================================================== */
  class MatrixMathEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.chars = "01∂∇∑∫λμπ∞≠≈√∈ℝℂ±§θφΨΩ";
      this.fontSize = 12;
      this.columns = Math.floor(canvas.width / this.fontSize);
      this.drops = Array(this.columns).fill(1);
      this.isRunning = false;
    }

    render() {
      if (!this.isRunning) return;
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(7, 9, 14, 0.12)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = "#5fe3c0";
      ctx.font = `${this.fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < this.drops.length; i++) {
        const text = this.chars[Math.floor(Math.random() * this.chars.length)];
        const x = i * this.fontSize;
        const y = this.drops[i] * this.fontSize;

        ctx.fillStyle = Math.random() > 0.85 ? "#fff" : "#5fe3c0";
        ctx.fillText(text, x, y);

        if (y > this.canvas.height && Math.random() > 0.975) {
          this.drops[i] = 0;
        }
        this.drops[i]++;
      }
      requestAnimationFrame(() => this.render());
    }

    start() {
      this.isRunning = true;
      this.render();
    }

    stop() {
      this.isRunning = false;
    }
  }

  /* ==========================================================================
     5. YOUTUBE MUSIC CONTROLLER (Hidden Iframe API + postMessage)
     ========================================================================== */
  class YouTubeController {
    constructor(onStateChange) {
      this.onStateChange = onStateChange;
      this.isPlaying = false;
      this.isMuted = false;
      this.volume = CONFIG.volume !== undefined ? CONFIG.volume : 35;
      this.iframe = null;
      this.createIframe();
    }

    createIframe() {
      let iframe = document.getElementById("holiday-yt-hidden-frame");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "holiday-yt-hidden-frame";
        iframe.src = `https://www.youtube-nocookie.com/embed/${CONFIG.youtubeId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&playsinline=1&controls=0&loop=1&playlist=${CONFIG.youtubeId}`;
        iframe.allow = "autoplay";
        document.body.appendChild(iframe);
      }
      this.iframe = iframe;
    }

    sendCommand(func, args = "") {
      if (!this.iframe || !this.iframe.contentWindow) return;
      this.iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: func, args: args }),
        "*"
      );
    }

    play() {
      this.sendCommand("playVideo");
      this.sendCommand("unMute");
      this.sendCommand("setVolume", [this.volume]);
      this.isPlaying = true;
      this.onStateChange(true);
    }

    pause() {
      this.sendCommand("pauseVideo");
      this.isPlaying = false;
      this.onStateChange(false);
    }

    toggle() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    setVolume(vol) {
      this.volume = Math.max(0, Math.min(100, vol));
      this.sendCommand("setVolume", [this.volume]);
      if (this.volume > 0 && this.isMuted) {
        this.unmute();
      }
    }

    mute() {
      this.sendCommand("mute");
      this.isMuted = true;
    }

    unmute() {
      this.sendCommand("unMute");
      this.isMuted = false;
    }

    changeTrack(videoId, title) {
      CONFIG.youtubeId = videoId;
      CONFIG.title = title || "Custom Track";
      if (this.iframe) {
        this.iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&playsinline=1&controls=0&loop=1&playlist=${videoId}`;
        setTimeout(() => {
          if (this.isPlaying) this.play();
        }, 1200);
      }
    }
  }

  /* ==========================================================================
     6. UI BUILDER: WIDGET, LAUNCHER & ADMIN MODAL
     ========================================================================== */
  function buildWidgetMarkup() {
    const isBottomLeft = CONFIG.position === "bottom-left";
    const posClass = isBottomLeft ? "pos-bottom-left" : "";

    // 1. Floating Widget Container
    const widget = document.createElement("div");
    widget.id = "holiday-widget-root";
    widget.className = `holiday-widget ${posClass}`;
    widget.innerHTML = `
      <div class="holiday-header">
        <div class="holiday-title" id="holiday-widget-drag-handle">
          <span>🎄</span>
          <span style="font-size: 11px;">ASCII Xmas</span>
          <div class="holiday-eq-bars" title="Âm thanh Giáng sinh">
            <span class="holiday-eq-bar"></span>
            <span class="holiday-eq-bar"></span>
            <span class="holiday-eq-bar"></span>
          </div>
        </div>
        <div class="holiday-header-actions">
          <div class="holiday-guide-tooltip" id="holiday-guide-tooltip" role="tooltip">
            <div class="tooltip-header">
              <span>💡 Hướng dẫn</span>
              <button class="tooltip-close" id="holiday-guide-close" title="Đóng hướng dẫn">✕</button>
            </div>
            <div>Bấm vào đây để tắt hoạt hoạ và nhạc bất kỳ lúc nào!</div>
          </div>
          <button class="holiday-btn-icon holiday-btn-close" id="holiday-btn-close" title="Đóng cây thông & tắt nhạc (✕)">✕</button>
        </div>
      </div>

      <div class="holiday-canvas-container">
        <canvas class="holiday-canvas" id="holiday-tree-canvas" width="290" height="290"></canvas>
        <div class="holiday-drag-hint">⇄ Kéo chuột để xoay 3D</div>
      </div>

      <div class="holiday-player-bar">
        <button class="holiday-play-btn" id="holiday-play-toggle" title="Phát / Dừng nhạc">▶</button>
        <div class="holiday-track-info">
          <div class="holiday-track-title" id="holiday-track-title">${CONFIG.title || "Holiday Chill Beats"}</div>
        </div>
        <div class="holiday-volume-wrap">
          <button class="holiday-vol-icon" id="holiday-vol-toggle" title="Bật/Tắt tiếng">🔊</button>
          <input type="range" class="holiday-vol-slider" id="holiday-vol-slider" min="0" max="100" value="${CONFIG.volume !== undefined ? CONFIG.volume : 35}" title="Âm lượng">
        </div>
      </div>
    `;

    // 2. Minimized Launcher
    const launcher = document.createElement("button");
    launcher.id = "holiday-widget-launcher";
    launcher.className = `holiday-launcher is-hidden ${posClass}`;
    launcher.innerHTML = `<span>🎄</span><span>Cây Thông & Nhạc</span>`;
    launcher.title = "Mở lại cây thông & nhạc Giáng sinh";

    // 3. Admin Modal
    const adminOverlay = document.createElement("div");
    adminOverlay.id = "holiday-admin-overlay";
    adminOverlay.className = "holiday-admin-overlay";
    adminOverlay.innerHTML = `
      <div class="holiday-admin-card" role="dialog" aria-modal="true" aria-labelledby="holiday-admin-heading">
        <div class="holiday-admin-header">
          <h2 id="holiday-admin-heading">⚙️ Quản lý Hoạt Hoạ & Âm Nhạc</h2>
          <button class="holiday-btn-icon" id="holiday-admin-close" title="Đóng cửa sổ">✕</button>
        </div>

        <!-- State 1: Password Gate -->
        <div class="holiday-admin-body" id="holiday-admin-gate-view">
          <p style="font-size: 13px; color: #c5ccda; margin-top: 0;">
            Khu vực quản lý được bảo vệ. Vui lòng nhập mật khẩu:
          </p>
          <form id="holiday-admin-auth-form" onsubmit="return false;">
            <div class="holiday-form-group">
              <label for="holiday-admin-pwd-input">Mật khẩu:</label>
              <input type="password" id="holiday-admin-pwd-input" class="holiday-form-control" placeholder="Nhập mật khẩu..." autofocus>
              <div id="holiday-admin-pwd-err" style="color: #ef4444; font-size: 11px; margin-top: 6px; display: none;">Mật khẩu không chính xác!</div>
            </div>
            <div class="holiday-admin-actions">
              <button type="submit" class="holiday-btn holiday-btn-primary" id="holiday-admin-auth-btn">Mở khoá</button>
            </div>
          </form>
        </div>

        <!-- State 2: Main Admin Dashboard -->
        <div class="holiday-admin-body" id="holiday-admin-dash-view" style="display: none;">
          <div class="holiday-admin-tabs">
            <button class="holiday-admin-tab is-active" data-tab="music">🎵 Âm nhạc</button>
            <button class="holiday-admin-tab" data-tab="animation">🎄 Hoạt hoạ</button>
            <button class="holiday-admin-tab" data-tab="security">🔒 Bảo mật & Git</button>
          </div>

          <!-- Tab 1: Music -->
          <div class="holiday-tab-pane" id="holiday-tab-music">
            <div class="holiday-form-group">
              <label for="admin-yt-url">Link YouTube (URL hoặc Video ID):</label>
              <input type="text" id="admin-yt-url" class="holiday-form-control" placeholder="https://www.youtube.com/watch?v=...">
              <div class="form-hint">Hỗ trợ link full, link rút gọn youtu.be hoặc ID video 11 ký tự.</div>
            </div>
            <div class="holiday-form-group">
              <label for="admin-song-title">Tên bài hát hiển thị:</label>
              <input type="text" id="admin-song-title" class="holiday-form-control" placeholder="Ví dụ: We Wish You A Merry Christmas">
            </div>
            <div class="holiday-form-group">
              <label for="admin-default-vol">Âm lượng mặc định: <span id="admin-vol-val">35</span>%</label>
              <input type="range" id="admin-default-vol" class="holiday-vol-slider" style="width: 100%;" min="0" max="100" value="35">
            </div>
            <div class="holiday-switch-row">
              <div>
                <div class="holiday-switch-label">Tự động phát khi tải trang</div>
                <div class="holiday-switch-sub">Nếu trình duyệt chặn tiếng, khách click vào web sẽ tự phát</div>
              </div>
              <label class="holiday-switch">
                <input type="checkbox" id="admin-autoplay-toggle">
                <span class="holiday-slider-toggle"></span>
              </label>
            </div>
          </div>

          <!-- Tab 2: Animation -->
          <div class="holiday-tab-pane" id="holiday-tab-animation" style="display: none;">
            <div class="holiday-form-group">
              <label for="admin-anim-type">Loại hoạt hoạ:</label>
              <select id="admin-anim-type" class="holiday-form-control">
                <option value="tree3d">🎄 3D ASCII Christmas Tree (Chuẩn video)</option>
                <option value="matrix">💻 Matrix Math Rain (Toán ứng dụng)</option>
              </select>
            </div>
            <div class="holiday-form-group">
              <label for="admin-anim-speed">Tốc độ xoay cây thông:</label>
              <input type="range" id="admin-anim-speed" class="holiday-vol-slider" style="width: 100%;" min="0.2" max="3" step="0.1" value="1.0">
            </div>
            <div class="holiday-form-group">
              <label for="admin-snow-density">Mật độ tuyết rơi:</label>
              <input type="range" id="admin-snow-density" class="holiday-vol-slider" style="width: 100%;" min="10" max="120" step="5" value="50">
            </div>
            <div class="holiday-form-group">
              <label for="admin-widget-pos">Vị trí hiển thị:</label>
              <select id="admin-widget-pos" class="holiday-form-control">
                <option value="bottom-right">Góc dưới bên Phải (Mặc định)</option>
                <option value="bottom-left">Góc dưới bên Trái</option>
              </select>
            </div>
          </div>

          <!-- Tab 3: Security & Git Encrypted Sync -->
          <div class="holiday-tab-pane" id="holiday-tab-security" style="display: none;">
            <div class="holiday-form-group">
              <label>Đổi mật khẩu Quản lý:</label>
              <input type="password" id="admin-new-pwd" class="holiday-form-control" placeholder="Mật khẩu mới (bỏ trống nếu không đổi)">
            </div>
            <div style="font-size: 12px; color: #c5ccda; margin-top: 14px; margin-bottom: 6px; font-weight: 600;">
              📦 Xuất cấu hình đã mã hoá cho GitHub Repo (Công khai):
            </div>
            <div style="font-size: 11px; color: #8e97aa; line-height: 1.4;">
              Vì repository công khai, thông tin nhạc và mật khẩu được mã hoá an toàn. Bấm nút dưới để tạo payload đã mã hoá dán vào file <code>index.html</code> hoặc <code>content.js</code>:
            </div>
            <div class="holiday-code-block" id="holiday-export-code">// Bấm 'Tạo mã Git' bên dưới để nhận mã...</div>
            <button type="button" class="holiday-btn holiday-btn-secondary" id="holiday-copy-code-btn" style="margin-top: 8px;">📋 Sao chép mã cấu hình</button>
          </div>

          <div class="holiday-admin-actions">
            <button type="button" class="holiday-btn holiday-btn-secondary" id="holiday-admin-cancel-btn">Đóng</button>
            <button type="button" class="holiday-btn holiday-btn-primary" id="holiday-admin-save-local-btn">💾 Lưu trên trình duyệt này</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    document.body.appendChild(launcher);
    document.body.appendChild(adminOverlay);

    return { widget, launcher, adminOverlay };
  }

  /* ==========================================================================
     7. INITIALIZATION & CONTROLLER ORCHESTRATION
     ========================================================================== */
  function init() {
    const { widget, launcher, adminOverlay } = buildWidgetMarkup();

    // 1. Setup Canvas Animation Engine
    const canvas = document.getElementById("holiday-tree-canvas");
    let currentEngine = null;

    function applyEngine(type) {
      if (currentEngine) currentEngine.stop();
      if (type === "matrix") {
        currentEngine = new MatrixMathEngine(canvas);
      } else {
        currentEngine = new AsciiTreeEngine(canvas);
      }
      currentEngine.start();
    }

    applyEngine(CONFIG.animation || "tree3d");

    // 2. Setup YouTube Controller
    const yt = new YouTubeController((isPlaying) => {
      const playBtn = document.getElementById("holiday-play-toggle");
      if (isPlaying) {
        widget.classList.add("is-playing");
        if (playBtn) playBtn.innerHTML = "⏸";
      } else {
        widget.classList.remove("is-playing");
        if (playBtn) playBtn.innerHTML = "▶";
      }
    });

    // 3. Bind Widget Controls
    const playToggleBtn = document.getElementById("holiday-play-toggle");
    if (playToggleBtn) {
      playToggleBtn.addEventListener("click", () => yt.toggle());
    }

    const volSlider = document.getElementById("holiday-vol-slider");
    if (volSlider) {
      volSlider.addEventListener("input", (e) => {
        yt.setVolume(parseInt(e.target.value, 10));
      });
    }

    const volToggleBtn = document.getElementById("holiday-vol-toggle");
    if (volToggleBtn) {
      volToggleBtn.addEventListener("click", () => {
        if (yt.isMuted) {
          yt.unmute();
          volToggleBtn.textContent = "🔊";
        } else {
          yt.mute();
          volToggleBtn.textContent = "🔇";
        }
      });
    }

    // Close button: Closes widget AND stops music!
    const closeBtn = document.getElementById("holiday-btn-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        widget.classList.add("is-hidden");
        launcher.classList.remove("is-hidden");
        yt.pause(); // Stops music on close!
      });
    }

    // Launcher button: Opens widget and resumes music
    launcher.addEventListener("click", () => {
      launcher.classList.add("is-hidden");
      widget.classList.remove("is-hidden");
      yt.play();
    });

    // 4. Guide Tooltip on first visit
    const guideTooltip = document.getElementById("holiday-guide-tooltip");
    const guideCloseBtn = document.getElementById("holiday-guide-close");
    const hasSeenGuide = sessionStorage.getItem("holiday_guide_dismissed");

    if (hasSeenGuide && guideTooltip) {
      guideTooltip.style.display = "none";
    } else if (guideTooltip) {
      const dismissGuide = () => {
        guideTooltip.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        guideTooltip.style.opacity = "0";
        guideTooltip.style.transform = "translateX(10px)";
        setTimeout(() => {
          if (guideTooltip) guideTooltip.style.display = "none";
        }, 400);
        sessionStorage.setItem("holiday_guide_dismissed", "true");
      };

      if (guideCloseBtn) guideCloseBtn.addEventListener("click", dismissGuide);
      // Auto dismiss after 7.5 seconds
      setTimeout(dismissGuide, 7500);
    }

    // 5. Autoplay on page load (with fallback for browser policies)
    if (CONFIG.autoplay) {
      // First user interaction auto-starts music if browser blocks immediate autoplay
      const startOnInteraction = () => {
        if (!yt.isPlaying) yt.play();
        window.removeEventListener("click", startOnInteraction);
        window.removeEventListener("keydown", startOnInteraction);
      };
      setTimeout(() => {
        yt.play();
      }, 1000);
      window.addEventListener("click", startOnInteraction, { once: true });
      window.addEventListener("keydown", startOnInteraction, { once: true });
    }

    // 6. Admin Panel Management & Authentication
    let isAuthenticated = false;

    function openAdminModal() {
      adminOverlay.classList.add("is-active");
      const pwdInput = document.getElementById("holiday-admin-pwd-input");
      if (!isAuthenticated && pwdInput) {
        pwdInput.value = "";
        pwdInput.focus();
      }
    }

    function closeAdminModal() {
      adminOverlay.classList.remove("is-active");
    }

    // Secret shortcut: Ctrl + Shift + H (or Ctrl + Shift + M)
    document.addEventListener("keydown", (e) => {
      if (
        e.ctrlKey &&
        e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        (e.code === "KeyH" || e.code === "KeyM")
      ) {
        e.preventDefault();
        openAdminModal();
      }
    });

    // Secret easter-egg trigger: Click 5 times on ASCII Xmas brand
    let titleClickCount = 0;
    const dragHandle = document.getElementById("holiday-widget-drag-handle");
    if (dragHandle) {
      dragHandle.addEventListener("click", () => {
        titleClickCount++;
        if (titleClickCount >= 5) {
          titleClickCount = 0;
          openAdminModal();
        }
      });
    }

    const adminCloseBtn = document.getElementById("holiday-admin-close");
    const adminCancelBtn = document.getElementById("holiday-admin-cancel-btn");
    if (adminCloseBtn) adminCloseBtn.addEventListener("click", closeAdminModal);
    if (adminCancelBtn) adminCancelBtn.addEventListener("click", closeAdminModal);

    // Password Check
    const authForm = document.getElementById("holiday-admin-auth-form");
    const pwdInput = document.getElementById("holiday-admin-pwd-input");
    const pwdErr = document.getElementById("holiday-admin-pwd-err");
    const gateView = document.getElementById("holiday-admin-gate-view");
    const dashView = document.getElementById("holiday-admin-dash-view");

    async function handleAuth() {
      const entered = pwdInput.value.trim();
      const salt = CONFIG.adminSalt || DEFAULT_SALT;
      const expectedHash = CONFIG.adminHash || DEFAULT_ADMIN_HASH;
      const computedHash = await sha256(entered + salt);

      if (computedHash === expectedHash) {
        isAuthenticated = true;
        pwdErr.style.display = "none";
        gateView.style.display = "none";
        dashView.style.display = "block";
        populateAdminValues();
      } else {
        pwdErr.style.display = "block";
        pwdInput.select();
      }
    }

    if (authForm) authForm.addEventListener("submit", handleAuth);

    // Populate Dashboard Inputs
    function populateAdminValues() {
      document.getElementById("admin-yt-url").value = CONFIG.youtubeId ? `https://www.youtube.com/watch?v=${CONFIG.youtubeId}` : "";
      document.getElementById("admin-song-title").value = CONFIG.title || "";
      document.getElementById("admin-default-vol").value = CONFIG.volume !== undefined ? CONFIG.volume : 35;
      document.getElementById("admin-vol-val").textContent = CONFIG.volume !== undefined ? CONFIG.volume : 35;
      document.getElementById("admin-autoplay-toggle").checked = !!CONFIG.autoplay;
      document.getElementById("admin-anim-type").value = CONFIG.animation || "tree3d";
      document.getElementById("admin-anim-speed").value = CONFIG.treeSpeed || 1.0;
      document.getElementById("admin-snow-density").value = CONFIG.snowDensity || 50;
      document.getElementById("admin-widget-pos").value = CONFIG.position || "bottom-right";

      updateExportCodePreview();
    }

    // Helper: Parse YouTube Video ID from any URL format
    function extractYouTubeId(url) {
      if (!url) return "";
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? match[1] : (url.length === 11 ? url : "");
    }

    // Modal Tabs Navigation
    const tabs = document.querySelectorAll(".holiday-admin-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        const target = tab.dataset.tab;
        document.getElementById("holiday-tab-music").style.display = target === "music" ? "block" : "none";
        document.getElementById("holiday-tab-animation").style.display = target === "animation" ? "block" : "none";
        document.getElementById("holiday-tab-security").style.display = target === "security" ? "block" : "none";
        if (target === "security") updateExportCodePreview();
      });
    });

    const adminVolInput = document.getElementById("admin-default-vol");
    if (adminVolInput) {
      adminVolInput.addEventListener("input", (e) => {
        document.getElementById("admin-vol-val").textContent = e.target.value;
      });
    }

    // Generate Encrypted Payload for Git
    async function getUpdatedConfigFromForm() {
      const rawUrl = document.getElementById("admin-yt-url").value.trim();
      const ytId = extractYouTubeId(rawUrl) || CONFIG.youtubeId;
      const title = document.getElementById("admin-song-title").value.trim() || "Holiday Music";
      const vol = parseInt(document.getElementById("admin-default-vol").value, 10);
      const autoplay = document.getElementById("admin-autoplay-toggle").checked;
      const animType = document.getElementById("admin-anim-type").value;
      const animSpeed = parseFloat(document.getElementById("admin-anim-speed").value);
      const snowDensity = parseInt(document.getElementById("admin-snow-density").value, 10);
      const pos = document.getElementById("admin-widget-pos").value;

      let adminHash = CONFIG.adminHash || DEFAULT_ADMIN_HASH;
      const newPwd = document.getElementById("admin-new-pwd").value.trim();
      if (newPwd.length > 0) {
        adminHash = await sha256(newPwd + (CONFIG.adminSalt || DEFAULT_SALT));
      }

      return {
        youtubeId: ytId,
        title: title,
        volume: vol,
        autoplay: autoplay,
        animation: animType,
        treeSpeed: animSpeed,
        snowDensity: snowDensity,
        position: pos,
        enabled: true,
        adminHash: adminHash,
        adminSalt: CONFIG.adminSalt || DEFAULT_SALT
      };
    }

    async function updateExportCodePreview() {
      const cfg = await getUpdatedConfigFromForm();
      const encrypted = encryptPayload(cfg);
      const codeBlock = document.getElementById("holiday-export-code");
      if (codeBlock) {
        codeBlock.textContent = `<script>\n  window.HOLIDAY_CONFIG_PAYLOAD = "${encrypted}";\n<\/script>`;
      }
    }

    // Save locally
    const saveLocalBtn = document.getElementById("holiday-admin-save-local-btn");
    if (saveLocalBtn) {
      saveLocalBtn.addEventListener("click", async () => {
        const newCfg = await getUpdatedConfigFromForm();
        localStorage.setItem("holiday_custom_config", JSON.stringify(newCfg));
        CONFIG = newCfg;

        // Apply changes live immediately
        document.getElementById("holiday-track-title").textContent = CONFIG.title;
        volSlider.value = CONFIG.volume;
        yt.volume = CONFIG.volume;
        yt.changeTrack(CONFIG.youtubeId, CONFIG.title);
        applyEngine(CONFIG.animation);

        // Position change
        if (CONFIG.position === "bottom-left") {
          widget.classList.add("pos-bottom-left");
          launcher.classList.add("pos-bottom-left");
        } else {
          widget.classList.remove("pos-bottom-left");
          launcher.classList.remove("pos-bottom-left");
        }

        saveLocalBtn.textContent = "✅ Đã lưu & áp dụng!";
        setTimeout(() => {
          saveLocalBtn.textContent = "💾 Lưu trên trình duyệt này";
          closeAdminModal();
        }, 1000);
      });
    }

    // Copy Git Export Code
    const copyCodeBtn = document.getElementById("holiday-copy-code-btn");
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener("click", async () => {
        await updateExportCodePreview();
        const codeBlock = document.getElementById("holiday-export-code");
        if (navigator.clipboard && codeBlock) {
          navigator.clipboard.writeText(codeBlock.textContent).then(() => {
            copyCodeBtn.textContent = "✅ Đã sao chép!";
            setTimeout(() => {
              copyCodeBtn.textContent = "📋 Sao chép mã cấu hình";
            }, 2000);
          });
        }
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
