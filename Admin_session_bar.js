/**
 * مُوجز 24 — شريط الجلسة في الإدارة
 * أضف هذا السكريبت في نهاية admin.html بعد Auth.js
 */
(function () {
  if (typeof MojazAuth === "undefined") return;

  const session = MojazAuth.getSession();
  if (!session) return;

  /* ---- إنشاء شريط المستخدم ---- */
  const bar = document.createElement("div");
  bar.id = "adminSessionBar";
  bar.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e4eb);
    border-radius: 10px;
    padding: 10px 18px;
    margin-bottom: 20px;
    font-family: 'Cairo', sans-serif;
    font-size: .85rem;
    flex-wrap: wrap;
  `;

  const roleLabel = session.role === "admin" ? "🛡️ مدير النظام" : "✍️ صحفي";
  const roleColor = session.role === "admin" ? "#c8a96e" : "#38a169";

  bar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:linear-gradient(135deg,#c8a96e,#a8893e);
        color:#fff;font-weight:800;font-size:1rem;
        display:flex;align-items:center;justify-content:center;
      ">${session.avatar || (session.name || "م")[0]}</div>
      <div>
        <div style="font-weight:700;color:var(--text,#1a1d2e);">${session.name || session.username || "مستخدم"}</div>
        <div style="color:${roleColor};font-size:.75rem;font-weight:600;">${roleLabel}</div>
      </div>
    </div>
    <button id="adminLogoutBtn" style="
      display:flex;align-items:center;gap:6px;
      padding:7px 14px;border-radius:8px;
      background:transparent;border:1.5px solid var(--border,#e2e4eb);
      color:var(--text-muted,#6b7280);cursor:pointer;
      font-family:'Cairo',sans-serif;font-size:.82rem;font-weight:600;
      transition:background .2s,color .2s;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      تسجيل الخروج
    </button>
  `;

  // أدخل الشريط قبل adminFormCard
  const formCard = document.getElementById("adminFormCard");
  if (formCard && formCard.parentNode) {
    formCard.parentNode.insertBefore(bar, formCard);
  } else {
    const main = document.querySelector(".site-main .container");
    if (main) main.prepend(bar);
  }

  // زر الخروج
  document.getElementById("adminLogoutBtn")?.addEventListener("click", function () {
    if (confirm("هل تريد تسجيل الخروج؟")) MojazAuth.logout();
  });

  // hover
  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("mouseenter", function () {
      this.style.background = "rgba(229,62,62,.08)";
      this.style.color = "#e53e3e";
      this.style.borderColor = "rgba(229,62,62,.3)";
    });
    logoutBtn.addEventListener("mouseleave", function () {
      this.style.background = "transparent";
      this.style.color = "var(--text-muted,#6b7280)";
      this.style.borderColor = "var(--border,#e2e4eb)";
    });
  }
})();
