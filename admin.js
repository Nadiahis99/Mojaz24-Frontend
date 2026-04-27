/**
 * مُوجز 24 — Admin News Builder (Base64 + API Version)
 * هذا الملف يربط واجهة الإدارة بالسيرفر عبر MojazAPI
 */

(function () {
  /* ── Helper: استخراج الـ ID بأمان من أي كائن ── */
  function getItemId(item) {
    // يجرب كل الأسماء المحتملة للـ ID القادمة من الـ Backend
    return item?.id ?? item?.Id ?? item?._id ?? item?.newsId ?? item?.NewsId ?? null;
  }

  /* ── Helper Functions: معالجة وضغط الصور ── */
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

          // تحويل لـ Base64 بصيغة JPEG لتقليل الحجم جداً لـ MongoDB
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /* ---- Elements (العناصر) ---- */
  const form            = document.getElementById('adminNewsForm');
  const titleInput      = document.getElementById('newsTitle');
  const contentInput    = document.getElementById('newsContent');
  const categoryInput   = document.getElementById('newsCategory');
  const videoLinkInput  = document.getElementById('newsVideo'); 
  const editIdInput     = document.getElementById('editNewsId');
  const submitBtn       = document.getElementById('submitBtn');
  const formTitleEl     = document.getElementById('formTitle');
  
  const imageInput      = document.getElementById('newsImage');
  const imagePreview    = document.getElementById('imagePreview');
  const contentImageInput = document.getElementById('newsContentImage');
  const contentImagePreview = document.getElementById('contentImagePreview');

  /* ── الحالة الداخلية (State) ── */
  let selectedImageFile        = null;
  let selectedContentImageFile = null;
  let savedImageUrl            = ''; // لحفظ الصورة القديمة عند التعديل
  let savedContentImageUrl     = '';

  /* ---- اختيار الصور ومعاينتها ---- */
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    const url = URL.createObjectURL(file);
    if (imagePreview) {
      imagePreview.innerHTML = `<img src="${url}" style="width:100px; border-radius:8px; margin-top:10px;">`;
      imagePreview.style.display = 'block';
    }
  });

  contentImageInput?.addEventListener('change', () => {
    const file = contentImageInput.files[0];
    if (!file) return;
    selectedContentImageFile = file;
    const url = URL.createObjectURL(file);
    if (contentImagePreview) {
      contentImagePreview.innerHTML = `<img src="${url}" style="width:100px; border-radius:8px; margin-top:10px;">`;
      contentImagePreview.style.display = 'block';
    }
  });

  /* ---- حفظ الخبر (إضافة أو تعديل) ---- */
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

      // ضغط صورة الغلاف إذا تم اختيار ملف جديد
      if (selectedImageFile) {
        showToast('⏳ جاري معالجة صورة الغلاف...');
        finalImageUrl = await compressAndEncodeImage(selectedImageFile, 800, 0.6);
      }

      // ضغط صورة المحتوى إذا تم اختيار ملف جديد
      if (selectedContentImageFile) {
        showToast('⏳ جاري معالجة صورة المحتوى...');
        finalContentImageUrl = await compressAndEncodeImage(selectedContentImageFile, 1000, 0.6);
      }

      // بناء الكائن المتوافق مع الـ DTO في C#
      const newsData = {
        title,
        content,
        category,
        image: finalImageUrl,        // Base64 String
        contentImage: finalContentImageUrl,
        video: video                 // رابط يوتيوب
      };

      if (id) {
        // تحديث خبر موجود
        await window.MojazAPI.update(id, newsData);
        showToast('✅ تم تحديث الخبر بنجاح');
      } else {
        // إضافة خبر جديد
        await window.MojazAPI.add(newsData);
        showToast('✅ تم نشر الخبر بنجاح');
      }

      resetForm();
      // تحديث القائمة المعروضة في لوحة الإدارة
      renderNewsFeed();
      
    } catch (error) {
      console.error("Submission Error:", error);
      showToast('❌ خطأ: ' + error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  /* ---- وظائف الواجهة (UI) ---- */
  function resetForm() {
    form?.reset();
    editIdInput.value = '';
    selectedImageFile = selectedContentImageFile = null;
    savedImageUrl = savedContentImageUrl = '';
    if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.innerHTML = ''; }
    if (contentImagePreview) { contentImagePreview.style.display = 'none'; contentImagePreview.innerHTML = ''; }
    if (formTitleEl) formTitleEl.textContent = 'إضافة خبر جديد';
    if (submitBtn) submitBtn.textContent = 'نشر الخبر';
  }

  // دالة لجلب الأخبار وعرضها في لوحة الإدارة (Admin Feed)
  async function renderNewsFeed() {
    const feedContainer = document.getElementById('adminNewsFeed');
    if (!feedContainer) return;

    try {
      const allNews = await window.MojazAPI.getAll();

      // 🔍 للتشخيص فقط — احذف هذا السطر بعد التأكد من الاسم الصح
      if (allNews && allNews.length > 0) {
        console.log("🔑 مفاتيح الخبر من الـ Backend:", Object.keys(allNews[0]));
      }

      if (!allNews || allNews.length === 0) {
        feedContainer.innerHTML = '<p style="text-align:center; padding:20px;">لا توجد أخبار منشورة بعد.</p>';
        return;
      }

      feedContainer.innerHTML = allNews.map(item => {
        // ✅ استخدام getItemId بدل item.id || item._id مباشرة
        const newsId = getItemId(item);

        if (!newsId) {
          console.warn("⚠️ خبر بدون ID:", item);
        }

        return `
          <div class="admin-news-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
            <div>
              <strong style="display:block;">${item.title}</strong>
              <small style="color:#666;">${item.category} | ${new Date(item.createdAt).toLocaleDateString('ar-EG')}</small>
            </div>
            <div style="display:flex; gap:10px;">
              <button onclick="editNews('${newsId}')" class="btn-edit" style="background:#4361ee; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تعديل</button>
              <button onclick="deleteNews('${newsId}')" class="btn-delete" style="background:#e63946; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">حذف</button>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error("renderNewsFeed error:", err);
      feedContainer.innerHTML = '<p style="color:red;">خطأ في تحميل الأخبار.</p>';
    }
  }

  // جعل دالة الحذف والتعديل متاحة عالمياً للأزرار
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

  window.editNews = async (id) => {
    if (!id || id === 'null' || id === 'undefined') {
      showToast('❌ معرّف الخبر غير صالح');
      return;
    }
    try {
      const news = await window.MojazAPI.getById(id);
      if (!news) return;

      // ✅ استخدام getItemId بدل news.id || news._id مباشرة
      const newsId = getItemId(news);

      // ملء النموذج ببيانات الخبر
      editIdInput.value = newsId;
      titleInput.value = news.title;
      contentInput.value = news.content;
      categoryInput.value = news.category;
      videoLinkInput.value = news.video || '';
      
      // حفظ الصور القديمة في حال لم يغيرها المستخدم
      savedImageUrl = news.image || '';
      savedContentImageUrl = news.contentImage || '';

      if (formTitleEl) formTitleEl.textContent = 'تعديل الخبر';
      if (submitBtn) submitBtn.textContent = 'تحديث الخبر';
      
      // التمرير لأعلى النموذج
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('📝 تم تحميل بيانات الخبر للتعديل');
    } catch (err) {
      console.error("editNews error:", err);
      showToast('❌ خطأ في جلب بيانات الخبر');
    }
  };

  // تشغيل القائمة عند التحميل
  document.addEventListener('DOMContentLoaded', renderNewsFeed);

})();
