#!/usr/bin/env node
/* ==========================================================================
   unvault.mjs: the reverse of vault.mjs. Decrypts study/vault/ back into a
   source folder (lessons/*.json, img/, audio/, groups.json, curriculum*.json).

   Usage:
     VAULT_PASSWORD=... node tools/unvault.mjs [vault-dir] <out-dir>

   Use it to start a new lesson in a fresh checkout: decrypt the vault, add or
   rebuild one lesson in the folder, then encrypt the whole folder again with
   vault.mjs (which needs every file, because it deletes ciphertexts of files
   missing from its source).
   ========================================================================== */
import { webcrypto as crypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const subtle = crypto.subtle;
const enc = new TextEncoder();
const args = process.argv.slice(2);
const [vaultDir, outDir] = args.length > 1 ? args : ["study/vault", args[0]];
const password = process.env.VAULT_PASSWORD;
if (!outDir || !password) {
  console.error("Usage: VAULT_PASSWORD=... node tools/unvault.mjs [vault-dir] <out-dir>");
  process.exit(1);
}

const meta = JSON.parse(fs.readFileSync(path.join(vaultDir, "meta.json"), "utf8"));
const salt = new Uint8Array(Buffer.from(meta.salt, "base64"));
const base = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = new Uint8Array(await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: meta.iter }, base, 256));
const key = await subtle.importKey("raw", bits, "AES-GCM", false, ["decrypt"]);

const open = async (buf) => Buffer.from(await subtle.decrypt({ name: "AES-GCM", iv: buf.subarray(0, 12) }, key, buf.subarray(12)));

let index;
try {
  index = JSON.parse((await open(fs.readFileSync(path.join(vaultDir, "index.bin")))).toString("utf8"));
} catch {
  console.error("Wrong password for this vault.");
  process.exit(1);
}

let n = 0;
for (const [rel, { id }] of Object.entries(index.files)) {
  const dest = path.join(outDir, ...rel.split("/"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, await open(fs.readFileSync(path.join(vaultDir, id + ".bin"))));
  n++;
}
console.log(`Decrypted ${n} files (${index.lessons.length} lessons) into ${outDir}`);
