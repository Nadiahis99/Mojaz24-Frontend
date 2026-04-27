/**
 * مُوجز 24 — API Module
 * هذا الملف هو المسؤول عن التواصل مع السيرفر (Backend)
 * يدعم نظام Base64 للصور والتحقق من الهوية عبر JWT
 */
const MojazAPI = (() => {
  const BASE_URL = "https://mojaz24.runasp.net/api";

  async function request(method, path, body) {
    const token = localStorage.getItem("mojaz24-token");
    const headers = { "Content-Type": "application/json" };
    
    // إرسال توكن التحقق إذا كان موجوداً
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        // تحويل البيانات لنص JSON (Base64 سيُرسل كجزء من هذا النص)
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      console.error("Fetch Error:", err);
      throw new Error("تعذّر الاتصال بالخادم. تأكد من جودة الإنترنت لديك.");
    }

    // إذا كان الرد ناجحاً وبدون محتوى (مثل الحذف أو التعديل الناجح في بعض الأحيان)
    if (response.status === 204) return null;

    let payload = null;
    try { 
      payload = await response.json(); 
    } catch (e) {
      // الرد قد لا يكون JSON في بعض حالات الخطأ
    }

    // معالجة انتهاء صلاحية التوكن (401 Unauthorized)
    if (response.status === 401) {
      localStorage.removeItem("mojaz24-token");
      sessionStorage.removeItem("mojaz24-session");
      // توجيه المستخدم لتسجيل الدخول إذا انتهت الجلسة
      if (!window.location.href.includes("Login.html")) {
          window.location.href = "Login.html";
      }
      return;
    }

    // معالجة الأخطاء القادمة من السيرفر
    if (!response.ok) {
      const msg =
        typeof payload === "string" ? payload :
        payload?.message ? payload.message :
        payload?.title ? payload.title :
        `خطأ غير معروف (كود: ${response.status})`;
      throw new Error(msg);
    }

    return payload;
  }

  // --- دوال الأخبار ---
  function getAll() {
    return request("GET", "/News");
  }

  function getById(id) {
    return request("GET", `/News/${encodeURIComponent(id)}`);
  }

  function add(newsObj) {
    return request("POST", "/News", newsObj);
  }

  function update(id, newsObj) {
    return request("PUT", `/News/${encodeURIComponent(id)}`, newsObj);
  }

  function remove(id) {
    return request("DELETE", `/News/${encodeURIComponent(id)}`);
  }

  // --- دوال التعليقات ---
  function getComments() {
    return request("GET", "/Comments");
  }

  function addComment(commentObj) {
    return request("POST", "/Comments", commentObj);
  }

  function removeComment(id) {
    return request("DELETE", `/Comments/${encodeURIComponent(id)}`);
  }

  // --- دوال المصادقة (Auth) ---
  function login(email, password) {
    return request("POST", "/Auth/login", { email, password });
  }

  function register(userData) {
    return request("POST", "/Auth/register", userData);
  }

  // تصدير الوظائف
  return {
    login,
    register,
    getAll,
    getById,
    add,
    update,
    remove,
    getComments,
    addComment,
    removeComment,
  };
})();

// جعل الكائن متاحاً على نطاق المشروع
window.MojazAPI = MojazAPI;
