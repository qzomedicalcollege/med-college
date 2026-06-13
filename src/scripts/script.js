/* 
   script.js
   Kyzylorda Higher Medical College Website - Global Javascript (Firebase v8)
   Manages Firestore cloud database synchronization, caching, theme toggling,
   responsive UI, page-specific dynamic rendering, and multilinguality.
*/

const currentLang = document.documentElement.lang || 'ru';

// Helper to get translated fields with fallback
function getLangText(item, field) {
  if (!item) return '';
  const langField = `${field}_${currentLang}`;
  if (item[langField]) return item[langField];
  // Fallback to Russian
  const ruField = `${field}_ru`;
  if (item[ruField]) return item[ruField];
  // Fallback to base field (compatibility with old records)
  return item[field] || '';
}

// Translations for alerts and interactive JS strings
const tAlerts = {
  ru: {
    success: 'Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.',
    error: 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже.',
    fields: 'Пожалуйста, заполните все обязательные поля.',
    noNews: 'Новостей пока нет.',
    noSpecs: 'Специальностей не найдено.',
    readMore: 'Читать полностью',
    qualification: 'Квалификация',
    duration: 'Срок обучения',
    baseClass: 'База поступления',
    moreDetails: 'Узнать подробнее',
    activityArea: 'Сфера профессиональной деятельности:',
    subjects: 'Профильные дисциплины:',
    rulesBtn: 'Правила приема',
    closeBtn: 'Закрыть',
    chanceHigh: 'Высокие шансы поступить на грант!',
    chanceMed: 'Средние шансы (возможен грант или платное обучение)',
    chanceLow: 'Шансы ниже средних (рекомендуется подтянуть баллы)',
    defaultSubj: 'Общий вопрос'
  },
  kk: {
    success: 'Хабарлама сәтті жіберілді! Жақын арада сізбен байланысамыз.',
    error: 'Хабарлама жіберу кезінде қате кетті. Кейінірек қайталап көріңіз.',
    fields: 'Барлық міндетті өрістерді толтырыңыз.',
    noNews: 'Жаңалықтар әлі жоқ.',
    noSpecs: 'Мамандықтар табылмады.',
    readMore: 'Толық оқу',
    qualification: 'Біліктілігі',
    duration: 'Оқу мерзімі',
    baseClass: 'Қабылдау базасы',
    moreDetails: 'Толығырақ білу',
    activityArea: 'Кәсіби қызмет саласы:',
    subjects: 'Бейіндік пәндер:',
    rulesBtn: 'Қабылдау ережелері',
    closeBtn: 'Жабу',
    chanceHigh: 'Грантқа түсу мүмкіндігі жоғары!',
    chanceMed: 'Орташа мүмкіндік (грант немесе ақылы бөлім болуы мүмкін)',
    chanceLow: 'Төмен мүмкіндік (баллды көтеру ұсынылады)',
    defaultSubj: 'Жалпы сұрақ'
  },
  en: {
    success: 'Message sent successfully! We will contact you soon.',
    error: 'An error occurred while sending the message. Please try again later.',
    fields: 'Please fill in all required fields.',
    noNews: 'No news available.',
    noSpecs: 'No specialties found.',
    readMore: 'Read more',
    qualification: 'Qualification',
    duration: 'Duration of study',
    baseClass: 'Admission base',
    moreDetails: 'Learn more',
    activityArea: 'Area of professional activity:',
    subjects: 'Core subjects:',
    rulesBtn: 'Admission rules',
    closeBtn: 'Close',
    chanceHigh: 'High chance for state grant!',
    chanceMed: 'Medium chance (grant or paid department possible)',
    chanceLow: 'Low chance (it is recommended to improve scores)',
    defaultSubj: 'General Inquiry'
  }
};

const t = (key) => tAlerts[currentLang][key] || tAlerts['ru'][key];

