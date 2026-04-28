/**
 * مُوجز 24 — Main JavaScript
 * Handles: Dark/Light Mode, Animations, Ticker, Clock, Interactions
 */

/* ===================== DARK / LIGHT MODE ===================== */
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Read saved theme or default to light
let currentTheme = localStorage.getItem('mojaz24-theme') || 'light';
applyTheme(currentTheme);

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  html.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  currentTheme = theme;
  localStorage.setItem('mojaz24-theme', theme);
}

themeToggle?.addEventListener('click', () => {
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(next === 'dark' ? '🌙 تم التحويل للوضع الداكن' : '☀️ تم التحويل للوضع الفاتح');
});

/* ===================== REAL-TIME CLOCK ===================== */
function updateClock() {
  const now = new Date();

  // Arabic date
  const days   = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  const dayName = days[now.getDay()];
  const day     = now.getDate();
  const month   = months[now.getMonth()];
  const year    = now.getFullYear();

  const dateEl = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = `${dayName}، ${day} ${month} ${year}`;

  // Arabic time
  let hours   = now.getHours();
  const mins  = String(now.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  hours = hours % 12 || 12;

  const timeEl = document.getElementById('currentTime');
  if (timeEl) timeEl.textContent = `${hours}:${mins} ${period}`;
}

updateClock();
setInterval(updateClock, 30000);

/* ===================== READING PROGRESS BAR ===================== */
function updateProgress() {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  document.documentElement.style.setProperty('--progress', `${progress}%`);
}

window.addEventListener('scroll', updateProgress, { passive: true });

/* ===================== STICKY HEADER SHADOW ===================== */
const siteHeader = document.getElementById('siteHeader');

window.addEventListener('scroll', () => {
  if (!siteHeader) return;
  if (window.scrollY > 10) {
    siteHeader.classList.add('scrolled');
  } else {
    siteHeader.classList.remove('scrolled');
  }
}, { passive: true });

/* ===================== SEARCH OVERLAY ===================== */
const searchToggle  = document.getElementById('searchToggle');
const searchOverlay = document.getElementById('searchOverlay');
const searchClose   = document.getElementById('searchClose');
const searchInput   = document.getElementById('searchInput');

searchToggle?.addEventListener('click', () => {
  searchOverlay?.classList.add('open');
  setTimeout(() => searchInput?.focus(), 200);
});

searchClose?.addEventListener('click', () => {
  searchOverlay?.classList.remove('open');
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchOverlay?.classList.remove('open');
    mobileNav?.classList.remove('open');
    mobileNavOverlay?.classList.remove('open');
    hamburger?.classList.remove('open');
  }
});

/* ===================== MOBILE NAV ===================== */
const hamburger         = document.getElementById('hamburger');
const mobileNav         = document.getElementById('mobileNav');
const mobileNavOverlay  = document.getElementById('mobileNavOverlay');
const mobileNavClose    = document.getElementById('mobileNavClose');
const mobileNavSections = document.querySelectorAll('.mobile-nav-section.has-children');

function closeMobileDropdowns() {
  mobileNavSections.forEach(section => {
    section.classList.remove('open');
    const toggle = section.querySelector('.mobile-nav-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function openMobileNav() {
  if (!mobileNav || !mobileNavOverlay || !hamburger) return;
  mobileNav.classList.add('open');
  mobileNavOverlay.classList.add('open');
  hamburger.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
  if (!mobileNav || !mobileNavOverlay || !hamburger) return;
  mobileNav.classList.remove('open');
  mobileNavOverlay.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
  closeMobileDropdowns();
}

hamburger?.addEventListener('click', () => {
  if (mobileNav?.classList.contains('open')) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
});

mobileNavClose?.addEventListener('click', closeMobileNav);
mobileNavOverlay?.addEventListener('click', closeMobileNav);

mobileNavSections.forEach(section => {
  const toggle = section.querySelector('.mobile-nav-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const willOpen = !section.classList.contains('open');
    closeMobileDropdowns();

    if (willOpen) {
      section.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
  });
});

mobileNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) {
    closeMobileNav();
  }
});

