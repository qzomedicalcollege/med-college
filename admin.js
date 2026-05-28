// Ваши ключи
const FIREBASE_DB_URL = "https://qzomedicalcollege-default-rtdb.firebaseio.com/news.json";
const IMGBB_API_KEY = "582a59fe4c572868e41343f804672210";

// DOM элементы
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const newsForm = document.getElementById('news-form');
const newsList = document.getElementById('news-list');
const submitBtn = document.getElementById('news-submit-btn');

// Проверка сессии
function checkAuth() {
    if (localStorage.getItem('isAdmin') === 'true') {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadNews();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}
checkAuth();

// Вход в систему (логин: admin, пароль: admin)
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const login = document.getElementById('login').value;
    const pass = document.getElementById('password').value;
    
    if (login === 'admin' && pass === 'admin') {
        localStorage.setItem('isAdmin', 'true');
        checkAuth();
    } else {
        alert('Неверный логин или пароль!');
    }
});

// Выход
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isAdmin');
    checkAuth();
});

// Публикация новости
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.textContent = 'Идет публикация...';
    submitBtn.disabled = true;

    try {
        const title = document.getElementById('news_title').value;
        const content = document.getElementById('news_text').value;
        const fileInput = document.getElementById('news_image').files;
        let imageUrl = '';

        // Загрузка фото на ImgBB
        if (fileInput) {
            submitBtn.textContent = 'Загрузка фото...';
            const formData = new FormData();
            formData.append('image', fileInput);
            
            const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const imgData = await imgRes.json();
            
            if (imgData.success) {
                imageUrl = imgData.data.url;
            } else {
                throw new Error('Не удалось загрузить фотографию.');
            }
        }

        // Сохранение в Firebase
        submitBtn.textContent = 'Сохранение в базу...';
        const newPost = {
            title: title,
            content: content,
            imageUrl: imageUrl,
            date: new Date().toLocaleDateString('ru-RU'),
            timestamp: Date.now()
        };

        const dbRes = await fetch(FIREBASE_DB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
        });

        if (!dbRes.ok) throw new Error('Ошибка связи с базой данных.');

        alert('Новость успешно опубликована!');
        newsForm.reset();
        loadNews();

    } catch (err) {
        alert('Ошибка: ' + err.message);
    } finally {
        submitBtn.textContent = 'Опубликовать новость';
        submitBtn.disabled = false;
    }
});

// Загрузка и удаление новостей
async function loadNews() {
    newsList.innerHTML = '<p>Загрузка ленты новостей...</p>';
    
    try {
        const res = await fetch(FIREBASE_DB_URL);
        const data = await res.json();
        
        newsList.innerHTML = '';
        if (!data) {
            newsList.innerHTML = '<p>Новостей пока нет. Добавьте первую!</p>';
            return;
        }

        const newsArray = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        newsArray.sort((a, b) => b.timestamp - a.timestamp);

        newsArray.forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div class="news-info">
                    <strong>${escapeHTML(item.title)}</strong>
                    <small>${item.date}</small>
                </div>
                <button class="btn btn-danger delete-btn" data-id="${item.id}">Удалить</button>
            `;
            newsList.appendChild(div);
        });

        // Исправленная логика удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Удалить эту новость навсегда?')) {
                    // Формируем правильную ссылку для удаления конкретного элемента
                    const deleteUrl = `https://qzomedicalcollege-default-rtdb.firebaseio.com/news/${id}.json`;
                    
                    try {
                        e.target.textContent = 'Удаление...';
                        e.target.disabled = true;
                        
                        await fetch(deleteUrl, { method: 'DELETE' });
                        loadNews(); // Обновляем список сразу после удаления
                    } catch (error) {
                        alert('Ошибка при удалении: ' + error.message);
                    }
                }
            });
        });

    } catch (err) {
        newsList.innerHTML = `<p style="color: red;">Ошибка: ${err.message}</p>`;
    }
}

// Защита вывода
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
