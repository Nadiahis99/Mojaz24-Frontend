/**
 * مُوجز 24 — Admin News Builder
 * Manages: add, edit, delete news via localStorage
 */

(function () {
  /* ── Cloudinary Config ── */
  // تأكدي أن هذا الـ Preset مضبوط على Unsigned في إعدادات Cloudinary
  const CLOUD_NAME   = 'drbpdgp4c';
  const IMAGE_PRESET = 'mojaz24_images';
  const CLOUD_BASE   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

  async function uploadToCloudinary(file, type = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', IMAGE_PRESET);
    
    // تنظيم المجلدات بناءً على النوع
    const folder = `mojaz24/${type}s`;
    formData.append('folder', folder);

    // تحديد الـ endpoint الصحيح: 
    // Cloudinary يعالج الصوت (Audio) ضمن مسار الـ 'video'
    const endpoint = (type === 'video' || type === 'audio') ? 'video' : 'image';

    const res = await fetch(`${CLOUD_BASE}/${endpoint}/upload`, { 
      method: 'POST', 
      body: formData 
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Cloudinary Error:', err); // لعرض تفاصيل الخطأ في الـ Console
      throw new Error(err?.error?.message || 'فشل رفع الملف على Cloudinary');
    }

    const data = await res.json();
    return data.secure_url;
  }

  /* ---- Elements ---- */
  const form          = document.getElementById('adminNewsForm');
  const titleInput    = document.getElementById('newsTitle');
  const contentInput  = document.getElementById('newsContent');
  const categoryInput = document.getElementById('newsCategory');
  const videoInput    = document.getElementById('newsVideo'); // YouTube Link
  const editIdInput    = document.getElementById('editNewsId');
  const submitBtn      = document.getElementById('submitBtn');
  const cancelBtn      = document.getElementById('cancelEditBtn');
  const formTitleEl   = document.getElementById('formTitle');
  const newsFeed       = document.getElementById('adminNewsFeed');
  const filterSelect   = document.getElementById('filterCategory');
  
  // Previews
  const imageInput    = document.getElementById('newsImage');
  const imagePreview  = document.getElementById('imagePreview');
  const imageFileName = document.getElementById('imageFileName');

  const contentImageInput    = document.getElementById('newsContentImage');
  const contentImagePreview  = document.getElementById('contentImagePreview');
  const contentImageFileName = document.getElementById('contentImageFileName');

  const videoFileInput       = document.getElementById('newsVideoFile');
  const videoFilePreview      = document.getElementById('videoFilePreview');
  const videoFileNameEl       = document.getElementById('videoFileName');

  const audioFileInput    = document.getElementById('newsAudioFile');
  const audioFileNameEl   = document.getElementById('audioFileName');
  const audioFilePreview  = document.getElementById('audioFilePreview');

  // Recording elements
  const startRecordBtn        = document.getElementById('startRecordBtn');
  const stopRecordBtn         = document.getElementById('stopRecordBtn');
  const recordTimerEl         = document.getElementById('recordTimer');
  const recordPreviewEl       = document.getElementById('recordPreview');
  const recordedVideoPreview  = document.getElementById('recordedVideoPreview');
  const clearRecordBtn        = document.getElementById('clearRecordBtn');

  /* ── الملفات المختارة ── */
  let selectedImageFile        = null;
  let selectedContentImageFile = null;
  let selectedVideoFile        = null;
  let selectedAudioFile        = null;
  let recordedVideoBlob        = null;

  /* ── الـ URLs المحفوظة عند التعديل ── */
  let savedImageUrl        = '';
  let savedContentImageUrl = '';
  let savedVideoUrl        = '';
  let savedAudioUrl        = '';

  // Recording state
  let mediaRecorder = null;
  let activeRecordStream = null;
  let recordedChunks = [];
  let recordTimerInterval = null;
  let recordSeconds = 0;
  let suppressRecordSave = false;

  function getNewsId(news) { return news?._id || news?.id || ''; }
  function getImageUrl(news) { return news?.imageUrl || news?.image || ''; }
  function getContentImageUrl(news) { return news?.contentImage || ''; }
  function getVideoFileUrl(news) { return news?.videoUrl || news?.videoFile || ''; }
  function getAudioFileUrl(news) { return news?.audioFile || ''; }

  /* ---- Handlers for File Selection ---- */
  imageInput?.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    imageFileName.textContent = file.name;
    const url = URL.createObjectURL(file);
    if (imagePreview) {
      imagePreview.innerHTML = `<img src="${url}" alt="preview">`;
      imagePreview.style.display = 'block';
    }
  });

  contentImageInput?.addEventListener('change', () => {
    const file = contentImageInput.files[0];
    if (!file) return;
    selectedContentImageFile = file;
    if (contentImageFileName) contentImageFileName.textContent = file.name;
    const url = URL.createObjectURL(file);
    if (contentImagePreview) {
      contentImagePreview.innerHTML = `<img src="${url}" alt="preview" style="width:100%;max-height:160px;object-fit:cover;border-radius:var(--radius);">`;
      contentImagePreview.style.display = 'block';
    }
  });

  videoFileInput?.addEventListener('change', () => {
    const file = videoFileInput.files[0];
    if (!file) return;
    selectedVideoFile = file;
    recordedVideoBlob = null;
    if (videoFileNameEl) videoFileNameEl.textContent = file.name;
    clearRecording({ preserveVideoData: true });
    const url = URL.createObjectURL(file);
    if (videoFilePreview) {
      videoFilePreview.innerHTML = `<video src="${url}" controls style="width:100%;max-height:180px;border-radius:var(--radius);background:#000;"></video>`;
      videoFilePreview.style.display = 'block';
    }
  });

  audioFileInput?.addEventListener('change', () => {
    const file = audioFileInput.files[0];
    if (!file) return;
    selectedAudioFile = file;
    if (audioFileNameEl) audioFileNameEl.textContent = file.name;
    const url = URL.createObjectURL(file);
    if (audioFilePreview) {
      audioFilePreview.innerHTML = `
          <audio controls style="width:100%;margin-top:8px;border-radius:8px;">
            <source src="${url}" type="${file.type}">
          </audio>
          <p style="font-size:12px;color:#888;margin:4px 0 0;">${file.name}</p>`;
      audioFilePreview.style.display = 'block';
    }
  });

  /* ---- Video Recording Logic ---- */
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
        if (suppressRecordSave) { suppressRecordSave = false; return; }
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        recordedVideoBlob = blob;
        selectedVideoFile = null;
        const url = URL.createObjectURL(blob);
        if (videoFilePreview) {
          videoFilePreview.innerHTML = `<video src="${url}" controls style="width:100%;max-height:180px;border-radius:var(--radius);background:#000;"></video>`;
          videoFilePreview.style.display = 'block';
        }
        if (recordPreviewEl) recordPreviewEl.style.display = 'none';
        if (recordedVideoPreview) { recordedVideoPreview.src = url; recordedVideoPreview.style.display = 'block'; }
        if (clearRecordBtn) clearRecordBtn.style.display = 'inline-flex';
        stopRecordTimer();
        if (startRecordBtn) startRecordBtn.style.display = 'inline-flex';
        if (stopRecordBtn) stopRecordBtn.style.display = 'none';
      };
      if (recordPreviewEl) { recordPreviewEl.srcObject = stream; recordPreviewEl.style.display = 'block'; }
      mediaRecorder.start();
      startRecordTimer();
      if (startRecordBtn) startRecordBtn.style.display = 'none';
      if (stopRecordBtn) stopRecordBtn.style.display = 'inline-flex';
    } catch (err) {
      showToast('⚠️ تعذّر الوصول إلى الكاميرا');
    }
  });

  stopRecordBtn?.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
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
    if (recordTimerEl) { recordTimerEl.style.display = 'none'; recordTimerEl.textContent = '00:00'; }
  }

  function clearRecording(options = {}) {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      suppressRecordSave = true;
      mediaRecorder.stop();
    }
    stopRecordTimer();
    if (!options.preserveVideoData) { recordedVideoBlob = null; selectedVideoFile = null; }
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

    if (submitBtn) submitBtn.disabled = true;

    try {
      let imageUrl        = savedImageUrl;
      let contentImageUrl = savedContentImageUrl;
      let videoFileUrl    = savedVideoUrl;
      let audioFileUrl    = savedAudioUrl;

      // رفع الصور
      if (selectedImageFile) {
        showToast('⏳ جاري رفع صورة الغلاف...');
        imageUrl = await uploadToCloudinary(selectedImageFile, 'image');
      }
      if (selectedContentImageFile) {
        showToast('⏳ جاري رفع صورة المحتوى...');
        contentImageUrl = await uploadToCloudinary(selectedContentImageFile, 'image');
      }
      
      // رفع الفيديو
      if (selectedVideoFile) {
        showToast('⏳ جاري رفع الفيديو...');
        videoFileUrl = await uploadToCloudinary(selectedVideoFile, 'video');
      } else if (recordedVideoBlob) {
        showToast('⏳ جاري رفع التسجيل...');
        const file = new File([recordedVideoBlob], 'recorded.webm', { type: 'video/webm' });
        videoFileUrl = await uploadToCloudinary(file, 'video');
      }

      // رفع الصوت
      if (selectedAudioFile) {
        showToast('⏳ جاري رفع الصوت...');
        audioFileUrl = await uploadToCloudinary(selectedAudioFile, 'audio');
      }

      const newsData = {
        title, content, category,
        image: imageUrl,
        contentImage: contentImageUrl,
        video,
        videoFile: videoFileUrl,
        audioFile: audioFileUrl
      };

      if (id) {
        await MojazNewsStore.update(id, newsData);
        showToast('✅ تم تحديث الخبر بنجاح');
      } else {
        await MojazNewsStore.add(newsData);
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

  /* ---- UI Functions ---- */
  function resetForm() {
    form?.reset();
    editIdInput.value = '';
    selectedImageFile = selectedContentImageFile = selectedVideoFile = selectedAudioFile = recordedVideoBlob = null;
    savedImageUrl = savedContentImageUrl = savedVideoUrl = savedAudioUrl = '';
    if (imagePreview) { imagePreview.innerHTML = ''; imagePreview.style.display = 'none'; }
    if (contentImagePreview) { contentImagePreview.innerHTML = ''; contentImagePreview.style.display = 'none'; }
    if (audioFilePreview) { audioFilePreview.innerHTML = ''; audioFilePreview.style.display = 'none'; }
    if (videoFilePreview) { videoFilePreview.innerHTML = ''; videoFilePreview.style.display = 'none'; }
    if (formTitleEl) formTitleEl.textContent = 'إضافة خبر جديد';
  }

  function renderAll() {
    // افترضي وجود دوال RenderStats و RenderNewsFeed لديكِ مسبقاً
    if (typeof renderStats === 'function') renderStats();
    if (typeof renderNewsFeed === 'function') renderNewsFeed();
  }

  // تهيئة أولية
  renderAll();
  MojazNewsStore.ready().then(renderAll);
  window.addEventListener(MojazNewsStore.UPDATE_EVENT, renderAll);

})();