// --- 1. DEFAULT DATABASES FOR AUTO-INITIALIZATION ---
const defaultSettings = {
  name_ru: "Кызылординский высший медицинский колледж",
  name_kk: "Қызылорда жоғары медициналық колледжі",
  name_en: "Kyzylorda Higher Medical College",
  address_ru: "г. Кызылорда, ул. Ыбрая Жахаева, 18",
  address_kk: "Қызылорда қ., Ыбырай Жахаев көшесі, 18",
  address_en: "18 Ybyray Zhakhayev St, Kyzylorda",
  phone: "+7 (7242) 23-05-13",
  email: "kzmedicalcollege@mail.ru",
  directorName_ru: "Калмакова Жанар Амангельдиевна",
  directorName_kk: "Калмакова Жанар Амангелдіқызы",
  directorName_en: "Kalmakova Zhanar Amangeldievna",
  directorSpeech_ru: "Приветствую вас на официальном сайте Кызылординского высшего медицинского колледжа! Наше учебное заведение имеет богатую историю, начавшуюся в августе 1928 года. За 95 с лишним лет успешной работы мы подготовили более 15 000 высококлассных медицинских специалистов. Мы стремимся к предоставлению качественного образования, сочетая глубокие традиции, передовой опыт, современные симуляционные технологии и международные стандарты, чтобы наши выпускники всегда оставались востребованными и преданно служили обществу.",
  directorSpeech_kk: "Қызылорда жоғары медициналық колледжінің ресми сайтына қош келдіңіздер! Біздің оқу орнымыздың 1928 жылдың тамызында басталған бай тарихы бар. 95 жылдан астам табысты жұмыс барысында біз 15 000-нан астам жоғары білікті медицина маманын даярладық. Біз терең дәстүрлерді, озық тәжірибені, заманауи симуляциялық технологияларды және халықаралық стандарттарды ұштастыра отырып, түлектеріміздің әрқашан сұранысқа ие болуы және қоғамға адал қызмет етуі үшін сапалы білім беруге ұмтыламыз.",
  directorSpeech_en: "Welcome to the official website of the Kyzylorda Higher Medical College! Our educational institution has a rich history starting in August 1928. For over 95 years of successful work, we have prepared more than 15,000 highly qualified medical professionals. We strive to provide quality education by combining deep traditions, advanced experience, modern simulation technologies, and international standards, so that our graduates are always in demand and serve society faithfully.",
  instagram: "https://www.instagram.com/medcollegekzo/",
  facebook: "https://www.facebook.com/profile.php?id=100000861896594",
  youtube: "https://www.youtube.com/channel/UCcPSrHk2eqSo0YUAFyDexow",
  smartnation: "https://college.smartnation.kz/kz/tko"
};

