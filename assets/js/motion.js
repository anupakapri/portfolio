/* ==========================================================
   motion.js: Lenis smooth scroll + GSAP / ScrollTrigger / SplitText
   Shared by the homepage and case study pages. Every block is
   guarded, so a page simply skips what it doesn't contain.
   Reduced motion or missing libraries: content shows, nothing moves.
   ========================================================== */
(function () {
  var d = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Gothenburg clock (always on) ---------- */
  var clocks = $$("[data-clock]");
  if (clocks.length && window.Intl) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Stockholm",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    var tickClock = function () {
      var t = fmt.format(new Date());
      clocks.forEach(function (c) { c.textContent = t; });
    };
    tickClock();
    setInterval(tickClock, 15000);
  }

  /* ---------- Sliders (always on; native scroll-snap underneath) ---------- */
  $$("[data-slider]").forEach(function (sl) {
    var track = $(".sl-track", sl), slides = $$(".sl-slide", sl);
    var steps = $$(".sl-steps button", sl), prev = $(".sl-prev", sl), next = $(".sl-next", sl);
    var fill = $(".sl-bar i", sl), cur = -1;
    if (!track || !slides.length) return;
    function set(i) {
      if (i === cur) return;
      cur = i;
      steps.forEach(function (b, k) {
        if (k === i) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      if (fill) fill.style.transform = "scaleX(" + (i + 1) / slides.length + ")";
    }
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft });
      set(i);
    }
    var raf = 0;
    track.addEventListener("scroll", function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        set(Math.round(track.scrollLeft / (slides[0].offsetWidth + 16)));
      });
    }, { passive: true });
    steps.forEach(function (b, k) { b.addEventListener("click", function () { go(k); }); });
    if (prev) prev.addEventListener("click", function () { go(cur - 1); });
    if (next) next.addEventListener("click", function () { go(cur + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
    });
    set(0);
  });

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;

  if (reduce || !G || !ST || !d.classList.contains("js-motion")) {
    d.classList.remove("js-motion", "intro-on");
    $$(".rv").forEach(function (e) { e.classList.add("in"); });
    return;
  }

  window.__motionReady = true;
  G.registerPlugin(ST);
  if (Split) G.registerPlugin(Split);

  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var EASE = "expo.out";

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    window.__lenis = lenis;

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var id = a.getAttribute("href").slice(1);
      var el = id && id !== "top" ? document.getElementById(id) : null;
      if (id && id !== "top" && !el) return;
      e.preventDefault();
      lenis.scrollTo(el || 0, {
        offset: el ? -72 : 0,
        duration: 1.4,
        easing: function (x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); },
      });
      history.pushState(null, "", id && id !== "top" ? "#" + id : location.pathname);
    });
  }

  /* ---------- Header: hide on scroll down, show on up, progress line ---------- */
  var header = $("header"), menu = $("#menu"), bar = $("header .progress");
  if (header) {
    var setBar = bar ? G.quickSetter(bar, "scaleX") : null;
    ST.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        var y = self.scroll();
        var hide = y > Math.max(240, heroEnd) && self.direction === 1 && !(menu && menu.classList.contains("open"));
        header.classList.toggle("hide", hide);
        d.classList.toggle("header-hidden", hide);
        header.classList.toggle("scrolled", y > 8);
        if (setBar) setBar(self.progress);
      },
    });
  }

  /* Nav text roll */
  $$("nav #menu a").forEach(function (a) {
    var t = a.textContent.trim();
    a.innerHTML = '<span class="roll"><span>' + t + '</span><span aria-hidden="true">' + t + "</span></span>";
  });

  /* ---------- Helpers ---------- */
  function splitLines(el, opts) {
    if (!Split) return null;
    return Split.create(el, Object.assign({
      type: "lines",
      mask: "lines",
      linesClass: "sl",
      autoSplit: true,
    }, opts || {}));
  }

  function drawRule(el, start) {
    G.fromTo(el, { "--rule": 0 }, {
      "--rule": 1,
      duration: 1.4,
      ease: "expo.inOut",
      scrollTrigger: { trigger: el, start: start || "top 90%", once: true },
    });
  }

  function rise(targets, trigger, o) {
    o = o || {};
    if (!targets || (targets.length === 0)) return;
    G.fromTo(targets, { autoAlpha: 0, y: o.y || 28 }, {
      autoAlpha: 1,
      y: 0,
      duration: o.duration || 1.1,
      stagger: o.stagger || 0.07,
      delay: o.delay || 0,
      ease: EASE,
      scrollTrigger: { trigger: trigger, start: o.start || "top 86%", once: true },
    });
  }

  function headingReveal(h, start) {
    h.classList.add("in");
    splitLines(h, {
      onSplit: function (self) {
        return G.from(self.lines, {
          yPercent: 110,
          duration: 1.2,
          stagger: 0.09,
          ease: EASE,
          scrollTrigger: { trigger: h, start: start || "top 86%", once: true },
        });
      },
    });
  }

  /* ---------- Intro + hero ---------- */
  var heroEnd = 0;

  /* Scroll-driven wipe from the "design" scene to the "build" scene.
     Desktop: the hero pins under the header while the wipe plays.
     Tablet/phone: no pin, the wipe follows the illustration through the viewport. */
  function heroScroll() {
    var hero = $(".page-home .hero");
    var stage = hero && $(".ha-stage", hero);
    if (!stage) return;
    G.set(stage, { "--p": 0, "--lo": 0 });
    var desk = innerWidth > 960;
    var tl = G.timeline({
      defaults: { ease: "none" },
      onUpdate: function () {
        hero.classList.toggle("is-build", G.getProperty(stage, "--p") > 52);
      },
      scrollTrigger: {
        trigger: desk ? hero : stage,
        start: desk ? "top 64px" : "top 80%",
        end: desk ? function () { return "+=" + Math.round(innerHeight * 1.3); } : "bottom 30%",
        pin: desk ? $(".hero-pin", hero) : false,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefresh: function (self) { if (desk) heroEnd = self.end; },
      },
    });
    tl.to(stage, { "--lo": 1, duration: 0.06 }, 0)
      .to(stage, { "--p": 100, duration: 0.84, ease: "power1.inOut" }, 0.02)
      .to(stage, { "--lo": 0, duration: 0.06 }, 0.88)
      .to($(".hero-art", hero), { scale: 1.035, transformOrigin: "100% 100%", duration: 1 }, 0);
    if (desk) tl.to($(".hero-copy", hero), { y: -30, duration: 1 }, 0);
  }

  function heroIn() {
    var hero = $(".page-home .hero");
    if (!hero) return;
    var h1 = $("h1", hero);
    var tl = G.timeline({ defaults: { ease: EASE } });
    G.set(h1, { visibility: "visible" });
    var s = splitLines(h1, {
      onSplit: function (self) {
        return G.from(self.lines, { yPercent: 115, duration: 1.4, stagger: 0.1, ease: EASE });
      },
    });
    if (!s) tl.fromTo(h1, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0);
    tl.fromTo($(".status", hero), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.15)
      .fromTo($(".lead", hero), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.45)
      .fromTo($(".ctas", hero), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.55)
      .fromTo($(".ha-stage", hero), { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 1.6 }, 0.3)
      .set($(".hero-art", hero), { visibility: "visible" }, 0.3)
      .fromTo($(".ha-sel", hero), { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 1 }, 1.1)
      .fromTo($(".hero-foot", hero), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.2);
  }

  /* ---------- Selected work: pinned horizontal showcase ---------- */
  function workScroll() {
    var sec = $(".page-home .work");
    if (!sec) return;
    var pin = $(".wk-pin", sec), rail = $(".wk-rail", sec), panels = $$(".wk", sec);
    var count = $(".wk-count b", sec), fill = $(".wk-track i", sec);
    var n = panels.length;

    rise([$(".wk-lead", sec), $(".wk-prog", sec)], sec, { y: 16, start: "top 75%" });

    function reveal(p, st) {
      var txt = $$(".wk-meta, .wk-scope, .wk-desc, .wk-facts > div, .links", p);
      var h3 = $("h3", p), sel = $(".wk-sel", p);
      var tl = G.timeline({ scrollTrigger: st });
      if (Split && h3) {
        var sp = Split.create(h3, { type: "chars", mask: "chars", charsClass: "wc" });
        tl.from(sp.chars, { yPercent: 110, duration: 1.1, stagger: 0.035, ease: EASE }, 0);
      }
      tl.fromTo(txt, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06, ease: EASE }, 0.15)
        .fromTo(sel, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0)
        .fromTo($$(".h, .wk-sel-l", p), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: "back.out(2)" }, 0.9);
      return tl;
    }

    if (innerWidth <= 960) {
      panels.forEach(function (p) {
        reveal(p, { trigger: p, start: "top 80%", once: true });
      });
      return;
    }

    var dist = function () { return rail.scrollWidth - innerWidth; };
    var slide = G.to(rail, {
      x: function () { return -dist(); },
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: function () { return "+=" + dist() * 1.1; },
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var i = Math.min(n - 1, Math.round(self.progress * (n - 1)));
          if (count) count.textContent = String(i + 1).padStart(2, "0");
          if (fill) fill.style.transform = "scaleX(" + (1 + self.progress * (n - 1)) / n + ")";
        },
      },
    });

    panels.forEach(function (p, i) {
      if (i === 0) {
        reveal(p, { trigger: sec, start: "top 55%", once: true });
        return;
      }
      reveal(p, { trigger: p, containerAnimation: slide, start: "left 70%", once: true });
      /* text drifts in a touch slower than the panel for depth */
      G.fromTo($(".wk-txt", p), { x: 140 }, {
        x: 0,
        ease: "none",
        scrollTrigger: { trigger: p, containerAnimation: slide, start: "left right", end: "left left", scrub: true },
      });
    });
  }

  /* ---------- Process: pinned timeline, one stage at a time ---------- */
  function processScroll() {
    var sec = $(".page-home .diff");
    if (!sec || !$(".st-bar", sec)) return;
    var cards = $$(".st-card", sec), stations = $$(".st-s", sec);
    var bar = $(".st-bar", sec), count = $(".df-count b", sec), lab = $(".df-sel-l b", sec);
    var n = cards.length, cur = -1;

    if (innerWidth <= 960) {
      cards.forEach(function (c) { rise($$(".st-k, h3, .st-d, .st-o, .st-t", c), c, { y: 20, stagger: 0.06 }); });
      return;
    }

    function setStage(i) {
      if (i === cur) return;
      cur = i;
      var t = String(i + 1).padStart(2, "0");
      cards.forEach(function (c, k) {
        c.classList.toggle("on", k === i);
        c.classList.toggle("past", k < i);
      });
      stations.forEach(function (s, k) {
        s.classList.toggle("on", k === i);
        s.classList.toggle("done", k < i);
      });
      if (count) count.textContent = t;
      if (lab) lab.textContent = t;
    }
    setStage(0);

    ST.create({
      trigger: $(".df-pin", sec),
      start: "top top",
      end: "+=" + n * 55 + "%",
      pin: true,
      scrub: true,
      onUpdate: function (self) {
        var pr = self.progress;
        bar.style.setProperty("--p", pr);
        setStage(Math.min(n - 1, Math.floor(pr * n)));
      },
    });

    /* entrance */
    rise([$(".df-label", sec), $(".df-count", sec)], sec, { y: 16, start: "top 70%" });
    G.fromTo($(".df-sel", sec), { clipPath: "inset(0% 0% 100% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut",
      scrollTrigger: { trigger: sec, start: "top 60%", once: true },
    });
    G.fromTo($$(".st-s", sec), { autoAlpha: 0, y: 14 }, {
      autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: EASE,
      scrollTrigger: { trigger: sec, start: "top 50%", once: true },
    });
  }

  /* ---------- Life gallery: two columns drifting in opposite directions ---------- */
  function lifeGallery() {
    var gal = $(".page-home .life-gal");
    if (!gal) return;
    var tweens = [];
    $$(".lg-col", gal).forEach(function (col) {
      var track = $(".lg-track", col);
      /* duplicate the photos once so the loop is seamless */
      $$(".lg-card", track).forEach(function (c) {
        var k = c.cloneNode(true);
        k.setAttribute("aria-hidden", "true");
        var im = $("img", k);
        if (im) im.alt = "";
        track.appendChild(k);
      });
      var up = col.classList.contains("up");
      tweens.push(G.fromTo(track, { yPercent: up ? 0 : -50 }, {
        yPercent: up ? -50 : 0,
        duration: 46,
        ease: "none",
        repeat: -1,
      }));
      /* ease to a crawl while someone looks closely */
      col.addEventListener("pointerenter", function () { G.to(tweens, { timeScale: 0.15, duration: 0.6, overwrite: true }); });
      col.addEventListener("pointerleave", function () { G.to(tweens, { timeScale: 1, duration: 0.8, overwrite: true }); });
    });
    /* scrolling nudges the columns faster, then they settle */
    ST.create({
      trigger: gal,
      start: "top bottom",
      end: "bottom top",
      onToggle: function (self) { tweens.forEach(function (t) { self.isActive ? t.play() : t.pause(); }); },
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 300, 5);
        if (v > 0.5) {
          G.to(tweens, { timeScale: 1 + v, duration: 0.2, overwrite: true });
          G.to(tweens, { timeScale: 1, duration: 1.2, delay: 0.2, overwrite: false });
        }
      },
    });
    rise($$(".sec-label, .life-lead, .life-body p", $(".page-home .life")), ".page-home .life", { y: 20, stagger: 0.07 });
    G.fromTo(gal, { autoAlpha: 0, y: 60 }, {
      autoAlpha: 1, y: 0, duration: 1.4, ease: EASE,
      scrollTrigger: { trigger: gal, start: "top 85%", once: true },
    });
  }

  function intro(done) {
    var el = $(".intro");
    if (!el || !d.classList.contains("intro-on")) { done(); return; }
    if (lenis) lenis.stop();
    var count = $(".i-count", el), name = $(".i-name", el), n = { v: 0 };
    var parts = Split ? Split.create(name, { type: "lines,chars", mask: "lines" }).chars : [name];
    var tl = G.timeline({
      onComplete: function () {
        el.remove();
        d.classList.remove("intro-on");
        if (lenis) lenis.start();
      },
    });
    tl.from(parts, { yPercent: 110, duration: 1, stagger: 0.025, ease: EASE }, 0)
      .from($$(".i-top span", el), { autoAlpha: 0, y: 10, duration: 0.8, stagger: 0.08, ease: EASE }, 0.1)
      .to(n, {
        v: 100,
        duration: 1.3,
        ease: "power2.inOut",
        onUpdate: function () { count.textContent = String(Math.round(n.v)).padStart(3, "0"); },
      }, 0)
      .to($(".i-bar", el), { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 0)
      .to(el, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, 1.45)
      .add(done, 1.9);
  }

  /* ---------- Homepage sections ---------- */
  function home() {
    if (!$(".page-home")) return;

    /* section rules + headings + leads */
    $$(".page-home section:not(.hero):not(.contact)").forEach(function (s) { drawRule(s, "top 95%"); });
    $$(".page-home section:not(.hero):not(.contact) h2").forEach(function (h) { headingReveal(h); });
    $$(".page-home section:not(.hero):not(.contact) .lead").forEach(function (p) { rise(p, p, { y: 20 }); });

    /* projects */
    $$(".page-home .project").forEach(function (p) {
      p.classList.add("in");
      drawRule(p, "top 88%");
      var num = $(".num", p), txt = $(".txt", p), vis = $(".vis", p);
      if (num) {
        var chars = Split ? Split.create(num, { type: "chars", mask: "chars" }).chars : [num];
        G.from(chars, {
          yPercent: 105,
          duration: 1.3,
          stagger: 0.08,
          ease: EASE,
          scrollTrigger: { trigger: p, start: "top 82%", once: true },
        });
      }
      rise($$(":scope > h3, :scope > .cat, :scope > .scope, :scope > .desc, .facts > div, .links, :scope > .soon-note", txt), p, {
        start: "top 80%",
        stagger: 0.06,
        delay: 0.15,
      });
      if (vis) {
        G.fromTo(vis, { clipPath: "inset(100% 0% 0% 0%)" }, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.5,
          ease: "expo.inOut",
          scrollTrigger: { trigger: p, start: "top 80%", once: true },
        });
        if (innerWidth > 960) {
          G.fromTo(vis, { y: 60 }, {
            y: -40,
            ease: "none",
            scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      }
    });

    /* design → production pipeline: stations light up while scrolling */
    var pipe = $(".page-home .pipe");
    if (pipe) {
      var st = $$("li", pipe);
      pipe.style.setProperty("--p", 0);
      ST.create({
        trigger: pipe,
        start: "top 85%",
        end: "top 40%",
        scrub: true,
        onUpdate: function (self) {
          var pr = self.progress;
          pipe.style.setProperty("--p", pr);
          st.forEach(function (li, i) {
            li.classList.toggle("on", pr >= i / (st.length - 1) - 0.001);
          });
        },
      });
      rise(st.map(function (li) { return li.querySelector("span"); }), pipe, { y: 10, stagger: 0.05 });
    }
    rise($$(".page-home .tools li"), ".page-home .tools", { y: 14, stagger: 0.04 });

    /* experience */
    $$(".page-home .job").forEach(function (j) {
      j.classList.add("in");
      rise($$(".when, h3, .co, li", j), j, { y: 20, stagger: 0.05, start: "top 84%" });
    });

    /* about */
    var about = $(".page-home .about");
    if (about) {
      rise($(".body > p", about), $(".body", about), { y: 20 });
      rise($$(".facts2 > div", about), $(".facts2", about), { y: 14, stagger: 0.06 });
      rise($$(".skills > div", about), $(".skills", about), { y: 24, stagger: 0.08 });
      var fig = $(".portrait", about);
      if (fig) portrait(fig);
    }

    /* contact: heading reads in word by word */
    var contact = $(".page-home .contact");
    if (contact) {
      var ch = $("h2", contact);
      if (Split && ch) {
        Split.create(ch, {
          type: "words",
          autoSplit: true,
          onSplit: function (self) {
            return G.fromTo(self.words, { opacity: 0.14 }, {
              opacity: 1,
              stagger: 0.1,
              ease: "none",
              scrollTrigger: { trigger: contact, start: "top 75%", end: "top 20%", scrub: true },
            });
          },
        });
      }
      rise([$(".lead", contact), $(".btn", contact)], contact, { start: "top 60%" });
      rise($$("li", contact), $("ul", contact), { y: 14, stagger: 0.06, start: "top 92%" });
    }
  }

  /* ---------- Portrait: resolves from coarse pixels to full detail ---------- */
  function portrait(fig) {
    var frame = $(".frame", fig), img = $("img", frame);
    if (!frame || !img) return;
    img.loading = "eager";
    var cv = document.createElement("canvas");
    var off = document.createElement("canvas");
    frame.appendChild(cv);
    var ctx = cv.getContext("2d"), octx = off.getContext("2d");
    var levels = [72, 48, 32, 22, 15, 10, 7, 5, 3, 2, 1];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function draw(block) {
      var w = frame.clientWidth, h = frame.clientHeight;
      if (!w || !h) return;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      var bw = Math.max(1, Math.ceil(w / block)), bh = Math.max(1, Math.ceil(h / block));
      off.width = bw; off.height = bh;
      try {
        octx.drawImage(img, 0, 0, bw, bh);
        ctx.imageSmoothingEnabled = block > 1 ? false : true;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(off, 0, 0, bw, bh, 0, 0, cv.width, cv.height);
      } catch (e) {}
    }

    function run(from, dur, cb) {
      var o = { i: from };
      G.set(cv, { autoAlpha: 1 });
      return G.to(o, {
        i: levels.length - 1,
        duration: dur,
        ease: "power2.out",
        onUpdate: function () { draw(levels[Math.round(o.i)]); },
        onComplete: function () {
          G.set(img, { opacity: 1 });
          G.set(cv, { autoAlpha: 0 });
          if (cb) cb();
        },
      });
    }

    var ready = img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise(function (r) { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); });

    G.set(frame, { clipPath: "inset(100% 0 0 0)" });
    ST.create({
      trigger: fig,
      start: "top 80%",
      once: true,
      onEnter: function () {
        ready.then(function () {
          draw(levels[0]);
          G.to(frame, { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "expo.inOut" });
          G.delayedCall(0.35, function () { run(0, 1.6); });
          rise($("figcaption", fig).children, fig, { y: 10, stagger: 0.08, delay: 0.6, start: "top 95%" });
        });
      },
    });

    /* a quick re-resolve on hover, like a screen refreshing */
    if (fine) {
      var busy = false;
      frame.addEventListener("pointerenter", function () {
        if (busy || G.getProperty(img, "opacity") < 1) return;
        busy = true;
        draw(levels[4]);
        run(4, 0.7, function () { busy = false; });
      });
    }
  }

  /* ---------- Case study pages ---------- */
  function caseStudy() {
    if (!$(".page-case")) return;
    var hero = $(".page-case .hero");
    if (hero) {
      var h1 = $("h1", hero), tl = G.timeline({ defaults: { ease: EASE } });
      G.set(h1, { visibility: "visible" });
      if (Split) {
        var sp = Split.create(h1, { type: "chars", mask: "chars" });
        tl.from(sp.chars, { yPercent: 110, duration: 1.3, stagger: 0.035 }, 0.1);
      } else tl.fromTo(h1, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0);
      tl.fromTo($(".label", hero), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1 }, 0)
        .fromTo([$(".sub", hero), $(".hl .lead", hero)], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.5)
        .set($(".meta3", hero), { visibility: "visible" }, 0.7)
        .fromTo($(".meta3", hero), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "expo.inOut" }, 0.7)
        .fromTo($$(".meta3 > div", hero), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.9);
    }

    $$(".page-case .sec h2, .page-case .goal, .page-case .pull").forEach(function (h) { headingReveal(h, "top 88%"); });

    $$(".page-case .rv").forEach(function (el) {
      el.classList.add("in");
      G.fromTo(el, { autoAlpha: 0, y: 40 }, {
        autoAlpha: 1, y: 0, duration: 1.2, ease: EASE,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    /* stacking screens: each card sinks back as the next one lands on it */
    var cards = $$(".page-case .stack-card");
    cards.forEach(function (c, i) {
      var nxt = cards[i + 1], img = $("img", c);
      if (img) {
        G.fromTo(img, { scale: 1.06 }, {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: c, start: "top bottom", end: "top 30%", scrub: true },
        });
      }
      if (!nxt) return;
      G.to(c, {
        scale: 0.92 + i * 0.008,
        "--dim": 0.55,
        ease: "none",
        scrollTrigger: {
          trigger: nxt,
          start: "top bottom",
          end: function () { return "top " + (parseFloat(getComputedStyle(nxt).top) || 0) + "px"; },
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });

    $$(".page-case .fig:not(.sl-slide) img").forEach(function (img) {
      G.fromTo(img, { clipPath: "inset(8% 8% 8% 8%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut",
        scrollTrigger: { trigger: img, start: "top 90%", once: true },
      });
    });

    /* tabs swap hidden panels: recalc trigger positions */
    $$('[role="tab"], [data-go]').forEach(function (t) {
      t.addEventListener("click", function () {
        requestAnimationFrame(function () { ST.refresh(); });
      });
    });
  }

  /* ---------- Generic leftovers (.rv not handled above) ---------- */
  function leftovers() {
    var rest = $$(".rv:not(.in)");
    if (!rest.length) return;
    rest.forEach(function (e) { e.classList.add("in"); });
    G.set(rest, { autoAlpha: 0, y: 40 });
    ST.batch(rest, {
      start: "top 88%",
      once: true,
      onEnter: function (b) {
        G.to(b, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: EASE });
      },
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function magnetic() {
    if (!fine) return;
    $$(".page-home .btn").forEach(function (b) {
      var xTo = G.quickTo(b, "x", { duration: 0.5, ease: "power3.out" });
      var yTo = G.quickTo(b, "y", { duration: 0.5, ease: "power3.out" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.32);
      });
      b.addEventListener("pointerleave", function () {
        G.to(b, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ---------- Boot (after fonts so line splits are accurate) ---------- */
  var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var booted = false;
  /* Scroll position across reloads (browser restoration is switched off in <head>) */
  var KEY = "ak-scroll:" + location.pathname;
  function saveScroll() {
    try { sessionStorage.setItem(KEY, String(Math.round(window.scrollY))); } catch (e) {}
  }
  addEventListener("pagehide", saveScroll);
  addEventListener("beforeunload", saveScroll);
  function savedScroll() {
    try {
      var v = parseInt(sessionStorage.getItem(KEY), 10);
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }

  function restoreScroll() {
    var hash = location.hash && location.hash.length > 1 ? location.hash.slice(1) : "";
    var el = hash ? document.getElementById(hash) : null;
    var target = savedScroll();
    var go = function () {
      if (el && el.closest("[hidden]") === null) {
        var y = el.getBoundingClientRect().top + window.scrollY - 72;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      } else if (target > 0) {
        var max = document.documentElement.scrollHeight - innerHeight;
        var y2 = Math.min(target, max);
        if (lenis) lenis.scrollTo(y2, { immediate: true, force: true });
        else window.scrollTo(0, y2);
      }
      ST.update();
    };
    /* two frames so pin spacers and SplitText lines are in place */
    requestAnimationFrame(function () { requestAnimationFrame(go); });
  }

  function boot() {
    if (booted) return;
    booted = true;
    /* every trigger is measured from the top of the page */
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    heroScroll();
    workScroll();
    processScroll();
    home();
    lifeGallery();
    caseStudy();
    leftovers();
    magnetic();
    intro(heroIn);
    ST.refresh();
    restoreScroll();
    /* late images or fonts can still change the layout */
    var settle = function () {
      ST.refresh();
      /* if the page was still too short to reach the saved spot, try again */
      var t = savedScroll();
      if (!location.hash && t > 0 && Math.abs(window.scrollY - t) > 4) {
        var max = document.documentElement.scrollHeight - innerHeight;
        var y = Math.min(t, max);
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        ST.update();
      }
    };
    if (document.readyState === "complete") setTimeout(settle, 0);
    else addEventListener("load", settle, { once: true });
    setTimeout(settle, 900);
  }
  Promise.race([fonts, new Promise(function (r) { setTimeout(r, 1200); })]).then(boot);
})();
