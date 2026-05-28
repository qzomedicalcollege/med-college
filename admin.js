// Твои рабочие ключи
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

// 1. Проверка сессии при загрузке
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

// 2. Вход в систему (логин: admin, пароль: admin)
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

// 3. Выход из панели
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isAdmin');
    checkAuth();
});

// 4. ПУБЛИКАЦИЯ НОВОСТИ (Исправленная загрузка ImgBB)
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.textContent = 'Идет публикация...';
    submitBtn.disabled = true;

    try {
        const title = document.getElementById('news_title').value;
        const content = document.getElementById('news_text').value;
        const fileInput = document.getElementById('news_image').files; // Получаем список файлов
        let imageUrl = '';

        // ИСПРАВЛЕНИЕ: Проверяем, что файл выбран, и берем строго ПЕРВЫЙ файл из списка 
        if (fileInput && fileInput.length > 0) {
            submitBtn.textContent = 'Загрузка фото на сервер...';
            const formData = new FormData();
            formData.append('image', fileInput); // <-- Вот здесь был баг. Передаем конкретный файл!
            
            const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const imgData = await imgRes.json();
            
            if (imgData.success) {
                imageUrl = imgData.data.url;
            } else {
                throw new Error('Сервер картинок отклонил файл. Проверьте формат или размер.');
            }
        }

        // Сохранение в базу данных Firebase
        submitBtn.textContent = 'Сохранение текста в базу...';
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

        if (!dbRes.ok) throw new Error('Ошибка связи с базой данных Firebase.');

        alert('✅ Новость успешно опубликована!');
        newsForm.reset();
        loadNews(); // Перерисовываем список новостей

    } catch (err) {
        alert('❌ Ошибка: ' + err.message);
    } finally {
        submitBtn.textContent = 'Опубликовать новость';
        submitBtn.disabled = false;
    }
});

// 5. ЗАГРУЗКА И УДАЛЕНИЕ НОВОСТЕЙ (Исправленная логика удаления)
async function loadNews() {
    newsList.innerHTML = '<p style="color: #666;">Синхронизация ленты новостей...</p>';
    
    try {
        const res = await fetch(FIREBASE_DB_URL);
        const data = await res.json();
        
        newsList.innerHTML = '';
        if (!data) {
            newsList.innerHTML = '<p>Новостей пока нет. Добавьте первую публикацию!</p>';
            return;
        }

        // Сортировка новостей (сначала свежие)
        const newsArray = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        newsArray.sort((a, b) => b.timestamp - a.timestamp);

        newsArray.forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div class="news-info">
                    <strong>${escapeHTML(item.title)}</strong><br>
                    <small style="color: #888;">Опубликовано: ${item.date}</small>
                </div>
                <button class="btn btn-danger delete-btn" data-id="${item.id}">Удалить</button>
            `;
            newsList.appendChild(div);
        });

        // ИСПРАВЛЕНИЕ: Надежная логика удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // e.currentTarget гарантирует, что мы получим data-id именно с кнопки, а не с текста внутри нее
                const id = e.currentTarget.getAttribute('data-id'); 
                
                if (confirm('Удалить эту новость навсегда?')) {
                    // Формируем прямую, жесткую ссылку для удаления конкретного поста
                    const deleteUrl = `https://qzomedicalcollege-default-rtdb.firebaseio.com/news/${id}.json`;
                    
                    try {
                        e.currentTarget.textContent = 'Удаление...';
                        e.currentTarget.disabled = true;
                        
                        const response = await fetch(deleteUrl, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Сервер запретил удаление');
                        
                        // Если удаление прошло успешно, сразу перезагружаем список
                        loadNews(); 
                    } catch (error) {
                        alert('Ошибка при удалении: ' + error.message);
                        e.currentTarget.textContent = 'Удалить';
                        e.currentTarget.disabled = false;
                    }
                }
            });
        });

    } catch (err) {
        newsList.innerHTML = `<p style="color: red;">Ошибка: ${err.message}</p>`;
    }
}

// Утилита для защиты от вредоносного кода (XSS)
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
