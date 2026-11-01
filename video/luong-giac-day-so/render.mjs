// Render index.html to an MP4 (1920x1080, 30 fps): step render(t) in headless
// Chromium, screenshot each frame, pipe the JPEGs to ffmpeg.
//
//   npm install                       (KaTeX, once)
//   node render.mjs                   -> luong-giac-day-so.mp4
//   node render.mjs --stills 3,20,40  -> still-3.png, ... (layout check)
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const outDir = process.env.OUT_DIR || here;
const stillsArg = process.argv.indexOf("--stills");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(pathToFileURL(path.join(here, "index.html")).href + "?render");
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);
console.log(`duration ${duration}s`);
const shot = async (t, opts) => {
  await page.evaluate((t) => window.render(t), t);
  return page.screenshot({ type: "jpeg", quality: 92, ...opts });
};

if (stillsArg > -1) {
  for (const t of process.argv[stillsArg + 1].split(",").map(Number)) {
    await page.evaluate((t) => window.render(t), t);
    await page.screenshot({ path: path.join(outDir, `still-${t}.png`) });
  }
} else {
  const out = path.join(outDir, "luong-giac-day-so.mp4");
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-shortest", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    const buf = await shot(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 300 === 0) console.log(`frame ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}
await browser.close();