const defaultNews = [
  {
    id: 1,
    title_ru: "Торжественное празднование 95-летия колледжа",
    title_kk: "Колледждің 95 жылдығын салтанатты түрде атап өту",
    title_en: "Solemn celebration of the 95th anniversary of the college",
    date: "2023-10-15",
    category: "События",
    shortText_ru: "Наш колледж торжественно отметил свой 95-летний юбилей со дня основания. В мероприятии приняли участие ветераны здравоохранения, выпускники и почетные гости.",
    shortText_kk: "Біздің колледж негізі қаланған күннен бастап өзінің 95 жылдық мерейтойын салтанатты түрде атап өтті. Іс-шараға денсаулық сақтау ардагерлері, түлектер мен құрметті қонақтар қатысты.",
    shortText_en: "Our college solemnly celebrated its 95th anniversary since its foundation. Healthcare veterans, graduates, and honored guests took part in the event.",
    fullText_ru: "В октябре 2023 года Кызылординский высший медицинский колледж отметил знаменательную дату — 95 лет со дня основания (август 1928 г.). За эти годы учебное заведение прошло путь от небольшого фельдшерско-акушерского техникума до ведущего медицинского колледжа региона. На праздничном концерте были награждены лучшие преподаватели, а студенты подготовили яркие творческие номера. В рамках празднования также прошла научно-практическая конференция по развитию сестринского дела.",
    fullText_kk: "2023 жылдың қазан айында Қызылорда жоғары медициналық колледжі негізі қаланған күннен бастап (1928 жылғы тамыз) айтулы күнді — 95 жылдықты атап өтті. Осы жылдар ішінде оқу орны шағын фельдшерлік-акушерлік техникумнан аймақтың жетекші медициналық колледжіне дейінгі жолдан өтті. Мерекелік концертте үздік оқытушылар марапатталып, студенттер жарқын шығармашылық нөмірлер дайындады.",
    fullText_en: "In October 2023, the Kyzylorda Higher Medical College celebrated a milestone date - 95 years since its foundation (August 1928). Over these years, the educational institution has gone from a small obstetrician-feldsher school to the region's leading medical college. At the festive concert, the best teachers were awarded, and the students prepared bright creative performances.",
    image: ""
  },
  {
    id: 2,
    title_ru: "Открытие нового симуляционного центра практических навыков",
    title_kk: "Практикалық дағдылардың жаңа симуляциялық орталығының ашылуы",
    title_en: "Opening of the new simulation center of practical skills",
    date: "2024-02-10",
    category: "Образование",
    shortText_ru: "Колледж запустил ультрасовременный симуляционный центр с высокотехнологичными роботами-манекенами для отработки навыков неотложной помощи.",
    shortText_kk: "Колледж шұғыл көмек көрсету дағдыларын шыңдауға арналған жоғары технологиялық робот-манекендері бар ультразаманауи симуляциялық орталықты іске қосты.",
    shortText_en: "The college has launched an ultra-modern simulation center with high-tech robot mannequins for emergency medical skills training.",
    fullText_ru: "Для повышения качества подготовки специалистов в колледже был открыт новый симуляционный центр. Он оснащен интерактивными роботами-симуляторами шестого поколения, которые полностью имитируют физиологические реакции человека. Теперь студенты специальностей «Лечебное дело» и «Сестринское дело» могут отрабатывать навыки реанимации, акушерской помощи и хирургического ухода в условиях, максимально приближенных к клиническим.",
    fullText_kk: "Мамандарды даярлау сапасын арттыру мақсатында колледжде жаңа симуляциялық орталық ашылды. Ол адамның физиологиялық реакцияларын толықтай имитациялайтын алтыншы буынның интерактивті робот-симуляторларымен жабдықталған. Енді «Емдеу ісі» және «Мейіргер ісі» мамандықтарының студенттері реанимация, акушерлік көмек және хирургиялық күтім дағдыларын клиникалық жағдайларға барынша жақындатылған жағдайда шыңдай алады.",
    fullText_en: "To improve the quality of training, a new simulation center was opened at the college. It is equipped with interactive robot simulators of the sixth generation, which fully simulate physiological reactions of a human. Now students of 'General Medicine' and 'Nursing Care' can practice resuscitation, obstetric assistance, and surgical care in conditions as close as possible to clinical ones.",
    image: ""
  }
];

const defaultSpecialties = [
  {
    id: 1,
    name_ru: "Лечебное дело",
    name_kk: "Емдеу ісі",
    name_en: "General Medicine",
    qualification_ru: "Фельдшер",
    qualification_kk: "Фельдшер",
    qualification_en: "Physician Assistant (Feldsher)",
    duration_ru: "2 года 10 месяцев (11 кл.) / 3 года 10 месяцев (9 кл.)",
    duration_kk: "2 жыл 10 ай (11 сынып негізінде) / 3 жыл 10 ай (9 сынып негізінде)",
    duration_en: "2 years 10 months (after 11th grade) / 3 years 10 months (after 9th grade)",
    baseClass_ru: "9, 11 классы",
    baseClass_kk: "9, 11 сыныптар",
    baseClass_en: "Grades 9, 11",
    description_ru: "Подготовка специалистов для оказания первичной медико-санитарной и неотложной помощи.",
    description_kk: "Алғашқы медициналық-санитарлық және шұғыл көмек көрсету үшін мамандарды даярлау.",
    description_en: "Training specialists to provide primary healthcare and emergency services.",
    subjects_ru: "Анатомия, фармакология, терапия, хирургия, педиатрия, реаниматология",
    subjects_kk: "Анатомия, фармакология, терапия, хирургия, педиатрия, реаниматология",
    subjects_en: "Anatomy, pharmacology, internal medicine, surgery, pediatrics, resuscitation",
    details_ru: "Фельдшер ведет самостоятельный прием, ставит диагнозы, назначает лечение, руководит работой медсестер. Работает на станциях скорой помощи, в здравпунктах, сельских амбулаториях (ФАП).",
    details_kk: "Фельдшер өз бетінше қабылдау жүргізеді, диагноз қояды, ем тағайындайды, медбикелердің жұмысын басқарады. Жедел жәрдем станцияларында, денсаулық сақтау пункттерінде жұмыс істейді.",
    details_en: "A physician assistant holds independent appointments, diagnoses, prescribes treatment, and manages nursing staff. Works at ambulance stations, health posts, and rural clinics."
  },
  {
    id: 2,
    name_ru: "Сестринское дело",
    name_kk: "Мейіргер ісі",
    name_en: "Nursing Care",
    qualification_ru: "Медицинская сестра общей практики",
    qualification_kk: "Жалпы практикадағы медбике",
    qualification_en: "General Practice Nurse",
    duration_ru: "2 года 10 месяцев (11 кл.) / 3 года 10 месяцев (9 кл.)",
    duration_kk: "2 жыл 10 ай (11 сынып негізінде) / 3 жыл 10 ай (9 сынып негізінде)",
    duration_en: "2 years 10 months (after 11th grade) / 3 years 10 months (after 9th grade)",
    baseClass_ru: "9, 11 классы",
    baseClass_kk: "9, 11 сыныптар",
    baseClass_en: "Grades 9, 11",
    description_ru: "Подготовка медицинских сестер широкого профиля для работы в амбулаторных и стационарных условиях.",
    description_kk: "Амбулаториялық және стационарлық жағдайларда жұмыс істеу үшін кең профильді медбикелерді даярлау.",
    description_en: "Training generalist nurses for employment in inpatient and outpatient clinics.",
    subjects_ru: "Основы сестринского дела, гигиена, терапия, педиатрия, хирургия",
    subjects_kk: "Мейіргер ісі негіздері, гигиена, терапия, педиатрия, хирургия",
    subjects_en: "Fundamentals of nursing, hygiene, therapy, pediatrics, surgery",
    details_ru: "Специалист занимается уходом за больными, выполнением лечебно-профилактических назначений врача, ведением медицинской документации и пропагандой здорового образа жизни.",
    details_kk: "Маман науқастарды күтумен, дәрігердің емдік-профилактикалық нұсқауларын орындаумен, медициналық құжаттарды жүргізумен және салауатты өмір салтын насихаттаумен айналысады.",
    details_en: "A specialist is involved in patient care, executing therapeutic doctor prescriptions, keeping medical documentation, and promoting healthy lifestyles."
  }
];

