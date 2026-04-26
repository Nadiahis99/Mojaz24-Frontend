(function () {
  const feed = document.getElementById("categoryNewsFeed");
  if (!feed || !window.MojazNewsStore) return;

  const params = new URLSearchParams(window.location.search);
  const cat = params.get("cat") || "";
  const catCount = document.getElementById("catCount");
  const catBadge = document.getElementById("catBadge");
  const catTitle = document.getElementById("catTitle");

  if (catBadge) catBadge.textContent = cat || "أخبار";
  if (catTitle) catTitle.textContent = cat || "جميع الأخبار";
  document.title = `موجز 24 | ${cat || "الأخبار"}`;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function getNewsId(item) {
    return item?._id || item?.id || "";
  }

  function formatNewsDate(ts) {
    return new Date(ts).toLocaleString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function renderContent(news) {
    const parts = (news.content || "")
      .split(/\n{2,}|\r\n\r\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) return "";

    return parts.map((part, index) => {
      const paragraph = `<p style="margin:0 0 12px;line-height:1.9;">${escapeHtml(part)}</p>`;
      const image = news.contentImage && index === 0
        ? `<img src="${escapeHtml(news.contentImage)}" alt="${escapeHtml(news.title)}" loading="lazy" style="width:100%;max-height:260px;object-fit:cover;border-radius:var(--radius);margin:0 0 14px;">`
        : "";
      return paragraph + image;
    }).join("");
  }

  function renderEmptyState() {
    feed.innerHTML = `
      <div class="cat-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <p>لا توجد أخبار في هذا التصنيف بعد.</p>
        <a href="admin.html" class="admin-link-btn">أضف أول خبر الآن</a>
      </div>`;
  }

  function renderCategoryNews() {
    const allNews = window.MojazNewsStore.getAll();
    const filtered = cat ? allNews.filter((news) => news.category === cat) : allNews;

    if (catCount) catCount.textContent = `${filtered.length} خبر`;

    if (!filtered.length) {
      renderEmptyState();
      return;
    }

    feed.innerHTML = "";
    filtered.forEach((news) => {
      const card = document.createElement("article");
      card.className = "cat-news-card news-card-hover";
      card.setAttribute("data-animate", "");

      const imageHtml = news.image
        ? `<div class="cat-card-img"><img src="${escapeHtml(news.image)}" alt="${escapeHtml(news.title)}" loading="lazy"></div>`
        : `<div class="cat-card-img cat-card-img-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;

      const videoHtml = [
        news.video
          ? `<a href="${escapeHtml(news.video)}" target="_blank" rel="noopener" class="cat-card-video-link"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg> مشاهدة رابط الفيديو</a>`
          : "",
        news.videoFile
          ? `<div style="margin-top:12px;"><video src="${escapeHtml(news.videoFile)}" controls style="width:100%;max-height:260px;border-radius:var(--radius);background:#000;"></video></div>`
          : ""
      ].join("");

      card.innerHTML = `
        ${imageHtml}
        <div class="cat-card-body">
          <span class="cat-card-badge">${escapeHtml(news.category)}</span>
          <h3 class="cat-card-title">${escapeHtml(news.title)}</h3>
          <div class="cat-card-content">${renderContent(news)}</div>
          <div class="cat-card-footer">
            <time class="comment-time">${formatNewsDate(news.createdAt)}</time>
            ${videoHtml}
          </div>
        </div>`;

      card.style.cursor = "pointer";
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, video, button")) return;
        window.location.href = `article.html?id=${encodeURIComponent(getNewsId(news))}`;
      });

      feed.appendChild(card);
    });

    if (typeof initScrollReveal === "function") initScrollReveal();
  }

  renderCategoryNews();
  window.MojazNewsStore.ready().then(renderCategoryNews).catch(renderCategoryNews);
  window.addEventListener(window.MojazNewsStore.UPDATE_EVENT, renderCategoryNews);
})();
