// Render index.html to an MP4 (1080x1920, 30 fps) by stepping its render(t)
// function frame by frame in headless Chromium and piping JPEG frames to ffmpeg.
//
//   node render.mjs                 -> fishery-short.mp4
//   node render.mjs --stills 2,8,15 -> still-2.png, still-8.png, ... (layout check)
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

// require() also finds a globally installed Playwright
const { chromium } = createRequire(import.meta.url)("playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const stillsArg = process.argv.indexOf("--stills");
const outDir = process.env.OUT_DIR || here;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.join(here, "index.html")).href + "?render");
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);

const frame = (t) =>
  page.evaluate((t) => {
    window.render(t);
    return document.getElementById("c").toDataURL("image/jpeg", 0.95).split(",")[1];
  }, t);

if (stillsArg > -1) {
  for (const t of process.argv[stillsArg + 1].split(",").map(Number)) {
    await page.evaluate((t) => window.render(t), t);
    await page.locator("canvas").screenshot({ path: path.join(outDir, `still-${t}.png`) });
  }
} else {
  const out = path.join(outDir, "fishery-short.mp4");
  // a silent stereo track keeps every platform's uploader happy; add music in the app
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-shortest", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const total = Math.round(duration * FPS);
  for (let i = 0; i < total; i++) {
    const buf = Buffer.from(await frame(i / FPS), "base64");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) console.log(`frame ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}
await browser.close();
