import type {
  AgeTheme,
  HeroSlide,
  HomeSection,
  LanguageRecord,
  PluginRecord,
  PortalLink,
  RegistrationField,
  SettingsMap,
  SourceRef,
  StoryTheme,
  CategoryRecord,
  ContentItem,
  PublicUser,
} from "@/core/types";

export type SeedCategory = Omit<CategoryRecord, "id" | "parentId"> & { parentKey?: string };
export type SeedPlugin = Omit<PluginRecord, "updatedAt">;
export type SeedUser = Omit<PublicUser, "id" | "createdAt"> & { password: string };
export type SeedContent = Partial<Omit<ContentItem, "id" | "createdAt" | "updatedAt">> &
  Pick<ContentItem, "title" | "summary"> & { categoryKey: string; treeKey: string; daysAgo: number };

const src = (title: string, publisher: string, url: string, year = "۱۴۰۲"): SourceRef => ({ title, publisher, url, year });

export const DEFAULT_AGE_THEMES: AgeTheme[] = [
  {
    id: "child", label: "کودک (۷ تا ۱۱ سال)", min: 7, max: 11, icon: "🧸",
    description: "رنگ‌های شاد، کارت‌های گرد، تایپوگرافی بزرگ و اولویت بازی و انیمیشن",
    priority: ["game", "image", "video", "article"],
    colors: { primary: "#f97316", secondary: "#fb7185", accent: "#22c55e", background: "#fff8ee", surface: "#ffffff", text: "#422818", muted: "#8a6347" },
    radius: 24, fontScale: 1.08, mood: "playful", motif: "stars",
  },
  {
    id: "teen", label: "نوجوان (۱۲ تا ۱۷ سال)", min: 12, max: 17, icon: "⚡",
    description: "پالت پرانرژی آبی الکتریکی و ایندیگو، کنتراست بالا و کارت‌های پویا",
    priority: ["video", "game", "image", "article"],
    colors: { primary: "#4f46e5", secondary: "#0284c7", accent: "#f43f5e", background: "#f4f6ff", surface: "#ffffff", text: "#111827", muted: "#64748b" },
    radius: 14, fontScale: 1.02, mood: "energetic", motif: "grid",
  },
  {
    id: "youth", label: "جوان و دانشجو (۱۸ تا ۲۹ سال)", min: 18, max: 29, icon: "🚀",
    description: "هویت بصری مدرن زمردی و کهربایی، اولویت ویدئو، ارائه و پژوهش کاربردی",
    priority: ["video", "presentation", "pdf", "article"],
    colors: { primary: "#0f766e", secondary: "#0284c7", accent: "#f59e0b", background: "#effaf7", surface: "#ffffff", text: "#0f2926", muted: "#4d6b66" },
    radius: 10, fontScale: 1.0, mood: "modern", motif: "arabesque",
  },
  {
    id: "adult", label: "بزرگسال، والدین و مربیان (۳۰+ سال)", min: 30, max: 100, icon: "📖",
    description: "پالت آرام پژوهشی، سرمه‌ای، اسلیت و زمردی با کارت‌های منظم",
    priority: ["pdf", "presentation", "video", "article"],
    colors: { primary: "#12314b", secondary: "#0f766e", accent: "#c8a45d", background: "#f5f4ef", surface: "#ffffff", text: "#172535", muted: "#6b7280" },
    radius: 8, fontScale: 0.96, mood: "editorial", motif: "geometric",
  },
];

export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: "smart", title: "پیشنهادهای هوشمند برای شما", source: "smart", enabled: true, limit: 8, order: 1 },
  { id: "trending", title: "پربازدیدترین و برترین‌های هفته", source: "trending", enabled: true, limit: 10, order: 2 },
  { id: "games", title: "بازی‌ها و انیمیشن‌های آموزشی", source: "category", categoryKey: "portal-games", enabled: true, limit: 8, order: 3 },
  { id: "docs", title: "فیلم‌ها و مستندهای تبیینی", source: "category", categoryKey: "portal-docs", enabled: true, limit: 8, order: 4 },
  { id: "books", title: "کتاب‌ها و جزوات پیشنهادی", source: "category", categoryKey: "portal-books", enabled: true, limit: 8, order: 5 },
  { id: "latest", title: "جدیدترین محتواهای چندرسانه‌ای", source: "latest", enabled: true, limit: 8, order: 6 },
];

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "hero-1", title: "روایت مستند، با پشتوانه منبع", subtitle: "بانک محتوای تبیینی، تحلیلی، فرهنگی و مهارتی استودیو معراج اندیشه؛ از بازی کودکانه تا پژوهش تخصصی.",
    image: "/images/hero.jpg", cta: "ورود به بانک محتوا", target: "bank", badge: "مرجع محتوای مستند",
  },
  {
    id: "hero-2", title: "یادگیری متناسب با هر سن", subtitle: "با انتخاب گروه سنی، اولویت محتوا و تمام ظاهر سامانه به شکل خودکار دگرگون می‌شود.",
    image: "/images/game.jpg", cta: "مشاهده بازی‌های آموزشی", target: "games", badge: "تم‌های سنی هوشمند",
  },
  {
    id: "hero-3", title: "هر فرمت، یک تجربه کامل", subtitle: "ویدئو، پادکست، پی‌دی‌اف، پاورپوینت، فایل ورد، صفحه گسترده و پیوندهای خارجی؛ همه در نمایشگر یکپارچه.",
    image: "/images/books.jpg", cta: "جستجو در منابع", target: "bank", badge: "پشتیبانی از هر نوع فایل",
  },
];

