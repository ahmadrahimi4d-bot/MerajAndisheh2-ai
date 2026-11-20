import type { SectionKey } from "@/core/types";

export const ADMIN_SECTIONS: { key: SectionKey; title: string; icon: string; description: string }[] = [
  { key: "analytics", title: "آمار دقیق بازدید", icon: "📊", description: "بازدید یکتا، نشست‌ها، موضوعات پربازدید و آمار دانلود" },
  { key: "content", title: "مدیریت محتوا و ورود هوشمند", icon: "📚", description: "درج سریع متادیتای هوشمند، بارگذاری و پیوند رسانه" },
  { key: "taxonomy", title: "دسته‌ها و فیلترهای دیجی‌کالایی", icon: "🧩", description: "مگامنو، درختواره، نشان فرمت و گروه فیلترها" },
  { key: "visual", title: "ظاهر، تم‌های سنی و جانمایی", icon: "🎨", description: "رنگ، فونت، تم‌های سنی، شخصی‌سازی و ترتیب کادرها" },
  { key: "plugins", title: "مدیریت افزونه‌ها", icon: "🔌", description: "فعال یا غیرفعال کردن افزونه‌های نمایشی" },
  { key: "users", title: "کاربران، همکاران و دسترسی‌ها", icon: "👥", description: "نقش‌ها، سطوح دسترسی و فیلدهای ثبت‌نام" },
  { key: "languages", title: "زبان‌ها و فرهنگ‌بندی", icon: "🌐", description: "زبان، جهت، فونت، تقویم و نقوش فرهنگی" },
  { key: "backups", title: "پشتیبان‌گیری و همگام‌سازی", icon: "☁️", description: "زمانبندی هفتگی، ارسال به هاست و بازیابی JSON" },
];

export const PLUGIN_DEFINITIONS = [
  { key: "ticker", name: "نوار خبر فوری", description: "نوار پیام بالاترین لبه صفحه (Zone 1)", icon: "📣" },
  { key: "trending", name: "اسلایدر پربازدید هفته", description: "ردیف دوم خوراک اصلی", icon: "🔥" },
  { key: "ratings", name: "امتیاز و دیدگاه‌ها", description: "امتیازدهی، لایک و نظرات کاربران", icon: "⭐" },
  { key: "share", name: "اشتراک‌گذاری اجتماعی", description: "کپی پیوند و شبکه‌های اجتماعی", icon: "🔗" },
] as const;

export const CATEGORY_KINDS = [
  { value: "portal", label: "درگاه / پیوند ناوبری" },
  { value: "topic", label: "موضوع محتوایی" },
  { value: "tree", label: "شاخه درختواره" },
  { value: "filter-group", label: "گروه فیلتر" },
  { value: "filter-item", label: "گزینه فیلتر" },
  { value: "format", label: "نشان نوع فایل" },
];

export const FORMAT_META: Record<string, { label: string; icon: string; kind: string; color: string }> = {
  mp4: { label: "ویدئو", icon: "🎬", kind: "video", color: "#dc2626" },
  webm: { label: "ویدئو", icon: "🎬", kind: "video", color: "#dc2626" },
  mov: { label: "ویدئو", icon: "🎬", kind: "video", color: "#dc2626" },
  mp3: { label: "پادکست", icon: "🎧", kind: "audio", color: "#7c3aed" },
  wav: { label: "صوت", icon: "🎧", kind: "audio", color: "#7c3aed" },
  jpg: { label: "تصویر / اینفوگرافیک", icon: "🖼️", kind: "image", color: "#0891b2" },
  jpeg: { label: "تصویر / اینفوگرافیک", icon: "🖼️", kind: "image", color: "#0891b2" },
  png: { label: "تصویر / اینفوگرافیک", icon: "🖼️", kind: "image", color: "#0891b2" },
  pdf: { label: "پی‌دی‌اف", icon: "📕", kind: "pdf", color: "#e11d48" },
  ppt: { label: "پاورپوینت", icon: "📊", kind: "presentation", color: "#ea580c" },
  pptx: { label: "پاورپوینت", icon: "📊", kind: "presentation", color: "#ea580c" },
  doc: { label: "سند ورد", icon: "📝", kind: "office", color: "#2563eb" },
  docx: { label: "سند ورد", icon: "📝", kind: "office", color: "#2563eb" },
  xls: { label: "صفحه گسترده", icon: "📈", kind: "spreadsheet", color: "#16a34a" },
  xlsx: { label: "صفحه گسترده", icon: "📈", kind: "spreadsheet", color: "#16a34a" },
  csv: { label: "داده‌ها", icon: "📈", kind: "spreadsheet", color: "#16a34a" },
  zip: { label: "بسته فشرده", icon: "🗜️", kind: "archive", color: "#64748b" },
  rar: { label: "بسته فشرده", icon: "🗜️", kind: "archive", color: "#64748b" },
  article: { label: "مقاله / متن", icon: "📄", kind: "article", color: "#0f766e" },
  link: { label: "پیوند خارجی", icon: "🌐", kind: "link", color: "#475569" },
  game: { label: "بازی آموزشی", icon: "🎮", kind: "game", color: "#f59e0b" },
};

export const CALENDARS = [
  { value: "persian", label: "هجری شمسی" },
  { value: "islamic-umalqura", label: "هجری قمری" },
  { value: "gregory", label: "میلادی" },
];

export const MOTIFS = [
  { value: "geometric", label: "نقوش هندسی ایرانی" },
  { value: "arabesque", label: "اسلیمی عربی" },
  { value: "grid", label: "شبکه مدرن" },
  { value: "stars", label: "ستاره‌های کودکانه" },
  { value: "minimal", label: "ساده و مینیمال" },
];

export function formatMeta(format: string, mediaKind?: string) {
  const key = (format || "").toLowerCase().replace(".", "");
  return (
    FORMAT_META[key] ?? {
      label: mediaKind === "game" ? "بازی آموزشی" : "فایل",
      icon: "📎",
      kind: mediaKind ?? "office",
      color: "#64748b",
    }
  );
}

export function fileExtension(nameOrUrl: string) {
  const clean = nameOrUrl.split("?")[0].split("#")[0];
  const part = clean.split("/").pop() ?? "";
  const dot = part.lastIndexOf(".");
  return dot >= 0 ? part.slice(dot + 1).toLowerCase() : "file";
}
