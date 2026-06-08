import { supabase } from './supabase-client.js';
import { initI18n } from './i18n.js';
import { initMobileMenu, escapeHTML, parseLinks, formatDate, renderAttachments, initForcedDownloads } from './utils.js';

initI18n();
initMobileMenu();
initForcedDownloads();

const newsContainer = document.getElementById('news-container');
if (newsContainer) loadNews();

async function loadNews() {
  newsContainer.innerHTML = '<p class="loading">Загрузка новостей...</p>';
  const { data, error } = await supabase
    .from('site_posts')
    .select('*')
    .eq('section', 'news')
    .order('created_at', { ascending: false });

  if (error) {
    newsContainer.innerHTML = `<p class="error">Ошибка загрузки: ${escapeHTML(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    newsContainer.innerHTML = '<p class="empty">Новостей пока нет.</p>';
    return;
  }

  newsContainer.innerHTML = data.map(item => {
    const title = escapeHTML(item.title || 'Без заголовка');
    const image = item.image_url || '';
    const imgHtml = image
      ? `<img class="news-img" src="${escapeHTML(image)}" alt="${title}">`
      : `<img class="news-img" src="https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?w=900&q=80" alt="${title}">`;

    return `
      <article class="news-item">
        ${imgHtml}
        <div class="news-content">
          <div class="news-date">${escapeHTML(formatDate(item.created_at))}</div>
          <h3 class="news-title">${title}</h3>
          <p class="news-text">${parseLinks(item.body || '')}</p>
          ${renderAttachments(item.attachments)}
        </div>
      </article>
    `;
  }).join('');
}

window.submitContactForm = async function submitContactForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('form-submit-btn');
  const success = document.getElementById('form-success');
  const error = document.getElementById('form-error');

  btn.disabled = true;
  btn.textContent = '...';
  success?.classList.add('hidden');
  error?.classList.add('hidden');

  try {
    const response = await fetch('https://formspree.io/f/mdajbqev', {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Formspree error');
    form.reset();
    success?.classList.remove('hidden');
  } catch {
    error?.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отправить';
  }
};
