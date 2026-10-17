/* "Case study coming soon" cursor.
   Any element with [data-soon] swaps the pointer for a small label on desktop.
   Links inside it keep the normal pointer. Touch devices see a static text note instead. */
(function () {
  var els = document.querySelectorAll("[data-soon]");
  if (!els.length) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var label = document.createElement("div");
  label.className = "soon-cursor";
  label.setAttribute("aria-hidden", "true");
  label.textContent = "Case study coming soon";
  document.body.appendChild(label);

  var html = document.documentElement;
  var x = 0, y = 0, cx = 0, cy = 0, raf = 0, active = false;

  function loop() {
    var k = reduce ? 1 : 0.28;
    cx += (x - cx) * k;
    cy += (y - cy) * k;
    label.style.transform =
      "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%)";
    raf = requestAnimationFrame(loop);
  }
  function start(e) {
    if (active) return;
    active = true;
    x = cx = e.clientX;
    y = cy = e.clientY;
    html.classList.add("soon-active");
    if (!raf) loop();
  }
  function stop() {
    active = false;
    label.classList.remove("on");
    html.classList.remove("soon-active");
    cancelAnimationFrame(raf);
    raf = 0;
  }

  els.forEach(function (el) {
    el.addEventListener("pointerenter", start);
    el.addEventListener("pointermove", function (e) {
      if (!active) start(e);
      x = e.clientX;
      y = e.clientY;
      var overLink = !!e.target.closest("a, button");
      label.classList.toggle("on", !overLink);
    });
    el.addEventListener("pointerleave", stop);
  });

  /* the page can scroll out from under a still pointer */
  window.addEventListener(
    "scroll",
    function () {
      if (!active) return;
      var t = document.elementFromPoint(x, y);
      if (!t || !t.closest("[data-soon]")) stop();
    },
    { passive: true }
  );
})();