export const DEFAULT_PORTAL_LINKS: PortalLink[] = [
  { id: "home", label: "صفحه اصلی", labelKey: "home", target: "home", enabled: true, order: 1 },
  { id: "games", label: "بازی‌های سبک آموزشی", labelKey: "games", target: "games", enabled: true, order: 2 },
  { id: "docs", label: "فیلم‌ها و مستندها", labelKey: "documentaries", target: "docs", enabled: true, order: 3 },
  { id: "books", label: "معرفی کتاب‌ها", labelKey: "books", target: "books", enabled: true, order: 4 },
  { id: "tree", label: "درختواره بانک محتوا", labelKey: "tree", target: "tree", enabled: true, order: 5 },
];

export const DEFAULT_REGISTRATION_FIELDS: RegistrationField[] = [
  { id: "firstName", label: "نام", type: "text", required: true, enabled: true },
  { id: "lastName", label: "نام خانوادگی", type: "text", required: true, enabled: true },
  { id: "phone", label: "شماره تلفن", type: "tel", required: true, enabled: true, placeholder: "09123456789" },
  { id: "country", label: "کشور", type: "select", required: true, enabled: true, options: ["ایران", "عراق", "لبنان", "سایر"] },
  { id: "province", label: "استان", type: "text", required: true, enabled: true },
  { id: "city", label: "شهر", type: "text", required: true, enabled: true },
  { id: "password", label: "گذرواژه", type: "password", required: true, enabled: true },
];

export const DEFAULT_STORY_THEMES: StoryTheme[] = [
  { id: "editorial", label: "پژوهشی سرمه‌ای", background: "#102a43", accent: "#c8a45d", text: "#ffffff", pattern: "geometric" },
  { id: "emerald", label: "زمردی فرهنگی", background: "#064e3b", accent: "#fbbf24", text: "#ffffff", pattern: "arabesque" },
  { id: "vibrant", label: "پرانرژی نوجوان", background: "#4338ca", accent: "#22d3ee", text: "#ffffff", pattern: "grid" },
];

export const DEFAULT_SETTINGS: SettingsMap = {
  site: {
    title: "بانک محتوا | استودیو معراج اندیشه",
    subtitle: "مرجع محتواهای مستند تبیینی، تحلیلی، فرهنگی و مهارتی",
    logo: "✦",
    watermark: "استودیو معراج اندیشه",
    footerBio: "استودیو معراج اندیشه مجموعه‌ای پژوهشی برای تولید، مستندسازی و توزیع محتوای تبیینی، تحلیلی، فرهنگی و مهارتی است. هر محتوا با منبع معتبر و قابلیت ردیابی ارجاع عرضه می‌شود.",
    footerContact: "تهران، میدان اندیشه | پشتیبانی: ۰۲۱-۱۲۳۴۵۶۷۸ | content@merajandisheh.ir",
    footerRules: "نمایش و پخش محتوا آزاد است. دانلود فایل اصلی مستلزم ورود یا ثبت نام است. بازنشر با ذکر منبع مجاز است.",
  },
  ageThemes: DEFAULT_AGE_THEMES,
  homeSections: DEFAULT_HOME_SECTIONS,
  heroSlides: DEFAULT_HERO_SLIDES,
  portalLinks: DEFAULT_PORTAL_LINKS,
  registrationFields: DEFAULT_REGISTRATION_FIELDS,
  storyThemes: DEFAULT_STORY_THEMES,
  personalization: { enabledByDefault: true, allowUserToggle: true, decayDays: 30 },
  downloadGate: { requireLogin: true, previewOpen: true, message: "نمایش و پخش آزاد است؛ دانلود نیازمند حساب کاربری است." },
  visual: { fontFamily: "auto", motifOpacity: 0.075, headerBlur: true, compactMode: false },
  backup: { enabled: true, intervalDays: 7, webhookUrl: "", secretToken: "", autoPush: true } as Record<string, unknown>,
};

