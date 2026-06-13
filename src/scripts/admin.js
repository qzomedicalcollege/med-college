/* 
   admin.js
   Kyzylorda Higher Medical College Website - Admin Panel Controller (Firebase v8)
   Coordinates Firebase Authentication session checks, Cloud Firestore CRUD,
   client-side image/file compression, and 3-language dynamic content editing (RU/KK/EN).
*/

// Global datasets loaded from Firestore
let currentNews = [];
let currentSpecialties = [];
let currentMessages = [];
let currentDocuments = [];
let activeTab = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof auth === 'undefined' || typeof db === 'undefined') {
    console.warn("Firebase auth/db globals are not initialized yet.");
    return;
  }

  // --- 1. AUTH STATE OBSERVER ---
  auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');

    if (user) {
      if (loginScreen) loginScreen.style.display = 'none';
      if (adminPanel) adminPanel.style.display = 'grid';
      console.log("Admin logged in:", user.email);
      switchTab(activeTab);
    } else {
      if (loginScreen) loginScreen.style.display = 'flex';
      if (adminPanel) adminPanel.style.display = 'none';
    }
  });

  // Login Submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-user').value.trim();
      const pass = document.getElementById('login-pass').value.trim();
      const errorMsg = document.getElementById('login-error');

      try {
        await auth.signInWithEmailAndPassword(email, pass);
        errorMsg.style.display = 'none';
        loginForm.reset();
      } catch (error) {
        console.error("Login failed:", error);
        errorMsg.style.display = 'block';
      }
    });
  }

  // Logout Trigger
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        location.reload();
      } catch (error) {
        console.error("Logout failed:", error);
      }
    });
  }

  // Tab switcher
  const menuItems = document.querySelectorAll('.admin-menu-item[data-tab]');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const tabId = item.getAttribute('data-tab');
      activeTab = tabId;
      switchTab(tabId);
    });
  });

  // Settings form submit
  const settingsForm = document.getElementById('admin-settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const address_ru = document.getElementById('set-address-ru').value.trim();
      const dirName_ru = document.getElementById('set-dir-name-ru').value.trim();
      const dirSpeech_ru = document.getElementById('set-dir-speech-ru').value.trim();

      const updated = {
        phone: document.getElementById('set-phone').value.trim(),
        email: document.getElementById('set-email').value.trim(),
        smartnation: document.getElementById('set-smartnation').value.trim(),
        instagram: document.getElementById('set-insta').value.trim(),
        facebook: document.getElementById('set-fb').value.trim(),
        youtube: document.getElementById('set-youtube').value.trim(),

        name_ru: "Кызылординский высший медицинский колледж",
        name_kk: "Қызылорда жоғары медициналық колледжі",
        name_en: "Kyzylorda Higher Medical College",

        address_ru: address_ru,
        address_kk: document.getElementById('set-address-kk').value.trim() || address_ru,
        address_en: document.getElementById('set-address-en').value.trim() || address_ru,

        directorName_ru: dirName_ru,
        directorName_kk: document.getElementById('set-dir-name-kk').value.trim() || dirName_ru,
        directorName_en: document.getElementById('set-dir-name-en').value.trim() || dirName_ru,

        directorSpeech_ru: dirSpeech_ru,
        directorSpeech_kk: document.getElementById('set-dir-speech-kk').value.trim() || dirSpeech_ru,
        directorSpeech_en: document.getElementById('set-dir-speech-en').value.trim() || dirSpeech_ru
      };

      try {
        await db.collection("settings").doc("general").set(updated);
        localStorage.setItem("college_settings", JSON.stringify(updated));
        alert('Глобальные настройки сайта успешно обновлены в Firestore!');
        if (window.renderGlobalSettings) window.renderGlobalSettings();
      } catch (error) {
        console.error("Failed to save settings:", error);
        alert("Ошибка сохранения настроек.");
      }
    });
  }

  // News save/edit form submit
  const newsForm = document.getElementById('admin-news-form');
  if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idVal = document.getElementById('news-edit-id').value;
      const category = document.getElementById('news-category').value;
      const date = document.getElementById('news-date').value;
      const fileInput = document.getElementById('news-image-file');
      
      let base64Image = document.getElementById('news-image-base64').value;

      const title_ru = document.getElementById('news-title-ru').value.trim();
      const title_kk = document.getElementById('news-title-kk').value.trim() || title_ru;
      const title_en = document.getElementById('news-title-en').value.trim() || title_ru;

      const shortText_ru = document.getElementById('news-short-ru').value.trim();
      const shortText_kk = document.getElementById('news-short-kk').value.trim() || shortText_ru;
      const shortText_en = document.getElementById('news-short-en').value.trim() || shortText_ru;

      const fullText_ru = document.getElementById('news-full-ru').value.trim();
      const fullText_kk = document.getElementById('news-full-kk').value.trim() || fullText_ru;
      const fullText_en = document.getElementById('news-full-en').value.trim() || fullText_ru;

      try {
        if (fileInput.files && fileInput.files[0]) {
          base64Image = await compressImageFile(fileInput.files[0]);
        }

        const id = idVal ? parseInt(idVal) : Date.now();
        const newsObj = {
          id,
          category,
          date,
          image: base64Image,
          
          title_ru, title_kk, title_en,
          shortText_ru, shortText_kk, shortText_en,
          fullText_ru, fullText_kk, fullText_en
        };

        await db.collection("news").doc(String(id)).set(newsObj);
        closeNewsAdminModal();
        switchTab('news');
      } catch (error) {
        console.error("Failed to save news doc:", error);
        alert("Ошибка сохранения новости.");
      }
    });
  }

  // Specialties save/edit form submit
  const specForm = document.getElementById('admin-spec-form');
  if (specForm) {
    specForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idVal = document.getElementById('spec-edit-id').value;

      const name_ru = document.getElementById('spec-name-ru').value.trim();
      const name_kk = document.getElementById('spec-name-kk').value.trim() || name_ru;
      const name_en = document.getElementById('spec-name-en').value.trim() || name_ru;

      const qualification_ru = document.getElementById('spec-qual-ru').value.trim();
      const qualification_kk = document.getElementById('spec-qual-kk').value.trim() || qualification_ru;
      const qualification_en = document.getElementById('spec-qual-en').value.trim() || qualification_ru;

      const baseClass_ru = document.getElementById('spec-base-ru').value.trim();
      const baseClass_kk = document.getElementById('spec-base-kk').value.trim() || baseClass_ru;
      const baseClass_en = document.getElementById('spec-base-en').value.trim() || baseClass_ru;

      const duration_ru = document.getElementById('spec-duration-ru').value.trim();
      const duration_kk = document.getElementById('spec-duration-kk').value.trim() || duration_ru;
      const duration_en = document.getElementById('spec-duration-en').value.trim() || duration_ru;

      const description_ru = document.getElementById('spec-desc-ru').value.trim();
      const description_kk = document.getElementById('spec-desc-kk').value.trim() || description_ru;
      const description_en = document.getElementById('spec-desc-en').value.trim() || description_ru;

      const details_ru = document.getElementById('spec-details-ru').value.trim();
      const details_kk = document.getElementById('spec-details-kk').value.trim() || details_ru;
      const details_en = document.getElementById('spec-details-en').value.trim() || details_ru;

      const subjects_ru = document.getElementById('spec-subjects-ru').value.trim();
      const subjects_kk = document.getElementById('spec-subjects-kk').value.trim() || subjects_ru;
      const subjects_en = document.getElementById('spec-subjects-en').value.trim() || subjects_ru;

      try {
        const id = idVal ? parseInt(idVal) : Date.now();
        const specObj = {
          id,
          name_ru, name_kk, name_en,
          qualification_ru, qualification_kk, qualification_en,
          baseClass_ru, baseClass_kk, baseClass_en,
          duration_ru, duration_kk, duration_en,
          description_ru, description_kk, description_en,
          details_ru, details_kk, details_en,
          subjects_ru, subjects_kk, subjects_en
        };

        await db.collection("specialties").doc(String(id)).set(specObj);
        closeSpecAdminModal();
        switchTab('specialties');
      } catch (error) {
        console.error("Failed to save specialty doc:", error);
        alert("Ошибка сохранения специальности.");
      }
    });
  }

  // Documents save form submit
  const docForm = document.getElementById('admin-doc-form');
  if (docForm) {
    docForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idVal = document.getElementById('doc-edit-id').value;
      const category = document.getElementById('doc-category').value;
      const fileInput = document.getElementById('doc-file-input');

      const name_ru = document.getElementById('doc-name-ru').value.trim();
      const name_kk = document.getElementById('doc-name-kk').value.trim() || name_ru;
      const name_en = document.getElementById('doc-name-en').value.trim() || name_ru;

      let fileData = document.getElementById('doc-file-base64').value;
      let fileName = document.getElementById('doc-file-name').value;
      let fileType = document.getElementById('doc-file-type').value;

      try {
        if (fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          // Check size limit: 1 MB
          if (file.size > 1024 * 1024) {
            alert("Файл слишком большой! Максимальный размер файла — 1 МБ.");
            return;
          }

          fileName = file.name;
          fileType = file.type || 'application/octet-stream';
          fileData = await readFileAsBase64(file);
        }

        if (!fileData) {
          alert("Пожалуйста, выберите файл для загрузки.");
          return;
        }

        const id = idVal ? parseInt(idVal) : Date.now();
        const docObj = {
          id,
          category,
          fileName,
          fileType,
          fileData,
          name_ru, name_kk, name_en
        };

        // Save to Firestore
        await db.collection("documents").doc(String(id)).set(docObj);
        closeDocAdminModal();
        switchTab('documents');
      } catch (error) {
        console.error("Failed to save document:", error);
        alert("Ошибка сохранения документа.");
      }
    });
  }
});

