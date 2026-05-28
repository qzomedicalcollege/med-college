// 2. Рендеринг новостной ленты
onValue(ref(db, 'news'), (snapshot) => {
    const container = document.getElementById('public-news-container');
    const data = snapshot.val();
    
    if (!data) {
        container.innerHTML = '<p>Новостей пока нет.</p>';
        return;
    }

    // Сортировка от свежих к старым
    const newsArray = Object.values(data);
    newsArray.sort((a, b) => b.timestamp - a.timestamp);

    container.innerHTML = ''; // Очищаем прелоадер

    newsArray.forEach(item => {
        const article = document.createElement('article');
        article.className = 'news-card';
        
        // Формируем HTML, учитывая новые поля: content и imageUrl
        article.innerHTML = `
            ${item.imageUrl ? `<img src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.title)}" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px; object-fit: cover;">` : ''}
            <h3>${escapeHTML(item.title)}</h3>
            ${item.date ? `<div class="news-date" style="color: #666; font-size: 0.9em; margin-bottom: 10px;">${escapeHTML(item.date)}</div>` : ''}
            <p>${item.content ? escapeHTML(item.content).replace(/\n/g, '<br>') : ''}</p>
        `;
        container.appendChild(article);
    });
});
