/* ==========================================================================
   vault.js: opens the encrypted study materials in study/vault/.
   Shared by the homepage gate (assets/js/gate.js) and the study page.
   The derived key lives in sessionStorage only, so closing the tab locks it.
   ========================================================================== */
(() => {
  "use strict";
  const VAULT = new URL("vault/", document.currentScript.src).href;
  const STORE = "study-key";
  const subtle = window.crypto && window.crypto.subtle;
  const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (u8) => btoa(String.fromCharCode.apply(null, u8));

  let key = null;
  let index = null;
  const blobs = new Map();

  async function getMeta() {
    const r = await fetch(VAULT + "meta.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("vault missing");
    return r.json();
  }

  async function open(buf) {
    const u8 = new Uint8Array(buf);
    return subtle.decrypt({ name: "AES-GCM", iv: u8.subarray(0, 12) }, key, u8.subarray(12));
  }

  async function useBits(bits) {
    key = await subtle.importKey("raw", bits, "AES-GCM", false, ["decrypt"]);
  }

  /* Returns true when the password opens the vault. */
  async function unlock(password) {
    const meta = await getMeta();
    const base = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: fromB64(meta.salt), iterations: meta.iter }, base, 256));
    await useBits(bits);
    try {
      await open(fromB64(meta.check));
    } catch (e) {
      key = null;
      return false;
    }
    try { sessionStorage.setItem(STORE, toB64(bits)); } catch (e) {}
    return true;
  }

  async function resume() {
    let saved = null;
    try { saved = sessionStorage.getItem(STORE); } catch (e) {}
    if (!saved) return false;
    try {
      await useBits(fromB64(saved));
      await getIndex();
      return true;
    } catch (e) {
      lock();
      return false;
    }
  }

  function lock() {
    key = null;
    index = null;
    try { sessionStorage.removeItem(STORE); } catch (e) {}
  }

  async function fetchRaw(id) {
    const r = await fetch(VAULT + id + ".bin");
    if (!r.ok) throw new Error("missing " + id);
    return open(await r.arrayBuffer());
  }

  async function getIndex() {
    if (!index) index = JSON.parse(new TextDecoder().decode(await fetchRaw("index")));
    return index;
  }

  function has(name) {
    return Boolean(index && index.files[name]);
  }

  async function json(name) {
    const f = (await getIndex()).files[name];
    if (!f) throw new Error("not in vault: " + name);
    return JSON.parse(new TextDecoder().decode(await fetchRaw(f.id)));
  }

  const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", mp3: "audio/mpeg", m4a: "audio/mp4", webp: "image/webp" };

  /* Decrypts a file once and returns an object URL for <img>/<audio>. */
  function url(name) {
    if (!blobs.has(name)) {
      blobs.set(name, (async () => {
        const f = (await getIndex()).files[name];
        if (!f) throw new Error("not in vault: " + name);
        const ext = name.split(".").pop().toLowerCase();
        return URL.createObjectURL(new Blob([await fetchRaw(f.id)], { type: TYPES[ext] || "application/octet-stream" }));
      })());
    }
    return blobs.get(name);
  }

  window.Vault = { supported: Boolean(subtle), unlock, resume, lock, getIndex, has, json, url };
})();