// Reset tabs visibility inside modal dialogs
function resetFormTabs(prefix) {
  const contents = document.querySelectorAll(`.${prefix}-tab-content`);
  contents.forEach((c, idx) => {
    if (idx === 0) c.classList.add('active');
    else c.classList.remove('active');
  });

  const tabHeaderBtns = document.querySelectorAll(`button[onclick^="switch${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Tab"]`);
  tabHeaderBtns.forEach((b, idx) => {
    if (idx === 0) b.classList.add('active');
    else b.classList.remove('active');
  });
}

// Coordinate screen visibility
async function switchTab(tabId) {
  const contents = document.querySelectorAll('.admin-tab-content');
  contents.forEach(c => c.style.display = 'none');

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (activeContent) activeContent.style.display = 'block';

  const tabTitle = document.getElementById('admin-tab-title');
  if (tabTitle) {
    switch(tabId) {
      case 'dashboard': tabTitle.textContent = 'Панель управления'; break;
      case 'news': tabTitle.textContent = 'Управление новостями'; break;
      case 'specialties': tabTitle.textContent = 'Управление специальностями'; break;
      case 'messages': tabTitle.textContent = 'Входящие обращения'; break;
      case 'documents': tabTitle.textContent = 'Управление документами'; break;
      case 'settings': tabTitle.textContent = 'Глобальные настройки колледжа'; break;
    }
  }

  // Load data dynamically
  if (tabId === 'dashboard') await loadDashboardData();
  else if (tabId === 'news') await loadNewsData();
  else if (tabId === 'specialties') await loadSpecialtiesData();
  else if (tabId === 'messages') await loadMessagesData();
  else if (tabId === 'documents') await loadDocumentsData();
  else if (tabId === 'settings') await populateSettingsForm();
}

