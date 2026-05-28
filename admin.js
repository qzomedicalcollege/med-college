// Ключи доступа (Уже прописаны твои)
const FIREBASE_DB_URL = "https://qzomedicalcollege-default-rtdb.firebaseio.com/news.json";
const IMGBB_API_KEY = "582a59fe4c572868e41343f804672210";

// DOM элементы
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const newsForm = document.getElementById('news-form');
const newsList = document.getElementById('news-list');

// Проверка авторизации при загрузке страницы
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

// Логика входа
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

// Добавление новой новости
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('news-submit-btn');
    btn.textContent = 'Обработка...';
    btn.disabled = true;

    try {
        const title = document.getElementById('news_title').value;
        const content = document.getElementById('news_text').value;
        const fileInput = document.getElementById('news_image').files;
        let imageUrl = '';

        // 1. Загрузка картинки на ImgBB (если она выбрана)
        if (fileInput) {
            btn.textContent = 'Загрузка картинки на сервер...';
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
                throw new Error('Не удалось загрузить картинку');
            }
        }

        // 2. Отправка текста и ссылки на картинку в базу Firebase
        btn.textContent = 'Сохранение в базу...';
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

        if (!dbRes.ok) throw new Error('Ошибка записи в Firebase');

        alert('Новость успешно опубликована!');
        newsForm.reset();
        loadNews(); // Обновляем список на экране

    } catch (err) {
        alert('Ошибка: ' + err.message);
    } finally {
        btn.textContent = 'Опубликовать новость';
        btn.disabled = false;
    }
});

// Загрузка списка новостей с кнопкой удаления
async function loadNews() {
    newsList.innerHTML = 'Загрузка...';
    try {
        const res = await fetch(FIREBASE_DB_URL);
        const data = await res.json();
        
        newsList.innerHTML = '';
        if (!data) {
            newsList.innerHTML = '<p style="color:#888;">Новостей пока нет.</p>';
            return;
        }

        // Преобразуем объекты в массив и сортируем от новых к старым
        const newsArray = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        newsArray.sort((a, b) => b.timestamp - a.timestamp);

        newsArray.forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div>
                    <strong style="font-size: 16px;">${escapeHTML(item.title)}</strong><br>
                    <small style="color: #666;">${item.date}</small>
                </div>
                <button class="danger delete-btn" data-id="${item.id}">Удалить</button>
            `;
            newsList.appendChild(div);
        });

        // Вешаем слушатели на кнопки "Удалить"
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Вы уверены, что хотите безвозвратно удалить эту новость?')) {
                    const deleteUrl = FIREBASE_DB_URL.replace('news.json', `news/${id}.json`);
                    await fetch(deleteUrl, { method: 'DELETE' });
                    loadNews(); // Обновляем список после удаления
                }
            });
        });

    } catch (err) {
        newsList.innerHTML = '<p style="color:red;">Ошибка загрузки базы данных</p>';
    }
}

// Защита от вредоносного кода при выводе
function escapeHTML(str) {
    if(!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
