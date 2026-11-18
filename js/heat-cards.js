// Heat cards: scroll reveal (photo opens, flags unfurl) and "lit" state on touch screens.
(function () {
  var root = document.getElementById("saunas");
  if (!root || !("IntersectionObserver" in window)) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;
  var revealEls = root.querySelectorAll(".heat-reveal");

  if (!reduced) {
    root.classList.add("heat-armed");
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  // No hover on touch screens: light up whichever card sits in the middle band of the viewport.
  if (!canHover) {
    var litObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-lit", entry.isIntersecting);
      });
    }, { rootMargin: "-35% 0px -35% 0px" });
    root.querySelectorAll(".heat-card").forEach(function (el) { litObserver.observe(el); });
  }
})();
