/* ============================================================
   menu.js — render the menu from assets/data/menu.json
   Builds sticky category tabs + per-category dish lists.
   Re-renders text on `langchange`. Depends on window.SushiI18n.
   ============================================================ */
(function () {
  "use strict";
  var data = null;
  var tabsEl, bodyEl;

  function lang() { return (window.SushiI18n && SushiI18n.getLang()) || "es"; }
  function tt(key, fb) { var v = window.SushiI18n && SushiI18n.t(key); return v != null ? v : (fb || ""); }
  function allergenName(n) {
    var L = lang();
    if (data && data.allergenLegend) {
      for (var i = 0; i < data.allergenLegend.length; i++) {
        if (data.allergenLegend[i].n === n) return data.allergenLegend[i][L] || data.allergenLegend[i].en;
      }
    }
    return String(n);
  }
  function allergenIcon(n) {
    var nm = allergenName(n).replace(/"/g, "&quot;");
    return '<img class="allg" src="/images/allergens/' + n + '.png" alt="' + nm + '" title="' + nm + '" loading="lazy" />';
  }

  function catName(c) { return c.name[lang()] || c.name.en; }

  function render() {
    if (!data) return;
    var L = lang();

    // tabs
    tabsEl.innerHTML = "";
    data.categories.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.cat = c.id;
      b.innerHTML = catName(c);
      if (i === 0) b.classList.add("is-active");
      b.addEventListener("click", function () {
        var t = document.getElementById("cat-" + c.id);
        if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 110, behavior: "smooth" });
      });
      tabsEl.appendChild(b);
    });

    // categories + items
    bodyEl.innerHTML = "";
    data.categories.forEach(function (c) {
      var items = data.items.filter(function (it) { return it.category === c.id; });
      if (!items.length) return;
      var sec = document.createElement("section");
      sec.className = "menu-cat";
      sec.id = "cat-" + c.id;

      var head = document.createElement("div");
      head.className = "menu-cat__head";
      head.innerHTML = '<h2>' + catName(c) + '</h2>';
      sec.appendChild(head);

      var grid = document.createElement("div");
      grid.className = "menu-items";
      items.forEach(function (it) {
        var name = it.name[L] || it.name.en;
        var desc = it.desc ? (it.desc[L] || it.desc.en || "") : "";
        var tags = "";
        if (it.spicy) tags += '<span class="tag-chip spicy">' + tt("menu.spicy", "Spicy") + '</span>';
        if (it.vegan) tags += '<span class="tag-chip vegan">' + tt("menu.vegan", "Vegan") + '</span>';
        var allg = (it.allergens || []).map(allergenIcon).join("");

        var row = document.createElement("article");
        row.className = "m-item";
        var photo = '/images/menu/' + it.code + '.jpg';
        // photo (hidden gracefully if it fails to load)
        var imgHtml = '<img class="m-item__photo" src="' + photo + '" alt="' + name.replace(/"/g, '&quot;') +
          '" loading="lazy" onerror="this.closest(\'.m-item\').classList.add(\'no-photo\');this.remove();" />';
        row.innerHTML =
          imgHtml +
          '<div class="m-item__body">' +
            '<div class="m-item__head">' +
              '<span class="m-item__code">' + it.code + '</span>' +
              '<h3 class="m-item__name">' + name + '</h3>' +
              (tags ? '<span class="m-item__tags">' + tags + '</span>' : '') +
            '</div>' +
            (allg ? '<div class="m-item__allerg">' + allg + '</div>' : '') +
            (desc ? '<p class="m-item__desc">' + desc + '</p>' : '') +
          '</div>';
        grid.appendChild(row);
      });
      sec.appendChild(grid);
      bodyEl.appendChild(sec);
    });

    buildLegend();
    spyTabs();
  }

  function buildLegend() {
    var box = document.getElementById("allergen-legend");
    if (!box || !data.allergenLegend) return;
    var L = lang();
    box.innerHTML = data.allergenLegend.map(function (a) {
      return '<span>' + allergenIcon(a.n) + (a[L] || a.en) + '</span>';
    }).join("");
  }

  // highlight active tab while scrolling
  function spyTabs() {
    var secs = Array.prototype.slice.call(document.querySelectorAll(".menu-cat"));
    if (!("IntersectionObserver" in window) || !secs.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id.replace("cat-", "");
          tabsEl.querySelectorAll("button").forEach(function (b) {
            var active = b.dataset.cat === id;
            b.classList.toggle("is-active", active);
            if (active) b.scrollIntoView({ block: "nearest", inline: "center" });
          });
        }
      });
    }, { rootMargin: "-120px 0px -70% 0px" });
    secs.forEach(function (s) { io.observe(s); });
  }

  function init() {
    tabsEl = document.getElementById("menu-tabs");
    bodyEl = document.getElementById("menu-body");
    if (!tabsEl || !bodyEl) return;
    fetch("/assets/data/menu.json")
      .then(function (r) { return r.json(); })
      .then(function (json) { data = json; render(); })
      .catch(function () { bodyEl.innerHTML = '<p class="menu-note">No se pudo cargar la carta. / Menu could not be loaded.</p>'; });
    document.addEventListener("langchange", render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
