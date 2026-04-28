/**
 * مُوجز 24 — Admin News Builder (Base64 + API Version)
 * هذا الملف يربط واجهة الإدارة بالسيرفر عبر MojazAPI
 */

(function () {
  /* ── Helper: استخراج الـ ID بأمان من أي كائن ── */
  function getItemId(item) {
    return item?.id ?? item?.Id ?? item?._id ?? item?.newsId ?? item?.NewsId ?? null;
  }

  /* ── Helper: استخراج الـ ImageUrl بأمان ── */
  function getImageUrl(item) {
    return item?.imageUrl ?? item?.ImageUrl ?? item?.image ?? item?.Image ?? '';
  }

  /* ── Helper: استخراج الـ VideoUrl بأمان ── */
  function getVideoUrl(item) {
    return item?.videoUrl ?? item?.VideoUrl ?? item?.video ?? item?.Video ?? '';
  }

  /* ── Helper: ضغط وتشفير الصورة لـ Base64 ── */
  async function compressAndEncodeImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  /* ── Helper: تحويل ملف فيديو/صوت لـ Base64 ── */
  function encodeFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  }

  /* ---- Elements ---- */
  const form               = document.getElementById('adminNewsForm');
  const titleInput         = document.getElementById('newsTitle');
  const contentInput       = document.getElementById('newsContent');
  const categoryInput      = document.getElementById('newsCategory');
  const videoLinkInput     = document.getElementById('newsVideo');
  const editIdInput        = document.getElementById('editNewsId');
  const submitBtn          = document.getElementById('submitBtn');
  const formTitleEl        = document.getElementById('formTitle');
  const cancelEditBtn      = document.getElementById('cancelEditBtn');

  const imageInput         = document.getElementById('newsImage');
  const imagePreview       = document.getElementById('imagePreview');
  const contentImageInput  = document.getElementById('newsContentImage');
  const contentImagePreview = document.getElementById('contentImagePreview');
  const videoFileInput     = document.getElementById('newsVideoFile');
  const videoFilePreview   = document.getElementById('videoFilePreview');
  const audioFileInput     = document.getElementById('newsAudioFile');
  const audioFilePreview   = document.getElementById('audioFilePreview');

  /* ── الحالة الداخلية (State) ── */
  let selectedImageFile        = null;
  let selectedContentImageFile = null;
  let selectedVideoFile        = null;
  let selectedAudioFile        = null;
  let savedImageUrl            = '';
  let savedContentImageUrl     = '';
  let savedVideoFileUrl        = '';
  let savedAudioFileUrl        = '';

  /* ---- اختيار صورة الغلاف ---- */
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    const url = URL.createObjectURL(file);
    document.getElementById('imageFileName').textContent = file.name;
    if (imagePreview) {
      imagePreview.innerHTML = `<img src="${url}" style="width:100px;border-radius:8px;margin-top:10px;">`;
      imagePreview.style.display = 'block';
    }
  });

  /* ---- اختيار صورة المحتوى ---- */
  contentImageInput?.addEventListener('change', () => {
    const file = contentImageInput.files[0];
    if (!file) return;
    selectedContentImageFile = file;
    const url = URL.createObjectURL(file);
    document.getElementById('contentImageFileName').textContent = file.name;
    if (contentImagePreview) {
      contentImagePreview.innerHTML = `<img src="${url}" style="width:100px;border-radius:8px;margin-top:10px;">`;
      contentImagePreview.style.display = 'block';
    }
  });

  /* ---- اختيار ملف الفيديو ---- */
  videoFileInput?.addEventListener('change', () => {
    const file = videoFileInput.files[0];
    if (!file) return;
    selectedVideoFile = file;
    const url = URL.createObjectURL(file);
    document.getElementById('videoFileName').textContent = file.name;
    if (videoFilePreview) {
      videoFilePreview.innerHTML = `<video src="${url}" controls style="width:100%;max-width:300px;margin-top:10px;border-radius:8px;"></video>`;
      videoFilePreview.style.display = 'block';
    }
  });

  /* ---- اختيار ملف الصوت ---- */
  audioFileInput?.addEventListener('change', () => {
    const file = audioFileInput.files[0];
    if (!file) return;
    selectedAudioFile = file;
    const url = URL.createObjectURL(file);
    document.getElementById('audioFileName').textContent = file.name;
    if (audioFilePreview) {
      audioFilePreview.innerHTML = `<audio src="${url}" controls style="width:100%;margin-top:10px;"></audio>`;
      audioFilePreview.style.display = 'block';
    }
  });

  /* ---- حفظ الخبر (إضافة أو تعديل) ---- */
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title    = titleInput.value.trim();
    const content  = contentInput.value.trim();
    const category = categoryInput.value;
    const videoUrl = videoLinkInput?.value.trim() || '';
    const id       = editIdInput.value;

    if (!title || !content || !category) {
      showToast('⚠️ يرجى ملء الحقول المطلوبة');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      let finalImageUrl       = savedImageUrl;
      let finalContentImageUrl = savedContentImageUrl;
      let finalVideoFileBase64 = null;
      let finalAudioFileBase64 = null;

      // ضغط صورة الغلاف إذا اختار المستخدم ملف جديد
      if (selectedImageFile) {
        showToast('⏳ جاري معالجة صورة الغلاف...');
        finalImageUrl = await compressAndEncodeImage(selectedImageFile, 800, 0.6);
      }

      // ضغط صورة المحتوى إذا اختار المستخدم ملف جديد
      if (selectedContentImageFile) {
        showToast('⏳ جاري معالجة صورة المحتوى...');
        finalContentImageUrl = await compressAndEncodeImage(selectedContentImageFile, 1000, 0.6);
      }

      // تحويل ملف الفيديو لـ Base64 إذا اختار المستخدم ملف جديد
      if (selectedVideoFile) {
        showToast('⏳ جاري معالجة ملف الفيديو...');
        finalVideoFileBase64 = await encodeFileToBase64(selectedVideoFile);
      }

      // تحويل ملف الصوت لـ Base64 إذا اختار المستخدم ملف جديد
      if (selectedAudioFile) {
        showToast('⏳ جاري معالجة الملف الصوتي...');
        finalAudioFileBase64 = await encodeFileToBase64(selectedAudioFile);
      }

      // ✅ بناء الكائن المتوافق مع الـ DTO في C# بعد التعديل
      const newsData = {
        title,
        content,
        category,
        image:        finalImageUrl,         // Base64 للصورة الرئيسية
        contentImage: finalContentImageUrl,  // Base64 لصورة المحتوى
        videoUrl:     videoUrl,              // ✅ رابط فيديو خارجي (كان video قبل كده)
        videoFile:    finalVideoFileBase64,  // Base64 لملف الفيديو
        audioFile:    finalAudioFileBase64,  // Base64 للصوت
      };

      if (id) {
        await window.MojazAPI.update(id, newsData);
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

  /* ---- إلغاء التعديل ---- */
  cancelEditBtn?.addEventListener('click', resetForm);

  /* ---- إعادة تعيين النموذج ---- */
  function resetForm() {
    form?.reset();
    editIdInput.value = '';
    selectedImageFile = selectedContentImageFile = selectedVideoFile = selectedAudioFile = null;
    savedImageUrl = savedContentImageUrl = savedVideoFileUrl = savedAudioFileUrl = '';

    if (imagePreview)        { imagePreview.style.display = 'none';        imagePreview.innerHTML = ''; }
    if (contentImagePreview) { contentImagePreview.style.display = 'none'; contentImagePreview.innerHTML = ''; }
    if (videoFilePreview)    { videoFilePreview.style.display = 'none';    videoFilePreview.innerHTML = ''; }
    if (audioFilePreview)    { audioFilePreview.style.display = 'none';    audioFilePreview.innerHTML = ''; }

    if (document.getElementById('imageFileName'))       document.getElementById('imageFileName').textContent = 'اختر صورة...';
    if (document.getElementById('contentImageFileName')) document.getElementById('contentImageFileName').textContent = 'اختر صورة للمحتوى...';
    if (document.getElementById('videoFileName'))        document.getElementById('videoFileName').textContent = 'اختر ملف فيديو...';
    if (document.getElementById('audioFileName'))        document.getElementById('audioFileName').textContent = 'اختر ملف صوتي...';

    if (formTitleEl) formTitleEl.textContent = 'إضافة خبر جديد';
    if (submitBtn)   submitBtn.textContent   = 'نشر الخبر';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
  }

  /* ---- عرض الأخبار في لوحة الإدارة ---- */
  async function renderNewsFeed() {
    const feedContainer = document.getElementById('adminNewsFeed');
    const newsCountEl   = document.getElementById('newsCount');
    const statTotalEl   = document.getElementById('statTotal');
    if (!feedContainer) return;

    try {
      const allNews = await window.MojazAPI.getAll();

      if (!allNews || allNews.length === 0) {
        feedContainer.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);">لا توجد أخبار منشورة بعد.</p>';
        if (newsCountEl) newsCountEl.textContent = '0 خبر';
        if (statTotalEl) statTotalEl.textContent = '0';
        return;
      }

      if (newsCountEl) newsCountEl.textContent = `${allNews.length} خبر`;
      if (statTotalEl) statTotalEl.textContent  = allNews.length;

      feedContainer.innerHTML = allNews.map(item => {
        const newsId    = getItemId(item);
        const imgUrl    = getImageUrl(item);
        const title     = item.title || item.Title || 'بدون عنوان';
        const category  = item.category || item.Category || '';
        const createdAt = item.createdAt || item.CreatedAt || '';

        return `
          <div class="admin-news-item" style="
            display:flex;justify-content:space-between;align-items:center;
            padding:12px 16px;border-bottom:1px solid var(--border);gap:12px;
          ">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
              ${imgUrl
                ? `<img src="${imgUrl}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0;" loading="lazy">`
                : `<div style="width:56px;height:56px;border-radius:8px;background:var(--border);flex-shrink:0;"></div>`
              }
              <div style="min-width:0;">
                <strong style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</strong>
                <small style="color:var(--text-muted);">
                  ${category} | ${createdAt ? new Date(createdAt).toLocaleDateString('ar-EG') : ''}
                </small>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0;">
              <button onclick="editNews('${newsId}')"
                style="background:#4361ee;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:.82rem;">
                تعديل
              </button>
              <button onclick="deleteNews('${newsId}')"
                style="background:#e63946;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:.82rem;">
                حذف
              </button>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('renderNewsFeed error:', err);
      feedContainer.innerHTML = '<p style="color:red;text-align:center;padding:20px;">خطأ في تحميل الأخبار.</p>';
    }
  }

  /* ---- حذف خبر ---- */
  window.deleteNews = async (id) => {
    if (!id || id === 'null' || id === 'undefined') {
      showToast('❌ معرّف الخبر غير صالح');
      return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
      await window.MojazAPI.remove(id);
      showToast('🗑️ تم الحذف بنجاح');
      renderNewsFeed();
    } catch (err) {
      showToast('❌ فشل الحذف: ' + err.message);
    }
  };

  /* ---- تعديل خبر ---- */
  window.editNews = async (id) => {
    if (!id || id === 'null' || id === 'undefined') {
      showToast('❌ معرّف الخبر غير صالح');
      return;
    }
    try {
      const news = await window.MojazAPI.getById(id);
      if (!news) return;

      const newsId = getItemId(news);

      // ملء النموذج ببيانات الخبر
      editIdInput.value      = newsId;
      titleInput.value       = news.title    || news.Title    || '';
      contentInput.value     = news.content  || news.Content  || '';
      categoryInput.value    = news.category || news.Category || '';

      // ✅ قراءة VideoUrl بشكل صحيح
      if (videoLinkInput) videoLinkInput.value = getVideoUrl(news);

      // حفظ الـ URLs القديمة
      savedImageUrl        = getImageUrl(news);
      savedContentImageUrl = news.contentImage || news.ContentImage || '';
      savedVideoFileUrl    = news.videoFile    || news.VideoFile    || '';
      savedAudioFileUrl    = news.audioFile    || news.AudioFile    || '';

      if (formTitleEl)   formTitleEl.textContent   = 'تعديل الخبر';
      if (submitBtn)     submitBtn.textContent      = 'تحديث الخبر';
      if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';

      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('📝 تم تحميل بيانات الخبر للتعديل');

    } catch (err) {
      console.error('editNews error:', err);
      showToast('❌ خطأ في جلب بيانات الخبر');
    }
  };

  /* ---- تشغيل القائمة عند التحميل ---- */
  document.addEventListener('DOMContentLoaded', renderNewsFeed);

})();
