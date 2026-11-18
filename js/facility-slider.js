// Facility: the large photo of each area (Mizu / Kaze / Mori) slides through that area's photos.
// One photo at a time with ← → arrows and swipe; hover (or keyboard focus) pauses the auto-advance.
(function () {
  var INTERVAL_MS = 4000;
  var AREAS = ["mizu", "kaze", "mori"];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setup(section) {
    var stage = section.querySelector(".aspect-\\[4\\/3\\]");
    var thumbs = Array.prototype.slice.call(section.querySelectorAll(".grid-cols-3 img"));
    var lead = stage && stage.querySelector("img");
    if (!stage || !lead || !thumbs.length) return;

    var sources = [{ src: lead.getAttribute("src"), alt: lead.alt }].concat(thumbs.map(function (t) {
      return { src: t.getAttribute("src"), alt: t.alt };
    }));

    var track = document.createElement("div");
    track.className = "fs-track";
    sources.forEach(function (item, i) {
      var img = document.createElement("img");
      img.className = "fs-slide";
      img.src = item.src;
      img.alt = i === 0 ? item.alt : "";
      img.loading = i === 0 ? "eager" : "lazy";
      img.decoding = "async";
      track.appendChild(img);
    });
    lead.remove();
    stage.classList.add("fs-stage");
    stage.setAttribute("tabindex", "0");
    stage.setAttribute("aria-roledescription", "スライドショー");
    stage.setAttribute("aria-label", section.querySelector("h2").textContent + " の写真");
    stage.appendChild(track);

    var bar = document.createElement("div");
    bar.className = "fs-progress";
    bar.innerHTML = "<span></span>";
    stage.appendChild(bar);
    var counter = document.createElement("p");
    counter.className = "fs-count";
    stage.appendChild(counter);

    var index = 0, timer = 0, paused = false;

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function show(i) {
      index = (i + sources.length) % sources.length;
      track.style.transform = "translate3d(" + (-index * 100) + "%,0,0)";
      counter.textContent = pad(index + 1) + " / " + pad(sources.length);
      // thumbnail i corresponds to slide i + 1 (slide 0 is the lead photo)
      restartBar();
    }

    function restartBar() {
      bar.classList.remove("is-running");
      void bar.offsetWidth; // restart the CSS animation
      if (!paused && !reduced) bar.classList.add("is-running");
    }

    function schedule() {
      window.clearTimeout(timer);
      if (paused || reduced) return;
      timer = window.setTimeout(function () { show(index + 1); schedule(); }, INTERVAL_MS);
    }

    function pause() { paused = true; stage.classList.add("is-paused"); window.clearTimeout(timer); bar.classList.remove("is-running"); }
    function resume() { paused = false; stage.classList.remove("is-paused"); restartBar(); schedule(); }

    stage.addEventListener("mouseenter", pause);
    stage.addEventListener("mouseleave", resume);
    stage.addEventListener("focusin", pause);
    stage.addEventListener("focusout", resume);
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        show(index + (e.key === "ArrowRight" ? 1 : -1));
      }
    });

    // One photo only: hide the thumbnail grid, slide with arrows / swipe instead.
    var grid = thumbs[0].closest(".grid-cols-3");
    if (grid) grid.hidden = true;

    ["prev", "next"].forEach(function (dir) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fs-arrow fs-arrow--" + dir;
      btn.setAttribute("aria-label", dir === "prev" ? "前の写真" : "次の写真");
      btn.innerHTML = dir === "prev" ? "&#8592;" : "&#8594;";
      btn.addEventListener("click", function () { show(index + (dir === "prev" ? -1 : 1)); schedule(); });
      stage.appendChild(btn);
    });

    var startX = null;
    stage.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") startX = e.clientX; });
    stage.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) { show(index + (dx < 0 ? 1 : -1)); schedule(); }
    });
    stage.addEventListener("pointercancel", function () { startX = null; });

    // Only run while the area is on screen.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { if (!stage.matches(":hover")) resume(); }
          else { window.clearTimeout(timer); bar.classList.remove("is-running"); }
        });
      }, { threshold: 0.3 }).observe(stage);
    } else {
      schedule();
    }

    show(0);
  }

  AREAS.forEach(function (id) {
    var section = document.getElementById(id);
    if (section) setup(section);
  });
})();
