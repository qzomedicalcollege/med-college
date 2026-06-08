import { supabase } from './supabase-client.js';
import { STORAGE_BUCKET, SECTIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_POST } from './config.js';
import { escapeHTML, parseLinks, formatBytes, renderAttachments, slugifyFileName } from './utils.js';

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const itemForm = document.getElementById('item-form');
const itemTitleInput = document.getElementById('item-title');
const itemTextInput = document.getElementById('item-text');
const itemFilesInput = document.getElementById('item-files');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formTitle = document.getElementById('form-title');
const listTitle = document.getElementById('list-title');
const itemList = document.getElementById('item-list');
const statusBox = document.getElementById('status-box');
const currentSectionLabel = document.getElementById('current-section-label');

let currentSection = 'news';
let editingId = null;
let editingRecord = null;

init();

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  renderAuth(session?.user || null);
  if (session?.user) loadSection();

  supabase.auth.onAuthStateChange((_event, session) => {
    renderAuth(session?.user || null);
    if (session?.user) loadSection();
  });
}

function renderAuth(user) {
  loginSection.classList.toggle('hidden', Boolean(user));
  dashboardSection.classList.toggle('hidden', !user);
  userEmail.textContent = user?.email || '';
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  setStatus('Вход...', 'neutral');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) setStatus(`Ошибка входа: ${error.message}`, 'error');
  else setStatus('', 'neutral');
});

logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  itemList.innerHTML = '';
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentSection = btn.dataset.section;
    editingId = null;
    editingRecord = null;
    itemForm.reset();
    updateUI();
    loadSection();
  });
});

cancelEditBtn?.addEventListener('click', () => {
  editingId = null;
  editingRecord = null;
  itemForm.reset();
  updateUI();
});

itemForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = itemTitleInput.value.trim();
  const body = itemTextInput.value.trim();
  const files = Array.from(itemFilesInput.files || []);

  if (!title || !body) return setStatus('Заполните заголовок и текст.', 'error');
  if (files.length > MAX_FILES_PER_POST) return setStatus(`Можно прикрепить максимум ${MAX_FILES_PER_POST} файлов за раз.`, 'error');

  try {
    submitBtn.disabled = true;
    setStatus('Проверка файлов...', 'neutral');
    validateFiles(files);

    const recordId = editingId || crypto.randomUUID();
    const oldAttachments = Array.isArray(editingRecord?.attachments) ? editingRecord.attachments : [];
    const oldImageUrl = editingRecord?.image_url || '';

    const uploadedAttachments = await uploadFiles(files, currentSection, recordId);
    const attachments = [...oldAttachments, ...uploadedAttachments];
    const firstImageUrl = uploadedAttachments.find(file => file.type?.startsWith('image/'))?.url || oldImageUrl || '';

    const payload = {
      id: recordId,
      section: currentSection,
      title,
      body,
      image_url: firstImageUrl,
      attachments,
      updated_at: new Date().toISOString()
    };

    if (!editingId) payload.created_at = new Date().toISOString();

    const { error } = await supabase.from('site_posts').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    setStatus(editingId ? 'Запись обновлена.' : 'Запись опубликована.', 'ok');
    editingId = null;
    editingRecord = null;
    itemForm.reset();
    updateUI();
    loadSection();
  } catch (error) {
    setStatus(`Ошибка: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

itemList?.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-action="edit"]');
  const deleteBtn = e.target.closest('[data-action="delete"]');

  if (editBtn) startEdit(editBtn.dataset.id);
  if (deleteBtn) deleteItem(deleteBtn.dataset.id);
});

function updateUI() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === currentSection);
  });
  currentSectionLabel.textContent = SECTIONS[currentSection];
  formTitle.textContent = editingId ? `Редактировать: ${SECTIONS[currentSection]}` : `Добавить: ${SECTIONS[currentSection]}`;
  listTitle.textContent = `Опубликовано: ${SECTIONS[currentSection]}`;
  submitBtn.textContent = editingId ? 'Сохранить изменения' : 'Опубликовать';
  cancelEditBtn.classList.toggle('hidden', !editingId);
}

async function loadSection() {
  updateUI();
  itemList.innerHTML = '<p class="loading">Загрузка...</p>';
  const { data, error } = await supabase
    .from('site_posts')
    .select('*')
    .eq('section', currentSection)
    .order('created_at', { ascending: false });

  if (error) {
    itemList.innerHTML = `<p class="error">Ошибка загрузки: ${escapeHTML(error.message)}</p>`;
    return;
  }
  if (!data?.length) {
    itemList.innerHTML = '<p class="empty">Пока нет записей.</p>';
    return;
  }
  itemList.innerHTML = data.map(renderAdminItem).join('');
}

function renderAdminItem(item) {
  const files = Array.isArray(item.attachments) ? item.attachments : [];
  return `
    <article class="admin-list-item">
      <strong>${escapeHTML(item.title || 'Без заголовка')}</strong>
      <p style="color:var(--text-light);margin-top:6px;">${parseLinks((item.body || '').slice(0, 260))}${(item.body || '').length > 260 ? '...' : ''}</p>
      <div>${files.map(file => `<span class="file-pill"><i class="fa-solid fa-paperclip"></i>${escapeHTML(file.name)} ${escapeHTML(formatBytes(file.size))}</span>`).join('')}</div>
      ${renderAttachments(files)}
      <div class="admin-list-actions">
        <button type="button" class="btn-secondary" data-action="edit" data-id="${escapeHTML(item.id)}"><i class="fa-solid fa-pen"></i> Редактировать</button>
        <button type="button" class="btn-danger" data-action="delete" data-id="${escapeHTML(item.id)}"><i class="fa-solid fa-trash"></i> Удалить</button>
      </div>
    </article>
  `;
}

async function startEdit(id) {
  const { data, error } = await supabase.from('site_posts').select('*').eq('id', id).single();
  if (error) return setStatus(`Ошибка: ${error.message}`, 'error');
  editingId = id;
  editingRecord = data;
  itemTitleInput.value = data.title || '';
  itemTextInput.value = data.body || '';
  itemFilesInput.value = '';
  updateUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteItem(id) {
  if (!confirm('Удалить запись и все прикреплённые файлы?')) return;
  try {
    const { data, error: readError } = await supabase.from('site_posts').select('attachments').eq('id', id).single();
    if (readError) throw readError;

    const paths = Array.isArray(data?.attachments) ? data.attachments.map(file => file.path).filter(Boolean) : [];
    if (paths.length) await supabase.storage.from(STORAGE_BUCKET).remove(paths);

    const { error } = await supabase.from('site_posts').delete().eq('id', id);
    if (error) throw error;
    setStatus('Запись удалена.', 'ok');
    loadSection();
  } catch (error) {
    setStatus(`Ошибка удаления: ${error.message}`, 'error');
  }
}

function validateFiles(files) {
  files.forEach(file => {
    if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name}: файл больше ${formatBytes(MAX_FILE_SIZE)}.`);
    if (!ALLOWED_MIME_TYPES.has(file.type)) throw new Error(`${file.name}: тип файла не разрешён.`);
  });
}

async function uploadFiles(files, section, recordId) {
  const uploaded = [];
  for (const file of files) {
    setStatus(`Загрузка файла: ${file.name}`, 'neutral');
    const path = `${section}/${recordId}/${Date.now()}-${crypto.randomUUID()}-${slugifyFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream'
    });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    uploaded.push({
      name: file.name,
      size: file.size,
      type: file.type,
      path,
      url: data.publicUrl
    });
  }
  return uploaded;
}

function setStatus(message, type = 'neutral') {
  statusBox.textContent = message;
  statusBox.className = `status ${message ? 'show' : ''} ${type}`;
}
