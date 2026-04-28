/**
 * مُوجز 24 — Home Page News Renderer
 * Renders all dynamic sections on the homepage using MojazNewsStore.
 * All items are pre-normalized via api.js → imageUrl, category, title, etc.
 */
function initHomepageNews() {
  const heroImg       = document.getElementById("heroImg");
  const latestList    = document.querySelector(".latest-list");
  const mostReadList  = document.querySelector(".most-read-list");
  const newsFeed      = document.getElementById("newsFeed");
  const trendingList  = document.getElementById("trendingList");
  const mediaGrid     = document.getElementById("mediaGrid");
  const tickerTrack   = document.getElementById("tickerTrack");

  if (!heroImg || !window.MojazNewsStore) return;

  /* ─── Helpers ─── */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function createPlaceholderImage(label) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1d3557"/>
            <stop offset="100%" stop-color="#457b9d"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="675" fill="url(#g)"/>
        <circle cx="980" cy="120" r="120" fill="rgba(255,255,255,.08)"/>
        <circle cx="180" cy="560" r="160" fill="rgba(255,255,255,.06)"/>
        <text x="600" y="345" font-family="Cairo, Arial" font-size="58" fill="#ffffff" text-anchor="middle">${label}</text>
      </svg>`
    )}`;
  }

  const placeholderImage = createPlaceholderImage("موجز 24");

  function getNewsId(item) {
    return item?.id || item?._id || "";
  }

  /** Normalized items always have imageUrl; fall back to placeholder. */
  function getImage(item) {
    return item?.imageUrl || item?.image || placeholderImage;
  }

  function hasVideo(item) {
    return !!(item?.videoUrl || item?.video || item?.videoFile);
  }

  function formatNewsDate(ts) {
    if (!ts) return "الآن";
    return new Date(ts).toLocaleString("ar-EG", {
      day: "numeric", month: "long", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  function getTagClass(category) {
    const v = (category || "").trim();
    if (v === "عاجل")  return "tag-urgent";
    if (v === "سياسة") return "tag-politics";
    if (v === "اقتصاد") return "tag-economy";
    if (v === "عالمي") return "tag-world";
    return "tag-accent";
  }

  function estimateReadTime(content) {
    const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 180))} دقيقة قراءة`;
  }

  function getParagraphs(content) {
    return (content || "")
      .split(/\n{2,}|\r\n\r\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  function emptyState(message) {
    return `<div class="comment-empty">${message}</div>`;
  }

  /* ─── Hero ─── */
  function renderHero(news) {
    const heroTag      = document.getElementById("heroTag");
    const heroTitle    = document.getElementById("heroTitle");
    const heroExcerpt  = document.getElementById("heroExcerpt");
    const heroDate     = document.getElementById("heroDate");
    const heroViews    = document.getElementById("heroViews");
    const heroReadTime = document.getElementById("heroReadTime");

    if (!news) {
      heroImg.src = placeholderImage;
      heroImg.alt = "لا توجد أخبار منشورة بعد";
      if (heroTag)     { heroTag.className = "tag hero-tag tag-accent"; heroTag.textContent = "بانتظار النشر"; }
      if (heroTitle)   heroTitle.textContent = "لا توجد أخبار منشورة بعد";
      if (heroExcerpt) heroExcerpt.textContent = "ستظهر الأخبار هنا تلقائيًا عند إضافتها من لوحة الإدارة.";
      if (heroDate)    heroDate.textContent = "جاهز للتحديث";
      if (heroViews)   heroViews.textContent = "بدون بيانات";
      if (heroReadTime) heroReadTime.textContent = "0 دقيقة قراءة";
      return;
    }

    const paragraphs = getParagraphs(news.content);
    heroImg.src = getImage(news);
    heroImg.alt = news.title || "صورة الخبر";
    if (heroTag) {
      heroTag.className = `tag hero-tag ${getTagClass(news.category)}`;
      heroTag.textContent = news.category || "خبر";
    }
    if (heroTitle)   heroTitle.textContent = news.title || "";
    if (heroExcerpt) heroExcerpt.textContent = paragraphs[0] || news.content || "";
    if (heroDate)    heroDate.textContent = formatNewsDate(news.createdAt);
    if (heroViews)   heroViews.textContent = hasVideo(news) ? "يتضمن وسائط" : "منشور";
    if (heroReadTime) heroReadTime.textContent = estimateReadTime(news.content);

    const heroCard = document.querySelector(".hero-card");
    if (heroCard) {
      heroCard.style.cursor = "pointer";
      heroCard.onclick = () => {
        window.location.href = `article.html?id=${encodeURIComponent(getNewsId(news))}`;
      };
    }
  }

  /* ─── Lists & Feed ─── */
  function renderLists(allNews) {
    const latestItems   = allNews.slice(0, 4);
    const mostReadItems = allNews.slice(0, 4);
    const feedItems     = allNews.slice(1);
    const trendingItems = allNews.slice(0, 5);
    const mediaItems    = allNews.filter(hasVideo).slice(0, 4);

    /* Latest */
    if (latestList) {
      latestList.innerHTML = latestItems.length
        ? latestItems.map((item) => `
            <a class="latest-item" href="article.html?id=${encodeURIComponent(getNewsId(item))}">
              <div class="latest-img">
                <img src="${escapeHtml(getImage(item))}" alt="${escapeHtml(item.title)}" loading="lazy">
              </div>
              <div class="latest-info">
                <span class="tag tag-sm ${getTagClass(item.category)}">${escapeHtml(item.category || "خبر")}</span>
                <h4>${escapeHtml(item.title)}</h4>
                <time>${escapeHtml(formatNewsDate(item.createdAt))}</time>
              </div>
            </a>`).join("")
        : emptyState("لا توجد أخبار منشورة بعد.");
    }

    /* Most Read */
    if (mostReadList) {
      mostReadList.innerHTML = mostReadItems.length
        ? mostReadItems.map((item, i) => `
            <a class="most-read-item" href="article.html?id=${encodeURIComponent(getNewsId(item))}">
              <span class="rank-num">${i + 1}</span>
              <div class="most-read-info">
                <h4>${escapeHtml(item.title)}</h4>
                <div class="views-count">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>${escapeHtml(estimateReadTime(item.content))}</span>
                </div>
              </div>
            </a>`).join("")
        : emptyState("القائمة جاهزة لعرض الأخبار عند النشر.");
    }

    /* News Feed */
    if (newsFeed) {
      newsFeed.innerHTML = feedItems.length
        ? feedItems.map((item) => {
            const excerpt = escapeHtml((getParagraphs(item.content)[0] || item.content || "").slice(0, 160));
            const articleUrl = `article.html?id=${encodeURIComponent(getNewsId(item))}`;
            return `
            <article class="news-card-h" style="cursor:pointer;"
              onclick="window.location.href='${articleUrl}'">
              <div class="news-card-img">
                <img src="${escapeHtml(getImage(item))}" alt="${escapeHtml(item.title)}" loading="lazy">
              </div>
              <div class="news-card-body">
                <span class="tag ${getTagClass(item.category)}">${escapeHtml(item.category || "خبر")}</span>
                <h3>${escapeHtml(item.title)}</h3>
                ${excerpt ? `<p class="news-excerpt-preview">${excerpt}...</p>` : ""}
                <div class="news-card-footer-row">
                  <div class="hero-meta">
                    <span class="meta-item"><time>${escapeHtml(formatNewsDate(item.createdAt))}</time></span>
                    <span class="meta-item">${escapeHtml(estimateReadTime(item.content))}</span>
                  </div>
                  <a class="news-read-more-btn" href="${articleUrl}" onclick="event.stopPropagation()">
                    عرض المزيد
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </a>
                </div>
              </div>
            </article>`;
          }).join("")
        : emptyState("سيظهر موجز الأخبار هنا تلقائيًا بعد إضافة أول خبر.");
    }

    /* Trending */
    if (trendingList) {
      trendingList.innerHTML = trendingItems.length
        ? trendingItems.map((item, i) => `
            <a class="trending-item" href="article.html?id=${encodeURIComponent(getNewsId(item))}"
               style="display:flex;gap:10px;align-items:flex-start;padding:8px;border-radius:var(--radius-sm);transition:background var(--transition);">
              <span class="rank-num" style="min-width:28px;">${i + 1}</span>
              <div class="most-read-info">
                <h4>${escapeHtml(item.title)}</h4>
                <div class="views-count"><span>${escapeHtml(item.category || "خبر")}</span></div>
              </div>
            </a>`).join("")
        : emptyState("لا توجد أخبار متداولة بعد.");
    }

    /* Media */
    if (mediaGrid) {
      mediaGrid.innerHTML = mediaItems.length
        ? mediaItems.map((item) => `
            <article class="media-card" style="cursor:pointer;"
              onclick="window.location.href='article.html?id=${encodeURIComponent(getNewsId(item))}'">
              <div class="media-thumb">
                <img src="${escapeHtml(getImage(item))}" alt="${escapeHtml(item.title)}" loading="lazy">
                <div class="media-overlay">
                  <div class="play-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                  </div>
                </div>
                <span class="media-duration">${escapeHtml(item.videoFile ? "ملف محلي" : "رابط")}</span>
                <span class="media-type media-type-video">فيديو</span>
              </div>
              <div class="media-info"><h3>${escapeHtml(item.title)}</h3></div>
            </article>`).join("")
        : emptyState("لا توجد وسائط مرتبطة بالأخبار بعد.");
    }
  }

  /* ─── Ticker ─── */
  function renderTicker(allNews) {
    if (!tickerTrack) return;
    const items = allNews.slice(0, 6);
    tickerTrack.innerHTML = items.length
      ? items.map((item) => `<span>${escapeHtml(item.title)}</span>`).join("")
      : "<span>لا توجد أخبار منشورة بعد</span>";

    delete tickerTrack.dataset.tickerOriginal;
    if (typeof scheduleTickerInit === "function") scheduleTickerInit();
  }

  /* ─── Main render ─── */
  function renderHomepageNews() {
    const allNews = window.MojazNewsStore.getAll();
    renderHero(allNews[0] || null);
    renderLists(allNews);
    renderTicker(allNews);
  }

  // Initial render from cache, then refresh
  renderHomepageNews();
  window.MojazNewsStore.ready()
    .then(renderHomepageNews)
    .catch(renderHomepageNews);
  window.addEventListener(window.MojazNewsStore.UPDATE_EVENT, renderHomepageNews);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomepageNews);
} else {
  initHomepageNews();
}
