/* Booking step 1: clicking a plan row goes straight to the date page for that plan. */
(function () {
  "use strict";
  var form = document.querySelector(".bk__form");
  if (!form) return;

  function go(value) {
    if (!value) return;
    window.location.href = "date/?plan=" + encodeURIComponent(value);
  }

  form.querySelectorAll(".bk__plan").forEach(function (row) {
    var input = row.querySelector('input[type="radio"]');
    row.addEventListener("click", function (e) {
      e.preventDefault();
      input.checked = true;
      go(input.value);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); go(input.value); }
    });
  });

  // "日時を選ぶ" still works: send the visible tab's checked plan.
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var checked = form.querySelector("fieldset:not([disabled]) input[type=\"radio\"]:checked");
    go(checked && checked.value);
  });
})();
