/**
 * مُوجز 24 — Admin News Builder
 * Manages: add, edit, delete news via localStorage
 */

(function () {
  /* ---- Elements ---- */
  const form          = document.getElementById('adminNewsForm');
  const titleInput    = document.getElementById('newsTitle');
  const contentInput  = document.getElementById('newsContent');
  const categoryInput = document.getElementById('newsCategory');
  const imageInput    = document.getElementById('newsImage');
  const videoInput    = document.getElementById('newsVideo');
  const editIdInput   = document.getElementById('editNewsId');
  const submitBtn     = document.getElementById('submitBtn');
  const cancelBtn     = document.getElementById('cancelEditBtn');
  const formTitleEl   = document.getElementById('formTitle');
  const newsFeed      = document.getElementById('adminNewsFeed');
  const newsCountEl   = document.getElementById('newsCount');
  const statTotal     = document.getElementById('statTotal');
  const statCatCards  = document.getElementById('statCatCards');
  const filterSelect  = document.getElementById('filterCategory');
  const imagePreview  = document.getElementById('imagePreview');
  const imageFileName = document.getElementById('imageFileName');

  // Content image elements
  const contentImageInput    = document.getElementById('newsContentImage');
  const contentImagePreview  = document.getElementById('contentImagePreview');
  const contentImageFileName = document.getElementById('contentImageFileName');

  // Video file / record elements
  const videoFileInput        = document.getElementById('newsVideoFile');
  const videoFilePreview      = document.getElementById('videoFilePreview');
  const videoFileNameEl       = document.getElementById('videoFileName');
  const startRecordBtn        = document.getElementById('startRecordBtn');
  const stopRecordBtn         = document.getElementById('stopRecordBtn');
  const recordTimerEl         = document.getElementById('recordTimer');
  const recordPreviewEl       = document.getElementById('recordPreview');
  const recordedVideoPreview  = document.getElementById('recordedVideoPreview');
  const clearRecordBtn        = document.getElementById('clearRecordBtn');

  // ── Audio file elements ──
  const audioFileInput    = document.getElementById('newsAudioFile');
  const audioFileNameEl   = document.getElementById('audioFileName');
  const audioFilePreview  = document.getElementById('audioFilePreview');

  // In-memory data for current form
  let currentImageData        = '';
  let currentContentImageData = '';
  let currentVideoFileData    = '';
  let currentAudioFileData    = '';

  // Recording state
  let mediaRecorder = null;
  let activeRecordStream = null;
  let recordedChunks = [];
  let recordTimerInterval = null;
  let recordSeconds = 0;
  let suppressRecordSave = false;

  function getNewsId(news) {
    return news?._id || news?.id || '';
  }

  // ── helper: يجيب الـ URL الصحيح للصورة من الـ API response ──
  function getImageUrl(news) {
    return news?.imageUrl || news?.image || '';
  }
  function getContentImageUrl(news) {
    return news?.contentImage || '';
  }
  function getVideoFileUrl(news) {
    return news?.videoUrl || news?.videoFile || '';
  }
  function getAudioFileUrl(news) {
    return news?.audioFile || '';
  }

  /* ---- Image Upload Preview ---- */
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    imageFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageData = e.target.result;
      if (imagePreview) {
        imagePreview.innerHTML = `<img src="${currentImageData}" alt="preview">`;
        imagePreview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });

  /* ---- Content Image Upload Preview ---- */
  contentImageInput?.addEventListener('change', () => {
    const file = contentImageInput.files[0];
    if (!file) return;
    if (contentImageFileName) contentImageFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentContentImageData = e.target.result;
      if (contentImagePreview) {
        contentImagePreview.innerHTML = `<img src="${currentContentImageData}" alt="preview" style="width:100%;max-height:160px;object-fit:cover;border-radius:var(--radius);">`;
        contentImagePreview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });

  /* ---- Video File Upload ---- */
  videoFileInput?.addEventListener('change', () => {
    const file = videoFileInput.files[0];
    if (!file) return;
    if (videoFileNameEl) videoFileNameEl.textContent = file.name;
    clearRecording({ preserveVideoData: true });
    const reader = new FileReader();
    reader.onload = (e) => {
      currentVideoFileData = e.target.result;
      if (videoFilePreview) {
        videoFilePreview.innerHTML = `<video src="${currentVideoFileData}" controls style="width:100%;max-height:180px;border-radius:var(--radius);background:#000;"></video>`;
        videoFilePreview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });

  /* ── Audio File Upload ── */
  audioFileInput?.addEventListener('change', () => {
    const file = audioFileInput.files[0];
    if (!file) return;
    if (audioFileNameEl) audioFileNameEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentAudioFileData = e.target.result;
      if (audioFilePreview) {
        audioFilePreview.innerHTML = `
          <audio controls style="width:100%;margin-top:8px;border-radius:8px;">
            <source src="${currentAudioFileData}" type="${file.type}">
          </audio>
          <p style="font-size:12px;color:var(--text-muted,#888);margin:4px 0 0;">
            ${esc(file.name)} — ${(file.size / 1024).toFixed(0)} KB
          </p>`;
        audioFilePreview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });

  /* ---- Video Recording ---- */
  startRecordBtn?.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      activeRecordStream = stream;
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        activeRecordStream = null;
        if (suppressRecordSave) {
          suppressRecordSave = false;
          return;
        }
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const fr = new FileReader();
        fr.onload = (ev) => {
          currentVideoFileData = ev.target.result;
          if (videoFilePreview) {
            videoFilePreview.innerHTML = `<video src="${url}" controls style="width:100%;max-height:180px;border-radius:var(--radius);background:#000;"></video>`;
            videoFilePreview.style.display = 'block';
          }
        };
        fr.readAsDataURL(blob);
        if (recordPreviewEl) recordPreviewEl.style.display = 'none';
        if (recordedVideoPreview) { recordedVideoPreview.src = url; recordedVideoPreview.style.display = 'block'; }
        if (clearRecordBtn) clearRecordBtn.style.display = 'inline-flex';
        stopRecordTimer();
        if (startRecordBtn) startRecordBtn.style.display = 'inline-flex';
        if (stopRecordBtn) stopRecordBtn.style.display = 'none';
        if (videoFileInput) { videoFileInput.value = ''; if (videoFileNameEl) videoFileNameEl.textContent = 'اختر ملف فيديو...'; }
      };
      if (recordPreviewEl) { recordPreviewEl.srcObject = stream; recordPreviewEl.style.display = 'block'; }
      mediaRecorder.start();
      startRecordTimer();
      if (startRecordBtn) startRecordBtn.style.display = 'none';
      if (stopRecordBtn) stopRecordBtn.style.display = 'inline-flex';
      if (recordTimerEl) recordTimerEl.style.display = 'inline-flex';
    } catch (err) {
      showToast('⚠️ تعذّر الوصول إلى الكاميرا');
    }
  });

  stopRecordBtn?.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  });

  clearRecordBtn?.addEventListener('click', () => {
    clearRecording();
  });

  function startRecordTimer() {
    recordSeconds = 0;
    if (recordTimerEl) recordTimerEl.style.display = 'inline-flex';
    recordTimerInterval = setInterval(() => {
      recordSeconds++;
      const m = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
      const s = String(recordSeconds % 60).padStart(2, '0');
      if (recordTimerEl) recordTimerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopRecordTimer() {
    clearInterval(recordTimerInterval);
    recordTimerInterval = null;
    if (recordTimerEl) { recordTimerEl.style.display = 'none'; recordTimerEl.textContent = '00:00'; }
  }

  function clearRecording(options = {}) {
    const preserveVideoData = Boolean(options.preserveVideoData);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      suppressRecordSave = true;
      mediaRecorder.stop();
    }
    if (activeRecordStream) {
      activeRecordStream.getTracks().forEach(track => track.stop());
      activeRecordStream = null;
    }
    mediaRecorder = null;
    recordedChunks = [];
    if (!preserveVideoData) currentVideoFileData = '';
    stopRecordTimer();
    if (recordPreviewEl) { recordPreviewEl.srcObject = null; recordPreviewEl.style.display = 'none'; }
    if (recordedVideoPreview) { recordedVideoPreview.src = ''; recordedVideoPreview.style.display = 'none'; }
    if (clearRecordBtn) clearRecordBtn.style.display = 'none';
    if (startRecordBtn) startRecordBtn.style.display = 'inline-flex';
    if (stopRecordBtn) stopRecordBtn.style.display = 'none';
    if (videoFilePreview) { videoFilePreview.innerHTML = ''; videoFilePreview.style.display = 'none'; }
    if (videoFileInput) { videoFileInput.value = ''; if (videoFileNameEl) videoFileNameEl.textContent = 'اختر ملف فيديو...'; }
  }

  /* ---- Form Submit (Add / Edit) ---- */
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title    = titleInput.value.trim();
    const content  = contentInput.value.trim();
    const category = categoryInput.value;
    const video    = videoInput.value.trim();
    const id       = editIdInput.value;

    if (!title || !content || !category) {
      showToast('⚠️ يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const existing = id ? (MojazNewsStore.getById(id) || {}) : {};
    // عند التعديل نحتفظ بالـ URL القديم من الـ API لو ما جاش صورة جديدة
    const imageToUse        = currentImageData        || (id ? (getImageUrl(existing)       || '') : '');
    const contentImageToUse = currentContentImageData || (id ? (getContentImageUrl(existing) || '') : '');
    const videoFileToUse    = currentVideoFileData    || (id ? (getVideoFileUrl(existing)    || '') : '');
    const audioFileToUse    = currentAudioFileData    || (id ? (getAudioFileUrl(existing)    || '') : '');

    if (submitBtn) submitBtn.disabled = true;

    try {
      if (id) {
        await MojazNewsStore.update(id, {
          title, content, category,
          image: imageToUse,
          contentImage: contentImageToUse,
          video,
          videoFile: videoFileToUse,
          audioFile: audioFileToUse
        });
        showToast('✅ تم تحديث الخبر بنجاح');
      } else {
        await MojazNewsStore.add({
          title, content, category,
          image: imageToUse,
          contentImage: contentImageToUse,
          video,
          videoFile: videoFileToUse,
          audioFile: audioFileToUse
        });
        showToast('✅ تم نشر الخبر بنجاح');
      }

      resetForm();
      renderAll();
    } catch (error) {
      showToast(error.message || 'تعذر حفظ الخبر');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  /* ---- Cancel Edit ---- */
  cancelBtn?.addEventListener('click', () => {
    resetForm();
  });

  /* ---- Reset Form ---- */
  function resetForm() {
    form?.reset();
    editIdInput.value = '';
    currentImageData        = '';
    currentContentImageData = '';
    currentAudioFileData    = '';
    clearRecording();
    if (imagePreview)         { imagePreview.innerHTML = '';         imagePreview.style.display = 'none'; }
    if (imageFileName)          imageFileName.textContent = 'اختر صورة...';
    if (contentImagePreview)  { contentImagePreview.innerHTML = '';  contentImagePreview.style.display = 'none'; }
    if (contentImageFileName)   contentImageFileName.textContent = 'اختر صورة للمحتوى...';
    if (audioFilePreview)     { audioFilePreview.innerHTML = '';     audioFilePreview.style.display = 'none'; }
    if (audioFileNameEl)        audioFileNameEl.textContent = 'اختر ملف صوتي...';
    if (formTitleEl)  formTitleEl.textContent = 'إضافة خبر جديد';
    if (cancelBtn)    cancelBtn.style.display = 'none';
    if (submitBtn)    submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg> نشر الخبر';
  }

  /* ---- Load into Edit Form ---- */
  function loadForEdit(id) {
    const news = MojazNewsStore.getById(id);
    if (!news) return;

    const imgUrl         = getImageUrl(news);
    const contentImgUrl  = getContentImageUrl(news);
    const videoUrl       = getVideoFileUrl(news);
    const audioUrl       = getAudioFileUrl(news);

    editIdInput.value       = id;
    titleInput.value        = news.title;
    contentInput.value      = news.content;
    categoryInput.value     = news.category;
    videoInput.value        = news.video || '';
    // نحفظ الـ URL مش الـ base64 عشان لو ما تغيرش نبعته زي ما هو
    currentImageData        = imgUrl;
    currentContentImageData = contentImgUrl;
    currentVideoFileData    = videoUrl;
    currentAudioFileData    = audioUrl;

    if (imagePreview && imgUrl) {
      imagePreview.innerHTML = `<img src="${imgUrl}" alt="preview">`;
      imagePreview.style.display = 'block';
      if (imageFileName) imageFileName.textContent = 'صورة محفوظة';
    }

    if (contentImagePreview && contentImgUrl) {
      contentImagePreview.innerHTML = `<img src="${contentImgUrl}" alt="preview" style="width:100%;max-height:160px;object-fit:cover;border-radius:var(--radius);">`;
      contentImagePreview.style.display = 'block';
      if (contentImageFileName) contentImageFileName.textContent = 'صورة محتوى محفوظة';
    }

    if (videoFilePreview && videoUrl) {
      videoFilePreview.innerHTML = `<video src="${videoUrl}" controls style="width:100%;max-height:180px;border-radius:var(--radius);background:#000;"></video>`;
      videoFilePreview.style.display = 'block';
      if (videoFileNameEl) videoFileNameEl.textContent = 'فيديو محفوظ';
    }

    if (audioFilePreview && audioUrl) {
      audioFilePreview.innerHTML = `
        <audio controls style="width:100%;margin-top:8px;border-radius:8px;">
          <source src="${audioUrl}">
        </audio>
        <p style="font-size:12px;color:var(--text-muted,#888);margin:4px 0 0;">تسجيل صوتي محفوظ</p>`;
      audioFilePreview.style.display = 'block';
      if (audioFileNameEl) audioFileNameEl.textContent = 'تسجيل صوتي محفوظ';
    }

    if (formTitleEl) formTitleEl.textContent = 'تعديل الخبر';
    if (cancelBtn)   cancelBtn.style.display = 'inline-flex';
    if (submitBtn)   submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> حفظ التعديلات';

    document.getElementById('adminFormCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---- Delete ---- */
  async function deleteNews(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    await MojazNewsStore.remove(id);
    showToast('🗑️ تم حذف الخبر');
    renderAll();
  }

  /* ---- Format Date ---- */
  function formatDate(ts) {
    return new Date(ts).toLocaleString('ar-EG', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }

  /* ---- Escape HTML ---- */
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  /* ---- Render Stats ---- */
  function renderStats() {
    const allNews = MojazNewsStore.getAll();
    if (statTotal) statTotal.textContent = allNews.length;

    if (!statCatCards) return;
    const cats = MojazNewsStore.getCategories();
    const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 4);
    statCatCards.innerHTML = topCats.map(([cat, count]) =>
      `<div class="admin-stat-sub"><span class="admin-stat-sub-num">${count}</span><span>${esc(cat)}</span></div>`
    ).join('');
    if (topCats.length > 0) statCatCards.style.display = 'flex';
  }

  /* ---- Populate Filter Select ---- */
  function populateFilter() {
    if (!filterSelect) return;
    const cats = MojazNewsStore.getCategories();
    filterSelect.innerHTML = '<option value="">كل التصنيفات</option>';
    Object.keys(cats).sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = `${cat} (${cats[cat]})`;
      filterSelect.appendChild(opt);
    });
  }

  /* ---- Render News Feed ---- */
  function renderNewsFeed() {
    if (!newsFeed) return;
    const filterVal = filterSelect ? filterSelect.value : '';
    let allNews = MojazNewsStore.getAll();
    if (filterVal) allNews = allNews.filter(n => n.category === filterVal);

    if (newsCountEl) newsCountEl.textContent = `${allNews.length} خبر`;

    if (!allNews.length) {
      newsFeed.innerHTML = `<div class="comment-empty">لا توجد أخبار منشورة بعد. استخدم النموذج أعلاه لإضافة خبر.</div>`;
      return;
    }

    newsFeed.innerHTML = '';
    allNews.forEach(news => {
      // ✅ نستخدم imageUrl (من الـ API) أو image كـ fallback
      const thumbUrl = getImageUrl(news);
      const newsId   = getNewsId(news);

      const item = document.createElement('article');
      item.className = 'admin-news-item';
      item.innerHTML = `
        <div class="admin-news-item-inner">
          ${thumbUrl
            ? `<div class="admin-news-thumb"><img src="${esc(thumbUrl)}" alt="${esc(news.title)}" loading="lazy"></div>`
            : '<div class="admin-news-thumb admin-news-thumb-empty"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>'}
          <div class="admin-news-body">
            <div class="admin-news-meta">
              <span class="cat-card-badge">${esc(news.category)}</span>
              ${news.video ? '<span class="admin-has-video"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg> فيديو</span>' : ''}
              ${getAudioFileUrl(news) ? '<span class="admin-has-video"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg> صوت</span>' : ''}
              <time class="comment-time">${formatDate(news.createdAt)}</time>
              ${news.updatedAt && news.updatedAt !== news.createdAt ? `<span class="admin-edited">معدّل</span>` : ''}
            </div>
            <h4 class="admin-news-title">${esc(news.title)}</h4>
            <p class="admin-news-excerpt">${esc(news.content.length > 150 ? news.content.slice(0, 150) + '...' : news.content)}</p>
          </div>
          <div class="admin-news-actions">
            <button class="admin-action-btn admin-edit-btn" data-id="${newsId}" title="تعديل">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              تعديل
            </button>
            <a href="category.html?cat=${encodeURIComponent(news.category)}" class="admin-action-btn admin-view-btn" title="عرض التصنيف" target="_blank">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              عرض
            </a>
            <button class="admin-action-btn admin-delete-btn" data-id="${newsId}" title="حذف">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              حذف
            </button>
          </div>
        </div>`;

      newsFeed.appendChild(item);
    });

    // Bind action buttons
    newsFeed.querySelectorAll('.admin-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => loadForEdit(btn.dataset.id));
    });
    newsFeed.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteNews(btn.dataset.id));
    });
  }

  /* ---- Render All ---- */
  function renderAll() {
    renderStats();
    populateFilter();
    renderNewsFeed();
  }

  /* ---- Filter change ---- */
  filterSelect?.addEventListener('change', renderNewsFeed);

  renderAll();
  MojazNewsStore.ready().then(renderAll).catch(renderAll);
  window.addEventListener(MojazNewsStore.UPDATE_EVENT, renderAll);

})();
