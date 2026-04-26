function initHomepageNews() {
  const heroImg = document.getElementById("heroImg");
  const latestList = document.querySelector(".latest-list");
  const mostReadList = document.querySelector(".most-read-list");
  const newsFeed = document.getElementById("newsFeed");
  const trendingList = document.getElementById("trendingList");
  const mediaGrid = document.getElementById("mediaGrid");
  const tickerTrack = document.getElementById("tickerTrack");

  if (!heroImg || !window.MojazNewsStore) return;

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

  function getNewsId(item) {
    return item?._id || item?.id || "";
  }

  const placeholderImage = createPlaceholderImage("موجز 24");

  function formatNewsDate(ts) {
    if (!ts) return "الآن";
    return new Date(ts).toLocaleString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function getTagClass(category) {
    const value = (category || "").trim();
    if (value === "عاجل") return "tag-urgent";
    if (value === "سياسة") return "tag-politics";
    if (value === "اقتصاد") return "tag-economy";
    if (value === "عالمي") return "tag-world";
    return "tag-accent";
  }

  function estimateReadTime(content) {
    const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} دقيقة قراءة`;
  }

  function getParagraphs(content) {
    return (content || "")
      .split(/\n{2,}|\r\n\r\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  function emptyState(message) {
    return `<div class="comment-empty">${message}</div>`;
  }

  function renderHero(news) {
    const heroTag = document.getElementById("heroTag");
    const heroTitle = document.getElementById("heroTitle");
    const heroExcerpt = document.getElementById("heroExcerpt");
    const heroDate = document.getElementById("heroDate");
    const heroViews = document.getElementById("heroViews");
    const heroReadTime = document.getElementById("heroReadTime");

    if (!news) {
      heroImg.src = placeholderImage;
      heroImg.alt = "لا توجد أخبار منشورة بعد";
      heroTag.className = "tag hero-tag tag-accent";
      heroTag.textContent = "بانتظار النشر";
      heroTitle.textContent = "لا توجد أخبار منشورة بعد";
      heroExcerpt.textContent = "ستظهر الأخبار هنا تلقائيًا عند إضافتها من لوحة الإدارة.";
      heroDate.textContent = "جاهز للتحديث";
      heroViews.textContent = "بدون بيانات";
      heroReadTime.textContent = "0 دقيقة قراءة";
      return;
    }

    const paragraphs = getParagraphs(news.content);
    heroImg.src = news.image || news.contentImage || placeholderImage;
    heroImg.alt = news.title || "صورة الخبر";
    heroTag.className = `tag hero-tag ${getTagClass(news.category)}`;
    heroTag.textContent = news.category || "خبر";
    heroTitle.textContent = news.title || "";
    heroExcerpt.textContent = paragraphs[0] || news.content || "";
    heroDate.textContent = formatNewsDate(news.createdAt);
    heroViews.textContent = news.video || news.videoFile ? "يتضمن وسائط" : "منشور";
    heroReadTime.textContent = estimateReadTime(news.content);

    const heroCard = document.querySelector(".hero-card");
    if (heroCard) {
      heroCard.style.cursor = "pointer";
      heroCard.onclick = () => {
        window.location.href = `article.html?id=${encodeURIComponent(getNewsId(news))}`;
      };
    }
  }

  function renderLists(allNews) {
    const latestItems = allNews.slice(0, 4);
    const mostReadItems = allNews.slice(0, 4);
    const feedItems = allNews.slice(1);
    const trendingItems = allNews.slice(0, 5);
    const mediaItems = allNews.filter((item) => item.video || item.videoFile).slice(0, 4);

    latestList.innerHTML = latestItems.length
      ? latestItems.map((item) => `
          <a class="latest-item" href="article.html?id=${encodeURIComponent(getNewsId(item))}">
            <div class="latest-img"><img src="${escapeHtml(item.image || item.contentImage || placeholderImage)}" alt="${escapeHtml(item.title)}" loading="lazy"></div>
            <div class="latest-info">
              <span class="tag tag-sm ${getTagClass(item.category)}">${escapeHtml(item.category || "خبر")}</span>
              <h4>${escapeHtml(item.title)}</h4>
              <time>${escapeHtml(formatNewsDate(item.createdAt))}</time>
            </div>
          </a>
        `).join("")
      : emptyState("لا توجد أخبار منشورة بعد.");

    mostReadList.innerHTML = mostReadItems.length
      ? mostReadItems.map((item, index) => `
          <a class="most-read-item" href="article.html?id=${encodeURIComponent(getNewsId(item))}">
            <span class="rank-num">${index + 1}</span>
            <div class="most-read-info">
              <h4>${escapeHtml(item.title)}</h4>
              <div class="views-count">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                <span>${escapeHtml(estimateReadTime(item.content))}</span>
              </div>
            </div>
          </a>
        `).join("")
      : emptyState("القائمة جاهزة لعرض الأخبار عند النشر.");

    newsFeed.innerHTML = feedItems.length
      ? feedItems.map((item) => `
          <article class="news-card-h" style="cursor:pointer;" onclick="window.location.href='article.html?id=${encodeURIComponent(getNewsId(item))}'">
            <div class="news-card-img">
              <img src="${escapeHtml(item.image || item.contentImage || placeholderImage)}" alt="${escapeHtml(item.title)}" loading="lazy">
            </div>
            <div class="news-card-body">
              <span class="tag ${getTagClass(item.category)}">${escapeHtml(item.category || "خبر")}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml((getParagraphs(item.content)[0] || item.content || "").slice(0, 180))}</p>
              <div class="hero-meta">
                <span class="meta-item"><time>${escapeHtml(formatNewsDate(item.createdAt))}</time></span>
                <span class="meta-item">${escapeHtml(estimateReadTime(item.content))}</span>
              </div>
            </div>
          </article>
        `).join("")
      : emptyState("سيظهر موجز الأخبار هنا تلقائيًا بعد إضافة أول خبر.");

    trendingList.innerHTML = trendingItems.length
      ? trendingItems.map((item, index) => `
          <a class="trending-item" href="article.html?id=${encodeURIComponent(getNewsId(item))}" style="display:flex;gap:10px;align-items:flex-start;padding:8px;border-radius:var(--radius-sm);transition:background var(--transition);">
            <span class="rank-num" style="min-width:28px;">${index + 1}</span>
            <div class="most-read-info">
              <h4>${escapeHtml(item.title)}</h4>
              <div class="views-count"><span>${escapeHtml(item.category || "خبر")}</span></div>
            </div>
          </a>
        `).join("")
      : emptyState("لا توجد أخبار متداولة بعد.");

    mediaGrid.innerHTML = mediaItems.length
      ? mediaItems.map((item) => `
          <article class="media-card">
            <div class="media-thumb">
              <img src="${escapeHtml(item.image || item.contentImage || placeholderImage)}" alt="${escapeHtml(item.title)}" loading="lazy">
              <div class="media-overlay">
                <div class="play-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                </div>
              </div>
              <span class="media-duration">${escapeHtml(item.videoFile ? "ملف محلي" : "رابط")}</span>
              <span class="media-type media-type-video">فيديو</span>
            </div>
            <div class="media-info">
              <h3>${escapeHtml(item.title)}</h3>
            </div>
          </article>
        `).join("")
      : emptyState("لا توجد وسائط مرتبطة بالأخبار بعد.");
  }

  function renderTicker(allNews) {
    const tickerItems = allNews.slice(0, 6);
    tickerTrack.innerHTML = tickerItems.length
      ? tickerItems.map((item) => `<span>${escapeHtml(item.title)}</span>`).join("")
      : "<span>لا توجد أخبار منشورة بعد</span>";

    delete tickerTrack.dataset.tickerOriginal;
    if (typeof scheduleTickerInit === "function") scheduleTickerInit();
  }

  function renderHomepageNews() {
    const allNews = window.MojazNewsStore.getAll();
    renderHero(allNews[0]);
    renderLists(allNews);
    renderTicker(allNews);
  }

  renderHomepageNews();
  window.MojazNewsStore.ready().then(renderHomepageNews).catch(renderHomepageNews);
  window.addEventListener(window.MojazNewsStore.UPDATE_EVENT, renderHomepageNews);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomepageNews);
} else {
  initHomepageNews();
}
