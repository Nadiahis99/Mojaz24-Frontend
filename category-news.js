/**
 * مُوجز 24 — Category Page News Renderer
 * Used by category.html to render filtered news from MojazNewsStore.
 * Items are pre-normalized via api.js — always use item.imageUrl, item.category, etc.
 */
(function () {
  const params   = new URLSearchParams(window.location.search);
  const cat      = params.get("cat") || "";
  const searchQ  = params.get("search") || "";

  const catBadge = document.getElementById("catBadge");
  const catTitle = document.getElementById("catTitle");
  const catCount = document.getElementById("catCount");
  const feed     = document.getElementById("categoryNewsFeed");

  // Set page heading
  if (searchQ) {
    if (catBadge) catBadge.textContent = "بحث";
    if (catTitle) catTitle.textContent = `نتائج البحث: "${searchQ}"`;
    document.title = `مُوجز 24 | بحث: ${searchQ}`;
  } else {
    if (catBadge) catBadge.textContent = cat || "أخبار";
    if (catTitle) catTitle.textContent = cat || "جميع الأخبار";
    document.title = `مُوجز 24 | ${cat || "الأخبار"}`;
  }

  /* ─── Helpers ─── */
  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  function formatNewsDate(ts) {
    if (!ts) return "الآن";
    return new Date(ts).toLocaleString("ar-EG", {
      day: "numeric", month: "long", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  function getNewsId(news) {
    return news?.id || news?._id || "";
  }

  function getImage(news) {
    return news?.imageUrl || news?.image || "";
  }

  function getTagClass(category) {
    const v = (category || "").trim();
    if (v === "عاجل")  return "tag-urgent";
    if (v === "سياسة") return "tag-politics";
    if (v === "اقتصاد") return "tag-economy";
    if (v === "عالمي") return "tag-world";
    return "tag-accent";
  }

  function hasVideo(item) {
    return !!(item?.videoUrl || item?.video || item?.videoFile);
  }

  /* ─── Render ─── */
  function renderCategoryNews() {
    if (!feed) return;
    const allNews = window.MojazNewsStore.getAll();

    let filtered;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      filtered = allNews.filter((n) =>
        (n.title || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q) ||
        (n.category || "").toLowerCase().includes(q)
      );
    } else if (cat) {
      filtered = allNews.filter((n) => n.category === cat);
    } else {
      filtered = allNews;
    }

    if (catCount) catCount.textContent = `${filtered.length} خبر`;
    feed.innerHTML = "";

    if (!filtered.length) {
      feed.innerHTML = `
        <div class="cat-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <p>${searchQ ? `لا توجد نتائج لـ "${escapeHtml(searchQ)}"` : "لا توجد أخبار في هذا التصنيف بعد."}</p>
          <a href="admin.html" class="admin-link-btn">أضف أول خبر الآن</a>
        </div>`;
      return;
    }

    filtered.forEach((news) => {
      const card = document.createElement("article");
      card.className = "cat-news-card news-card-hover";
      card.setAttribute("data-animate", "");
      card.style.cursor = "pointer";
      card.onclick = () => {
        window.location.href = `article.html?id=${encodeURIComponent(getNewsId(news))}`;
      };

      const img = getImage(news);
      const imgHtml = img
        ? `<div class="cat-card-img"><img src="${escapeHtml(img)}" alt="${escapeHtml(news.title)}" loading="lazy"></div>`
        : `<div class="cat-card-img cat-card-img-placeholder">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <rect width="18" height="18" x="3" y="3" rx="2"/>
               <circle cx="9" cy="9" r="2"/>
               <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
             </svg>
           </div>`;

      const videoHtml = hasVideo(news)
        ? `<a href="${escapeHtml(news.videoUrl || news.video)}" target="_blank" class="cat-card-video-link" onclick="event.stopPropagation()">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>
             مشاهدة الفيديو
           </a>`
        : "";

      const contentSnippet = (news.content || "").slice(0, 200);

      card.innerHTML = `
        ${imgHtml}
        <div class="cat-card-body">
          <span class="cat-card-badge ${getTagClass(news.category)}">${escapeHtml(news.category || "خبر")}</span>
          <h3 class="cat-card-title">${escapeHtml(news.title)}</h3>
          <p class="cat-card-content">${escapeHtml(contentSnippet)}</p>
          <div class="cat-card-footer">
            <time class="comment-time">${formatNewsDate(news.createdAt)}</time>
            ${videoHtml}
          </div>
        </div>`;

      feed.appendChild(card);
    });

    if (typeof initScrollReveal === "function") initScrollReveal();
  }

  // Wait for MojazNewsStore to be available
  function init() {
    if (!window.MojazNewsStore) {
      setTimeout(init, 50);
      return;
    }
    renderCategoryNews();
    window.MojazNewsStore.ready()
      .then(renderCategoryNews)
      .catch(renderCategoryNews);
    window.addEventListener(window.MojazNewsStore.UPDATE_EVENT, renderCategoryNews);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