// --- DATA READERS FROM CLOUD ---
async function loadDashboardData() {
  await Promise.all([loadNewsData(), loadSpecialtiesData(), loadMessagesData(), loadDocumentsData()]);

  const unreadCount = currentMessages.filter(m => m.status === 'unread').length;

  document.getElementById('stat-news-count').textContent = currentNews.length;
  document.getElementById('stat-spec-count').textContent = currentSpecialties.length;
  document.getElementById('stat-msg-count').textContent = unreadCount;
  document.getElementById('stat-total-msg').textContent = currentMessages.length;
  document.getElementById('stat-doc-count').textContent = currentDocuments.length;

  // Recent messages rendering
  const recentBody = document.getElementById('recent-messages-body');
  if (recentBody) {
    recentBody.innerHTML = '';
    const sorted = [...currentMessages].sort((a, b) => b.id - a.id).slice(0, 5);

    if (sorted.length === 0) {
      recentBody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--text-tertiary);">Сообщений пока нет</td></tr>`;
      return;
    }

    sorted.forEach(m => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${m.date}</td>
        <td><strong>${m.name}</strong></td>
        <td>${m.phone}</td>
        <td>${m.subject}</td>
        <td><span class="badge ${m.status === 'unread' ? 'badge-unread' : 'badge-read'}">${m.status === 'unread' ? 'Новое' : 'Прочитано'}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn btn-view" id="msg-view-btn-${m.id}" title="Просмотреть"><i class="fas fa-eye"></i></button>
          </div>
        </td>
      `;
      row.querySelector(`#msg-view-btn-${m.id}`).addEventListener('click', () => {
        const menuItem = document.querySelector('.admin-menu-item[data-tab="messages"]');
        if (menuItem) menuItem.click();
      });
      recentBody.appendChild(row);
    });
  }
}