// --- 2. FIRESTORE SYNC & INITIALIZATION LOGIC ---
async function syncAndLoadDB() {
  if (typeof db === 'undefined') {
    console.warn("Firebase global db is not initialized yet. Waiting...");
    return;
  }

  try {
    // 1. Settings Synchronization
    const settingsDocRef = db.collection("settings").doc("general");
    const settingsSnap = await settingsDocRef.get();
    let settingsData;

    if (!settingsSnap.exists) {
      await settingsDocRef.set(defaultSettings);
      settingsData = defaultSettings;
      console.log("Firestore settings initialized with defaults.");
    } else {
      settingsData = settingsSnap.data();
    }
    localStorage.setItem("college_settings", JSON.stringify(settingsData));

    // 2. Specialties Synchronization
    const specsSnap = await db.collection("specialties").get();
    let specsList = [];

    if (specsSnap.empty) {
      for (const spec of defaultSpecialties) {
        await db.collection("specialties").doc(String(spec.id)).set(spec);
      }
      specsList = defaultSpecialties;
      console.log("Firestore specialties initialized with defaults.");
    } else {
      specsSnap.forEach(doc => specsList.push(doc.data()));
    }
    localStorage.setItem("college_specialties", JSON.stringify(specsList));

    // 3. News Synchronization
    const newsSnap = await db.collection("news").get();
    let newsList = [];

    if (newsSnap.empty) {
      for (const n of defaultNews) {
        await db.collection("news").doc(String(n.id)).set(n);
      }
      newsList = defaultNews;
      console.log("Firestore news initialized with defaults.");
    } else {
      newsSnap.forEach(doc => newsList.push(doc.data()));
    }
    localStorage.setItem("college_news", JSON.stringify(newsList));

    // 4. Documents Synchronization
    const docsSnap = await db.collection("documents").get();
    let docsList = [];
    if (!docsSnap.empty) {
      docsSnap.forEach(doc => docsList.push(doc.data()));
    }
    localStorage.setItem("college_documents", JSON.stringify(docsList));

  } catch (error) {
    console.warn("Failed to sync with Firebase. Running from localStorage cache.", error);
  }

  // Render Page Content
  renderGlobalSettings();

  // Run Page-Specific Renderers based on clean Astro paths
  const path = window.location.pathname.toLowerCase();
  let cleanPath = path;
  if (cleanPath.startsWith('/med-college')) {
    cleanPath = cleanPath.substring('/med-college'.length);
  }
  if (cleanPath.startsWith('/kk') || cleanPath.startsWith('/en')) {
    cleanPath = cleanPath.substring(3);
  }
  if (cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  if (cleanPath === '' || cleanPath === '/index.html') {
    renderHomePage();
  } else if (cleanPath === '/about' || cleanPath === '/about.html') {
    renderAboutPage();
  } else if (cleanPath === '/specialties' || cleanPath === '/specialties.html') {
    renderSpecialtiesPage();
  } else if (cleanPath === '/admissions' || cleanPath === '/admissions.html') {
    initAdmissionsPage();
  } else if (cleanPath === '/contacts' || cleanPath === '/contacts.html') {
    initContactsPage();
  }
}

// Check if Firebase is loaded before syncing
if (typeof db !== 'undefined') {
  syncAndLoadDB();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(syncAndLoadDB, 500); // safety fallback delay
  });
}

