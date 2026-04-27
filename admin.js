/**
 * مُوجز 24 — Admin News Builder (Base64 + Compression Version)
 */

(function () {
  /* ── Helper Functions: معالجة الصور ── */

  // دالة لضغط الصورة وتحويلها لـ Base64
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

          // تصغير الأبعاد إذا كانت أكبر من الحد المسموح
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // تحويل لـ Base64 بصيغة JPEG لتقليل الحجم جداً
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /* ---- Elements ---- */
  const form          = document.getElementById('adminNewsForm');
  const titleInput    = document.getElementById('newsTitle');
  const contentInput  = document.getElementById('newsContent');
  const categoryInput = document.getElementById('newsCategory');
  const videoLinkInput = document.getElementById('newsVideo'); 
  const editIdInput    = document.getElementById('editNewsId');
  const submitBtn      = document.getElementById('submitBtn');
  const formTitleEl   = document.getElementById('formTitle');
  
  // Inputs & Previews
  const imageInput    = document.getElementById('newsImage');
  const imagePreview  = document.getElementById('imagePreview');
  const contentImageInput = document.getElementById('newsContentImage');
  const contentImagePreview = document.getElementById('contentImagePreview');

  /* ── الملفات المختارة ── */
  let selectedImageFile        = null;
  let selectedContentImageFile = null;

  /* ── الـ Base64 المحفوظ عند التعديل ── */
  let savedImageUrl        = '';
  let savedContentImageUrl = '';

  /* ---- Handlers for File Selection ---- */
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    const url = URL.createObjectURL(file);
    if (imagePreview) {
      imagePreview.innerHTML = `<img src="${url}" style="width:100px; border-radius:8px;">`;
      imagePreview.style.display = 'block';
    }
  });

  contentImageInput?.addEventListener('change', () => {
    const file = contentImageInput.files[0];
    if (!file) return;
    selectedContentImageFile = file;
    const url = URL.createObjectURL(file);
    if (contentImagePreview) {
      contentImagePreview.innerHTML = `<img src="${url}" style="width:100px; border-radius:8px;">`;
      contentImagePreview.style.display = 'block';
    }
  });

  /* ---- Form Submit (Add / Edit) ---- */
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title    = titleInput.value.trim();
    const content  = contentInput.value.trim();
    const category = categoryInput.value;
    const video    = videoLinkInput.value.trim();
    const id       = editIdInput.value;

    if (!title || !content || !category) {
      showToast('⚠️ يرجى ملء الحقول المطلوبة');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      let finalImageUrl = savedImageUrl;
      let finalContentImageUrl = savedContentImageUrl;

      // معالجة صورة الغلاف (ضغط وتحويل)
      if (selectedImageFile) {
        showToast('⏳ جاري ضغط صورة الغلاف...');
        finalImageUrl = await compressAndEncodeImage(selectedImageFile, 800, 0.6);
      }

      // معالجة صورة المحتوى
      if (selectedContentImageFile) {
        showToast('⏳ جاري ضغط صورة المحتوى...');
        finalContentImageUrl = await compressAndEncodeImage(selectedContentImageFile, 1000, 0.6);
      }

      const newsData = {
        title,
        content,
        category,
        image: finalImageUrl,        // سيرسل كـ Base64 String
        contentImage: finalContentImageUrl,
        video: video                 // رابط يوتيوب كما هو
      };

      if (id) {
        await MojazNewsStore.update(id, newsData);
        showToast('✅ تم تحديث الخبر');
      } else {
        await MojazNewsStore.add(newsData);
        showToast('✅ تم نشر الخبر بنجاح');
      }

      resetForm();
      renderAll();
    } catch (error) {
      // هنا سيظهر لكِ الخطأ الحقيقي إذا كان الـ Backend يرفض البيانات
      console.error("Submission Error:", error);
      showToast('❌ خطأ في السيرفر: ' + error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  /* ---- UI Functions ---- */
  function resetForm() {
    form?.reset();
    editIdInput.value = '';
    selectedImageFile = selectedContentImageFile = null;
    savedImageUrl = savedContentImageUrl = '';
    if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.innerHTML = ''; }
    if (contentImagePreview) { contentImagePreview.style.display = 'none'; contentImagePreview.innerHTML = ''; }
    if (formTitleEl) formTitleEl.textContent = 'إضافة خبر جديد';
  }

  function renderAll() {
    if (typeof renderStats === 'function') renderStats();
    if (typeof renderNewsFeed === 'function') renderNewsFeed();
  }

  // تهيئة
  MojazNewsStore.ready().then(renderAll);
  window.addEventListener(MojazNewsStore.UPDATE_EVENT, renderAll);

})();
