/* TL;DR / Full case study tabs.
   Panels use the hidden attribute, so without JS the noscript rule shows both. */
(function () {
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;
  var bar = document.querySelector(".tabs-bar");

  function show(name, scroll) {
    tabs.forEach(function (t) {
      var on = t.id === "tab-" + name;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (history.replaceState) {
      history.replaceState(null, "", name === "full" ? "#full" : "#tldr");
    }
    if (scroll) {
      /* start the chosen tab at its first section (TL;DR goal / Overview).
         Measured from the panel, because the sticky tab bar reports its
         stuck position rather than where it sits on the page. */
      var panel = document.getElementById("panel-" + name);
      var header = document.querySelector("header");
      var offset = (bar ? bar.offsetHeight : 0) + (header ? header.offsetHeight : 0);
      var y = Math.max(0, panel.getBoundingClientRect().top + window.scrollY - offset);
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo({ top: y });
    }
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      show(t.id.replace("tab-", ""), true);
    });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus();
      show(n.id.replace("tab-", ""), true);
    });
  });
  [].forEach.call(document.querySelectorAll("[data-go]"), function (b) {
    b.addEventListener("click", function () {
      show(b.getAttribute("data-go"), true);
    });
  });

  /* deep links: #full, #tldr, or an id inside the full case study (e.g. #friction) */
  function route() {
    var id = location.hash.slice(1);
    if (id === "full") show("full");
    else if (id === "tldr") show("tldr");
    else if (id) {
      var el = document.getElementById(id);
      if (el && el.closest("#panel-full")) {
        show("full");
        el.scrollIntoView({ behavior: "instant" });
      }
    }
  }
  route();
  window.addEventListener("hashchange", route);
})();