function getCachedDB(key) {
  return JSON.parse(localStorage.getItem(key));
}

// --- 3. GLOBAL UI LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const hamburger = document.querySelector('.hamburger');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.overlay');

  if (hamburger && mobileDrawer && overlay) {
    const toggleMenu = () => {
      mobileDrawer.classList.toggle('open');
      overlay.classList.toggle('show');
      hamburger.classList.toggle('active');
      
      const spans = hamburger.querySelectorAll('span');
      if (mobileDrawer.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
        document.body.style.overflow = 'hidden';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
        document.body.style.overflow = '';
      }
    };

    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
    
    const drawerLinks = mobileDrawer.querySelectorAll('.nav-item');
    drawerLinks.forEach(link => link.addEventListener('click', toggleMenu));
  }

  // Sticky Header on Scroll
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Light/Dark Theme Switcher
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  const currentTheme = localStorage.getItem('theme') || 'light';

  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
    });
  });
});

// Render Global settings in header and footer
function renderGlobalSettings() {
  const settings = getCachedDB('college_settings');
  if (!settings) return;

  // Footer Contacts
  const footerAddress = document.getElementById('footer-address');
  const footerPhone = document.getElementById('footer-phone');
  const footerEmail = document.getElementById('footer-email');

  if (footerAddress) footerAddress.textContent = getLangText(settings, 'address');
  if (footerPhone) {
    footerPhone.textContent = settings.phone;
    footerPhone.href = `tel:${settings.phone.replace(/[^0-9+]/g, '')}`;
  }
  if (footerEmail) {
    footerEmail.textContent = settings.email;
    footerEmail.href = `mailto:${settings.email}`;
  }

  // Footer Social Links
  const footerInsta = document.getElementById('footer-insta');
  const footerFb = document.getElementById('footer-fb');
  const footerYoutube = document.getElementById('footer-youtube');

  if (footerInsta) footerInsta.href = settings.instagram;
  if (footerFb) footerFb.href = settings.facebook;
  if (footerYoutube) footerYoutube.href = settings.youtube;

  // SmartNation links
  const smartNationBtns = document.querySelectorAll('.smartnation-btn');
  smartNationBtns.forEach(btn => {
    btn.href = settings.smartnation;
  });
}

