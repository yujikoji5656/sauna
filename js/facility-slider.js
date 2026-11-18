// Facility: the large photo of each area (Mizu / Kaze / Mori) holds all of that area's photos in one frame.
// The photos flow on their own every few seconds (looping); hover pauses; swipe / arrows / ← → keys also work.
(function () {
  var INTERVAL_MS = 4000;
  var SCROLL_PER_PHOTO = 0.35;         // page scroll per photo while pinned, in viewport heights (smaller = faster)
  var SMOOTH_TAU = 0.12;               // seconds the photos take to ease after the scroll (natural, not jumpy)
  var AREAS = ["mizu", "kaze", "mori"];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");

  function headerHeight() {
    var h = document.getElementById("site-header");
    return h ? h.getBoundingClientRect().height : 0;
  }

  function setup(section) {
    var stage = section.querySelector(".aspect-\\[4\\/3\\]");
    var grid = section.querySelector(".grid-cols-3");
    var thumbs = grid ? Array.prototype.slice.call(grid.querySelectorAll("img")) : [];
    var lead = stage && stage.querySelector("img");
    var inner = section.firstElementChild;
    if (!stage || !lead || !thumbs.length || !inner) return;

    var sources = [{ src: lead.getAttribute("src"), alt: lead.alt }].concat(thumbs.map(function (t) {
      return { src: t.getAttribute("src"), alt: t.alt };
    }));
    var last = sources.length - 1;

    var track = document.createElement("div");
    track.className = "fs-track";
    sources.forEach(function (item, i) {
      var img = document.createElement("img");
      img.className = "fs-slide";
      img.src = item.src;
      img.alt = i === 0 ? item.alt : "";
      img.loading = i === 0 ? "eager" : "lazy";
      img.decoding = "async";
      img.draggable = false;
      track.appendChild(img);
    });
    var loopClone = track.firstChild.cloneNode();
    loopClone.alt = "";
    loopClone.setAttribute("aria-hidden", "true");
    track.appendChild(loopClone);
    lead.remove();
    grid.remove();
    section.classList.add("fs-area");
    inner.classList.add("fs-inner");
    stage.classList.add("fs-stage");
    stage.setAttribute("tabindex", "0");
    stage.setAttribute("aria-roledescription", "スライドショー");
    stage.setAttribute("aria-label", section.querySelector("h2").textContent + " の写真");
    stage.appendChild(track);

    var bar = document.createElement("div");
    bar.className = "fs-progress";
    bar.innerHTML = "<span></span>";
    stage.appendChild(bar);
    var fill = bar.firstChild;
    var counter = document.createElement("p");
    counter.className = "fs-count";
    stage.appendChild(counter);

    var index = 0, timer = 0, paused = false, settleTimer = 0, pinned = false;

    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function setIndex(i) {
      index = i;
      counter.textContent = pad(index + 1) + " / " + pad(sources.length);
    }

    /* ---------- pinned mode: page scroll drives the photos ---------- */
    var stickyTop = 0;
    function padTop() { return parseFloat(getComputedStyle(section).paddingTop) || 0; }
    // Distance the pinned block travels: content height of the section minus the block itself.
    function pinRange() {
      var cs = getComputedStyle(section);
      var content = section.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      return Math.max(0, content - inner.offsetHeight);
    }
    // Page offset (relative to the section's top edge) where pinning starts.
    function pinStart() { return padTop() - stickyTop; }

    // Scroll sets a target; the photos ease toward it every frame so wheel steps glide instead of jump.
    var targetP = 0, shownP = 0, easing = false, lastT = 0;
    function paint(p) {
      track.scrollLeft = p * (track.scrollWidth - track.clientWidth);
      fill.style.transform = "scaleX(" + p + ")";
      var i = Math.round(p * last);
      if (i !== index) setIndex(i);
    }
    function ease(now) {
      var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
      lastT = now;
      var diff = targetP - shownP;
      if (!pinned || Math.abs(diff) < 0.0005) { shownP = targetP; paint(shownP); easing = false; lastT = 0; return; }
      shownP += diff * (reduced ? 1 : 1 - Math.exp(-dt / SMOOTH_TAU));
      paint(shownP);
      window.requestAnimationFrame(ease);
    }
    function onScroll() {
      if (!pinned) return;
      var range = pinRange();
      var travelled = -section.getBoundingClientRect().top - pinStart();
      targetP = range > 0 ? Math.min(1, Math.max(0, travelled / range)) : 0;
      if (!easing) { easing = true; window.requestAnimationFrame(ease); }
    }

    function scrollPageTo(i) {
      var top = window.scrollY + section.getBoundingClientRect().top;
      window.scrollTo({ top: top + pinStart() + (i / last) * pinRange(), behavior: reduced ? "auto" : "smooth" });
    }

    function layout() {
      var shouldPin = false; // photos flow on their own on every screen (no scroll-driven mode)
      if (shouldPin) {
        // Pin only when the text + photo fit on screen below the floating header.
        section.style.minHeight = "";
        var room = window.innerHeight - headerHeight();
        shouldPin = inner.offsetHeight <= room - 16;
      }
      pinned = shouldPin;
      section.classList.toggle("fs-pinned", pinned);
      if (pinned) {
        stickyTop = headerHeight() + Math.max(0, (window.innerHeight - headerHeight() - inner.offsetHeight) / 2);
        inner.style.top = stickyTop + "px";
        var cs = getComputedStyle(section);
        var pads = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        section.style.minHeight = (pads + inner.offsetHeight + last * SCROLL_PER_PHOTO * window.innerHeight) + "px";
        stop();
        onScroll();
        shownP = targetP;
        paint(shownP);
      } else {
        inner.style.top = "";
        section.style.minHeight = "";
        fill.style.transform = "";
        track.scrollLeft = index * track.clientWidth;
        schedule();
      }
    }

    /* ---------- free mode: swipe / arrows / auto-advance ---------- */
    function jump(i) {
      track.classList.add("is-jumping");
      track.scrollLeft = i * track.clientWidth;
      track.classList.remove("is-jumping");
    }
    var wrapTimer = 0;
    function show(i) {
      var n = sources.length;
      window.clearTimeout(wrapTimer);
      if (i === n && !reduced) {
        // forward past the last photo: glide onto the copy of photo 1, then hop back to the real one
        setIndex(0);
        track.scrollTo({ left: n * track.clientWidth, behavior: "smooth" });
        wrapTimer = window.setTimeout(function () { jump(0); }, 1000);
      } else {
        var next = (i + n) % n;
        if (i < 0 && !reduced) jump(n); // backward from photo 1: start from the copy so it glides left
        setIndex(next);
        track.scrollTo({ left: next * track.clientWidth, behavior: reduced ? "auto" : "smooth" });
      }
      restartBar();
    }
    function restartBar() {
      bar.classList.remove("is-running");
      void bar.offsetWidth; // restart the CSS animation
      if (!pinned && !paused && !reduced) bar.classList.add("is-running");
    }
    function stop() { window.clearTimeout(timer); bar.classList.remove("is-running"); }
    function schedule() {
      stop();
      if (pinned || paused || reduced) return;
      restartBar();
      timer = window.setTimeout(function () { show(index + 1); schedule(); }, INTERVAL_MS);
    }

    track.addEventListener("scroll", function () {
      if (pinned) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(function () {
        var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i >= sources.length) { jump(0); i = 0; }
        if (i !== index) { setIndex(i); schedule(); }
      }, 120);
    }, { passive: true });

    stage.addEventListener("mouseenter", function () { paused = true; stage.classList.add("is-paused"); stop(); });
    stage.addEventListener("mouseleave", function () { paused = false; stage.classList.remove("is-paused"); schedule(); });

    function go(dir) {
      var target = Math.min(last, Math.max(0, index + dir));
      if (pinned) scrollPageTo(target);
      else { show(index + dir); schedule(); }
    }
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); }
    });
    ["prev", "next"].forEach(function (dir) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fs-arrow fs-arrow--" + dir;
      btn.setAttribute("aria-label", dir === "prev" ? "前の写真" : "次の写真");
      btn.innerHTML = dir === "prev" ? "&#8592;" : "&#8594;";
      btn.addEventListener("click", function () { go(dir === "prev" ? -1 : 1); });
      stage.appendChild(btn);
    });

    // Free mode only runs its timer while the area is on screen.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (pinned) return;
          if (entry.isIntersecting) { if (!stage.matches(":hover")) schedule(); }
          else stop();
        });
      }, { threshold: 0.3 }).observe(stage);
    }

    window.addEventListener("scroll", function () { window.requestAnimationFrame(onScroll); }, { passive: true });
    window.addEventListener("resize", layout);
    if (wide.addEventListener) wide.addEventListener("change", layout);
    setIndex(0);
    layout();
  }

  function init() {
    AREAS.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) setup(section);
    });
  }
  // Measure after fonts/images settle so the pinned height is right.
  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})();
