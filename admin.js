// Импортируем модули Firebase Authentication v9 через CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Твои настройки проекта Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAN02sRUHgBWrrpdmOtNBemEhHc192MfZs",
    authDomain: "qzomedicalcollege.firebaseapp.com",
    projectId: "qzomedicalcollege",
    storageBucket: "qzomedicalcollege.firebasestorage.app",
    messagingSenderId: "728480745712",
    appId: "1:728480745712:web:b9007f10890a0b1ccada35"
};

// Инициализация Firebase Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Ключи и ссылки для хранения контента (Оставляем прямые REST-запросы для надежности)
const FIREBASE_DB_URL = "https://qzomedicalcollege-default-rtdb.firebaseio.com/news.json";
const IMGBB_API_KEY = "582a59fe4c572868e41343f804672210";

// DOM элементы
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const newsForm = document.getElementById('news-form');
const newsList = document.getElementById('news-list');
const submitBtn = document.getElementById('news-submit-btn');

// --- 1. СИСТЕМА АВТОРИЗАЦИИ (FIREBASE AUTH) ---

// Слушатель состояния: проверяет, вошел ли пользователь при обновлении страницы
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Если юзер авторизован - показываем админку
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadNews(); // Загружаем новости из базы
    } else {
        // Если нет - показываем красивую форму логина
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// Обработка отправки формы входа
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    
    loginBtn.textContent = 'Проверка...';
    loginBtn.disabled = true;
    loginError.classList.add('hidden');

    try {
        // Входим через официальную базу юзеров Firebase
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
    } catch (error) {
        // Если пароль неверный - показываем ошибку
        loginError.textContent = 'Неверный email или пароль!';
        loginError.classList.remove('hidden');
    } finally {
        loginBtn.textContent = 'Войти';
        loginBtn.disabled = false;
    }
});

// Кнопка выхода
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});


// --- 2. СИСТЕМА УПРАВЛЕНИЯ НОВОСТЯМИ (REST API + ImgBB) ---

// Отправка новой публикации
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
            submitBtn.textContent = 'Загрузка фото на сервер...';
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

        // Отправка текста в Realtime Database
        submitBtn.textContent = 'Сохранение данных...';
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

        if (!dbRes.ok) throw new Error('Ошибка базы данных Firebase');

        // Успех
        alert('✅ Новость успешно опубликована!');
        newsForm.reset();
        loadNews();

    } catch (err) {
        alert('❌ Ошибка: ' + err.message);
    } finally {
        submitBtn.textContent = 'Опубликовать новость';
        submitBtn.disabled = false;
    }
});

// Загрузка списка новостей в админку с кнопкой "Удалить"
async function loadNews() {
    newsList.innerHTML = '<p style="color: var(--text-muted);">Синхронизация с сервером...</p>';
    
    try {
        const res = await fetch(FIREBASE_DB_URL);
        const data = await res.json();
        
        newsList.innerHTML = '';
        if (!data) {
            newsList.innerHTML = '<p>Новостей пока нет. Создайте первую публикацию!</p>';
            return;
        }

        // Превращаем JSON в массив и сортируем от новых к старым
        const newsArray = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        newsArray.sort((a, b) => b.timestamp - a.timestamp);

        newsArray.forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div class="news-info">
                    <strong>${escapeHTML(item.title)}</strong>
                    <small>Опубликовано: ${item.date}</small>
                </div>
                <button class="btn btn-danger delete-btn" data-id="${item.id}">Удалить</button>
            `;
            newsList.appendChild(div);
        });

        // Слушатели для удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Вы уверены, что хотите удалить эту новость навсегда?')) {
                    const deleteUrl = FIREBASE_DB_URL.replace('news.json', `news/${id}.json`);
                    await fetch(deleteUrl, { method: 'DELETE' });
                    loadNews(); // Перерисовываем список
                }
            });
        });

    } catch (err) {
        newsList.innerHTML = `<p style="color: #e53e3e;">Ошибка соединения: ${err.message}</p>`;
    }
}

// Защита от вредоносного кода
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
