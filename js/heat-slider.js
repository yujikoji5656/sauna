// Heat slider: endless loop (cards are cloned on both sides), prev/next buttons, counter,
// progress bar and mouse drag for the #heat-track row.
(function () {
  var DRAG_THRESHOLD_PX = 6;
  var SETTLE_MS = 140; // wait this long after the last scroll event before re-centring

  var track = document.getElementById("heat-track");
  var nav = document.querySelector(".heat-nav");
  if (!track || !nav) return;

  var originals = Array.prototype.slice.call(track.querySelectorAll(".heat-card"));
  var count = originals.length;
  if (count < 2) return;
  var buttons = nav.querySelectorAll(".heat-nav__btn");
  var nowEl = nav.querySelector(".heat-nav__now");
  var fill = nav.querySelector(".heat-nav__fill");

  function makeClone(card) {
    var c = card.cloneNode(true);
    c.classList.add("is-in", "is-clone");
    c.setAttribute("aria-hidden", "true");
    c.setAttribute("tabindex", "-1");
    c.removeAttribute("id");
    return c;
  }
  // [clones][originals][clones] so there is always a card on either side.
  var before = document.createDocumentFragment();
  var after = document.createDocumentFragment();
  originals.forEach(function (card) { before.appendChild(makeClone(card)); after.appendChild(makeClone(card)); });
  track.insertBefore(before, originals[0]);
  track.appendChild(after);

  function step() { return originals[1].offsetLeft - originals[0].offsetLeft; }
  function setWidth() { return step() * count; }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  // Jump without animation (used to hop between the identical sets).
  function jumpTo(x) {
    var prev = track.style.scrollBehavior;
    track.style.scrollBehavior = "auto";
    track.classList.add("is-dragging"); // also disables snapping for the jump
    track.scrollLeft = x;
    track.classList.remove("is-dragging");
    track.style.scrollBehavior = prev;
  }

  // Keep the scroll position inside the middle (original) set.
  function recentre() {
    var w = setWidth();
    var x = track.scrollLeft;
    if (x < w - step() / 2) jumpTo(x + w);
    else if (x >= 2 * w - step() / 2) jumpTo(x - w);
  }

  function update() {
    var index = ((Math.round(track.scrollLeft / step()) % count) + count) % count;
    nowEl.textContent = pad(index + 1);
    fill.style.width = (100 / count) + "%";
    fill.style.left = (index * 100 / count) + "%";
  }

  var settleTimer = 0;
  function onScroll() {
    window.requestAnimationFrame(update);
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(function () { if (!dragging) recentre(); }, SETTLE_MS);
  }

  function move(dir) {
    recentre();
    track.scrollBy({ left: dir * step(), behavior: "smooth" });
  }

  buttons.forEach(function (btn) {
    btn.disabled = false;
    btn.addEventListener("click", function () { move(parseInt(btn.getAttribute("data-dir"), 10)); });
  });

  track.addEventListener("keydown", function (e) {
    if (e.target !== track) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(e.key === "ArrowRight" ? 1 : -1);
    }
  });

  // Mouse drag (touch already scrolls natively).
  var startX = 0, startScroll = 0, dragging = false, moved = false;
  track.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    recentre();
    dragging = true; moved = false;
    startX = e.clientX; startScroll = track.scrollLeft;
  });
  window.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
    if (!moved) { moved = true; track.classList.add("is-dragging"); }
    track.scrollLeft = startScroll - dx;
  });
  window.addEventListener("pointerup", function () {
    if (!dragging) return;
    dragging = false;
    if (!moved) return;
    track.classList.remove("is-dragging");
    var target = Math.round(track.scrollLeft / step()) * step();
    track.scrollTo({ left: target, behavior: "smooth" });
  });
  track.addEventListener("click", function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);

  track.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    jumpTo(setWidth() + (((Math.round(track.scrollLeft / step()) % count) + count) % count) * step());
    update();
  });

  jumpTo(setWidth()); // start on the first original card
  update();
})();
