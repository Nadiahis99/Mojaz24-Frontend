/**
 * مُوجز 24 — Auth Module
 * يتعامل مع تسجيل الدخول والخروج وحالة الجلسة
 * يعتمد على MojazAPI (api.js)
 */
const MojazAuth = (function () {
  const SESSION_KEY = "mojaz24-session";
  const TOKEN_KEY   = "mojaz24-token";

  /**
   * تسجيل الدخول
   * الباك إند يقبل { email, password } — نُرسل username في حقل email أيضاً
   * الباك إند يُرجع { token, role, username } (أو ما يعادلها)
   */
  async function login(email, password) {
    try {
      const result = await window.MojazAPI.login(email, password);

      if (result && result.token) {
        // حفظ التوكن
        localStorage.setItem(TOKEN_KEY, result.token);

        // بناء بيانات الجلسة للفرونت
        const session = {
          name:     result.username || result.name || email,
          username: result.username || email,
          role:     result.role     || "admin",
          avatar:   (result.username || email)[0].toUpperCase(),
          token:    result.token,
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { success: true };
      }

      return { success: false, message: "فشل تسجيل الدخول: لم يصل توكن من الخادم" };
    } catch (error) {
      return {
        success: false,
        message: error.message || "حدث خطأ في الاتصال بالخادم",
      };
    }
  }

  /** تسجيل الخروج */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "Login.html";
  }

  /** إرجاع بيانات الجلسة الحالية أو null */
  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** هل المستخدم مسجّل دخول؟ */
  function isLoggedIn() {
    return !!getSession();
  }

  return { login, logout, getSession, isLoggedIn };
})();

window.MojazAuth = MojazAuth;
