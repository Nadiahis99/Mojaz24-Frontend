const MojazNewsStore = (() => {
  const STORAGE_KEY  = "mojaz24-news-cache";
  const UPDATE_EVENT = "mojaz:news-updated";
  let newsCache = [];

  function readCache() {
    try {
      newsCache = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(newsCache)) newsCache = [];
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
    const news = await window.MojazAPI.getAll();
    newsCache = Array.isArray(news)
      ? news
      : Array.isArray(news?.data) ? news.data : [];
    persistCache();
    emitUpdate();
    return [...newsCache];
  }

  readCache();
  let readyPromise = refresh().catch(() => [...newsCache]);

  function ready() { return readyPromise; }
  function getAll() { return [...newsCache]; }

  function getById(id) {
    return newsCache.find(
      (item) => String(item._id || item.id) === String(id)
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
