# Fishery short (9:16 video)

A 38-second vertical video for the series *Toán ẩn trong đời sống*, built from the
saturated-catch fishery model with a rarity-dependent price (same equations and
parameters as the research panel in `assets/js/diagrams.js`).

| File | What it is |
|---|---|
| `index.html` | The whole video as a canvas animation. Open it in a browser to watch it play. |
| `render.mjs` | Renders `index.html` frame by frame to `fishery-short.mp4` (needs Node, Playwright, ffmpeg). |
| `fishery-short.mp4` | 1080×1920, 30 fps, silent audio track (add music in TikTok / CapCut). |

```bash
node render.mjs                     # full video
node render.mjs --stills 2,16,31    # PNG stills to check a layout change
```

Scenes: hook (0–4.6 s) · feedback loop (4.6–11 s) · three fishing costs
c = 0.80 / 0.65 / 0.20 (11–32.5 s) · summary bar with the thresholds
c₀ = 0.25, c_H = 0.75 (Hopf), c₁ = 0.875 (32.5–38 s).
Texts live in `REGIMES` and the `scene*` functions of `index.html`.