export const DEFAULT_CATEGORIES: SeedCategory[] = [
  { key: "portal-home", label: "صفحه اصلی", icon: "🏠", kind: "portal", sort: 1, enabled: true, color: "#0f766e" },
  { key: "portal-games", label: "بازی‌های سبک آموزشی", icon: "🎮", kind: "portal", sort: 2, enabled: true, color: "#f59e0b" },
  { key: "portal-docs", label: "فیلم‌ها و مستندها", icon: "🎬", kind: "portal", sort: 3, enabled: true, color: "#dc2626" },
  { key: "portal-books", label: "معرفی کتاب‌ها", icon: "📚", kind: "portal", sort: 4, enabled: true, color: "#0f766e" },
  { key: "portal-tree", label: "درختواره بانک محتوا", icon: "🌳", kind: "portal", sort: 5, enabled: true, color: "#c8a45d" },
  { key: "portal-bank", label: "بانک محتوا", icon: "🗂️", kind: "portal", sort: 6, enabled: true, color: "#12314b" },

  { key: "topic-media", label: "سواد رسانه‌ای", icon: "📰", kind: "topic", sort: 1, enabled: true, color: "#4f46e5" },
  { key: "topic-history", label: "تاریخ و هویت", icon: "🏛️", kind: "topic", sort: 2, enabled: true, color: "#c8a45d" },
  { key: "topic-culture", label: "فرهنگ و سبک زندگی", icon: "🪴", kind: "topic", sort: 3, enabled: true, color: "#0f766e" },
  { key: "topic-analysis", label: "تحلیل و تبیین", icon: "🔍", kind: "topic", sort: 4, enabled: true, color: "#12314b" },
  { key: "topic-skills", label: "مهارت‌ها و آموزش", icon: "🧠", kind: "topic", sort: 5, enabled: true, color: "#ea580c" },
  { key: "topic-family", label: "خانواده و تربیت", icon: "👨‍👩‍👧", kind: "topic", sort: 6, enabled: true, color: "#db2777" },

  { key: "tree-explanation", label: "تبیین و بصیرت", icon: "◈", kind: "tree", sort: 1, enabled: true, color: "#12314b" },
  { key: "tree-media", label: "رسانه و سواد رسانه‌ای", icon: "◇", kind: "tree", sort: 1, parentKey: "tree-explanation", enabled: true, color: "#4f46e5" },
  { key: "tree-history", label: "تاریخ و هویت ملی", icon: "◇", kind: "tree", sort: 2, parentKey: "tree-explanation", enabled: true, color: "#c8a45d" },
  { key: "tree-archive", label: "اسناد و آرشیو", icon: "↳", kind: "tree", sort: 1, parentKey: "tree-history", enabled: true, color: "#64748b" },
  { key: "tree-culture", label: "فرهنگ و سبک زندگی", icon: "◈", kind: "tree", sort: 2, enabled: true, color: "#0f766e" },
  { key: "tree-books", label: "کتاب و اندیشه", icon: "◇", kind: "tree", sort: 1, parentKey: "tree-culture", enabled: true, color: "#0f766e" },
  { key: "tree-family", label: "خانواده و تربیت", icon: "◇", kind: "tree", sort: 2, parentKey: "tree-culture", enabled: true, color: "#db2777" },
  { key: "tree-skills", label: "مهارت‌ها و یادگیری", icon: "◈", kind: "tree", sort: 3, enabled: true, color: "#ea580c" },
  { key: "tree-presentation", label: "ارائه و روایتگری", icon: "◇", kind: "tree", sort: 1, parentKey: "tree-skills", enabled: true, color: "#ea580c" },
  { key: "tree-game", label: "بازی و یادگیری", icon: "◇", kind: "tree", sort: 2, parentKey: "tree-skills", enabled: true, color: "#f59e0b" },

  { key: "topic", label: "موضوع", icon: "🧭", kind: "filter-group", sort: 1, enabled: true, color: null },
  { key: "topic:media", label: "سواد رسانه‌ای", icon: "", kind: "filter-item", parentKey: "topic", sort: 1, enabled: true, color: null },
  { key: "topic:history", label: "تاریخ و هویت", icon: "", kind: "filter-item", parentKey: "topic", sort: 2, enabled: true, color: null },
  { key: "topic:culture", label: "فرهنگ و سبک زندگی", icon: "", kind: "filter-item", parentKey: "topic", sort: 3, enabled: true, color: null },
  { key: "topic:analysis", label: "تحلیل و تبیین", icon: "", kind: "filter-item", parentKey: "topic", sort: 4, enabled: true, color: null },
  { key: "topic:skills", label: "مهارت‌ها", icon: "", kind: "filter-item", parentKey: "topic", sort: 5, enabled: true, color: null },
  { key: "topic:family", label: "خانواده و تربیت", icon: "", kind: "filter-item", parentKey: "topic", sort: 6, enabled: true, color: null },

  { key: "format", label: "نوع رسانه و فایل", icon: "📎", kind: "filter-group", sort: 2, enabled: true, color: null },
  { key: "format:video", label: "ویدئو و مستند", icon: "", kind: "filter-item", parentKey: "format", sort: 1, enabled: true, color: null },
  { key: "format:audio", label: "صوت و پادکست", icon: "", kind: "filter-item", parentKey: "format", sort: 2, enabled: true, color: null },
  { key: "format:image", label: "تصویر و اینفوگرافیک", icon: "", kind: "filter-item", parentKey: "format", sort: 3, enabled: true, color: null },
  { key: "format:pdf", label: "پی‌دی‌اف و کتاب", icon: "", kind: "filter-item", parentKey: "format", sort: 4, enabled: true, color: null },
  { key: "format:presentation", label: "پاورپوینت و اسلاید", icon: "", kind: "filter-item", parentKey: "format", sort: 5, enabled: true, color: null },
  { key: "format:office", label: "ورد و آفیس", icon: "", kind: "filter-item", parentKey: "format", sort: 6, enabled: true, color: null },
  { key: "format:spreadsheet", label: "صفحه گسترده", icon: "", kind: "filter-item", parentKey: "format", sort: 7, enabled: true, color: null },
  { key: "format:archive", label: "بسته فشرده", icon: "", kind: "filter-item", parentKey: "format", sort: 8, enabled: true, color: null },
  { key: "format:game", label: "بازی آموزشی", icon: "", kind: "filter-item", parentKey: "format", sort: 9, enabled: true, color: null },
  { key: "format:article", label: "مقاله و متن", icon: "", kind: "filter-item", parentKey: "format", sort: 10, enabled: true, color: null },
  { key: "format:link", label: "پیوند خارجی", icon: "", kind: "filter-item", parentKey: "format", sort: 11, enabled: true, color: null },

  { key: "age", label: "گروه سنی", icon: "🎯", kind: "filter-group", sort: 3, enabled: true, color: null },
  { key: "age:child", label: "کودک (۷–۱۱)", icon: "", kind: "filter-item", parentKey: "age", sort: 1, enabled: true, color: null },
  { key: "age:teen", label: "نوجوان (۱۲–۱۷)", icon: "", kind: "filter-item", parentKey: "age", sort: 2, enabled: true, color: null },
  { key: "age:youth", label: "جوان و دانشجو (۱۸–۲۹)", icon: "", kind: "filter-item", parentKey: "age", sort: 3, enabled: true, color: null },
  { key: "age:adult", label: "بزرگسال و مربیان", icon: "", kind: "filter-item", parentKey: "age", sort: 4, enabled: true, color: null },

  { key: "portal", label: "درگاه", icon: "🚪", kind: "filter-group", sort: 4, enabled: true, color: null },
  { key: "portal:games", label: "بازی‌ها", icon: "", kind: "filter-item", parentKey: "portal", sort: 1, enabled: true, color: null },
  { key: "portal:docs", label: "مستندها", icon: "", kind: "filter-item", parentKey: "portal", sort: 2, enabled: true, color: null },
  { key: "portal:books", label: "کتاب‌ها", icon: "", kind: "filter-item", parentKey: "portal", sort: 3, enabled: true, color: null },
  { key: "portal:bank", label: "بانک جامع", icon: "", kind: "filter-item", parentKey: "portal", sort: 4, enabled: true, color: null },

  { key: "source", label: "نوع منبع", icon: "📌", kind: "filter-group", sort: 5, enabled: true, color: null },
  { key: "source:documented", label: "دارای منبع مکتوب", icon: "", kind: "filter-item", parentKey: "source", sort: 1, enabled: true, color: null },
  { key: "source:url", label: "دارای پیوند مرجع", icon: "", kind: "filter-item", parentKey: "source", sort: 2, enabled: true, color: null },

  { key: "fmt-video", label: "ویدئو", icon: "🎬", kind: "format", sort: 1, enabled: true, color: "#dc2626" },
  { key: "fmt-audio", label: "پادکست", icon: "🎧", kind: "format", sort: 2, enabled: true, color: "#7c3aed" },
  { key: "fmt-image", label: "اینفوگرافیک", icon: "🖼️", kind: "format", sort: 3, enabled: true, color: "#0891b2" },
  { key: "fmt-pdf", label: "PDF", icon: "📕", kind: "format", sort: 4, enabled: true, color: "#e11d48" },
  { key: "fmt-pptx", label: "PowerPoint", icon: "📊", kind: "format", sort: 5, enabled: true, color: "#ea580c" },
  { key: "fmt-docx", label: "Word", icon: "📝", kind: "format", sort: 6, enabled: true, color: "#2563eb" },
  { key: "fmt-xlsx", label: "Spreadsheet", icon: "📈", kind: "format", sort: 7, enabled: true, color: "#16a34a" },
  { key: "fmt-zip", label: "Archive", icon: "🗜️", kind: "format", sort: 8, enabled: true, color: "#64748b" },
  { key: "fmt-link", label: "External", icon: "🌐", kind: "format", sort: 9, enabled: true, color: "#475569" },
  { key: "fmt-game", label: "Game", icon: "🎮", kind: "format", sort: 10, enabled: true, color: "#f59e0b" },
];

