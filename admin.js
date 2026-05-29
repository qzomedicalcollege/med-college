// Ключи доступа к базам данных и сервисам
const FIREBASE_DB_URL = "https://qzomedicalcollege-default-rtdb.firebaseio.com/news.json";
const IMGBB_API_KEY = "e743803bf9be739f3ae6fc6cabda585f";

// Основные DOM-элементы
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const newsForm = document.getElementById('news-form');
const newsList = document.getElementById('news-container') || document.getElementById('news-list');
const submitBtn = document.getElementById('news-submit-btn') || document.getElementById('publish-btn');

// 1. Проверка сессии при загрузке
function checkAuth() {
    const isAdmin = localStorage.getItem('isMedAdmin') === 'true';
    if (loginSection && dashboardSection) {
        if (isAdmin) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
        } else {
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        }
    }
    loadNews();
}

// 2. Вход в систему
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const login = document.getElementById('login') ? document.getElementById('login').value : prompt('Логин:');
        const pass = document.getElementById('password') ? document.getElementById('password').value : prompt('Пароль:');
        if (login === 'QMHC' && pass === 'CHMQ') {
            localStorage.setItem('isMedAdmin', 'true');
            checkAuth();
            alert('Успешный вход!');
        } else {
            alert('Неверный логин или пароль!');
        }
    });
}

// 3. Выход из панели
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isMedAdmin');
        checkAuth();
    });
}

// 4. ПУБЛИКАЦИЯ НОВОСТИ — ИСПРАВЛЕНО: files[0] вместо files
if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn) { submitBtn.textContent = 'Идет публикация...'; submitBtn.disabled = true; }

        try {
            const title = document.getElementById('news_title') || document.getElementById('news-title');
            const content = document.getElementById('news_text') || document.getElementById('news-content');
            const fileInput = document.getElementById('news_image') || document.getElementById('news-image');
            let imageUrl = '';

            // ИСПРАВЛЕНИЕ: строго первый файл files[0]
            if (fileInput.files && fileInput.files.length > 0) {
                if (submitBtn) submitBtn.textContent = 'Загрузка фото на сервер...';

                const formData = new FormData();
                formData.append('image', fileInput.files[0]); // ✅ files[0], не files

                const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                const imgData = await imgRes.json();

                if (imgData.success) {
                    imageUrl = imgData.data.url;
                } else {
                    throw new Error('Сервер ImgBB отклонил файл. Попробуйте другой формат или размер.');
                }
            }

            if (submitBtn) submitBtn.textContent = 'Сохранение в базу...';

            const newPost = {
                title: title.value,
                content: content.value,
                imageUrl: imageUrl,
                date: new Date().toLocaleDateString('ru-RU'),
                timestamp: Date.now()
            };

            const dbRes = await fetch(FIREBASE_DB_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPost)
            });

            if (!dbRes.ok) throw new Error('Ошибка связи с базой данных Firebase.');

            alert('✅ Новость успешно опубликована!');
            newsForm.reset();
            loadNews();

        } catch (err) {
            alert('❌ Ошибка: ' + err.message);
        } finally {
            if (submitBtn) { submitBtn.textContent = 'Опубликовать новость'; submitBtn.disabled = false; }
        }
    });
}

// 5. УДАЛЕНИЕ НОВОСТЕЙ — ИСПРАВЛЕНО: closest() вместо classList
if (newsList) {
    newsList.addEventListener('click', async (e) => {
        // ✅ closest() — срабатывает даже при клике на иконку внутри кнопки
        const btn = e.target.closest('.delete-btn');
        if (btn) {
            const id = btn.getAttribute('data-id');
            if (confirm('Вы уверены, что хотите удалить эту новость навсегда?')) {
                const deleteUrl = `https://qzomedicalcollege-default-rtdb.firebaseio.com/news/${id}.json`;
                try {
                    btn.textContent = 'Удаление...';
                    btn.disabled = true;
                    const response = await fetch(deleteUrl, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Сервер Firebase запретил удаление');
                    loadNews();
                } catch (error) {
                    alert('Ошибка при удалении: ' + error.message);
                    btn.textContent = 'Удалить';
                    btn.disabled = false;
                }
            }
        }
    });
}

// 6. ЗАГРУЗКА И ОТРИСОВКА ЛЕНТЫ НОВОСТЕЙ
async function loadNews() {
    if (!newsList) return;
    newsList.innerHTML = '<p style="color: #666; text-align: center; width: 100%;">Синхронизация ленты новостей...</p>';

    try {
        const res = await fetch(FIREBASE_DB_URL);
        const data = await res.json();

        newsList.innerHTML = '';
        if (!data) {
            newsList.innerHTML = '<p style="text-align: center; width: 100%;">Новостей пока нет.</p>';
            return;
        }

        const newsArray = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        newsArray.sort((a, b) => b.timestamp - a.timestamp);

        const isAdmin = localStorage.getItem('isMedAdmin') === 'true';

        newsArray.forEach(item => {
            const article = document.createElement('div');
            article.className = 'news-item';

            const imgHtml = item.imageUrl
                ? `<img src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.title)}" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px; object-fit: cover;">`
                : '';

            const deleteBtnHtml = isAdmin
                ? `<button class="delete-btn" data-id="${item.id}" style="margin-top: 15px; padding: 10px 15px; background: #e53e3e; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;"><i class="fa-solid fa-trash"></i> Удалить новость</button>`
                : '';

            article.innerHTML = `
                ${imgHtml}
                <div class="news-content" style="padding: 10px 0;">
                    <div style="color: #0056b3; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Опубликовано: ${escapeHTML(item.date)}</div>
                    <h3 style="font-size: 18px; margin-bottom: 10px; color: #333;">${escapeHTML(item.title)}</h3>
                    <p style="color: #555; font-size: 15px; line-height: 1.5;">${escapeHTML(item.content).replace(/\n/g, '<br>')}</p>
                    ${deleteBtnHtml}
                </div>
            `;

            article.style.cssText = "background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column;";
            newsList.appendChild(article);
        });

    } catch (err) {
        newsList.innerHTML = `<p style="color: red; text-align: center; width: 100%;">Ошибка загрузки: ${err.message}</p>`;
    }
}


// Парсинг ссылок в тексте: [текст](url) и голые https://...
function parseLinks(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    let safe = div.innerHTML;
    safe = safe.replace(/\n/g, '<br>');
    // [текст](https://...) → кликабельная ссылка
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#0056b3;font-weight:600;text-decoration:underline;">$1</a>');
    // голый https://... → кликабельная ссылка
    safe = safe.replace(/(?<![="'\(])(https?:\/\/[^\s<,)]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#0056b3;text-decoration:underline;">$1</a>');
    return safe;
}

// Защита от XSS
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', checkAuth);

