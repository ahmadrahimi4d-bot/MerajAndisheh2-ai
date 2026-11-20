export type SettingsMap = Record<string, unknown>;

export interface SourceRef {
  title: string;
  publisher?: string;
  url?: string;
  year?: string;
}

export interface CategoryRecord {
  id: number;
  key: string;
  label: string;
  icon: string;
  kind: "portal" | "topic" | "tree" | "filter-group" | "filter-item" | "format" | string;
  parentId: number | null;
  sort: number;
  enabled: boolean;
  color: string | null;
}

export interface ContentItem {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string;
  keywords: string[];
  figures: string[];
  sources: SourceRef[];
  categoryId: number | null;
  treeId: number | null;
  portal: string;
  topic: string;
  format: string;
  mediaKind: string;
  fileUrl: string | null;
  externalUrl: string | null;
  embedCode: string | null;
  thumbnail: string;
  duration: string | null;
  slideCount: number | null;
  fileSize: string | null;
  slideTitles: string[];
  ageGroups: string[];
  gameKey: string | null;
  views: number;
  downloads: number;
  likes: number;
  ratingSum: number;
  ratingCount: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PluginRecord {
  key: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updatedAt: string;
}

export interface LanguageRecord {
  code: string;
  label: string;
  nativeLabel: string;
  direction: "rtl" | "ltr" | string;
  font: string;
  calendar: string;
  motif: string;
  enabled: boolean;
  labels: Record<string, string>;
  sort: number;
}

export interface PublicUser {
  id: number;
  username: string;
  role: "super_admin" | "staff" | "visitor" | string;
  displayName: string;
  permissions: string[];
  profile: Record<string, string>;
  enabled: boolean;
  createdAt: string;
}

export interface BackupLog {
  id: number;
  createdAt: string;
  mode: string;
  status: string;
  target: string;
  recordCount: number;
  message: string;
}

export interface AnalyticsSnapshot {
  uniqueVisitors: number;
  totalVisits: number;
  totalDownloads: number;
  totalViews: number;
  visitors: number;
  staff: number;
  contentCount: number;
  topTopics: { label: string; count: number }[];
  topDownloads: { title: string; count: number }[];
  recentVisits: { path: string; topic: string | null; createdAt: string }[];
}

export interface Bootstrap {
  settings: SettingsMap;
  categories: CategoryRecord[];
  contents: ContentItem[];
  plugins: PluginRecord[];
  languages: LanguageRecord[];
  users: PublicUser[];
  analytics: AnalyticsSnapshot;
  backupLogs: BackupLog[];
  serverTime: string;
}

export interface AgeTheme {
  id: string;
  label: string;
  min: number;
  max: number;
  icon: string;
  description: string;
  priority: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  radius: number;
  fontScale: number;
  mood: string;
  motif: string;
}

export interface HomeSection {
  id: string;
  title: string;
  source: "smart" | "trending" | "category" | "latest" | "multimedia" | "tree";
  categoryKey?: string;
  enabled: boolean;
  limit: number;
  order: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  target: string;
  badge: string;
}

export interface PortalLink {
  id: string;
  label: string;
  labelKey?: string;
  target: string;
  enabled: boolean;
  order: number;
}

export interface RegistrationField {
  id: string;
  label: string;
  type: "text" | "tel" | "password" | "email" | "select" | "textarea" | string;
  required: boolean;
  enabled: boolean;
  options?: string[];
  placeholder?: string;
}

export interface StoryTheme {
  id: string;
  label: string;
  background: string;
  accent: string;
  text: string;
  pattern: string;
}

export interface BackupConfig {
  enabled: boolean;
  intervalDays: number;
  webhookUrl: string;
  secretToken: string;
  autoPush: boolean;
}

export interface CommentItem {
  id: number;
  contentId: number;
  visitorId: string;
  userId: number | null;
  type: string;
  value: number;
  text: string;
  createdAt: string;
}

export const ALL_SECTIONS = [
  "analytics",
  "content",
  "taxonomy",
  "visual",
  "plugins",
  "users",
  "languages",
  "backups",
] as const;

export type SectionKey = (typeof ALL_SECTIONS)[number];

export function getSetting<T>(settings: SettingsMap, key: string, fallback: T): T {
  const value = settings[key];
  return (value === undefined || value === null ? fallback : value) as T;
}