export const DEFAULT_PLUGINS: SeedPlugin[] = [
  { key: "ticker", enabled: true, config: { messages: ["پشتیبانی کامل از پاورپوینت، PDF، ویدئو و هر نوع فایل", "خوراک هوشمند متناسب با گروه سنی شما فعال است", " پشتیبان‌گیری خودکار هفتگی از کل پیکربندی سامانه"], speed: 38 } },
  { key: "trending", enabled: true, config: { limit: 10, days: 7 } },
  { key: "ratings", enabled: true, config: { comments: true, requireLoginForComment: false } },
  { key: "share", enabled: true, config: { networks: ["تلگرام", "واتساپ", "ایمیل", "کپی پیوند"] } },
];

export const DEFAULT_LANGUAGE_ROWS: LanguageRecord[] = [
  { code: "fa", label: "Persian", nativeLabel: "فارسی", direction: "rtl", font: "Vazirmatn", calendar: "persian", motif: "geometric", enabled: true, labels: {}, sort: 1 },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", direction: "rtl", font: "Cairo", calendar: "islamic-umalqura", motif: "arabesque", enabled: true, labels: {}, sort: 2 },
  { code: "en", label: "English", nativeLabel: "English", direction: "ltr", font: "Inter", calendar: "gregory", motif: "minimal", enabled: true, labels: {}, sort: 3 },
];

export const DEFAULT_USERS: SeedUser[] = [
  {
    username: "admin", password: "1234", role: "super_admin", displayName: "مدیر کل استودیو", enabled: true,
    permissions: ["analytics", "content", "taxonomy", "visual", "plugins", "users", "languages", "backups"], profile: {},
  },
  {
    username: "staff", password: "1234", role: "staff", displayName: "همکار محتوایی", enabled: true,
    permissions: ["analytics", "content", "taxonomy"], profile: { phone: "09120000000" },
  },
  {
    username: "editor", password: "1234", role: "staff", displayName: "ویراستار و تحلیلگر", enabled: true,
    permissions: ["content", "plugins", "visual"], profile: { phone: "09130000000" },
  },
];

const VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
const AUDIO = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

export const DEFAULT_CONTENTS: SeedContent[] = [
  {
    title: "بازی «مسیر آگاهی»: تشخیص خبر درست از شایعه", slug: "message-awareness-game",
    summary: "یک بازی تعاملی کوتاه برای تمرین تشخیص خبر معتبر، بررسی منبع و مقابله با شایعات در فضای مجازی.",
    body: "در هر مرحله یک گزاره نمایش داده می‌شود. بازیکن باید بر اساس نشانه‌های اعتبار منبع، تاریخ و سند، تصمیم بگیرد. هدف آموزش عملی سواد رسانه‌ای به کودکان و نوجوانان است.",
    keywords: ["سواد رسانه‌ای", "شایعه", "تفکر نقادانه", "بازی"], figures: ["مخاطب کودک و نوجوان", "چک لیست اعتبارسنجی"],
    sources: [src("چارچوب سواد رسانه‌ای و اطلاعاتی", "یونسکو", "https://www.unesco.org/en/media-information-literacy", "۲۰۲۱")],
    portal: "games", topic: "media", format: "game", mediaKind: "game", gameKey: "quiz", thumbnail: "/images/game.jpg",
    ageGroups: ["child", "teen"], categoryKey: "topic-media", treeKey: "tree-media", views: 1284, likes: 342, ratingSum: 438, ratingCount: 96,
    slideCount: null, featured: true, daysAgo: 2,
  },
  {
    title: "مستند «روایت یک ملت»؛ از مشروطه تا امروز", slug: "nation-narrative-documentary",
    summary: "روایتی تصویری و مستند از تحولات هویتی ایران معاصر با اتکا به اسناد آرشیوی و گفتار پژوهشگران.",
    body: "این مستند در سه فصل، پیوند میان تحولات تاریخی، رسانه و حافظه جمعی را بررسی می‌کند. هر فصل با ارجاع به اسناد کتابخانه ملی و پژوهشگاه فرهنگ، هنر و ارتباطات مستندسازی شده است.",
    keywords: ["تاریخ معاصر", "هویت ملی", "مستند", "مشروطه"], figures: ["موسسه مطالعات تاریخ معاصر ایران", "اسناد کتابخانه ملی"],
    sources: [src("آرشیو اسناد تاریخ معاصر", "سازمان اسناد و کتابخانه ملی ایران", "https://www.nlai.ir", "۱۴۰۱"), src("گزارش تحلیل روایت تاریخی", "پژوهشگاه فرهنگ، هنر و ارتباطات", "https://www.irna.ir", "۱۴۰۲")],
    portal: "docs", topic: "history", format: "mp4", mediaKind: "video", externalUrl: VIDEO, thumbnail: "/images/documentary.jpg", duration: "۴۲ دقیقه",
    ageGroups: ["teen", "youth", "adult"], categoryKey: "topic-history", treeKey: "tree-history", views: 3210, likes: 588, ratingSum: 567, ratingCount: 121, featured: true, daysAgo: 4,
  },
  {
    title: "کتاب «تفکر نقادانه در عصر رسانه»", slug: "critical-thinking-media-book",
    summary: "مروری بر کتابی پژوهشی درباره الگوریتم‌ها، سوگیری شناختی و روش‌های ارزیابی روایت‌های رسانه‌ای.",
    body: "نسخه مطالعاتی این اثر شامل خلاصه فصل‌ها، نمودار مفهومی و پرسش‌هایی برای بحث گروهی والدین و مربیان است. فایل پیوست، جزوه معرفی و بررسی کتاب است.",
    keywords: ["کتاب", "تفکر نقادانه", "رسانه", "سوگیری"], figures: ["فصل الگوریتم و حقیقت", "نمودار پنج پرسش کلیدی"],
    sources: [src("فهرستگان منابع کتابخانه ملی", "سازمان اسناد و کتابخانه ملی ایران", "https://www.nlai.ir", "۱۴۰۰")],
    portal: "books", topic: "analysis", format: "pdf", mediaKind: "pdf", fileUrl: "/samples/meraj-guide.pdf", fileSize: "PDF • ۴.۲ KB", thumbnail: "/images/books.jpg",
    ageGroups: ["youth", "adult"], categoryKey: "topic-analysis", treeKey: "tree-books", views: 1876, likes: 211, ratingSum: 390, ratingCount: 84, daysAgo: 7,
  },
  {
    title: "پاورپوینت «اصول تبیین و روایتگری»", slug: "explanation-narration-presentation",
    summary: "بسته اسلاید کارگاهی برای مربیان: ساختار روایت، سلسله مراتب پیام، طراحی اسلاید و ارجاع منبع.",
    body: "فایل پاورپوینت شامل ۲۸ اسلاید، تمرین‌های گروهی و الگوی ارجاعدهی استودیو است. پیشنمایش اسلایدها بدون نیاز به نرم افزار خارجی در سامانه نمایش داده می‌شود.",
    keywords: ["پاورپوینت", "تبیین", "روایتگری", "مربیان", "ارائه"], figures: ["۲۸ اسلاید", "۴ تمرین کارگاهی"],
    sources: [src("راهنمای تولید محتوای تبیینی", "استودیو معراج اندیشه", "https://www.irna.ir", "۱۴۰۲")],
    portal: "bank", topic: "skills", format: "pptx", mediaKind: "presentation", fileUrl: "/samples/meraj-presentation.pptx", fileSize: "PPTX • ۳.۶ KB", slideCount: 28,
    slideTitles: ["نقشه راه کارگاه", "چرا تبیین؟", "مخاطب و زمینه", "ساختار روایت", "پیام مرکزی", "سند و ارجاع", "طراحی اسلاید", "تمرین گروهی"],
    thumbnail: "/images/infographic.jpg", ageGroups: ["teen", "youth", "adult"], categoryKey: "topic-skills", treeKey: "tree-presentation", views: 2460, likes: 301, ratingSum: 452, ratingCount: 96, featured: true, daysAgo: 1,
  },
  {
    title: "اینفوگرافیک «نقشه ذهن مخاطب»", slug: "audience-mind-map",
    summary: "نقشه بصری مسیر پردازش پیام، از توجه تا باور و اقدام، ویژه کارگاه‌های سواد رسانه‌ای.",
    body: "این تصویر قابل بزرگنمایی است و برای چاپ در کلاس یا استفاده در ارائه طراحی شده است. لایه‌های مختلف مسیر پیام با رنگ‌های مجزا مشخص شدهاند.",
    keywords: ["اینفوگرافیک", "مخاطب", "اقناع", "رسانه"], figures: ["توجه", "درک", "باور", "اقدام"],
    sources: [src("چارچوب سواد رسانه‌ای و اطلاعاتی", "یونسکو", "https://www.unesco.org/en/media-information-literacy", "۲۰۲۱")],
    portal: "bank", topic: "media", format: "png", mediaKind: "image", fileUrl: "/images/infographic.jpg", thumbnail: "/images/infographic.jpg", fileSize: "PNG • تصویر شاخص",
    ageGroups: ["teen", "youth", "adult"], categoryKey: "topic-media", treeKey: "tree-media", views: 1655, likes: 188, ratingSum: 345, ratingCount: 76, daysAgo: 3,
  },
  {
    title: "پادکست «گفتارهای تبیینی ۰۱: حافظه و رسانه»", slug: "explanatory-talks-01",
    summary: "گفتاری صوتی درباره نقش رسانه در شکلگیری حافظه جمعی و مسئولیت روایتگر.",
    body: "اپیزود نخست مجموعه گفتارهای تبیینی. متن پیادهسازی شده و فهرست منابع درون محتوا قرار دارد.",
    keywords: ["پادکست", "حافظه جمعی", "تبیین", "رسانه"], figures: ["گفتار اول", "منابع پیشنهادی"],
    sources: [src("پژوهشنامه فرهنگ و ارتباطات", "پژوهشگاه فرهنگ، هنر و ارتباطات", "https://www.irna.ir", "۱۴۰۱")],
    portal: "docs", topic: "analysis", format: "mp3", mediaKind: "audio", externalUrl: AUDIO, thumbnail: "/images/hero.jpg", duration: "۳ دقیقه",
    ageGroups: ["youth", "adult"], categoryKey: "topic-analysis", treeKey: "tree-explanation", views: 912, likes: 104, ratingSum: 221, ratingCount: 49, daysAgo: 6,
  },
  {
    title: "درسنامه «سواد رسانه‌ای برای نوجوان»", slug: "teen-media-literacy-lesson",
    summary: "جزوه آموزشی هفت جلسه‌ای با تمرین، سناریو و چکلیست ارزیابی منبع برای نوجوانان.",
    body: "هر جلسه شامل اهداف یادگیری، فعالیت گروهی و یک سناریوی واقعی بررسی خبر است. برای معلمان و مربیان پرورشی مناسب است.",
    keywords: ["درسنامه", "نوجوان", "سواد رسانه‌ای", "آموزش"], figures: ["هفت جلسه", "چکلیست پنج سوالی"],
    sources: [src("راهنمای آموزش سواد رسانه‌ای", "یونسکو", "https://www.unesco.org/en/media-information-literacy", "۲۰۲۱")],
    portal: "books", topic: "media", format: "pdf", mediaKind: "pdf", fileUrl: "/samples/meraj-guide.pdf", fileSize: "PDF • ۴.۲ KB", thumbnail: "/images/infographic.jpg",
    ageGroups: ["teen"], categoryKey: "topic-media", treeKey: "tree-media", views: 1420, likes: 223, ratingSum: 382, ratingCount: 83, daysAgo: 9,
  },
  {
    title: "بازی حافظه «مفاهیم فرهنگی»", slug: "cultural-memory-game",
    summary: "بازی جفتکردن کارت‌ها برای آشنایی کودکان با مفاهیم فرهنگی، نمادها و نشانه‌های ایرانی.",
    body: "یک بازی سبک و بدون نیاز به نصب که مستقیماً در پنجره محتوا اجرا می‌شود. تمرکز بر حافظه دیداری و یادگیری واژگان فرهنگی است.",
    keywords: ["بازی حافظه", "کودک", "فرهنگ", "نماد"], figures: ["۱۲ کارت", "۶ مفهوم فرهنگی"],
    sources: [src("مجموعه محتوای تربیتی استودیو", "استودیو معراج اندیشه", "https://www.nlai.ir", "۱۴۰۲")],
    portal: "games", topic: "culture", format: "game", mediaKind: "game", gameKey: "memory", thumbnail: "/images/game.jpg",
    ageGroups: ["child"], categoryKey: "topic-culture", treeKey: "tree-game", views: 860, likes: 198, ratingSum: 290, ratingCount: 62, daysAgo: 5,
  },
  {
    title: "مستند «ایران از نگاه دوربین؛ معماری و هویت»", slug: "iran-through-lens",
    summary: "نگاهی تصویری به پیوند معماری، نقوش هندسی و هویت فرهنگی در شهرهای تاریخی ایران.",
    body: "روایت تصویری با تکیه بر منابع میراث فرهنگی و اسناد تصویری، همراه با فهرست ارجاعات در بخش منبع.",
    keywords: ["معماری ایرانی", "مستند", "هویت", "میراث فرهنگی"], figures: ["گنبد فیروزهای", "نقوش هندسی"],
    sources: [src("پرونده میراث فرهنگی ایرانی", "یونسکو", "https://whc.unesco.org/en/statesparties/ir", "۲۰۲۲")],
    portal: "docs", topic: "culture", format: "mp4", mediaKind: "video", externalUrl: VIDEO, thumbnail: "/images/documentary.jpg", duration: "۲۴ دقیقه",
    ageGroups: ["teen", "adult"], categoryKey: "topic-culture", treeKey: "tree-culture", views: 2040, likes: 276, ratingSum: 410, ratingCount: 91, daysAgo: 11,
  },
  {
    title: "مقاله «تحلیل روایتهای تاریخی در رسانههای نو»", slug: "historical-narratives-analysis",
    summary: "متنی تحلیلی درباره تفاوت روایت آرشیوی، بازنویسی رسانهای و حافظه دیجیتال.",
    body: "این مقاله سه لایه روایت، سند و بازنشر را از یکدیگر تفکیک میکند و الگویی ساده برای ارزیابی اعتبار پیشنهاد میدهد. متن کامل در همین پنجره قابل مطالعه است.",
    keywords: ["تحلیل", "روایت تاریخی", "رسانه نو", "ارزیابی منبع"], figures: ["الگوی سه لایه", "نمونههای آرشیوی"],
    sources: [src("آرشیو ملی ایران", "سازمان اسناد و کتابخانه ملی ایران", "https://www.nlai.ir", "۱۴۰۲")],
    portal: "bank", topic: "analysis", format: "article", mediaKind: "article", thumbnail: "/images/books.jpg",
    ageGroups: ["adult"], categoryKey: "topic-analysis", treeKey: "tree-archive", views: 1180, likes: 143, ratingSum: 307, ratingCount: 69, daysAgo: 8,
  },
  {
    title: "اسلاید «کارگاه مربیان رسانه؛ الگوی ارائه»", slug: "media-trainers-slides",
    summary: "نسخه ویژه مربیان از بسته اسلاید روایتگری شامل الگوهای تمرین و فرم ارزیابی.",
    body: "فایل پاورپوینت شامل ۱۶ اسلاید و پیوست فرم ارزیابی است. پیشنمایش و دانلود از همان کادر رسانه انجام میشود.",
    keywords: ["مربیان", "پاورپوینت", "کارگاه", "روایتگری"], figures: ["۱۶ اسلاید", "فرم ارزیابی"],
    sources: [src("راهنمای کارگاههای آموزشی", "استودیو معراج اندیشه", "https://www.irna.ir", "۱۴۰۱")],
    portal: "bank", topic: "skills", format: "pptx", mediaKind: "presentation", fileUrl: "/samples/meraj-presentation.pptx", fileSize: "PPTX • ۳.۶ KB", slideCount: 16,
    slideTitles: ["شروع کارگاه", "مخاطبشناسی", "پیام کلیدی", "ساختار ۳ دقیقهای", "منبع و سند", "تمرین ارائه", "بازخورد", "جمع بندی"],
    thumbnail: "/images/infographic.jpg", ageGroups: ["adult"], categoryKey: "topic-skills", treeKey: "tree-presentation", views: 1044, likes: 132, ratingSum: 286, ratingCount: 62, daysAgo: 13,
  },
  {
    title: "مجموعه داده «شاخصهای فرهنگی و رسانهای»", slug: "cultural-indicators-sheet",
    summary: "صفحه گستردهای از شاخصهای نمونه برای تمرین تحلیل داده و ساخت نمودار در کلاس.",
    body: "این صفحه گسترده شامل ستونهای شاخص، سال، منبع و یادداشت است. مناسب مربیان و پژوهشگران برای تمرین تحلیل داده.",
    keywords: ["صفحه گسترده", "داده", "شاخص", "تحلیل"], figures: ["۴ ستون", "۱۲ رکورد نمونه"],
    sources: [src("چارچوب شاخصهای فرهنگی", "پژوهشگاه فرهنگ، هنر و ارتباطات", "https://www.irna.ir", "۱۴۰۲")],
    portal: "bank", topic: "analysis", format: "xlsx", mediaKind: "spreadsheet", fileUrl: "/samples/cultural-indicators.xlsx", fileSize: "XLSX • ۲.۱ KB",
    thumbnail: "/images/infographic.jpg", ageGroups: ["adult"], categoryKey: "topic-analysis", treeKey: "tree-archive", views: 690, likes: 77, ratingSum: 194, ratingCount: 43, daysAgo: 15,
  },
  {
    title: "کتاب «قصههای آگاهی برای کودکان»", slug: "awareness-stories-children",
    summary: "مجموعهای از داستانهای کوتاه و تصویری برای گفتوگو با کودکان درباره راستگویی و منبع خبر.",
    body: "نسخه PDF شامل شش داستان کوتاه، پرسشهای پایانی و راهنمای والدین است.",
    keywords: ["کودک", "قصه", "راستگویی", "خانواده"], figures: ["شش داستان", "راهنمای والدین"],
    sources: [src("مجموعه قصههای تربیتی", "استودیو معراج اندیشه", "https://www.nlai.ir", "۱۴۰۲")],
    portal: "books", topic: "family", format: "pdf", mediaKind: "pdf", fileUrl: "/samples/meraj-guide.pdf", fileSize: "PDF • ۴.۲ KB", thumbnail: "/images/game.jpg",
    ageGroups: ["child"], categoryKey: "topic-family", treeKey: "tree-family", views: 980, likes: 182, ratingSum: 318, ratingCount: 71, daysAgo: 10,
  },
  {
    title: "کلیپ «یک دقیقه با حقیقت»", slug: "one-minute-truth-clip",
    summary: "کلیپ کوتاه آموزشی درباره سه پرسش ضروری پیش از بازنشر یک خبر.",
    body: "نسخهای سریع و قابل اشتراکگذاری برای نوجوانان؛ تمرکز بر منبع، تاریخ و سند.",
    keywords: ["کلیپ", "شایعه", "نوجوان", "خبر"], figures: ["سه پرسش کلیدی"],
    sources: [src("چارچوب سواد رسانه و اطلاعات", "یونسکو", "https://www.unesco.org/en/media-information-literacy", "۲۰۲۱")],
    portal: "docs", topic: "media", format: "mp4", mediaKind: "video", externalUrl: VIDEO, thumbnail: "/images/infographic.jpg", duration: "۱ دقیقه",
    ageGroups: ["teen"], categoryKey: "topic-media", treeKey: "tree-media", views: 2750, likes: 377, ratingSum: 468, ratingCount: 102, daysAgo: 2,
  },
  {
    title: "جزوه ورد «یادداشتهای جلسه تبیین»", slug: "explanation-session-notes",
    summary: "سند ورد قابل ویرایش برای ثبت نکات جلسات تبیینی و پیگیری منابع.",
    body: "فایل DOCX شامل سربرگ استودیو، جدول منابع و چکلیست اقدامات پس از جلسه است.",
    keywords: ["ورد", "جزوه", "جلسه", "مستندسازی"], figures: ["جدول منابع", "چکلیست اقدامات"],
    sources: [src("الگوی مستندسازی جلسات", "استودیو معراج اندیشه", "https://www.irna.ir", "۱۴۰۲")],
    portal: "bank", topic: "skills", format: "docx", mediaKind: "office", fileUrl: "/samples/lesson-notes.docx", fileSize: "DOCX • ۲.۴ KB",
    thumbnail: "/images/books.jpg", ageGroups: ["adult"], categoryKey: "topic-skills", treeKey: "tree-presentation", views: 530, likes: 51, ratingSum: 152, ratingCount: 36, daysAgo: 16,
  },
  {
    title: "بسته فشرده «کیت مربی رسانهای»", slug: "media-trainer-kit",
    summary: "مجموعه فایلهای تمرینی، فرمها و راهنماهای کلاسی در یک بسته ZIP برای مربیان.",
    body: "بسته شامل راهنما، الگوهای تمرین و فهرست منابع است. دانلود فایل پس از ورود به حساب کاربری فعال میشود.",
    keywords: ["بسته مربی", "ZIP", "کارگاه", "منابع"], figures: ["۳ فایل", "راهنمای استفاده"],
    sources: [src("مجموعه کارگاهی استودیو", "استودیو معراج اندیشه", "https://www.nlai.ir", "۱۴۰۲")],
    portal: "bank", topic: "skills", format: "zip", mediaKind: "archive", fileUrl: "/samples/educator-kit.zip", fileSize: "ZIP • ۲.۸ KB",
    thumbnail: "/images/hero.jpg", ageGroups: ["adult"], categoryKey: "topic-skills", treeKey: "tree-skills", views: 760, likes: 88, ratingSum: 202, ratingCount: 45, daysAgo: 12,
  },
  {
    title: "پیوند «آرشیو اسناد ملی و منابع پژوهشی»", slug: "national-archive-link",
    summary: "دسترسی مستقیم به آرشیو سازمان اسناد و کتابخانه ملی جمهوری اسلامی ایران.",
    body: "این محتوا نمونهای از پشتیبانی پیوند خارجی و میزبانی ترکیبی است. نمایش و بازکردن پیوند آزاد است.",
    keywords: ["آرشیو", "پیوند خارجی", "سند", "پژوهش"], figures: ["سازمان اسناد و کتابخانه ملی"],
    sources: [src("پortal سازمان اسناد و کتابخانه ملی", "سازمان اسناد و کتابخانه ملی ایران", "https://www.nlai.ir", "۱۴۰۲")],
    portal: "bank", topic: "history", format: "link", mediaKind: "link", externalUrl: "https://www.nlai.ir", thumbnail: "/images/documentary.jpg",
    ageGroups: ["adult"], categoryKey: "topic-history", treeKey: "tree-archive", views: 420, likes: 39, ratingSum: 128, ratingCount: 30, daysAgo: 18,
  },
];