async function loadNewsData() {
  try {
    const snap = await db.collection("news").get();
    currentNews = [];
    snap.forEach(doc => currentNews.push(doc.data()));
    localStorage.setItem("college_news", JSON.stringify(currentNews));
  } catch (error) {
    console.error("Failed to load news:", error);
    currentNews = JSON.parse(localStorage.getItem("college_news")) || [];
  }

  const body = document.getElementById('admin-news-body');
  if (!body) return;

  body.innerHTML = '';
  const sorted = [...currentNews].sort((a, b) => b.id - a.id);

  if (sorted.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="text-center">Новостей нет. Нажмите "Добавить новость", чтобы опубликовать первую.</td></tr>`;
    return;
  }

  sorted.forEach(n => {
    const titleRU = n.title_ru || n.title || '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${n.id}</td>
      <td><strong>${titleRU}</strong></td>
      <td><span class="badge" style="background-color: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary);">${n.category}</span></td>
      <td>${n.date}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn btn-edit" id="news-edit-${n.id}" title="Редактировать"><i class="fas fa-pencil-alt"></i></button>
          <button class="action-btn btn-delete" id="news-del-${n.id}" title="Удалить"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;
    row.querySelector(`#news-edit-${n.id}`).addEventListener('click', () => editNews(n.id));
    row.querySelector(`#news-del-${n.id}`).addEventListener('click', () => deleteNews(n.id));
    body.appendChild(row);
  });
}

async function loadSpecialtiesData() {
  try {
    const snap = await db.collection("specialties").get();
    currentSpecialties = [];
    snap.forEach(doc => currentSpecialties.push(doc.data()));
    localStorage.setItem("college_specialties", JSON.stringify(currentSpecialties));
  } catch (error) {
    console.error("Failed to load specialties:", error);
    currentSpecialties = JSON.parse(localStorage.getItem("college_specialties")) || [];
  }

  const body = document.getElementById('admin-specs-body');
  if (!body) return;

  body.innerHTML = '';

  if (currentSpecialties.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="text-center">Специальностей нет. Нажмите "Добавить", чтобы наполнить каталог.</td></tr>`;
    return;
  }

  currentSpecialties.forEach(s => {
    const nameRU = s.name_ru || s.name || '';
    const qualRU = s.qualification_ru || s.qualification || '';
    const baseRU = s.baseClass_ru || s.baseClass || '';
    const durRU = s.duration_ru || s.duration || '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${nameRU}</strong></td>
      <td>${qualRU}</td>
      <td>${baseRU}</td>
      <td>${durRU}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn btn-edit" id="spec-edit-${s.id}" title="Редактировать"><i class="fas fa-pencil-alt"></i></button>
          <button class="action-btn btn-delete" id="spec-del-${s.id}" title="Удалить"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;
    row.querySelector(`#spec-edit-${s.id}`).addEventListener('click', () => editSpec(s.id));
    row.querySelector(`#spec-del-${s.id}`).addEventListener('click', () => deleteSpec(s.id));
    body.appendChild(row);
  });
}

