/* ============================================================
   gallery.js — grid lightbox (zoom, prev/next, keys, swipe)
   Wires every [data-gallery] container. Each .g-item must carry
   data-full="<large image url>".
   ============================================================ */
(function () {
  "use strict";

  function build(container) {
    var items = Array.prototype.slice.call(container.querySelectorAll(".g-item"));
    if (!items.length) return;
    var sources = items.map(function (b) { return b.getAttribute("data-full") || b.querySelector("img").src; });
    var alts = items.map(function (b) { var i = b.querySelector("img"); return i ? i.alt : ""; });
    var idx = 0;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML =
      '<button class="lb-close" aria-label="Close">✕</button>' +
      '<button class="lb-btn lb-prev" aria-label="Previous">‹</button>' +
      '<img alt="">' +
      '<button class="lb-btn lb-next" aria-label="Next">›</button>' +
      '<div class="lb-count"></div>';
    document.body.appendChild(box);

    var img = box.querySelector("img");
    var count = box.querySelector(".lb-count");
    var lastFocus = null;

    function show(i) {
      idx = (i + sources.length) % sources.length;
      img.src = sources[idx];
      img.alt = alts[idx] || "";
      count.textContent = (idx + 1) + " / " + sources.length;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      box.querySelector(".lb-close").focus();
    }
    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    items.forEach(function (b, i) { b.addEventListener("click", function () { open(i); }); });
    box.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    box.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    box.querySelector(".lb-close").addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });

    // touch swipe
    var x0 = null;
    box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  function init() { document.querySelectorAll("[data-gallery]").forEach(build); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
