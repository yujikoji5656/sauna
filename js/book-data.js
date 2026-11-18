/* Booking flow: shared data (plans, hours, holidays) and state kept in sessionStorage. */
(function (global) {
  "use strict";

  var PLANS = {
    "general-5h":  { name: "5時間コース",  hours: 5,  price: 8800,  label: "一般", weekdayOnly: false },
    "general-2h":  { name: "2時間コース",  hours: 2,  price: 3500,  label: "一般", weekdayOnly: true },
    "member-5h":   { name: "5時間コース",  hours: 5,  price: 6000,  label: "会員", weekdayOnly: false },
    "member-2h":   { name: "2時間コース",  hours: 2,  price: 2480,  label: "会員", weekdayOnly: false },
    "member-10h":  { name: "10時間コース", hours: 10, price: 10000, label: "会員", weekdayOnly: false }
  };

  var HOURS = { open: 10 * 60, close: 20 * 60, stepMin: 30, closedWeekday: 2 /* Tuesday */ };
  var MAX_GUESTS = 6;
  var BOOK_AHEAD_MONTHS = 2;
  var PHONE = "080-6330-1447";

  // Japanese public holidays (incl. substitute holidays), 2026–2027.
  var HOLIDAYS = [
    "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20", "2026-04-29",
    "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-07-20", "2026-08-11",
    "2026-09-21", "2026-09-22", "2026-09-23", "2026-10-12", "2026-11-03", "2026-11-23",
    "2027-01-01", "2027-01-11", "2027-02-11", "2027-02-23", "2027-03-21", "2027-03-22",
    "2027-04-29", "2027-05-03", "2027-05-04", "2027-05-05", "2027-07-19", "2027-08-11",
    "2027-09-20", "2027-09-23", "2027-10-11", "2027-11-03", "2027-11-23"
  ];

  var KEY = "tcsf-booking";
  var WEEK = ["日", "月", "火", "水", "木", "金", "土"];

  function load() {
    try {
      var raw = global.sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function save(patch) {
    var next = Object.assign({}, load(), patch);
    try {
      global.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      /* Storage blocked: the flow still works within the page, just not across reloads. */
    }
    return next;
  }

  function clear() {
    try { global.sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function minToTime(min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); }
  function timeToMin(t) {
    var m = /^(\d{2}):(\d{2})$/.exec(t || "");
    return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
  }
  function yen(n) { return "¥" + n.toLocaleString("ja-JP"); }
  function formatDate(d) {
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" + WEEK[d.getDay()] + "）";
  }

  function isHoliday(d) { return HOLIDAYS.indexOf(isoDate(d)) !== -1; }

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function lastBookableDay() {
    var t = startOfToday();
    return new Date(t.getFullYear(), t.getMonth() + BOOK_AHEAD_MONTHS + 1, 0);
  }

  // Why a day cannot be booked for this plan, or "" when it can.
  function dayBlock(d, plan) {
    if (d < startOfToday() || d > lastBookableDay()) return "out";
    if (d.getDay() === HOURS.closedWeekday) return "closed";
    if (plan && plan.weekdayOnly && (d.getDay() === 0 || d.getDay() === 6 || isHoliday(d))) return "weekday";
    if (slotsFor(d, plan).length === 0) return "full";
    return "";
  }

  // Start times whose whole stay fits inside opening hours (and, for today, haven't passed).
  function slotsFor(d, plan) {
    if (!plan) return [];
    var last = HOURS.close - plan.hours * 60;
    var now = new Date();
    var isToday = isoDate(d) === isoDate(now);
    var earliest = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0;
    var out = [];
    for (var m = HOURS.open; m <= last; m += HOURS.stepMin) {
      if (m >= earliest) out.push(minToTime(m));
    }
    return out;
  }

  function planFromQuery() {
    var q = new URLSearchParams(global.location.search);
    var id = q.get("plan") || q.get("plan-member");
    return PLANS[id] ? id : null;
  }

  global.TCSFBooking = {
    PLANS: PLANS, HOURS: HOURS, MAX_GUESTS: MAX_GUESTS, PHONE: PHONE, WEEK: WEEK,
    load: load, save: save, clear: clear,
    isoDate: isoDate, parseIso: parseIso, minToTime: minToTime, timeToMin: timeToMin,
    yen: yen, formatDate: formatDate, isHoliday: isHoliday,
    startOfToday: startOfToday, lastBookableDay: lastBookableDay,
    dayBlock: dayBlock, slotsFor: slotsFor, planFromQuery: planFromQuery
  };
})(window);