// --- 4. PAGE-SPECIFIC RENDERING LOGIC ---
function renderHomePage() {
  const news = getCachedDB('college_news') || [];
  const newsGrid = document.getElementById('news-grid');

  if (newsGrid) {
    newsGrid.innerHTML = '';
    const sortedNews = [...news].sort((a, b) => b.id - a.id).slice(0, 3);

    if (sortedNews.length === 0) {
      newsGrid.innerHTML = `<p class="text-center" style="grid-column: 1/-1;">${t('noNews')}</p>`;
      return;
    }

    sortedNews.forEach(item => {
      let imageMarkup = '';
      const newsTitle = getLangText(item, 'title');
      if (item.image && item.image.startsWith('data:image')) {
        imageMarkup = `<img src="${item.image}" alt="${newsTitle}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        let svgMarkup = '';
        if (item.category === 'Образование') {
          svgMarkup = `<svg viewBox="0 0 100 100" fill="currentColor"><rect x="25" y="25" width="50" height="50" rx="10" opacity="0.6"/><path d="M50 40 L50 60 M40 50 L60 50" stroke="white" stroke-width="6" stroke-linecap="round"/></svg>`;
        } else if (item.category === 'Абитуриенту') {
          svgMarkup = `<svg viewBox="0 0 100 100" fill="currentColor"><circle cx="50" cy="50" r="40" opacity="0.7"/><path d="M35 50 L45 60 L65 40" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        } else {
          svgMarkup = `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 10 C30 10 15 25 15 45 C15 70 50 90 50 90 C50 90 85 70 85 45 C85 25 70 10 50 10 Z M50 55 C44.5 55 40 50.5 40 45 C40 39.5 44.5 35 50 35 C55.5 35 60 39.5 60 45 C60 50.5 55.5 55 50 55 Z" opacity="0.8"/></svg>`;
        }
        imageMarkup = svgMarkup;
      }

      const card = document.createElement('div');
      card.className = 'news-card glass-card';
      card.innerHTML = `
        <div class="news-img">
          ${imageMarkup}
          <span class="news-tag">${item.category}</span>
        </div>
        <div class="news-content">
          <div class="news-date">
            <i class="far fa-calendar-alt"></i> ${formatDate(item.date)}
          </div>
          <h3 class="news-title">${newsTitle}</h3>
          <p class="news-desc">${getLangText(item, 'shortText')}</p>
          <a class="news-link" onclick="openNewsModal(${item.id})">${t('readMore')} <i class="fas fa-arrow-right"></i></a>
        </div>
      `;
      newsGrid.appendChild(card);
    });
  }

  // Count up animation
  const stats = document.querySelectorAll('.stat-num');
  const animateStats = () => {
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'));
      const count = +stat.innerText.replace(/[^0-9]/g, '');
      const speed = 100;
      const inc = target / speed;

      if (count < target) {
        stat.innerText = Math.ceil(count + inc) + (stat.getAttribute('data-suffix') || '');
        setTimeout(animateStats, 15);
      } else {
        stat.innerText = target + (stat.getAttribute('data-suffix') || '');
      }
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateStats();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('.stats-bar');
  if (statsSection) observer.observe(statsSection);
}

