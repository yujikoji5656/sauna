/* Booking step 4: review everything. Sending is not wired to a booking system yet. */
(function () {
  "use strict";

  var B = window.TCSFBooking;
  var list = document.getElementById("bk-review");
  if (!B || !list) return;

  var state = B.load();
  var plan = B.PLANS[state.plan];
  var c = state.customer;
  if (!plan || !state.date || !state.time) { window.location.replace("../date/"); return; }
  if (!c) { window.location.replace("../info/"); return; }

  var date = B.parseIso(state.date);
  var end = B.minToTime(B.timeToMin(state.time) + plan.hours * 60);

  var rows = [
    ["プラン", plan.name + (plan.label === "会員" ? "（会員）" : "")],
    ["料金", B.yen(plan.price) + "(税込)"],
    ["日付", B.formatDate(date)],
    ["ご利用時間", state.time + " 〜 " + end + "（" + plan.hours + "時間）"],
    ["ご利用人数", "男性 " + (state.male || 0) + "名 ／ 女性 " + (state.female || 0) + "名"],
    ["ご利用回数", c.visit === "repeat" ? "2回目以降" : "初めて"],
    ["代表者お名前", c.name],
    ["フリガナ", c.kana || "—"],
    ["電話番号", c.tel],
    ["メールアドレス", c.email]
  ];
  if (c.coupon) rows.push(["クーポンコード", c.coupon]);

  // textContent only: customer input is never inserted as HTML.
  rows.forEach(function (r) {
    var div = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = r[0];
    dd.textContent = r[1];
    div.appendChild(dt);
    div.appendChild(dd);
    list.appendChild(div);
  });

  var submit = document.getElementById("bk-submit");
  var notice = document.getElementById("bk-submit-note");
  submit.addEventListener("click", function () {
    notice.hidden = false;
    notice.querySelector("[data-phone]").textContent = B.PHONE;
    notice.querySelector("a").href = "tel:" + B.PHONE.replace(/-/g, "");
  });
})();
