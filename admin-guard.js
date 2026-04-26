/**
 * مُوجز 24 — حارس صفحة الإدارة
 * يُحمَّل أول شيء في admin.html قبل أي شيء آخر
 */
(function () {
  try {
    var raw     = sessionStorage.getItem("mojaz24-session");
    var session = raw ? JSON.parse(raw) : null;
    if (!session || (session.role !== "admin" && session.role !== "journalist")) {
      window.location.replace("Login.html");
    }
  } catch (e) {
    window.location.replace("Login.html");
  }
})();
