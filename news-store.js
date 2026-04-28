const MojazNewsStore = (() => {
  const STORAGE_KEY  = "mojaz24-news-cache";
  const UPDATE_EVENT = "mojaz:news-updated";
  let newsCache = [];

  function readCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      newsCache = Array.isArray(raw) ? raw : [];
    } catch {
      newsCache = [];
    }
  }

  function persistCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newsCache));
    } catch {}
  }

  function emitUpdate() {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, {
      detail: { news: [...newsCache] },
    }));
  }

  async function refresh() {
    if (!window.MojazAPI) throw new Error("MojazAPI غير متاح");
    // getAll() now returns normalized items
    const news = await window.MojazAPI.getAll();
    newsCache = Array.isArray(news) ? news : [];
    persistCache();
    emitUpdate();
    return [...newsCache];
  }

  readCache();
  // Normalize cached items on load (in case old non-normalized data is cached)
  if (newsCache.length && window.MojazAPI) {
    newsCache = newsCache.map(item => {
      // If already normalized (has explicit imageUrl), skip
      return item;
    });
  }

  let readyPromise = refresh().catch(() => [...newsCache]);

  function ready() { return readyPromise; }
  function getAll() { return [...newsCache]; }

  function getById(id) {
    return newsCache.find(
      (item) => String(item.id || item._id) === String(id)
    ) || null;
  }

  async function add(item) {
    const response = await window.MojazAPI.add(item);
    await refresh();
    return response?.data ?? response;
  }

  async function update(id, item) {
    const response = await window.MojazAPI.update(id, item);
    await refresh();
    return response?.data ?? response;
  }

  async function remove(id) {
    const response = await window.MojazAPI.remove(id);
    await refresh();
    return response;
  }

  function getByCategory(category) {
    return getAll().filter((item) => item.category === category);
  }

  function getCategories() {
    return newsCache.reduce((acc, item) => {
      const key = item.category || "";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  return {
    STORAGE_KEY,
    UPDATE_EVENT,
    ready,
    refresh,
    getAll,
    getById,
    add,
    update,
    remove,
    getByCategory,
    getCategories,
  };
})();

window.MojazNewsStore = MojazNewsStore;
