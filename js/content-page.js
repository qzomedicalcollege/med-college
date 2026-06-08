import { supabase } from './supabase-client.js';
import { initI18n } from './i18n.js';
import { initMobileMenu, escapeHTML, parseLinks, formatDate, renderAttachments, initForcedDownloads } from './utils.js';

initI18n();
initMobileMenu();
initForcedDownloads();

const container = document.getElementById('content-container');
const section = document.body.dataset.section;

if (container && section) loadContent(section);

async function loadContent(sectionName) {
  container.innerHTML = '<p class="loading">Загрузка...</p>';
  const { data, error } = await supabase
    .from('site_posts')
    .select('*')
    .eq('section', sectionName)
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<p class="error">Ошибка загрузки: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    container.innerHTML = '<p class="empty">Информация пока не добавлена.</p>';
    return;
  }

  container.innerHTML = data.map(item => {
    const image = item.image_url || '';
    return `
      <article class="content-item">
        <h3>${escapeHTML(item.title || 'Без заголовка')}</h3>
        <p>${parseLinks(item.body || '')}</p>
        ${image ? `<img class="news-img" style="border-radius:14px;margin-top:18px;" src="${escapeHTML(image)}" alt="${escapeHTML(item.title || '')}">` : ''}
        <div style="margin-top:8px;color:var(--text-light);font-size:13px;">${escapeHTML(formatDate(item.created_at))}</div>
        ${renderAttachments(item.attachments)}
      </article>
    `;
  }).join('');
}
