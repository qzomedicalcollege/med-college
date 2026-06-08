const dictionary = {
  'nav-about': { kz: 'Колледж туралы', ru: 'О колледже', en: 'About' },
  'nav-specialties': { kz: 'Мамандық', ru: 'Специальность', en: 'Specialty' },
  'nav-news': { kz: 'Жаңалықтар', ru: 'Новости', en: 'News' },
  'nav-students': { kz: 'Студентке', ru: 'Студентам', en: 'Students' },
  'nav-contacts': { kz: 'Байланыс', ru: 'Контакты', en: 'Contacts' },
  'hero-title': { kz: 'Қызылорда жоғары медициналық колледжі', ru: 'Кызылординский высший медицинский колледж', en: 'Kyzylorda Higher Medical College' },
  'hero-subtitle': { kz: 'Сапалы медициналық білім, заманауи технологиялар және тәжірибелі оқытушылар.', ru: 'Качественное медицинское образование на базе современных технологий.', en: 'Quality medical education based on modern technologies.' },
  'hero-btn': { kz: 'Байланысқа шығу', ru: 'Связаться с нами', en: 'Contact us' },
  'about-title': { kz: 'Колледж туралы', ru: 'О колледже', en: 'About college' },
  'about-subtitle': { kz: 'Қызылорда жоғары медициналық колледжі туралы ақпарат', ru: 'Информация о Кызылординском высшем медицинском колледже', en: 'Information about Kyzylorda Higher Medical College' },
  'students-title': { kz: 'Студентке', ru: 'Студентам', en: 'For students' },
  'students-subtitle': { kz: 'Студенттерге арналған ақпарат', ru: 'Информация для студентов', en: 'Information for students' },
  'contacts-title': { kz: 'Байланыстар', ru: 'Контакты', en: 'Contacts' },
  'contact-address-title': { kz: 'Мекенжай', ru: 'Адрес', en: 'Address' },
  'contact-address': { kz: 'Қызылорда қ., Ы. Жахаев көшесі, 18', ru: 'г. Кызылорда, ул. Ы. Жахаева, 18', en: 'Kyzylorda, Y. Zhakhayev st., 18' },
  'contact-phone-title': { kz: 'Қабылдау комиссиясы', ru: 'Приёмная комиссия', en: 'Admissions office' },
  'feedback-title': { kz: 'Кері байланыс', ru: 'Обратная связь', en: 'Feedback' },
  'send': { kz: 'Жіберу', ru: 'Отправить', en: 'Send' },
  'specialty-title': { kz: 'Мамандық', ru: 'Специальность', en: 'Specialty' },
  'specialty-1': { kz: 'Мейіргер ісінің қолданбалы бакалавры', ru: 'Прикладной бакалавр сестринского дела', en: 'Applied Bachelor of Nursing' },
  'specialty-1-desc': { kz: 'Халықаралық стандарттар бойынша жоғары білікті мейіргерлерді даярлау.', ru: 'Подготовка высококвалифицированных медицинских сестёр по международным стандартам.', en: 'Training highly qualified nurses according to international standards.' },
  'footer-copy': { kz: '© 2026 Қызылорда жоғары медициналық колледжі. Барлық құқықтар қорғалған.', ru: '© 2026 Кызылординский высший медицинский колледж. Все права защищены.', en: '© 2026 Kyzylorda Higher Medical College. All rights reserved.' }
};

export function getLang() {
  return localStorage.getItem('site_lang') || 'kz';
}

export function setLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem('site_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = dictionary[key]?.[lang];
    if (value) el.textContent = value;
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

export function initI18n() {
  setLanguage(getLang());
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
}