window.openNewsModal = function(id) {
  const news = getCachedDB('college_news') || [];
  const item = news.find(n => n.id === id);
  if (!item) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.id = 'news-modal';

  const newsTitle = getLangText(item, 'title');
  let imageMarkup = '';
  if (item.image && item.image.startsWith('data:image')) {
    imageMarkup = `<img src="${item.image}" alt="${newsTitle}" style="width:100%; max-height:280px; object-fit:cover; border-radius:8px; margin-bottom:20px;">`;
  }

  modal.innerHTML = `
    <div class="modal-content glass-card">
      <div class="modal-header">
        <span class="badge" style="background-color: var(--color-secondary); color: white;">${item.category}</span>
        <span class="modal-close" onclick="closeNewsModal()">&times;</span>
      </div>
      <h2 style="margin-bottom: 12px; color: var(--color-primary);">${newsTitle}</h2>
      <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 20px;">
        <i class="far fa-calendar-alt"></i> ${formatDate(item.date)}
      </p>
      ${imageMarkup}
      <div style="font-size: 1rem; color: var(--text-secondary); line-height: 1.7; white-space: pre-line;">
        ${getLangText(item, 'fullText')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
};

window.closeNewsModal = function() {
  const modal = document.getElementById('news-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
};

function renderAboutPage() {
  const settings = getCachedDB('college_settings');
  if (settings) {
    const directorGreeting = document.getElementById('director-greeting');
    const directorNameEl = document.getElementById('director-name');

    if (directorGreeting) directorGreeting.innerHTML = `&ldquo;${getLangText(settings, 'directorSpeech')}&rdquo;`;
    if (directorNameEl) directorNameEl.textContent = getLangText(settings, 'directorName');
  }

  // Render general documents list
  const docsList = getCachedDB('college_documents') || [];
  const container = document.getElementById('about-docs-list');
  if (container) {
    const generalDocs = docsList.filter(d => d.category === 'general');
    renderDocsWidget(generalDocs, container);
  }
}

function renderSpecialtiesPage() {
  const specialties = getCachedDB('college_specialties') || [];
  const specsGrid = document.getElementById('specs-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (!specsGrid) return;

  const renderList = (filter = 'all') => {
    specsGrid.innerHTML = '';
    const filtered = filter === 'all' 
      ? specialties 
      : specialties.filter(s => {
          const baseClassStr = s.baseClass_ru || s.baseClass || '';
          if (filter === '9class') return baseClassStr.includes('9');
          if (filter === '11class') return baseClassStr.includes('11');
          return true;
        });

    if (filtered.length === 0) {
      specsGrid.innerHTML = `<p class="text-center" style="grid-column: 1/-1;">${t('noSpecs')}</p>`;
      return;
    }

    filtered.forEach(spec => {
      const specName = getLangText(spec, 'name');
      let iconClass = 'fa-user-md';
      if (specName.toLowerCase().includes('сестрин')) iconClass = 'fa-user-nurse';
      if (specName.toLowerCase().includes('бакалавр')) iconClass = 'fa-graduation-cap';
      if (specName.toLowerCase().includes('акушер')) iconClass = 'fa-baby';
      if (specName.toLowerCase().includes('стомат')) iconClass = 'fa-tooth';
      if (specName.toLowerCase().includes('фарма')) iconClass = 'fa-pills';
      if (specName.toLowerCase().includes('лабор')) iconClass = 'fa-microscope';

      const card = document.createElement('div');
      card.className = 'spec-card glass-card';
      card.innerHTML = `
        <div class="spec-header">
          <div class="spec-icon">
            <i class="fas ${iconClass}"></i>
          </div>
          <div class="spec-title-box">
            <h3>${specName}</h3>
          </div>
        </div>
        <div class="spec-body">
          <div class="spec-meta">
            <div class="meta-item">
              <i class="fas fa-medal"></i>
              <span><strong>${t('qualification')}:</strong> ${getLangText(spec, 'qualification')}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-clock"></i>
              <span><strong>${t('duration')}:</strong> ${getLangText(spec, 'duration')}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-graduation-cap"></i>
              <span><strong>${t('baseClass')}:</strong> ${getLangText(spec, 'baseClass')}</span>
            </div>
          </div>
          <p class="spec-desc">${getLangText(spec, 'description')}</p>
        </div>
        <div class="spec-footer">
          <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="openSpecDetails(${spec.id})">${t('moreDetails')}</button>
        </div>
      `;
      specsGrid.appendChild(card);
    });
  };

  renderList();

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderList(btn.getAttribute('data-filter'));
    });
  });
}

window.openSpecDetails = function(id) {
  const specialties = getCachedDB('college_specialties') || [];
  const spec = specialties.find(s => s.id === id);
  if (!spec) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.id = 'spec-modal';

  const base = '/med-college';

  modal.innerHTML = `
    <div class="modal-content glass-card" style="max-width: 650px;">
      <div class="modal-header">
        <h2 style="color: var(--color-primary);">${getLangText(spec, 'name')}</h2>
        <span class="modal-close" onclick="closeSpecModal()">&times;</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px; font-size: 0.95rem; color: var(--text-secondary);">
        <p><strong>${t('qualification')}:</strong> ${getLangText(spec, 'qualification')}</p>
        <p><strong>${t('baseClass')}:</strong> ${getLangText(spec, 'baseClass')}</p>
        <p><strong>${t('duration')}:</strong> ${getLangText(spec, 'duration')}</p>
        <hr style="border: 0; border-top: 1px solid var(--border-color);">
        <div>
          <h4 style="color: var(--text-primary); margin-bottom: 6px;">${t('activityArea')}</h4>
          <p>${getLangText(spec, 'details')}</p>
        </div>
        <div>
          <h4 style="color: var(--text-primary); margin-bottom: 6px;">${t('subjects')}</h4>
          <p>${getLangText(spec, 'subjects')}</p>
        </div>
      </div>
      <div style="margin-top: 24px; display: flex; gap: 12px;">
        <a href="${base}/${currentLang === 'ru' ? '' : currentLang + '/'}admissions" class="btn btn-primary btn-sm" style="flex-grow: 1; text-align: center;">${t('rulesBtn')}</a>
        <button class="btn btn-outline btn-sm" onclick="closeSpecModal()">${t('closeBtn')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
};

window.closeSpecModal = function() {
  const modal = document.getElementById('spec-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
};

function initAdmissionsPage() {
  const calcForm = document.getElementById('calc-form');
  const calcResult = document.getElementById('calc-result');

  if (calcForm && calcResult) {
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const math = parseFloat(document.getElementById('score-math').value) || 0;
      const biology = parseFloat(document.getElementById('score-bio').value) || 0;
      const lang = parseFloat(document.getElementById('score-lang').value) || 0;
      const history = parseFloat(document.getElementById('score-hist').value) || 0;

      const avg = (math + biology + lang + history) / 4;
      
      let chanceText = '';
      let chanceClass = '';

      if (avg >= 4.5) {
        chanceText = t('chanceHigh');
        chanceClass = 'chance-high';
      } else if (avg >= 3.8) {
        chanceText = t('chanceMed');
        chanceClass = 'chance-med';
      } else {
        chanceText = t('chanceLow');
        chanceClass = 'chance-low';
      }

      calcResult.querySelector('.score-val').textContent = avg.toFixed(2);
      
      const badge = calcResult.querySelector('.chance-badge');
      badge.textContent = chanceText;
      badge.className = `chance-badge ${chanceClass}`;
      
      calcResult.style.display = 'block';
    });
  }

  const faqHeaders = document.querySelectorAll('.faq-header');
  faqHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });

  // Render admissions documents list
  const docsList = getCachedDB('college_documents') || [];
  const container = document.getElementById('admission-docs-list');
  if (container) {
    const admissionDocs = docsList.filter(d => d.category === 'admission');
    renderDocsWidget(admissionDocs, container);
  }
}

