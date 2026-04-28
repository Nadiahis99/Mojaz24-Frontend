const MojazAPI = (() => {
  const BASE_URL = "https://mojaz24.runasp.net/api";

  async function request(method, path, body) {
    const token = localStorage.getItem("mojaz24-token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error("تعذّر الاتصال بالخادم.");
    }

    if (response.status === 204) return null;

    let payload = null;
    try { payload = await response.json(); } catch {}

    if (response.status === 401) {
      localStorage.removeItem("mojaz24-token");
      sessionStorage.removeItem("mojaz24-session");
      window.location.href = "Login.html";
      return;
    }

    if (!response.ok) {
      const msg =
        typeof payload === "string" ? payload :
        payload?.message ? payload.message :
        payload?.title ? payload.title :
        `خطأ ${response.status}`;
      throw new Error(msg);
    }

    return payload;
  }

  function login(email, password) {
    return request("POST", "/Auth/login", { email, password });
  }

  function register(userData) {
    return request("POST", "/Auth/register", userData);
  }

  function getAll() {
    return request("GET", "/News");
  }

  function add(newsObj) {
    return request("POST", "/News", newsObj);
  }

  function remove(id) {
    return request("DELETE", `/News/${encodeURIComponent(id)}`);
  }

  function getComments() {
    return request("GET", "/Comments");
  }

  function addComment(commentObj) {
    return request("POST", "/Comments", commentObj);
  }

  function removeComment(id) {
    return request("DELETE", `/Comments/${encodeURIComponent(id)}`);
  }

  return {
    login, register,
    getAll, add, remove,
    getComments, addComment, removeComment,
  };
})();

window.MojazAPI = MojazAPI;
