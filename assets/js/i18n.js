/* ============================================================
   i18n.js — language detection, persistence, DOM fill
   Usage: elements carry data-i18n="key" (text) or
   data-i18n-attr="attr:key,attr2:key2" (attributes).
   Languages: es (default) / ca / en.  Persists in localStorage.
   Dispatches a `langchange` CustomEvent({detail:{lang}}) on switch.
   ============================================================ */
(function () {
  "use strict";
  var LANGS = ["es", "ca", "en"];
  var STORE_KEY = "sushigin.lang";
  var dict = null;
  var current = "es";

  function pickInitial() {
    var url = new URLSearchParams(location.search).get("lang");
    if (url && LANGS.indexOf(url) > -1) return url;
    var saved = localStorage.getItem(STORE_KEY);
    if (saved && LANGS.indexOf(saved) > -1) return saved;
    var nav = (navigator.language || "es").slice(0, 2).toLowerCase();
    if (LANGS.indexOf(nav) > -1) return nav;
    return "es";
  }

  function t(key) {
    if (!dict || !dict[key]) return null;
    return dict[key][current] != null ? dict[key][current] : dict[key].en;
  }

  function apply() {
    document.documentElement.lang = current;
    // text content
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (v != null) el.innerHTML = v;
    });
    // attributes: "alt:key,placeholder:key2"
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var bits = pair.split(":");
        if (bits.length === 2) {
          var v = t(bits[1].trim());
          if (v != null) el.setAttribute(bits[0].trim(), v);
        }
      });
    });
    // active state on language buttons
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-lang") === current);
    });
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0 || lang === current && dict) return;
    current = lang;
    localStorage.setItem(STORE_KEY, lang);
    apply();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  function wireButtons() {
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });
  }

  function init() {
    current = pickInitial();
    fetch("/assets/data/i18n.json")
      .then(function (r) { return r.json(); })
      .then(function (json) {
        dict = json;
        wireButtons();
        apply();
        document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: current } }));
      })
      .catch(function () {
        // dictionary missing: still wire buttons + emit lang so other modules render
        wireButtons();
        document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: current } }));
      });
  }

  // public API
  window.SushiI18n = { setLang: setLang, getLang: function () { return current; }, t: t };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
