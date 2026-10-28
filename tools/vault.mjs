#!/usr/bin/env node
/* ==========================================================================
   vault.mjs: encrypts the study materials into study/vault/.

   Usage:
     VAULT_PASSWORD=... node tools/vault.mjs <source-dir> [out-dir]

   Every file under <source-dir> is encrypted with AES-GCM (key from
   PBKDF2-SHA256 of the password) and written as <out-dir>/<opaque-id>.bin.
   An encrypted index maps the original relative paths to those ids, so the
   public repository shows neither file names nor content.
   Lessons are the files matching lessons/*.json.

   The IV is derived from the content, so unchanged files produce identical
   output and do not show up as changes in git.
   ========================================================================== */
import { webcrypto as crypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ITERATIONS = 600000;
const subtle = crypto.subtle;
const enc = new TextEncoder();
const b64 = (u8) => Buffer.from(u8).toString("base64");
const hex = (buf) => Buffer.from(buf).toString("hex");

const [srcDir, outDir = "study/vault"] = process.argv.slice(2);
const password = process.env.VAULT_PASSWORD;
if (!srcDir || !password) {
  console.error("Usage: VAULT_PASSWORD=... node tools/vault.mjs <source-dir> [out-dir]");
  process.exit(1);
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith(".")) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

fs.mkdirSync(outDir, { recursive: true });
const metaPath = path.join(outDir, "meta.json");
const old = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : null;
// Keep the salt across builds so ids and ciphertexts stay stable.
const salt = old ? new Uint8Array(Buffer.from(old.salt, "base64")) : crypto.getRandomValues(new Uint8Array(16));

const base = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = new Uint8Array(
  await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, base, 256)
);
const key = await subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt"]);
// A separate key (derived from the AES key) for ids and IVs.
const macKey = await subtle.importKey(
  "raw", await subtle.digest("SHA-256", Buffer.concat([Buffer.from("vault-mac"), bits])),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
);
const mac = async (...parts) => new Uint8Array(await subtle.sign("HMAC", macKey, Buffer.concat(parts.map(Buffer.from))));

async function seal(name, data) {
  const iv = (await mac(enc.encode(name), new Uint8Array([0]), data)).slice(0, 12);
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  return Buffer.concat([iv, ct]);
}

if (old && old.iter === ITERATIONS) {
  // Refuse to mix keys: the check blob must still open with this password.
  const blob = Buffer.from(old.check, "base64");
  const dkey = await subtle.importKey("raw", bits, "AES-GCM", false, ["decrypt"]);
  try {
    await subtle.decrypt({ name: "AES-GCM", iv: blob.subarray(0, 12) }, dkey, blob.subarray(12));
  } catch {
    console.error("This password does not match the existing vault. Delete the vault folder to re-key it.");
    process.exit(1);
  }
}

const files = walk(srcDir).map((p) => path.relative(srcDir, p).split(path.sep).join("/")).sort();
const index = { files: {}, lessons: [] };
const written = new Set(["meta.json", "index.bin"]);

for (const rel of files) {
  const data = fs.readFileSync(path.join(srcDir, rel));
  const id = hex((await mac(enc.encode("id:"), enc.encode(rel))).slice(0, 10));
  fs.writeFileSync(path.join(outDir, id + ".bin"), await seal(rel, data));
  written.add(id + ".bin");
  index.files[rel] = { id, size: data.length };
  if (/^lessons\/[^/]+\.json$/.test(rel)) {
    const l = JSON.parse(data.toString("utf8"));
    index.lessons.push({ id: l.id, no: l.no, title: l.title, subtitle: l.subtitle, file: rel });
  }
}
index.lessons.sort((a, b) => (a.no || 0) - (b.no || 0));

fs.writeFileSync(path.join(outDir, "index.bin"), await seal("index", enc.encode(JSON.stringify(index))));
const check = old && old.iter === ITERATIONS ? old.check : b64(await seal("check", enc.encode("ok")));
fs.writeFileSync(metaPath, JSON.stringify({ v: 1, iter: ITERATIONS, salt: b64(salt), check }) + "\n");

// Remove ciphertexts of files that no longer exist in the source.
for (const f of fs.readdirSync(outDir)) if (!written.has(f)) fs.unlinkSync(path.join(outDir, f));

console.log(`Encrypted ${files.length} files (${index.lessons.length} lessons) into ${outDir}`);
