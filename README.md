# Сайт колледжа: версия Supabase

Эта версия полностью убирает Firebase Storage и ImgBB. Данные, авторизация и файлы работают через Supabase.

## В проект уже вставлено

```js
SUPABASE_URL = 'https://wfxldgdfxilqtmgezlwf.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_-B-7IqrYeYBPS7V8GK1cuw_yMos3zqe'
STORAGE_BUCKET = 'college-files'
```

Используйте базовый URL `https://wfxldgdfxilqtmgezlwf.supabase.co`, а не URL с `/rest/v1/`.

## Файлы проекта

- `index.html` — главная страница
- `about.html` — страница “О колледже”
- `students.html` — страница “Студентам”
- `admin.html` — админ-панель
- `css/style.css` — общий дизайн
- `js/config.js` — настройки Supabase
- `js/admin.js` — вход, публикация, редактирование, удаление, загрузка файлов
- `js/public.js` — главная страница и новости
- `js/content-page.js` — страницы about/students
- `supabase/schema.sql` — таблицы и политики базы
- `supabase/storage-policies.sql` — политики Storage

## Настройка Supabase

### 1. SQL для базы

Откройте Supabase Dashboard → SQL Editor и выполните файл:

```text
supabase/schema.sql
```

Он создаст:

- `site_posts` — записи сайта для news/about/students
- `admin_users` — список администраторов
- RLS policies: публичное чтение, запись только администраторам

### 2. Создать администратора

Supabase Dashboard → Authentication → Users → Add user.

Создайте пользователя с email и паролем. Потом в SQL Editor выполните:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'ВАШ_EMAIL'
on conflict (user_id) do nothing;
```

Замените `ВАШ_EMAIL` на email администратора.

### 3. Создать Storage bucket

Supabase Dashboard → Storage → New bucket:

```text
Name: college-files
Public bucket: ON
```

Потом в SQL Editor выполните:

```text
supabase/storage-policies.sql
```

### 4. Загрузка сайта

Загрузите содержимое папки сайта на хостинг. Для теста можно открыть через локальный сервер:

```bash
python -m http.server 8080
```

Потом открыть:

```text
http://localhost:8080
```

## Поддерживаемые файлы

- изображения: JPG, PNG, WEBP, GIF
- PDF
- Word: DOC, DOCX
- Excel: XLS, XLSX
- PowerPoint: PPT, PPTX
- TXT

Ограничение по умолчанию: 8 файлов за раз, до 20 MB каждый.

## Важно по безопасности

- `sb_publishable_...` / anon public key можно использовать в браузере.
- `service_role key`, database password, connection string и JWT secret нельзя вставлять в сайт и нельзя отправлять посторонним.
- Не включайте публичную регистрацию админов. Создавайте пользователей вручную через Dashboard.

## Если Supabase пишет `permission denied for table site_posts`

Открой `supabase/repair-permissions.sql`, скопируй весь SQL в Supabase → SQL Editor и нажми **Run**. Это добавляет недостающие API grants и пересоздаёт RLS-политики.


## Изменение в версии download-fixed

Ссылки на вложения теперь используют параметр Supabase Storage `?download=имя-файла`.
При нажатии на PDF/Word/изображение браузер должен скачивать файл, а не открывать публичный URL Supabase в этой же вкладке.


## Исправление скачивания файлов

В этой версии карточки вложений не являются прямыми ссылками на Supabase Storage. Нажатие перехватывается JavaScript: файл скачивается через `fetch()` как `Blob`, затем браузеру отдаётся локальная ссылка с атрибутом `download`. Это уменьшает вероятность перехода пользователя на домен Supabase при клике по изображению/PDF.

Если мобильный браузер всё равно заблокирует программное скачивание, сработает запасной вариант: файл откроется в новой вкладке по публичной ссылке Supabase.
