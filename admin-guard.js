
(function () {
  try {
    var raw     = sessionStorage.getItem("mojaz24-session");
    var session = raw ? JSON.parse(raw) : null;
    if (!session || (session.role !== "Admin" && session.role !== "Journalist")) {
      window.location.replace("Login.html");
    }
  } catch (e) {
    window.location.replace("Login.html");
  }
})();
