/* ==========================================================================
   gate.js: hidden entrance to the English study pages.
   Ctrl + Shift + L opens a password box; the right password opens /study/.
   ========================================================================== */
(() => {
  "use strict";
  const SRC = "study/vault.js";
  let box = null;
  let loading = null;

  const loadVault = () => loading || (loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.onload = () => resolve(window.Vault);
    s.onerror = reject;
    document.head.appendChild(s);
  }));

  function build() {
    box = document.createElement("div");
    box.className = "gate";
    box.hidden = true;
    box.innerHTML =
      '<form class="gate-card" autocomplete="off">' +
      '<label class="gate-label" for="gate-pass">Password</label>' +
      '<input id="gate-pass" class="gate-input" type="password" spellcheck="false" autocapitalize="off">' +
      '<p class="gate-msg" aria-live="polite"></p>' +
      "</form>";
    document.body.appendChild(box);
    const form = box.querySelector("form");
    const input = box.querySelector("input");
    const msg = box.querySelector(".gate-msg");
    box.addEventListener("mousedown", (e) => { if (e.target === box) close(); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!input.value) return;
      msg.textContent = "…";
      try {
        const V = await loadVault();
        if (await V.unlock(input.value)) {
          location.href = "study/";
          return;
        }
        msg.textContent = "Wrong password";
      } catch (err) {
        msg.textContent = "Not available";
      }
      input.select();
    });
  }

  function open() {
    if (!box) build();
    box.hidden = false;
    box.querySelector(".gate-msg").textContent = "";
    const input = box.querySelector("input");
    input.value = "";
    setTimeout(() => input.focus(), 0);
    loadVault().catch(() => {});
  }

  function close() {
    if (box) box.hidden = true;
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && e.code === "KeyL") {
      e.preventDefault();
      if (box && !box.hidden) close(); else open();
    } else if (e.key === "Escape") {
      close();
    }
  });
})();
