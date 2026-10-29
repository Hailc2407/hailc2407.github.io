/* ==========================================================================
   gate.js: hidden entrance to the English study pages.
   Ctrl + Shift + L opens /study/ (no password).
   ========================================================================== */
(() => {
  "use strict";
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && e.code === "KeyL") {
      e.preventDefault();
      location.href = "study/";
    }
  });
})();
