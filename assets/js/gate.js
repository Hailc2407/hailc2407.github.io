/* ==========================================================================
   gate.js: hidden entrance to the English study pages.
   Ctrl + Shift + L opens the English Room (repo StudyToeic, no password).
   ========================================================================== */
(() => {
  "use strict";
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && e.code === "KeyL") {
      e.preventDefault();
      location.href = "https://hailc2407.github.io/StudyToeic/";
    }
  });
})();