function initContactsPage() {
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const phone = document.getElementById('cf-phone').value.trim();
      const subject = document.getElementById('cf-subject').value.trim();
      const message = document.getElementById('cf-message').value.trim();

      if (!name || !email || !phone || !message) {
        alert(t('fields'));
        return;
      }

      const newMsg = {
        name,
        email,
        phone,
        subject: subject || t('defaultSubj'),
        message,
        date: new Date().toISOString().split('T')[0],
        status: 'unread'
      };

      try {
        await db.collection("messages").add(newMsg);
        contactForm.reset();
        alert(t('success'));
      } catch (error) {
        console.error("Failed to send message to Firestore: ", error);
        alert(t('error'));
      }
    });
  }
}

// Render dynamic documents download widget
function renderDocsWidget(docs, container) {
  container.innerHTML = '';
  if (docs.length === 0) {
    const emptyMsg = currentLang === 'ru' 
      ? 'Документов пока нет.' 
      : currentLang === 'kk' 
      ? 'Құжаттар әлі жоқ.' 
      : 'No documents available yet.';
    container.innerHTML = `<p style="color: var(--text-tertiary); font-size: 0.95rem;">${emptyMsg}</p>`;
    return;
  }

  docs.forEach(d => {
    const docName = getLangText(d, 'name');
    let fileIcon = 'fa-file-alt';
    if (d.fileType && d.fileType.includes('pdf')) fileIcon = 'fa-file-pdf';
    else if (d.fileType && (d.fileType.includes('word') || d.fileType.includes('document') || d.fileName.endsWith('.doc') || d.fileName.endsWith('.docx'))) fileIcon = 'fa-file-word';
    else if (d.fileType && (d.fileType.includes('sheet') || d.fileType.includes('excel') || d.fileName.endsWith('.xls') || d.fileName.endsWith('.xlsx'))) fileIcon = 'fa-file-excel';

    const btn = document.createElement('button');
    btn.className = 'doc-download-item';
    btn.onclick = () => downloadBase64File(d.fileData, d.fileName);
    btn.innerHTML = `
      <div class="doc-file-icon">
        <i class="fas ${fileIcon}"></i>
      </div>
      <div class="doc-file-info">
        <h4>${docName}</h4>
        <p>${d.fileName}</p>
      </div>
      <div class="doc-file-action">
        <i class="fas fa-download"></i>
      </div>
    `;
    container.appendChild(btn);
  });
}

// Helper Date formatter
function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const locale = currentLang === 'ru' ? 'ru-RU' : currentLang === 'kk' ? 'kk-KK' : 'en-US';
  return new Date(dateStr).toLocaleDateString(locale, options);
}

window.downloadBase64File = function(base64Data, fileName) {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Global functions exposed to window for inline onclicks
window.formatDate = formatDate;
window.renderGlobalSettings = renderGlobalSettings;
