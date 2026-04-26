/**
 * مُوجز 24 — API Client
 * يتصل بـ .NET Backend المنشور على SmarterASP.NET
 *
 * ⚠️  غيّر BASE_URL بعد رفع الـ Backend على SmarterASP
 *     مثال: "https://mojaz24api.smarterasp.net/api"
 *
 * API المتاحة:
 *   POST /api/Auth/register
 *   POST /api/Auth/login
 *   GET  /api/Comments
 *   POST /api/Comments
 *   DELETE /api/Comments/{id}
 *   GET  /api/News
 *   POST /api/News
 *   DELETE /api/News/{id}
 */
const MojazAPI = (() => {

  // ── عنوان الـ API ─────────────────────────────────────────────
  // • للتطوير المحلي: "https://localhost:7030/api"
  // • للـ Production : ضع هنا الدومين الحقيقي بعد الرفع على SmarterASP
  const BASE_URL = "https://localhost:7030/api";
  // ─────────────────────────────────────────────────────────────

  /**
   * دالة الطلبات العامة
   */
  async function request(method, path, body) {
    const token = localStorage.getItem("mojaz24-token");
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      throw new Error("تعذّر الاتصال بالخادم. تحقق من الإنترنت أو حاول لاحقاً.");
    }

    // لا محتوى (مثل DELETE 204)
    if (response.status === 204) return null;

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      /* لا يوجد body */
    }

    // انتهاء الجلسة
    if (response.status === 401) {
      localStorage.removeItem("mojaz24-token");
      sessionStorage.removeItem("mojaz24-session");
      window.location.href = "Login.html";
      return;
    }

    if (!response.ok) {
      // ASP.NET Core يُرجع رسائل خطأ بأشكال مختلفة
      const msg =
        typeof payload === "string"   ? payload :
        payload?.message              ? payload.message :
        payload?.title                ? payload.title :
        `خطأ ${response.status}`;
      throw new Error(msg);
    }

    return payload;
  }

  // ── Auth ──────────────────────────────────────────────────────

  /**
   * تسجيل دخول
   * @param {string} email
   * @param {string} password
   * @returns {{ token: string, role: string, username: string }}
   */
  function login(email, password) {
    return request("POST", "/Auth/login", { email, password });
  }

  /**
   * تسجيل مستخدم جديد
   * @param {{ email, password, username, role }} userData
   */
  function register(userData) {
    return request("POST", "/Auth/register", userData);
  }

  // ── News ──────────────────────────────────────────────────────

  /** جلب كل الأخبار */
  function getAll() {
    return request("GET", "/News");
  }

  /**
   * إضافة خبر
   * الصور والفيديو تُرسل كـ Base64 داخل JSON
   * @param {{ title, content, category, image?, contentImage?, video?, videoFile?, audioFile? }} newsObj
   */
  function add(newsObj) {
    return request("POST", "/News", newsObj);
  }

  /**
   * حذف خبر
   * @param {string|number} id
   */
  function remove(id) {
    return request("DELETE", `/News/${encodeURIComponent(id)}`);
  }

  // ── Comments ──────────────────────────────────────────────────

  /** جلب كل التعليقات */
  function getComments() {
    return request("GET", "/Comments");
  }

  /**
   * إضافة تعليق
   * @param {{ text: string, newsId?: string }} commentObj
   */
  function addComment(commentObj) {
    return request("POST", "/Comments", commentObj);
  }

  /**
   * حذف تعليق
   * @param {string|number} id
   */
  function removeComment(id) {
    return request("DELETE", `/Comments/${encodeURIComponent(id)}`);
  }

  return {
    login,
    register,
    getAll,
    add,
    remove,
    getComments,
    addComment,
    removeComment,
  };
})();

window.MojazAPI = MojazAPI;
