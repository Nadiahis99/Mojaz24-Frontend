/**
 * مُوجز 24 — News Store
 * طبقة وسيطة بين الـ UI والـ API
 *
 * ملاحظة: الـ API لا يوجد بها PUT /News/{id}
 * لذا التعديل = حذف القديم + إضافة جديد
 */
const MojazNewsStore = (() => {
  const STORAGE_KEY  = "mojaz24-news-cache";
  const UPDATE_EVENT = "mojaz:news-updated";
  let newsCache = [];

  // ── Cache helpers ─────────────────────────────────────────────
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
    } catch { /* تجاهل إذا كانت التخزين ممتلئاً */ }
  }

  function emitUpdate() {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, {
      detail: { news: [...newsCache] },
    }));
  }

  // ── API sync ──────────────────────────────────────────────────
  async function refresh() {
    if (!window.MojazAPI) throw new Error("MojazAPI غير متاح");

    const news = await window.MojazAPI.getAll();
    // الباك إند قد يُرجع مصفوفة مباشرة أو { data: [...] }
    newsCache = Array.isArray(news)
      ? news
      : Array.isArray(news?.data) ? news.data : [];

    persistCache();
    emitUpdate();
    return [...newsCache];
  }

  // ── Init ──────────────────────────────────────────────────────
  readCache();
  // محاولة تحديث من الـ API فور التحميل، مع الاحتفاظ بالكاش عند الفشل
  let readyPromise = refresh().catch(() => [...newsCache]);

  function ready() { return readyPromise; }
  function getAll() { return [...newsCache]; }

  function getById(id) {
    return newsCache.find(
      (item) => String(item._id || item.id) === String(id)
    ) || null;
  }

  // ── CRUD ──────────────────────────────────────────────────────

  async function add(item) {
    const response = await window.MojazAPI.add(item);
    await refresh();
    // الباك إند يُرجع الكائن مباشرة أو { news: {...} }
    return response?.news ?? response;
  }

  /**
   * تعديل: الـ API ليس لديه PUT، نحذف ونُعيد الإضافة
   * نحتفظ بـ createdAt الأصلي إذا أرجعه الـ API
   */
  async function update(id, item) {
    await window.MojazAPI.remove(id);
    const response = await window.MojazAPI.add(item);
    await refresh();
    return response?.news ?? response;
  }

  async function remove(id) {
    const response = await window.MojazAPI.remove(id);
    await refresh();
    return response;
  }

  // ── Selectors ─────────────────────────────────────────────────
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
