const MojazAPI = (() => {

  const BASE_URL = "https://mojaz24.runasp.net/api";

  function dataURLtoBlob(dataURL) {
    const [header, data] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

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

  async function add(newsObj) {
    const token = localStorage.getItem("mojaz24-token");
    const formData = new FormData();
    formData.append("Title", newsObj.title || "");
    formData.append("Content", newsObj.content || "");
    formData.append("Category", newsObj.category || "");

    if (newsObj.video) formData.append("Video", newsObj.video);

    if (newsObj.image && newsObj.image.startsWith("data:"))
      formData.append("imageFile", dataURLtoBlob(newsObj.image), "image.jpg");

    if (newsObj.videoFile && newsObj.videoFile.startsWith("data:"))
      formData.append("videoFile", dataURLtoBlob(newsObj.videoFile), "video.mp4");

    if (newsObj.audioFile && newsObj.audioFile.startsWith("data:"))
      formData.append("audioFile", dataURLtoBlob(newsObj.audioFile), "audio.mp3");

    let response;
    try {
      response = await fetch(`${BASE_URL}/News`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
    } catch {
      throw new Error("تعذّر الاتصال بالخادم.");
    }

    if (response.status === 401) {
      localStorage.removeItem("mojaz24-token");
      sessionStorage.removeItem("mojaz24-session");
      window.location.href = "Login.html";
      return;
    }

    let payload = null;
    try { payload = await response.json(); } catch {}

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
