/* Features: pin the section and slide the row sideways with vertical scroll. */
(function () {
  "use strict";

  var root = document.getElementById("features");
  if (!root) return;

  var pin = root.querySelector(".tf__pin");
  var viewport = root.querySelector(".tf__viewport");
  var list = root.querySelector(".tf__list");
  var items = Array.prototype.slice.call(root.querySelectorAll(".tf__item"));
  var fades = Array.prototype.slice.call(root.querySelectorAll(".tf-fade"));
  var imgs = Array.prototype.slice.call(root.querySelectorAll(".tf__fig"));
  var counter = root.querySelector(".tf__current");
  var wide = window.matchMedia("(min-width: 768px) and (min-height: 520px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var distance = 0;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function measure() {
    var pinned = wide.matches && !reduced.matches;
    root.classList.toggle("is-pinned", pinned);
    if (!pinned) {
      list.style.transform = "";
      root.style.removeProperty("--tf-run");
      return;
    }
    distance = Math.max(0, list.scrollWidth - viewport.clientWidth);
    // Vertical run = one screen of pin + the sideways distance (1px down = 1px across).
    root.style.setProperty("--tf-run", (window.innerHeight + distance) + "px");
  }

  function revealInView() {
    var vw = window.innerWidth;
    fades.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      var r = el.getBoundingClientRect();
      if (r.left < vw * 0.92 && r.right > 0 && r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("is-in");
      }
    });
  }

  function parallax() {
    var center = window.innerWidth / 2;
    imgs.forEach(function (fig) {
      var r = fig.getBoundingClientRect();
      var offset = (r.left + r.width / 2 - center) / window.innerWidth; // ~ -1..1
      var shift = Math.max(-1, Math.min(1, offset)) * -0.07 * r.width;
      fig.style.setProperty("--tf-px", shift.toFixed(1) + "px");
    });
  }

  // Smoothed state: the row eases toward the scroll position instead of jumping with each wheel step.
  var SMOOTH_TAU = 0.14;          // seconds; larger = softer, more lag
  var target = { p: 0, gx: 30, gy: 60 };
  var shown = { p: 0, gx: 30, gy: 60 };
  var lastTime = 0;
  var running = false;

  function readTarget() {
    if (!root.classList.contains("is-pinned") || distance <= 0) { target.p = 0; return; }
    var top = root.getBoundingClientRect().top;
    target.p = Math.min(1, Math.max(0, -top / distance));
  }

  function render() {
    if (root.classList.contains("is-pinned")) {
      list.style.transform = "translate3d(" + (-shown.p * distance).toFixed(2) + "px,0,0)";
      root.style.setProperty("--tf-progress", shown.p.toFixed(4));
      var index = Math.min(items.length - 1, Math.round(shown.p * (items.length - 1)));
      if (counter) counter.textContent = pad(index + 1);
    }
    root.style.setProperty("--tf-gx", shown.gx.toFixed(2) + "%");
    root.style.setProperty("--tf-gy", shown.gy.toFixed(2) + "%");
    parallax();
    revealInView();
  }

  function frame(now) {
    var dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
    lastTime = now;
    var k = reduced.matches ? 1 : 1 - Math.exp(-dt / SMOOTH_TAU);
    var settled = true;
    ["p", "gx", "gy"].forEach(function (key) {
      var diff = target[key] - shown[key];
      var eps = key === "p" ? 0.5 / Math.max(1, distance) : 0.05;
      if (Math.abs(diff) > eps) { shown[key] += diff * k; settled = false; }
      else shown[key] = target[key];
    });
    render();
    if (settled) { running = false; lastTime = 0; return; }
    window.requestAnimationFrame(frame);
  }

  function request() {
    readTarget();
    if (running) return;
    running = true;
    window.requestAnimationFrame(frame);
  }

  function jump() { readTarget(); shown.p = target.p; render(); }

  function onResize() { measure(); jump(); }

  // Warm glow follows the pointer.
  pin.addEventListener("pointermove", function (e) {
    var r = pin.getBoundingClientRect();
    target.gx = (e.clientX - r.left) / r.width * 100;
    target.gy = (e.clientY - r.top) / r.height * 100;
    request();
  });

  if (!reduced.matches) root.classList.add("is-armed");

  [wide, reduced].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener("change", onResize);
    else if (mq.addListener) mq.addListener(onResize);
  });
  window.addEventListener("scroll", request, { passive: true });
  viewport.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", onResize);
  imgs.forEach(function (fig) {
    var img = fig.querySelector("img");
    if (img && !img.complete) img.addEventListener("load", request, { once: true });
  });
  measure();
  jump();
})();