/* ===================== SCROLL REVEAL ANIMATIONS ===================== */
function initScrollReveal() {
  const elements = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  });

  elements.forEach(el => observer.observe(el));
}

// Run after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}

/* ===================== SEAMLESS TICKER =====================
   Approach:
   - Wait for window.load so fonts are rendered and offsetWidth is accurate
   - Clone the original set once → track width = 2 × original set
   - Animate translateX(0) → translateX(-50%) = shift exactly one set
   - At -50% the second copy lines up perfectly with where the first started
   - Result: infinite seamless loop, text never disappears, no gap
   ============================================================ */
function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const wrap = track.parentElement;
  if (!wrap) return;

  if (!track.dataset.tickerOriginal) {
    track.dataset.tickerOriginal = track.innerHTML;
  }

  const originalMarkup = track.dataset.tickerOriginal.trim();
  if (!originalMarkup) return;

  // Reset any previous state
  track.style.animation = 'none';
  track.style.transform = 'translateX(0)';
  track.innerHTML = originalMarkup;

  const originals = Array.from(track.children);
  if (!originals.length) return;

  const measureWidth = (nodes) =>
    nodes.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);

  let setWidth = measureWidth(originals);
  if (setWidth === 0) {
    setTimeout(initTicker, 200);
    return;
  }

  const minVisibleWidth = wrap.getBoundingClientRect().width * 1.35;

  while (setWidth < minVisibleWidth) {
    originals.forEach(span => {
      track.appendChild(span.cloneNode(true));
    });
    setWidth = measureWidth(Array.from(track.children));
  }

  const oneFullSetMarkup = track.innerHTML;
  track.innerHTML = oneFullSetMarkup + oneFullSetMarkup + oneFullSetMarkup;

  Array.from(track.children).forEach((item, index) => {
    if (index >= track.children.length / 3) {
      item.setAttribute('aria-hidden', 'true');
    }
  });

  void track.offsetWidth;

  const pxPerSecond = 72;
  const duration = setWidth / pxPerSecond;

  const keyframeName = 'tickerLoop';
  let styleEl = document.getElementById('ticker-keyframe-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ticker-keyframe-style';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @keyframes ${keyframeName} {
      0%   { transform: translateX(-${setWidth}px); }
      100% { transform: translateX(0); }
    }
  `;

  track.style.transform = `translateX(-${setWidth}px)`;
  track.style.animation = `${keyframeName} ${duration}s linear infinite`;
  track.style.animationPlayState = 'running';

  // Pause on hover
  if (wrap._tickerPause) {
    wrap.removeEventListener('mouseenter', wrap._tickerPause);
  }
  if (wrap._tickerResume) {
    wrap.removeEventListener('mouseleave', wrap._tickerResume);
  }
  wrap._tickerPause = () => { track.style.animationPlayState = 'paused'; };
  wrap._tickerResume = () => { track.style.animationPlayState = 'running'; };
  wrap.addEventListener('mouseenter', wrap._tickerPause);
  wrap.addEventListener('mouseleave', wrap._tickerResume);
}

function scheduleTickerInit() {
  requestAnimationFrame(() => {
    requestAnimationFrame(initTicker);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleTickerInit);
} else {
  scheduleTickerInit();
}

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    scheduleTickerInit();
  });
}

window.addEventListener('load', scheduleTickerInit);

window.addEventListener('resize', () => {
  clearTimeout(window.__tickerResizeTimer);
  window.__tickerResizeTimer = setTimeout(scheduleTickerInit, 120);
});

/* ===================== DROPDOWN NAV ===================== */
(function initDropdowns() {
  const navGroups = document.querySelectorAll('.nav-group.has-dropdown');

  navGroups.forEach(group => {
    const btn = group.querySelector('.nav-btn');
    if (!btn) return;

    // Toggle on click
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = group.classList.contains('open');

      // Close all other dropdowns first
      navGroups.forEach(g => g.classList.remove('open'));

      // Toggle this one
      if (!isOpen) {
        group.classList.add('open');
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    navGroups.forEach(g => g.classList.remove('open'));
  });

  // Prevent dropdown panel clicks from closing
  document.querySelectorAll('.nav-dropdown').forEach(panel => {
    panel.addEventListener('click', (e) => e.stopPropagation());
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      navGroups.forEach(g => g.classList.remove('open'));
    }
  });
})();

/* ===================== POLL INTERACTION ===================== */
let pollVoted = false;

window.votePoll = function(btn, percentage) {
  if (pollVoted) return;
  pollVoted = true;

  const options  = btn.closest('.poll-options').querySelectorAll('.poll-option');
  const totals   = [42, 28, 20, 10]; // Preset distribution
  let usedPcts   = [...totals];

  // Adjust so the clicked one gets its pct
  options.forEach((opt, i) => {
    const bar = opt.querySelector('.option-bar');
    const pct = usedPcts[i];
    opt.classList.add('voted');
    opt.disabled = true;

    // Animate after a small delay
    setTimeout(() => {
      bar.style.setProperty('--pct', `${pct}%`);
      // Add percentage text
      const existingPctEl = opt.querySelector('.option-pct');
      if (!existingPctEl) {
        const pctEl = document.createElement('span');
        pctEl.className = 'option-pct';
        pctEl.style.cssText = 'position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:var(--primary);z-index:1;';
        pctEl.textContent = `${pct}%`;
        opt.appendChild(pctEl);
      }
    }, 50 * i);

    if (opt === btn) {
      opt.classList.add('voted-selected');
    }
  });

  showToast('✅ تم تسجيل رأيك بنجاح!');
};

/* ===================== PODCAST PLAY ===================== */
document.querySelectorAll('.play-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Toggle play/pause state
    const isPlaying = btn.dataset.playing === 'true';
    if (isPlaying) {
      btn.textContent = '▶';
      btn.dataset.playing = 'false';
    } else {
      // Reset all others
      document.querySelectorAll('.play-btn').forEach(b => {
        b.textContent = '▶';
        b.dataset.playing = 'false';
      });
      btn.textContent = '⏸';
      btn.dataset.playing = 'true';
      const name = btn.closest('.podcast-item').querySelector('h4').textContent;
      showToast(`🎙️ جارٍ تشغيل: ${name}`);
    }
  });
});

/* ===================== NEWSLETTER SUBSCRIBE ===================== */
window.subscribeNewsletter = function(e) {
  e.preventDefault();
  const input = e.target.querySelector('.newsletter-input');
  const email = input.value.trim();
  if (!email) return false;

  showToast('📧 تم الاشتراك بنجاح في النشرة البريدية!');
  input.value = '';
  return false;
};

/* ===================== TOAST NOTIFICATION ===================== */
let toastTimeout = null;

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/* ===================== FONT SIZE ADJUSTMENT ===================== */
let fontScale = parseFloat(localStorage.getItem('mojaz24-font') || '1');
applyFontScale(fontScale);

function applyFontScale(scale) {
  fontScale = Math.max(0.85, Math.min(1.3, scale));
  document.documentElement.style.fontSize = `${fontScale * 16}px`;
  localStorage.setItem('mojaz24-font', fontScale.toString());
}

document.getElementById('fontIncrease')?.addEventListener('click', () => {
  applyFontScale(fontScale + 0.05);
});

document.getElementById('fontDecrease')?.addEventListener('click', () => {
  applyFontScale(fontScale - 0.05);
});

/* ===================== NEWS CARD CLICK RIPPLE ===================== */
document.querySelectorAll('.news-card-h, .media-card, .latest-item, .most-read-item, .trending-item').forEach(card => {
  card.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect   = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(67, 97, 238, 0.12);
      transform: scale(0);
      animation: rippleAnim 0.5s linear;
      pointer-events: none;
      width: 80px;
      height: 80px;
      left: ${x - 40}px;
      top: ${y - 40}px;
    `;

    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    card.appendChild(ripple);

    setTimeout(() => ripple.remove(), 500);
  });
});

