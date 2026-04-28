/**
 * مُوجز 24 — Auth Module
 * يتعامل مع تسجيل الدخول والخروج وحالة الجلسة
 * يعتمد بشكل كلي على كائن MojazAPI المعرف في (api.js)
 */
const MojazAuth = (function () {
  const SESSION_KEY = "mojaz24-session";
  const TOKEN_KEY   = "mojaz24-token";

  /**
   * تسجيل الدخول
   * يرسل البيانات للـ API ويخزن التوكن وبيانات المستخدم في حال النجاح
   */
  async function login(email, password) {
    try {
      // استدعاء دالة الـ login من ملف api.js
      const result = await window.MojazAPI.login(email, password);

      if (result && result.token) {
        // 1. حفظ التوكن في localStorage ليبقى متاحاً للطلبات القادمة
        localStorage.setItem(TOKEN_KEY, result.token);

        // 2. بناء بيانات الجلسة (Session) بناءً على رد السيرفر
        // ملاحظة: الحقول تتبع الأسماء الراجعة من الـ Backend
        const session = {
          name:     result.username || result.name || email,
          username: result.username || email,
          role:     result.role     || "Admin", // القيمة الافتراضية إذا لم يرجع الدور
          avatar:   (result.username || email)[0].toUpperCase(),
          token:    result.token,
        };

        // 3. حفظ بيانات الجلسة في sessionStorage (تنتهي بإغلاق المتصفح)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        
        return { success: true };
      }

      return { success: false, message: "فشل تسجيل الدخول: بيانات غير مكتملة من الخادم" };
    } catch (error) {
      // إرجاع رسالة الخطأ القادمة من MojazAPI.request
      return {
        success: false,
        message: error.message || "حدث خطأ غير متوقع أثناء الاتصال",
      };
    }
  }

  /**
   * تسجيل الخروج
   * تنظيف كافة البيانات المسجلة وتوجيه المستخدم لصفحة الدخول
   */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "Login.html";
  }

  /** * جلب بيانات الجلسة الحالية
   * @returns {Object|null}
   */
  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /** * التحقق من حالة الدخول
   * @returns {Boolean}
   */
  function isLoggedIn() {
    const session = getSession();
    const token = localStorage.getItem(TOKEN_KEY);
    // المستخدم يعتبر مسجل دخول إذا وجد التوكن وبيانات الجلسة معاً
    return !!(session && token);
  }

  // تصدير الوظائف للاستخدام الخارجي عبر MojazAuth
  return { 
    login, 
    logout, 
    getSession, 
    isLoggedIn 
  };
})();

// جعل الكائن متاحاً عالمياً
window.MojazAuth = MojazAuth;
