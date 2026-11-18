/* Booking step 3: customer details (kept in sessionStorage, never in the URL). */
(function () {
  "use strict";

  var B = window.TCSFBooking;
  var form = document.getElementById("bk-info");
  if (!B || !form) return;

  var state = B.load();
  if (!B.PLANS[state.plan] || !state.date || !state.time) { window.location.replace("../date/"); return; }

  var RULES = {
    name:  { required: true, max: 60, msg: "代表者お名前を入力してください。" },
    kana:  { required: false, max: 60, pattern: /^[゠-ヿ　\s・ー]*$/, msg: "フリガナはカタカナで入力してください。" },
    tel:   { required: true, max: 20, pattern: /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/, msg: "電話番号を正しく入力してください（例：090-1234-5678）。" },
    email: { required: true, max: 120, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: "メールアドレスを正しく入力してください。" },
    coupon:{ required: false, max: 30, pattern: /^[A-Za-z0-9-]*$/, msg: "クーポンコードは英数字で入力してください。" }
  };

  var saved = state.customer || {};
  Object.keys(RULES).forEach(function (key) {
    if (saved[key] && form.elements[key]) form.elements[key].value = saved[key];
  });
  var visit = saved.visit === "repeat" ? "repeat" : "first";
  form.querySelector('input[name="visit"][value="' + visit + '"]').checked = true;

  var couponToggle = document.getElementById("bk-coupon-toggle");
  var couponField = document.getElementById("bk-coupon-field");
  if (saved.coupon) { couponField.hidden = false; couponToggle.setAttribute("aria-expanded", "true"); }
  couponToggle.addEventListener("click", function () {
    var open = couponField.hidden;
    couponField.hidden = !open;
    couponToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) form.elements.coupon.focus();
  });

  function normalize(key, value) {
    var v = value.trim();
    if (key === "tel") v = v.replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/[‐－ー−]/g, "-");
    if (key === "email") v = v.toLowerCase();
    return v;
  }

  function check(key) {
    var input = form.elements[key];
    var rule = RULES[key];
    var value = normalize(key, input.value);
    var bad = (rule.required && !value) || value.length > rule.max || (value && rule.pattern && !rule.pattern.test(value));
    var msg = document.getElementById("bk-err-" + key);
    input.setAttribute("aria-invalid", bad ? "true" : "false");
    if (msg) { msg.textContent = bad ? rule.msg : ""; msg.hidden = !bad; }
    return bad ? null : value;
  }

  Object.keys(RULES).forEach(function (key) {
    form.elements[key].addEventListener("blur", function () { if (form.elements[key].value) check(key); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var values = {};
    var firstBad = null;
    Object.keys(RULES).forEach(function (key) {
      var v = check(key);
      if (v === null && !firstBad) firstBad = form.elements[key];
      values[key] = v || "";
    });
    if (firstBad) { firstBad.focus(); return; }
    values.visit = form.querySelector('input[name="visit"]:checked').value;
    B.save({ customer: values });
    window.location.href = "../confirm/";
  });
})();