// Add ripple keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleAnim {
    to { transform: scale(4); opacity: 0; }
  }
`;
document.head.appendChild(style);

/* ===================== LAZY LOADING IMAGES ===================== */
if ('IntersectionObserver' in window) {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  const imageObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.4s ease';
        img.addEventListener('load', () => {
          img.style.opacity = '1';
        }, { once: true });
        obs.unobserve(img);
      }
    });
  });
  lazyImages.forEach(img => imageObserver.observe(img));
}

/* ===================== ACTIVE NAV HIGHLIGHT ===================== */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    if (this.tagName === 'A') {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      this.classList.add('active');
    }
  });
});

// Active nav style
const navActiveStyle = document.createElement('style');
navActiveStyle.textContent = `
  a.nav-item.active {
    color: var(--primary);
    background: rgba(67, 97, 238, 0.08);
  }
  a.nav-item.active .nav-icon {
    background: rgba(67, 97, 238, 0.15);
  }
`;
document.head.appendChild(navActiveStyle);

/* ===================== BLOG COMMENTS ===================== */
const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('commentInput');
const commentsFeed = document.getElementById('commentsFeed');
const commentsCount = document.getElementById('commentsCount');
const commentsStorageKey = 'mojaz24-blog-comments';

function getStoredComments() {
  try {
    return JSON.parse(localStorage.getItem(commentsStorageKey) || '[]');
  } catch {
    return [];
  }
}

function saveComments(comments) {
  localStorage.setItem(commentsStorageKey, JSON.stringify(comments));
}

function formatCommentTime(timestamp) {
  return new Date(timestamp).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getCommentInitial(text) {
  const firstLetter = text.trim().charAt(0);
  return firstLetter || 'م';
}

function updateCommentsCount(total) {
  if (!commentsCount) return;
  commentsCount.textContent = `${total} ${total === 1 ? 'تعليق' : 'تعليقات'}`;
}

function renderComments() {
  if (!commentsFeed) return;

  const comments = getStoredComments();
  commentsFeed.innerHTML = '';

  if (!comments.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'comment-empty';
    emptyState.textContent = 'لا توجد تعليقات بعد. كن أول من يكتب تعليقًا.';
    commentsFeed.appendChild(emptyState);
    updateCommentsCount(0);
    return;
  }

  comments.forEach(comment => {
    const item = document.createElement('article');
    item.className = 'comment-item';
    item.innerHTML = `
      <div class="comment-item-header">
        <div class="comment-author">
          <span class="comment-avatar">${getCommentInitial(comment.text)}</span>
          <span>قارئ مُوجز 24</span>
        </div>
        <time class="comment-time" datetime="${comment.createdAt}">${formatCommentTime(comment.createdAt)}</time>
      </div>
      <p class="comment-body"></p>
    `;
    item.querySelector('.comment-body').textContent = comment.text;
    commentsFeed.appendChild(item);
  });

  updateCommentsCount(comments.length);
}

if (commentForm && commentInput && commentsFeed) {
  renderComments();

  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = commentInput.value.trim();
    if (!text) return;

    const comments = getStoredComments();
    comments.unshift({
      text,
      createdAt: new Date().toISOString()
    });
    saveComments(comments);
    commentInput.value = '';
    renderComments();
    showToast('تم نشر تعليقك بنجاح');
  });
}

/* ===================== BACK TO TOP ===================== */
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  lastScrollY = window.scrollY;
}, { passive: true });

/* ===================== PRINT FRIENDLY ===================== */
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('[data-animate]').forEach(el => {
    el.classList.add('animated');
  });
});

/* ===================== CONSOLE BRANDING ===================== */
console.log(
  '%c مُوجز 24 %c أخبار عربية على مدار الساعة ',
  'background: #4361ee; color: white; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 4px 0 0 4px;',
  'background: #e63946; color: white; font-size: 14px; padding: 6px 12px; border-radius: 0 4px 4px 0;'
);
