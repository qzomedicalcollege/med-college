export function escapeHTML(value = '') {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

export function parseLinks(value = '') {
  const safe = escapeHTML(value).replace(/\n/g, '<br>');
  return safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatBytes(bytes = 0) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

export function fileIcon(type = '', name = '') {
  const lower = name.toLowerCase();
  if (type.startsWith('image/')) return 'fa-image';
  if (type === 'application/pdf' || lower.endsWith('.pdf')) return 'fa-file-pdf';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'fa-file-word';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'fa-file-excel';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'fa-file-powerpoint';
  return 'fa-file-lines';
}

export function fileDownloadUrl(file = {}) {
  const url = String(file.url || '');
  if (!url) return '#';
  const separator = url.includes('?') ? '&' : '?';
  const name = encodeURIComponent(file.name || 'file');
  return `${url}${separator}download=${name}`;
}

export function renderAttachments(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) return '';
  return `
    <div class="attachments">
      ${attachments.map(file => `
        <button type="button" class="attachment js-download-file" data-url="${escapeHTML(fileDownloadUrl(file))}" data-name="${escapeHTML(file.name || 'file')}">
          <i class="fa-solid ${fileIcon(file.type, file.name)}"></i>
          <span>Скачать: ${escapeHTML(file.name || 'Файл')}</span>
          <small>${escapeHTML(formatBytes(file.size))}</small>
        </button>
      `).join('')}
    </div>
  `;
}

export function initForcedDownloads(root = document) {
  root.addEventListener('click', async (event) => {
    const button = event.target.closest('.js-download-file');
    if (!button) return;

    event.preventDefault();
    const url = button.dataset.url;
    const fileName = button.dataset.name || 'file';
    if (!url) return;

    const originalText = button.querySelector('span')?.textContent || '';
    const label = button.querySelector('span');

    try {
      button.disabled = true;
      if (label) label.textContent = 'Загрузка...';

      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (error) {
      // Fallback: if a mobile browser blocks programmatic download,
      // open the public Storage URL in a new tab instead of breaking the UI.
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      button.disabled = false;
      if (label) label.textContent = originalText || `Скачать: ${fileName}`;
    }
  });
}

export function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('active'));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('active')));
}

export function slugifyFileName(name = 'file') {
  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex > -1 ? name.slice(0, dotIndex) : name;
  const ext = dotIndex > -1 ? name.slice(dotIndex).toLowerCase() : '';
  const safeBase = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁқҚғҒңҢүҮұҰіІәӘөӨһҺ-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'file';
  return `${safeBase}${ext}`;
}
