/**
 * مُوجز 24 — Admin News Builder (Base64 + API Version)
 * الإصدار المُحدَّث: يدعم رفع صور متعددة داخل المحتوى
 */

(function () {
  function getItemId(item) {
    // Normalized items from api.js have 'id' field; also check legacy names
    return item?.id ?? item?.Id ?? item?._id ?? item?.newsId ?? item?.NewsId ?? null;
  }
  function getImageUrl(item) {
    return item?.imageUrl ?? item?.ImageUrl ?? item?.image ?? item?.Image ?? '';
  }
  function getVideoUrl(item) {
    return item?.videoUrl ?? item?.VideoUrl ?? item?.video ?? item?.Video ?? '';
  }

  async function compressAndEncodeImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  function encodeFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  }

  const form                 = document.getElementById('adminNewsForm');
  const titleInput           = document.getElementById('newsTitle');
  const contentInput         = document.getElementById('newsContent');
  const categoryInput        = document.getElementById('newsCategory');
  const videoLinkInput       = document.getElementById('newsVideo');
  const editIdInput          = document.getElementById('editNewsId');
  const submitBtn            = document.getElementById('submitBtn');
  const formTitleEl          = document.getElementById('formTitle');
  const cancelEditBtn        = document.getElementById('cancelEditBtn');
  const imageInput           = document.getElementById('newsImage');
  const imagePreview         = document.getElementById('imagePreview');
  const contentImagesInput   = document.getElementById('newsContentImages');
  const contentImagesPreview = document.getElementById('contentImagesPreview');
  const videoFileInput       = document.getElementById('newsVideoFile');
  const videoFilePreview     = document.getElementById('videoFilePreview');
  const audioFileInput       = document.getElementById('newsAudioFile');
  const audioFilePreview     = document.getElementById('audioFilePreview');

  let selectedImageFile         = null;
  let selectedContentImageFiles = [];
  let selectedVideoFile         = null;
  let selectedAudioFile         = null;
  let savedImageUrl             = '';
  let savedContentImages        = [];
  let savedVideoFileUrl         = '';
  let savedAudioFileUrl         = '';

  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    document.getElementById('imageFileName').textContent = file.name;
    if (imagePreview) {
      imagePreview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width:100px;border-radius:8px;margin-top:10px;">`;
      imagePreview.style.display = 'block';
    }
  });

  contentImagesInput?.addEventListener('change', () => {
    const files = Array.from(contentImagesInput.files);
    if (!files.length) return;
    selectedContentImageFiles = files;
    const fileNameEl = document.getElementById('contentImagesFileName');
    if (fileNameEl) fileNameEl.textContent = files.length === 1 ? files[0].name : `${files.length} صور مختارة`;
    if (contentImagesPreview) {
      contentImagesPreview.innerHTML = '';
      contentImagesPreview.style.display = 'flex';
      files.forEach((file, idx) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative;display:inline-block;';
        wrapper.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;border:2px solid var(--border);">
          <span style="position:absolute;top:-6px;left:-6px;background:var(--accent,#c8a96e);color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:700;">${idx + 1}</span>`;
        contentImagesPreview.appendChild(wrapper);
      });
    }
  });

  videoFileInput?.addEventListener('change', () => {
    const file = videoFileInput.files[0];
    if (!file) return;
    selectedVideoFile = file;
    document.getElementById('videoFileName').textContent = file.name;
    if (videoFilePreview) {
      videoFilePreview.innerHTML = `<video src="${URL.createObjectURL(file)}" controls style="width:100%;max-width:300px;margin-top:10px;border-radius:8px;"></video>`;
      videoFilePreview.style.display = 'block';
    }
  });

  audioFileInput?.addEventListener('change', () => {
    const file = audioFileInput.files[0];
    if (!file) return;
    selectedAudioFile = file;
    document.getElementById('audioFileName').textContent = file.name;
    if (audioFilePreview) {
      audioFilePreview.innerHTML = `<audio src="${URL.createObjectURL(file)}" controls style="width:100%;margin-top:10px;"></audio>`;
      audioFilePreview.style.display = 'block';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title    = titleInput.value.trim();
    const content  = contentInput.value.trim();
    const category = categoryInput.value;
    const videoUrl = videoLinkInput?.value.trim() || '';
    const id       = editIdInput.value;

    if (!title || !content || !category) { showToast('⚠️ يرجى ملء الحقول المطلوبة'); return; }
    if (submitBtn) submitBtn.disabled = true;

    try {
      let finalImageUrl        = savedImageUrl;
      let finalContentImages   = [...savedContentImages];
      let finalVideoFileBase64 = null;
      let finalAudioFileBase64 = null;

      if (selectedImageFile) {
        showToast('⏳ جاري معالجة صورة الغلاف...');
        finalImageUrl = await compressAndEncodeImage(selectedImageFile, 800, 0.6);
      }
      if (selectedContentImageFiles.length > 0) {
        showToast('⏳ جاري معالجة صور المحتوى...');
        finalContentImages = [];
        for (const file of selectedContentImageFiles) {
          finalContentImages.push(await compressAndEncodeImage(file, 1000, 0.65));
        }
      }
      if (selectedVideoFile) {
        showToast('⏳ جاري معالجة ملف الفيديو...');
        finalVideoFileBase64 = await encodeFileToBase64(selectedVideoFile);
      }
      if (selectedAudioFile) {
        showToast('⏳ جاري معالجة الملف الصوتي...');
        finalAudioFileBase64 = await encodeFileToBase64(selectedAudioFile);
      }

      const newsData = {
        title, content, category,
        // Send both field names to maximize compatibility with the backend
        image:         finalImageUrl,
        imageUrl:      finalImageUrl,
        contentImage:  finalContentImages[0] || '',
        contentImages: finalContentImages,
        videoUrl,
        video:         videoUrl,
        videoFile:     finalVideoFileBase64,
        audioFile:     finalAudioFileBase64,
      };

      if (id) {
        if (typeof window.MojazAPI.update === 'function') {
          await window.MojazAPI.update(id, newsData);
        } else {
          await window.MojazAPI.remove(id);
          await window.MojazAPI.add(newsData);
        }
        showToast('✅ تم تحديث الخبر بنجاح');
      } else {
        await window.MojazAPI.add(newsData);
        showToast('✅ تم نشر الخبر بنجاح');
      }

      resetForm();
      renderNewsFeed();

    } catch (error) {
      console.error('Submission Error:', error);
      showToast('❌ خطأ: ' + error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  cancelEditBtn?.addEventListener('click', resetForm);

  function resetForm() {
    form?.reset();
    editIdInput.value = '';
    selectedImageFile = null; selectedContentImageFiles = [];
    selectedVideoFile = null; selectedAudioFile = null;
    savedImageUrl = ''; savedContentImages = [];
    savedVideoFileUrl = ''; savedAudioFileUrl = '';

    if (imagePreview)         { imagePreview.style.display = 'none';         imagePreview.innerHTML = ''; }
    if (contentImagesPreview) { contentImagesPreview.style.display = 'none'; contentImagesPreview.innerHTML = ''; }
    if (videoFilePreview)     { videoFilePreview.style.display = 'none';     videoFilePreview.innerHTML = ''; }
    if (audioFilePreview)     { audioFilePreview.style.display = 'none';     audioFilePreview.innerHTML = ''; }

    const fn = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    fn('imageFileName', 'اختر صورة...');
    fn('contentImagesFileName', 'اختر صورة أو أكثر للمحتوى...');
    fn('videoFileName', 'اختر ملف فيديو...');
    fn('audioFileName', 'اختر ملف صوتي...');

    if (formTitleEl) formTitleEl.textContent = 'إضافة خبر جديد';
    if (submitBtn) submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg> نشر الخبر`;
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
  }

  async function renderNewsFeed() {
    const feedContainer = document.getElementById('adminNewsFeed');
    const newsCountEl   = document.getElementById('newsCount');
    const statTotalEl   = document.getElementById('statTotal');
    if (!feedContainer) return;

    try {
      await window.MojazNewsStore.refresh();
      const allNews = window.MojazNewsStore.getAll();

      const filterCat = document.getElementById('filterCategory');
      if (filterCat) {
        const cats = [...new Set(allNews.map(n => n.category || n.Category).filter(Boolean))];
        const currentVal = filterCat.value;
        filterCat.innerHTML = '<option value="">كل التصنيفات</option>' +
          cats.map(c => `<option value="${c}"${c === currentVal ? ' selected' : ''}>${c}</option>`).join('');
        filterCat.onchange = () => renderFiltered(allNews, filterCat.value);
      }

      renderFiltered(allNews, filterCat?.value || '');
      if (newsCountEl) newsCountEl.textContent = `${allNews.length} خبر`;
      if (statTotalEl) statTotalEl.textContent = allNews.length;

      const statCatCards = document.getElementById('statCatCards');
      if (statCatCards) {
        const cats = {};
        allNews.forEach(n => { const c = n.category || n.Category || 'غير مصنف'; cats[c] = (cats[c] || 0) + 1; });
        statCatCards.innerHTML = Object.entries(cats).slice(0, 3).map(([cat, count]) =>
          `<div style="display:flex;flex-direction:column;align-items:center;">
            <span class="admin-stat-num" style="font-size:1.4rem;">${count}</span>
            <span class="admin-stat-label">${cat}</span>
          </div>`).join('');
      }
    } catch (err) {
      console.error('renderNewsFeed error:', err);
      feedContainer.innerHTML = '<p style="color:red;text-align:center;padding:20px;">خطأ في تحميل الأخبار.</p>';
    }
  }

  function renderFiltered(allNews, cat) {
    const feedContainer = document.getElementById('adminNewsFeed');
    if (!feedContainer) return;
    const list = cat ? allNews.filter(n => (n.category || n.Category) === cat) : allNews;
    if (!list.length) {
      feedContainer.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);">لا توجد أخبار منشورة بعد.</p>';
      return;
    }
    feedContainer.innerHTML = list.map(item => {
      const newsId   = getItemId(item);
      const imgUrl   = getImageUrl(item);
      const title    = item.title || item.Title || 'بدون عنوان';
      const category = item.category || item.Category || '';
      const createdAt = item.createdAt || item.CreatedAt || '';
      const imgCount = Array.isArray(item.contentImages) ? item.contentImages.length
                      : (item.contentImage ? 1 : 0);
      return `
        <div class="admin-news-item">
          <div class="admin-news-item-info">
            ${imgUrl
              ? `<img src="${imgUrl}" class="admin-news-thumb" loading="lazy" alt="${title}">`
              : `<div class="admin-news-thumb admin-news-thumb-empty"></div>`}
            <div class="admin-news-text">
              <strong class="admin-news-title">${title}</strong>
              <div class="admin-news-meta">
                <span class="tag tag-sm" style="font-size:.7rem;padding:2px 8px;">${category}</span>
                ${createdAt ? `<span>${new Date(createdAt).toLocaleDateString('ar-EG')}</span>` : ''}
                ${imgCount > 1 ? `<span style="color:var(--accent,#c8a96e);">📷 ${imgCount} صور</span>` : ''}
              </div>
            </div>
          </div>
          <div class="admin-news-actions">
            <a class="admin-btn-view" href="article.html?id=${encodeURIComponent(newsId)}" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
              عرض
            </a>
            <button class="admin-btn-edit" onclick="editNews('${newsId}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              تعديل
            </button>
            <button class="admin-btn-delete" onclick="deleteNews('${newsId}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              حذف
            </button>
          </div>
        </div>`;
    }).join('');
  }

  /* ===== Custom Delete Modal ===== */
  function showDeleteModal(id) {
    // Remove any existing modal
    const existing = document.getElementById('mojazDeleteModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mojazDeleteModal';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,.45);backdrop-filter:blur(4px);
      display:flex;align-items:center;justify-content:center;
      padding:20px;animation:modalFadeIn .2s ease;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes modalFadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        #mojazDeleteModal .del-modal{
          background:var(--surface,#fff);border:1px solid var(--border,#e2e4eb);
          border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);
          padding:36px 32px 28px;max-width:400px;width:100%;
          font-family:'Cairo',sans-serif;text-align:center;
        }
        #mojazDeleteModal .del-icon{
          width:60px;height:60px;border-radius:50%;
          background:rgba(229,62,62,.1);border:2px solid rgba(229,62,62,.25);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 18px;color:#e53e3e;
        }
        #mojazDeleteModal h3{font-size:1.15rem;font-weight:800;color:var(--text,#1a1d2e);margin-bottom:8px;}
        #mojazDeleteModal p{font-size:.87rem;color:var(--text-muted,#6b7280);margin-bottom:24px;line-height:1.6;}
        #mojazDeleteModal .del-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
        #mojazDeleteModal .btn-cancel{
          flex:1;min-width:100px;padding:11px 20px;
          background:var(--bg,#f5f6fa);border:1.5px solid var(--border,#e2e4eb);
          color:var(--text,#1a1d2e);border-radius:10px;cursor:pointer;
          font-family:'Cairo',sans-serif;font-size:.92rem;font-weight:700;
          transition:background .2s;
        }
        #mojazDeleteModal .btn-cancel:hover{background:var(--border,#e2e4eb);}
        #mojazDeleteModal .btn-delete{
          flex:1;min-width:100px;padding:11px 20px;
          background:linear-gradient(135deg,#e53e3e,#c53030);
          color:#fff;border:none;border-radius:10px;cursor:pointer;
          font-family:'Cairo',sans-serif;font-size:.92rem;font-weight:700;
          transition:opacity .2s,transform .15s;
        }
        #mojazDeleteModal .btn-delete:hover{opacity:.9;}
        #mojazDeleteModal .btn-delete:active{transform:scale(.97);}
      </style>
      <div class="del-modal" id="delModalBox">
        <div class="del-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </div>
        <h3>حذف الخبر</h3>
        <p>هل أنت متأكد من حذف هذا الخبر؟<br>لا يمكن التراجع عن هذا الإجراء.</p>
        <div class="del-actions">
          <button class="btn-cancel" id="delCancelBtn">رجوع</button>
          <button class="btn-delete" id="delConfirmBtn">حذف</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    // Close on backdrop click (outside modal box)
    overlay.addEventListener('click', (e) => {
      if (!document.getElementById('delModalBox').contains(e.target)) closeModal();
    });

    document.getElementById('delCancelBtn').addEventListener('click', closeModal);

    document.getElementById('delConfirmBtn').addEventListener('click', async () => {
      const confirmBtn = document.getElementById('delConfirmBtn');
      confirmBtn.disabled = true;
      confirmBtn.textContent = '...جاري الحذف';
      try {
        await window.MojazAPI.remove(id);
        closeModal();
        showToast('🗑️ تم الحذف بنجاح');
        renderNewsFeed();
      } catch (err) {
        closeModal();
        showToast('❌ فشل الحذف: ' + err.message);
      }
    });
  }

  window.deleteNews = async (id) => {
    if (!id || id === 'null' || id === 'undefined') { showToast('❌ معرّف الخبر غير صالح'); return; }
    showDeleteModal(id);
  };

  window.editNews = async (id) => {
    if (!id || id === 'null' || id === 'undefined') { showToast('❌ معرّف الخبر غير صالح'); return; }
    try {
      const allNews = window.MojazNewsStore.getAll();
      let news = allNews.find(n => String(getItemId(n)) === String(id));
      if (!news && typeof window.MojazAPI.getById === 'function') news = await window.MojazAPI.getById(id);
      if (!news) { showToast('❌ لم يُعثر على الخبر'); return; }

      editIdInput.value   = getItemId(news);
      titleInput.value    = news.title    || news.Title    || '';
      contentInput.value  = news.content  || news.Content  || '';
      categoryInput.value = news.category || news.Category || '';
      if (videoLinkInput) videoLinkInput.value = getVideoUrl(news);

      savedImageUrl = getImageUrl(news);
      if (Array.isArray(news.contentImages) && news.contentImages.length) {
        savedContentImages = [...news.contentImages];
      } else if (news.contentImage || news.ContentImage) {
        savedContentImages = [news.contentImage || news.ContentImage];
      } else {
        savedContentImages = [];
      }
      savedVideoFileUrl = news.videoFile || news.VideoFile || '';
      savedAudioFileUrl = news.audioFile || news.AudioFile || '';

      if (contentImagesPreview && savedContentImages.length) {
        contentImagesPreview.innerHTML = '';
        contentImagesPreview.style.display = 'flex';
        savedContentImages.forEach((src, idx) => {
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'position:relative;display:inline-block;';
          wrapper.innerHTML = `<img src="${src}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;border:2px solid var(--accent,#c8a96e);">
            <span style="position:absolute;top:-6px;left:-6px;background:var(--accent,#c8a96e);color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:700;">${idx + 1}</span>`;
          contentImagesPreview.appendChild(wrapper);
        });
        const fileNameEl = document.getElementById('contentImagesFileName');
        if (fileNameEl) fileNameEl.textContent = `${savedContentImages.length} صور محفوظة`;
      }

      if (formTitleEl) formTitleEl.textContent = 'تعديل الخبر';
      if (submitBtn) submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> تحديث الخبر`;
      if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('📝 تم تحميل بيانات الخبر للتعديل');
    } catch (err) {
      console.error('editNews error:', err);
      showToast('❌ خطأ في جلب بيانات الخبر');
    }
  };

  document.addEventListener('DOMContentLoaded', renderNewsFeed);

})();
