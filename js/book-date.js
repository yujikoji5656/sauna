/* Booking step 2: guests, date (calendar) and start time. */
(function () {
  "use strict";

  var B = window.TCSFBooking;
  var root = document.getElementById("bk-date");
  if (!B || !root) return;

  var state = B.load();
  var planId = B.planFromQuery() || state.plan;
  var plan = B.PLANS[planId];
  if (!plan) { window.location.replace("../"); return; }
  if (planId !== state.plan) state = B.save({ plan: planId, date: null, time: null });

  var el = function (id) { return document.getElementById(id); };
  var male = el("bk-male");
  var female = el("bk-female");
  var grid = el("bk-cal-grid");
  var monthLabel = el("bk-cal-month");
  var prevBtn = el("bk-cal-prev");
  var nextBtn = el("bk-cal-next");
  var picked = el("bk-picked");
  var timesWrap = el("bk-times-wrap");
  var times = el("bk-times");
  var span = el("bk-span");
  var next = el("bk-date-next");
  var error = el("bk-date-error");

  el("bk-plan-name").textContent = plan.name + (plan.label === "会員" ? "（会員）" : "");
  el("bk-plan-price").textContent = B.yen(plan.price) + "(税込)";
  if (plan.weekdayOnly) el("bk-plan-note").textContent = "土日祝はご利用いただけません";

  // Guests: 0–6 each, total capped at MAX_GUESTS.
  [male, female].forEach(function (sel) {
    for (var n = 0; n <= B.MAX_GUESTS; n += 1) {
      var o = document.createElement("option");
      o.value = String(n);
      o.textContent = n + "名";
      sel.appendChild(o);
    }
  });
  male.value = String(state.male || 0);
  female.value = String(state.female || 0);

  var selectedDate = B.parseIso(state.date);
  if (selectedDate && B.dayBlock(selectedDate, plan)) selectedDate = null;
  var selectedTime = selectedDate && B.slotsFor(selectedDate, plan).indexOf(state.time) !== -1 ? state.time : null;
  var view = selectedDate || B.startOfToday();
  var viewMonth = new Date(view.getFullYear(), view.getMonth(), 1);

  function guests() { return Number(male.value) + Number(female.value); }
  function ready() { return Boolean(selectedDate && selectedTime && guests() > 0 && guests() <= B.MAX_GUESTS); }

  function renderCalendar() {
    var y = viewMonth.getFullYear();
    var m = viewMonth.getMonth();
    monthLabel.textContent = y + "年" + (m + 1) + "月";
    var first = new Date(y, m, 1);
    var days = new Date(y, m + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < first.getDay(); i += 1) cells.push('<span class="bkc__cell" aria-hidden="true"></span>');
    for (var d = 1; d <= days; d += 1) {
      var date = new Date(y, m, d);
      var block = B.dayBlock(date, plan);
      var iso = B.isoDate(date);
      var on = selectedDate && iso === B.isoDate(selectedDate);
      var cls = "bkc__day" + (on ? " is-on" : "") + (date.getDay() === 0 || B.isHoliday(date) ? " is-sun" : date.getDay() === 6 ? " is-sat" : "");
      cells.push('<button type="button" class="' + cls + '" data-date="' + iso + '"' +
        (block ? " disabled" : "") + ' aria-pressed="' + (on ? "true" : "false") + '" aria-label="' + B.formatDate(date) +
        (block ? "（予約不可）" : "") + '">' + d + "</button>");
    }
    grid.innerHTML = cells.join("");
    var today = B.startOfToday();
    prevBtn.disabled = y < today.getFullYear() || (y === today.getFullYear() && m <= today.getMonth());
    var last = B.lastBookableDay();
    nextBtn.disabled = y > last.getFullYear() || (y === last.getFullYear() && m >= last.getMonth());
  }

  function renderTimes() {
    if (!selectedDate) {
      picked.hidden = true;
      timesWrap.hidden = true;
      return;
    }
    picked.hidden = false;
    picked.innerHTML = "選択中: <b>" + B.formatDate(selectedDate) + "</b><span>（営業 " +
      B.minToTime(B.HOURS.open) + "〜" + B.minToTime(B.HOURS.close) + "）</span>";
    timesWrap.hidden = false;
    times.innerHTML = B.slotsFor(selectedDate, plan).map(function (t) {
      var on = t === selectedTime;
      return '<button type="button" class="bkt__slot' + (on ? " is-on" : "") + '" data-time="' + t +
        '" aria-pressed="' + (on ? "true" : "false") + '">' + t + "</button>";
    }).join("");
  }

  function renderSummary() {
    if (selectedTime) {
      var end = B.minToTime(B.timeToMin(selectedTime) + plan.hours * 60);
      span.hidden = false;
      span.innerHTML = "ご利用時間: <b>" + selectedTime + " 〜 " + end + "</b>（" + plan.hours + "時間）";
    } else {
      span.hidden = true;
    }
    next.setAttribute("aria-disabled", ready() ? "false" : "true");
  }

  function persist() {
    state = B.save({
      plan: planId,
      male: Number(male.value),
      female: Number(female.value),
      date: selectedDate ? B.isoDate(selectedDate) : null,
      time: selectedTime
    });
  }

  function onGuests(e) {
    var other = e.target === male ? female : male;
    if (guests() > B.MAX_GUESTS) other.value = String(B.MAX_GUESTS - Number(e.target.value));
    error.hidden = true;
    persist();
    renderSummary();
  }

  male.addEventListener("change", onGuests);
  female.addEventListener("change", onGuests);

  prevBtn.addEventListener("click", function () {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  nextBtn.addEventListener("click", function () {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-date]");
    if (!btn || btn.disabled) return;
    selectedDate = B.parseIso(btn.getAttribute("data-date"));
    selectedTime = null;
    persist();
    renderCalendar();
    renderTimes();
    renderSummary();
    timesWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  times.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-time]");
    if (!btn) return;
    selectedTime = btn.getAttribute("data-time");
    persist();
    renderTimes();
    renderSummary();
  });

  // Not disabled outright, so a click can say what is still missing.
  next.addEventListener("click", function () {
    if (!ready()) {
      var missing = [];
      if (guests() === 0) missing.push("ご利用人数");
      if (!selectedDate) missing.push("日付");
      else if (!selectedTime) missing.push("開始時間");
      error.textContent = missing.join("・") + "を選択してください。";
      error.hidden = false;
      return;
    }
    persist();
    window.location.href = "../info/";
  });

  renderCalendar();
  renderTimes();
  renderSummary();
})();
