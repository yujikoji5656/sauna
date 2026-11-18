/* Sauna cards in #saunas: click (or Enter on) a card to open that sauna's own page (saunas/<slug>/). */
(function () {
  "use strict";

  var section = document.getElementById("saunas");
  if (!section) return;
  var cards = Array.prototype.slice.call(section.querySelectorAll(".heat-card"));
  if (!cards.length) return;

  // Card name (aria-label) -> page folder under saunas/
  var PAGES = {
    "ケロサウナ": "kelo",
    "テルマリウム": "thermarium",
    "マウンテンサウナ": "mountain",
    "ベンベルグサウナ": "bemberg",
    "キャンプ（エコ）サウナ": "camp"
  };

  function pageFor(card) {
    var slug = PAGES[card.getAttribute("aria-label")];
    return slug ? "saunas/" + slug + "/" : null;
  }

  // Ignore clicks that end a drag/swipe of the slider.
  cards.forEach(function (card) {
    var href = pageFor(card);
    if (!href) return;
    var startX = 0;
    card.setAttribute("role", "link");
    card.addEventListener("pointerdown", function (e) { startX = e.clientX; });
    card.addEventListener("click", function (e) {
      if (Math.abs(e.clientX - startX) > 8) return;
      window.location.href = href;
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.location.href = href; }
    });
  });
})();
