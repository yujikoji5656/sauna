// Booking step 1: switch between 一般 / 会員 price tabs (only the visible panel's radios are submitted).
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".bk__tab"));
  if (!tabs.length) return;

  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (!panel) return;
      panel.hidden = !on;
      panel.disabled = !on;
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab); });
    tab.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  // Open the member tab directly with book/?member (e.g. from the membership page).
  if (/[?&]member\b/.test(window.location.search)) select(tabs[1]);
})();
