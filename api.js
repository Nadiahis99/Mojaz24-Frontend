const MojazAPI = (() => {
  const BASE_URL = "https://mojaz24.runasp.net/api";

  /**
   * Normalizes a news item returned from the .NET backend.
   * The backend may return Pascal-case (ImageUrl, Title, Category...)
   * or camelCase. We normalize everything to camelCase for consistency.
   */
  function normalizeNews(item) {
    if (!item || typeof item !== "object") return item;
    const imageUrl = item.imageUrl ?? item.ImageUrl ?? item.image ?? item.Image ?? "";
    const videoUrl = item.videoUrl ?? item.VideoUrl ?? item.video ?? item.Video ?? "";
    const contentImages = Array.isArray(item.contentImages) ? item.contentImages
                        : Array.isArray(item.ContentImages) ? item.ContentImages
                        : (item.contentImage || item.ContentImage)
                          ? [item.contentImage || item.ContentImage]
                          : [];
    return {
      id:             item.id        ?? item.Id        ?? item._id       ?? item.newsId ?? item.NewsId ?? null,
      _id:            item.id        ?? item.Id        ?? item._id       ?? item.newsId ?? item.NewsId ?? null,
      title:          item.title     ?? item.Title     ?? "",
      content:        item.content   ?? item.Content   ?? "",
      category:       item.category  ?? item.Category  ?? "",
      imageUrl,
      image: imageUrl,
      contentImage:   item.contentImage  ?? item.ContentImage  ?? "",
      contentImages,
      videoUrl,
      video: videoUrl,
      videoFile:      item.videoFile ?? item.VideoFile ?? "",
      audioFile:      item.audioFile ?? item.AudioFile ?? "",
      createdAt:      item.createdAt ?? item.CreatedAt ?? item.created_at ?? null,
      updatedAt:      item.updatedAt ?? item.UpdatedAt ?? null,
    };
  }

  function normalizeNewsArray(data) {
    const arr = Array.isArray(data) ? data
              : Array.isArray(data?.data) ? data.data
              : Array.isArray(data?.items) ? data.items
              : [];
    return arr.map(normalizeNews);
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

  async function getAll() {
    const data = await request("GET", "/News");
    return normalizeNewsArray(data);
  }

  async function getById(id) {
    const data = await request("GET", `/News/${encodeURIComponent(id)}`);
    return data ? normalizeNews(data) : null;
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
    getAll, getById, add, update, remove,
    getComments, addComment, removeComment,
    normalizeNews, normalizeNewsArray,
  };
})();

window.MojazAPI = MojazAPI;