async function loadMessagesData() {
  try {
    const snap = await db.collection("messages").get();
    currentMessages = [];
    snap.forEach(doc => {
      currentMessages.push({ docId: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error("Failed to load messages:", error);
  }

  const body = document.getElementById('admin-messages-body');
  if (!body) return;

  body.innerHTML = '';
  const sorted = [...currentMessages].sort((a, b) => b.id - a.id);

  if (sorted.length === 0) {
    body.innerHTML = `<tr><td colspan="7" class="text-center">Почтовый ящик пуст. Сообщения из формы контактов будут появляться здесь.</td></tr>`;
    return;
  }

  sorted.forEach(m => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${m.date}</td>
      <td><strong>${m.name}</strong></td>
      <td>
        <div><i class="fas fa-phone-alt" style="font-size:0.75rem;"></i> ${m.phone}</div>
        <div><i class="fas fa-envelope" style="font-size:0.75rem;"></i> ${m.email}</div>
      </td>
      <td><strong>${m.subject}</strong></td>
      <td style="max-width: 250px; white-space: pre-wrap; font-size: 0.85rem;">${m.message}</td>
      <td><span class="badge ${m.status === 'unread' ? 'badge-unread' : 'badge-read'}">${m.status === 'unread' ? 'Новое' : 'Прочитано'}</span></td>
      <td>
        <div class="table-actions">
          ${m.status === 'unread' ? `<button class="action-btn btn-view" id="msg-read-${m.id}" title="Отметить прочитанным"><i class="fas fa-check"></i></button>` : ''}
          <button class="action-btn btn-delete" id="msg-del-${m.id}" title="Удалить обращение"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;
    if (row.querySelector(`#msg-read-${m.id}`)) {
      row.querySelector(`#msg-read-${m.id}`).addEventListener('click', () => markMessageRead(m.docId));
    }
    row.querySelector(`#msg-del-${m.id}`).addEventListener('click', () => deleteMessage(m.docId));
    body.appendChild(row);
  });
}

async function loadDocumentsData() {
  try {
    const snap = await db.collection("documents").get();
    currentDocuments = [];
    snap.forEach(doc => {
      currentDocuments.push({ docId: doc.id, ...doc.data() });
    });
    localStorage.setItem("college_documents", JSON.stringify(currentDocuments));
  } catch (error) {
    console.error("Failed to load documents:", error);
    currentDocuments = JSON.parse(localStorage.getItem("college_documents")) || [];
  }

  const body = document.getElementById('admin-docs-body');
  if (!body) return;

  body.innerHTML = '';
  const sorted = [...currentDocuments].sort((a, b) => b.id - a.id);

  if (sorted.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="text-center">Документов нет. Нажмите "Добавить документ", чтобы загрузить первый.</td></tr>`;
    return;
  }

  sorted.forEach(d => {
    const docNameRU = d.name_ru || d.name || '';
    const sectionName = d.category === 'general' ? 'Официальные (О колледже)' : 'Скачивание (Поступающим)';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${docNameRU}</strong></td>
      <td><code>${d.fileName}</code></td>
      <td><span style="font-size:0.8rem; color:var(--text-tertiary);">${d.fileType}</span></td>
      <td><span class="badge" style="background:var(--bg-tertiary); border:1px solid var(--border-color); color:var(--text-primary);">${sectionName}</span></td>
      <td>
        <div class="table-actions">
          <button class="action-btn btn-delete" id="doc-del-${d.id}" title="Удалить"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;
    row.querySelector(`#doc-del-${d.id}`).addEventListener('click', () => deleteDoc(d.docId));
    body.appendChild(row);
  });
}

function getCachedDB(key) {
  return JSON.parse(localStorage.getItem(key));
}

async function populateSettingsForm() {
  let settings = getCachedDB('college_settings');
  if (!settings) {
    try {
      const snap = await db.collection("settings").doc("general").get();
      settings = snap.data();
    } catch (e) {
      console.error(e);
    }
  }
  if (!settings) return;

  // Global Settings Fields
  document.getElementById('set-phone').value = settings.phone || '';
  document.getElementById('set-email').value = settings.email || '';
  document.getElementById('set-smartnation').value = settings.smartnation || '';
  document.getElementById('set-insta').value = settings.instagram || '';
  document.getElementById('set-fb').value = settings.facebook || '';
  document.getElementById('set-youtube').value = settings.youtube || '';

  // Localized Settings Fields
  document.getElementById('set-address-ru').value = settings.address_ru || settings.address || '';
  document.getElementById('set-address-kk').value = settings.address_kk || '';
  document.getElementById('set-address-en').value = settings.address_en || '';

  document.getElementById('set-dir-name-ru').value = settings.directorName_ru || settings.directorName || '';
  document.getElementById('set-dir-name-kk').value = settings.directorName_kk || '';
  document.getElementById('set-dir-name-en').value = settings.directorName_en || '';

  document.getElementById('set-dir-speech-ru').value = settings.directorSpeech_ru || settings.directorSpeech || '';
  document.getElementById('set-dir-speech-kk').value = settings.directorSpeech_kk || '';
  document.getElementById('set-dir-speech-en').value = settings.directorSpeech_en || '';

  resetFormTabs('settings');
}

// --- MODAL UTILITIES ---

window.openAddNewsModal = function() {
  document.getElementById('news-modal-title').textContent = 'Добавить новость';
  document.getElementById('news-edit-id').value = '';
  document.getElementById('news-image-base64').value = '';
  document.getElementById('admin-news-form').reset();
  document.getElementById('news-date').value = new Date().toISOString().split('T')[0];
  resetFormTabs('news');
  document.getElementById('admin-news-modal').style.display = 'flex';
};

window.closeNewsAdminModal = function() {
  document.getElementById('admin-news-modal').style.display = 'none';
};

function editNews(id) {
  const n = currentNews.find(item => item.id === id);
  if (!n) return;

  document.getElementById('news-modal-title').textContent = 'Редактировать новость';
  document.getElementById('news-edit-id').value = n.id;
  document.getElementById('news-category').value = n.category;
  document.getElementById('news-date').value = n.date;
  document.getElementById('news-image-base64').value = n.image || '';
  document.getElementById('news-image-file').value = '';

  // Populate localized news fields
  document.getElementById('news-title-ru').value = n.title_ru || n.title || '';
  document.getElementById('news-title-kk').value = n.title_kk || '';
  document.getElementById('news-title-en').value = n.title_en || '';

  document.getElementById('news-short-ru').value = n.shortText_ru || n.shortText || '';
  document.getElementById('news-short-kk').value = n.shortText_kk || '';
  document.getElementById('news-short-en').value = n.shortText_en || '';

  document.getElementById('news-full-ru').value = n.fullText_ru || n.fullText || '';
  document.getElementById('news-full-kk').value = n.fullText_kk || '';
  document.getElementById('news-full-en').value = n.fullText_en || '';

  resetFormTabs('news');
  document.getElementById('admin-news-modal').style.display = 'flex';
}

async function deleteNews(id) {
  if (confirm('Вы действительно хотите удалить эту новость?')) {
    try {
      await db.collection("news").doc(String(id)).delete();
      await switchTab('news');
    } catch (e) {
      console.error(e);
      alert("Ошибка удаления новости.");
    }
  }
}

window.openAddSpecModal = function() {
  document.getElementById('spec-modal-title').textContent = 'Добавить специальность';
  document.getElementById('spec-edit-id').value = '';
  document.getElementById('admin-spec-form').reset();
  resetFormTabs('spec');
  document.getElementById('admin-spec-modal').style.display = 'flex';
};

window.closeSpecAdminModal = function() {
  document.getElementById('admin-spec-modal').style.display = 'none';
};

function editSpec(id) {
  const s = currentSpecialties.find(item => item.id === id);
  if (!s) return;

  document.getElementById('spec-modal-title').textContent = 'Редактировать специальность';
  document.getElementById('spec-edit-id').value = s.id;

  // Populate localized fields
  document.getElementById('spec-name-ru').value = s.name_ru || s.name || '';
  document.getElementById('spec-name-kk').value = s.name_kk || '';
  document.getElementById('spec-name-en').value = s.name_en || '';

  document.getElementById('spec-qual-ru').value = s.qualification_ru || s.qualification || '';
  document.getElementById('spec-qual-kk').value = s.qualification_kk || '';
  document.getElementById('spec-qual-en').value = s.qualification_en || '';

  document.getElementById('spec-base-ru').value = s.baseClass_ru || s.baseClass || '';
  document.getElementById('spec-base-kk').value = s.baseClass_kk || '';
  document.getElementById('spec-base-en').value = s.baseClass_en || '';

  document.getElementById('spec-duration-ru').value = s.duration_ru || s.duration || '';
  document.getElementById('spec-duration-kk').value = s.duration_kk || '';
  document.getElementById('spec-duration-en').value = s.duration_en || '';

  document.getElementById('spec-desc-ru').value = s.description_ru || s.description || '';
  document.getElementById('spec-desc-kk').value = s.description_kk || '';
  document.getElementById('spec-desc-en').value = s.description_en || '';

  document.getElementById('spec-details-ru').value = s.details_ru || s.details || '';
  document.getElementById('spec-details-kk').value = s.details_kk || '';
  document.getElementById('spec-details-en').value = s.details_en || '';

  document.getElementById('spec-subjects-ru').value = s.subjects_ru || s.subjects || '';
  document.getElementById('spec-subjects-kk').value = s.subjects_kk || '';
  document.getElementById('spec-subjects-en').value = s.subjects_en || '';

  resetFormTabs('spec');
  document.getElementById('admin-spec-modal').style.display = 'flex';
}

async function deleteSpec(id) {
  if (confirm('Вы действительно хотите удалить эту специальность?')) {
    try {
      await db.collection("specialties").doc(String(id)).delete();
      await switchTab('specialties');
    } catch (e) {
      console.error(e);
      alert("Ошибка удаления специальности.");
    }
  }
}

window.openAddDocModal = function() {
  document.getElementById('doc-modal-title').textContent = 'Добавить документ';
  document.getElementById('doc-edit-id').value = '';
  document.getElementById('doc-file-base64').value = '';
  document.getElementById('doc-file-name').value = '';
  document.getElementById('doc-file-type').value = '';
  document.getElementById('admin-doc-form').reset();
  resetFormTabs('doc');
  document.getElementById('admin-doc-modal').style.display = 'flex';
};

window.closeDocAdminModal = function() {
  document.getElementById('admin-doc-modal').style.display = 'none';
};

async function deleteDoc(docId) {
  if (confirm('Вы действительно хотите удалить этот документ?')) {
    try {
      await db.collection("documents").doc(docId).delete();
      await switchTab('documents');
    } catch (e) {
      console.error(e);
      alert("Ошибка удаления документа.");
    }
  }
}

async function markMessageRead(docId) {
  try {
    await db.collection("messages").doc(docId).update({ status: 'read' });
    await switchTab('messages');
  } catch (e) {
    console.error(e);
  }
}

async function deleteMessage(docId) {
  if (confirm('Вы действительно хотите удалить это сообщение из архива?')) {
    try {
      await db.collection("messages").doc(docId).delete();
      await switchTab('messages');
    } catch (e) {
      console.error(e);
    }
  }
}

// --- IMAGE COMPRESSION & BASE64 HELPER ---
function compressImageFile(file, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64Str = canvas.toDataURL('image/jpeg', quality);
        resolve(base64Str);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.switchTab = switchTab;
