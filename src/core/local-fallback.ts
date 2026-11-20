import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTENTS,
  DEFAULT_LANGUAGE_ROWS,
  DEFAULT_PLUGINS,
  DEFAULT_SETTINGS,
  DEFAULT_USERS,
} from "@/config/defaults";
import { formatMeta } from "@/config/registry";
import {
  getSetting,
  type Bootstrap,
  type CategoryRecord,
  type CommentItem,
  type ContentItem,
  type LanguageRecord,
  type PublicUser,
  type RegistrationField,
  type SourceRef,
} from "@/core/types";

const STORE_KEY = "meraj.offlineStore.v1";

interface LocalUserRecord extends PublicUser {
  password: string;
}

interface LocalStoreState {
  bootstrap: Bootstrap;
  users: LocalUserRecord[];
  sessions: Record<string, number>;
  comments: Record<number, CommentItem[]>;
  media: Record<string, string>;
  nextId: number;
}

const memoryFallback = new Map<string, string>();

function readStorage(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryFallback.get(key) ?? null;
    }
  }
  return memoryFallback.get(key) ?? null;
}

function writeStorage(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // Fall through to memory map if storage quota exceeded
    }
  }
  memoryFallback.set(key, value);
}

export function buildDefaultBootstrap(): Bootstrap {
  const now = Date.now();
  let catId = 1;
  const byKey = new Map<string, number>();
  const categories: CategoryRecord[] = [];
  for (const seed of DEFAULT_CATEGORIES.filter((c) => !c.parentKey)) {
    const id = catId++;
    byKey.set(seed.key, id);
    categories.push({
      id,
      key: seed.key,
      label: seed.label,
      icon: seed.icon,
      kind: seed.kind,
      parentId: null,
      sort: seed.sort,
      enabled: seed.enabled,
      color: seed.color ?? null,
    });
  }
  for (const seed of DEFAULT_CATEGORIES.filter((c) => c.parentKey)) {
    const id = catId++;
    byKey.set(seed.key, id);
    categories.push({
      id,
      key: seed.key,
      label: seed.label,
      icon: seed.icon,
      kind: seed.kind,
      parentId: byKey.get(seed.parentKey ?? "") ?? null,
      sort: seed.sort,
      enabled: seed.enabled,
      color: seed.color ?? null,
    });
  }

  const contents: ContentItem[] = DEFAULT_CONTENTS.map((seed, index) => {
    const format = String(seed.format ?? "article").toLowerCase();
    const mediaKind = String(seed.mediaKind ?? formatMeta(format).kind);
    const createdAt = new Date(now - seed.daysAgo * 86400000).toISOString();
    return {
      id: index + 1,
      slug: String(seed.slug ?? seed.title.replace(/\s+/g, "-")),
      title: seed.title,
      summary: seed.summary,
      body: seed.body ?? "",
      keywords: seed.keywords ?? [],
      figures: seed.figures ?? [],
      sources: seed.sources ?? [],
      categoryId: byKey.get(seed.categoryKey) ?? null,
      treeId: byKey.get(seed.treeKey) ?? null,
      portal: seed.portal ?? "bank",
      topic: seed.topic ?? "general",
      format,
      mediaKind,
      fileUrl: seed.fileUrl ?? null,
      externalUrl: seed.externalUrl ?? null,
      embedCode: seed.embedCode ?? null,
      thumbnail: seed.thumbnail ?? "/images/hero.jpg",
      duration: seed.duration ?? null,
      slideCount: seed.slideCount ?? null,
      fileSize: seed.fileSize ?? null,
      slideTitles: seed.slideTitles ?? [],
      ageGroups: seed.ageGroups ?? ["adult"],
      gameKey: seed.gameKey ?? null,
      views: seed.views ?? 0,
      downloads: seed.downloads ?? 0,
      likes: seed.likes ?? 0,
      ratingSum: seed.ratingSum ?? 0,
      ratingCount: seed.ratingCount ?? 0,
      featured: Boolean(seed.featured),
      published: seed.published !== false,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const users: PublicUser[] = DEFAULT_USERS.map((u, idx) => ({
    id: idx + 1,
    username: u.username,
    role: u.role,
    displayName: u.displayName,
    permissions: u.permissions,
    profile: u.profile,
    enabled: u.enabled,
    createdAt: new Date(now).toISOString(),
  }));

  return {
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as Record<string, unknown>,
    categories,
    contents,
    plugins: DEFAULT_PLUGINS.map((p) => ({ ...p, updatedAt: new Date(now).toISOString() })),
    languages: DEFAULT_LANGUAGE_ROWS.map((l) => ({ ...l })),
    users,
    analytics: {
      uniqueVisitors: 12,
      totalVisits: 42,
      totalDownloads: contents.reduce((s, c) => s + c.downloads, 0) + 24,
      totalViews: contents.reduce((s, c) => s + c.views, 0),
      visitors: 0,
      staff: users.length,
      contentCount: contents.length,
      topTopics: [
        { label: "سواد رسانه‌ای", count: 14 },
        { label: "تاریخ و هویت", count: 10 },
        { label: "تحلیل و تبیین", count: 8 },
      ],
      topDownloads: contents.slice(0, 5).map((c) => ({ title: c.title, count: c.views })),
      recentVisits: [{ path: "/", topic: "media", createdAt: new Date(now).toISOString() }],
    },
    backupLogs: [],
    serverTime: new Date(now).toISOString(),
  };
}

function createInitialStore(seed?: Bootstrap): LocalStoreState {
  const bootstrap = seed ? (JSON.parse(JSON.stringify(seed)) as Bootstrap) : buildDefaultBootstrap();
  const passwordMap = new Map(DEFAULT_USERS.map((u) => [u.username, u.password]));
  const users: LocalUserRecord[] = bootstrap.users.map((u) => ({
    ...u,
    password: passwordMap.get(u.username) ?? "1234",
  }));
  const firstId = bootstrap.contents[0]?.id ?? 1;
  return {
    bootstrap,
    users,
    sessions: {},
    comments: {
      [firstId]: [
        {
          id: 1,
          contentId: firstId,
          visitorId: "seed-visitor-1",
          userId: null,
          type: "comment",
          value: 0,
          text: "بازی بسیار کاربردی برای کلاس سواد رسانه‌ای بود.",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    },
    media: {},
    nextId: 5000,
  };
}

function loadStore(seed?: Bootstrap): LocalStoreState {
  const raw = readStorage(STORE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as LocalStoreState;
    } catch {
      // Reinitialize corrupted store
    }
  }
  const initial = createInitialStore(seed);
  saveStore(initial);
  return initial;
}

function saveStore(state: LocalStoreState): void {
  writeStorage(STORE_KEY, JSON.stringify(state));
}

export function syncServerBootstrap(bootstrap: Bootstrap): void {
  const current = loadStore(bootstrap);
  const passByUser = new Map(current.users.map((u) => [u.username, u.password]));
  const defaultPass = new Map(DEFAULT_USERS.map((u) => [u.username, u.password]));
  current.bootstrap = JSON.parse(JSON.stringify(bootstrap)) as Bootstrap;
  current.users = bootstrap.users.map((u) => ({
    ...u,
    password: passByUser.get(u.username) ?? defaultPass.get(u.username) ?? "1234",
  }));
  saveStore(current);
}

export function getLocalBootstrap(seed?: Bootstrap): Bootstrap {
  return loadStore(seed).bootstrap;
}

export function isUnreachableResponse(res: Response): boolean {
  if ([404, 405, 502, 503, 504].includes(res.status)) return true;
  const ct = res.headers.get("content-type") ?? "";
  return !ct.includes("application/json");
}

function strArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v ?? "")
    .split(/[،,|\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function recomputeAnalytics(store: LocalStoreState): void {
  const b = store.bootstrap;
  b.analytics.contentCount = b.contents.length;
  b.analytics.totalViews = b.contents.reduce((s, c) => s + c.views, 0);
  b.analytics.visitors = store.users.filter((u) => u.role === "visitor").length;
  b.analytics.staff = store.users.filter((u) => u.role !== "visitor").length;
}

export function runLocalAuth(
  action: "login" | "register" | "logout" | "session",
  payload: Record<string, unknown>,
  seed?: Bootstrap,
): { ok: boolean; user: PublicUser | null; token?: string; error?: string } {
  const store = loadStore(seed);

  if (action === "session") {
    const token = String(payload.token ?? "");
    const uid = store.sessions[token];
    if (!uid) return { ok: true, user: null };
    const found = store.users.find((u) => u.id === uid && u.enabled);
    if (!found) return { ok: true, user: null };
    const { password: _pw, ...pub } = found;
    return { ok: true, user: pub, token };
  }

  if (action === "logout") {
    const token = String(payload.token ?? "");
    if (token) delete store.sessions[token];
    saveStore(store);
    return { ok: true, user: null };
  }

  if (action === "register") {
    const profile = (payload.profile && typeof payload.profile === "object" ? payload.profile : {}) as Record<string, string>;
    const password = String(payload.password ?? profile.password ?? "");
    const username = String(payload.username || profile.phone || profile.email || "").trim();
    if (!username || !password) {
      return { ok: false, user: null, error: "نام کاربری و گذرواژه الزامی است." };
    }
    const fields = getSetting<RegistrationField[]>(store.bootstrap.settings, "registrationFields", []);
    for (const field of fields) {
      if (field.enabled && field.required && field.id !== "password" && !profile[field.id]) {
        return { ok: false, user: null, error: `تکمیل فیلد «${field.label}» الزامی است.` };
      }
    }
    if (store.users.some((u) => u.username === username)) {
      return { ok: false, user: null, error: "این نام کاربری یا شماره تلفن پیشتر ثبت شده است." };
    }
    const cleanProfile = { ...profile };
    delete cleanProfile.password;
    const id = store.nextId++;
    const createdAt = new Date().toISOString();
    const record: LocalUserRecord = {
      id,
      username,
      password,
      role: "visitor",
      displayName: [cleanProfile.firstName, cleanProfile.lastName].filter(Boolean).join(" ") || username,
      permissions: [],
      profile: cleanProfile,
      enabled: true,
      createdAt,
    };
    const { password: _pw, ...pub } = record;
    store.users.push(record);
    store.bootstrap.users.push(pub);
    const token = `local-${id}-${Date.now()}`;
    store.sessions[token] = id;
    recomputeAnalytics(store);
    saveStore(store);
    return { ok: true, user: pub, token };
  }

  // login
  const username = String(payload.username ?? "").trim();
  const password = String(payload.password ?? "");
  const found = store.users.find((u) => u.username === username && u.enabled && u.password === password);
  if (!found) {
    return { ok: false, user: null, error: "نام کاربری یا گذرواژه صحیح نیست." };
  }
  const token = `local-${found.id}-${Date.now()}`;
  store.sessions[token] = found.id;
  saveStore(store);
  const { password: _pw, ...pub } = found;
  return { ok: true, user: pub, token };
}

export function runLocalAction(
  action: string,
  payload: Record<string, unknown>,
  user: PublicUser | null,
  seed?: Bootstrap,
): { ok: boolean; bootstrap: Bootstrap; [key: string]: unknown } {
  const store = loadStore(seed);
  const b = store.bootstrap;

  switch (action) {
    case "saveSettings": {
      const values = (payload.values && typeof payload.values === "object" ? payload.values : {}) as Record<string, unknown>;
      for (const [k, v] of Object.entries(values)) {
        if (k !== "section") b.settings[k] = v;
      }
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    case "saveCategory": {
      const c = (payload.category ?? {}) as Partial<CategoryRecord>;
      const id = Number(c.id ?? 0);
      if (id) {
        b.categories = b.categories.map((cat) => (cat.id === id ? { ...cat, ...c, id } : cat));
        saveStore(store);
        return { ok: true, id, bootstrap: b };
      }
      const newId = store.nextId++;
      b.categories.push({
        id: newId,
        key: String(c.key || `category-${newId}`),
        label: String(c.label || "دسته جدید"),
        icon: String(c.icon || "✦"),
        kind: String(c.kind || "topic"),
        parentId: c.parentId ?? null,
        sort: Number(c.sort ?? 0),
        enabled: c.enabled !== false,
        color: c.color ?? null,
      });
      saveStore(store);
      return { ok: true, id: newId, bootstrap: b };
    }
    case "deleteCategory": {
      const id = Number(payload.id ?? 0);
      b.categories = b.categories.filter((c) => c.id !== id && c.parentId !== id);
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    case "saveContent": {
      const raw = (payload.content ?? {}) as Record<string, unknown>;
      const id = Number(raw.id ?? 0);
      const title = String(raw.title || "محتوای بدون عنوان");
      const format = String(raw.format || "article").toLowerCase().replace(".", "");
      const mediaKind = String(raw.mediaKind || formatMeta(format).kind);
      const nowIso = new Date().toISOString();
      const itemData: Omit<ContentItem, "id" | "createdAt" | "views" | "downloads" | "likes" | "ratingSum" | "ratingCount"> = {
        slug: String(raw.slug || title.trim().replace(/\s+/g, "-")),
        title,
        summary: String(raw.summary ?? ""),
        body: String(raw.body ?? ""),
        keywords: strArr(raw.keywords),
        figures: strArr(raw.figures),
        sources: Array.isArray(raw.sources) ? (raw.sources as SourceRef[]).filter((s) => s.title) : [],
        categoryId: raw.categoryId ? Number(raw.categoryId) : null,
        treeId: raw.treeId ? Number(raw.treeId) : null,
        portal: String(raw.portal || "bank"),
        topic: String(raw.topic || "general"),
        format,
        mediaKind,
        fileUrl: raw.fileUrl ? String(raw.fileUrl) : null,
        externalUrl: raw.externalUrl ? String(raw.externalUrl) : null,
        embedCode: raw.embedCode ? String(raw.embedCode) : null,
        thumbnail: String(raw.thumbnail || "/images/hero.jpg"),
        duration: raw.duration ? String(raw.duration) : null,
        slideCount: raw.slideCount ? Number(raw.slideCount) : null,
        fileSize: raw.fileSize ? String(raw.fileSize) : null,
        slideTitles: strArr(raw.slideTitles),
        ageGroups: strArr(raw.ageGroups).length ? strArr(raw.ageGroups) : ["adult"],
        gameKey: raw.gameKey ? String(raw.gameKey) : null,
        featured: Boolean(raw.featured),
        published: raw.published !== false,
        updatedAt: nowIso,
      };
      if (id) {
        b.contents = b.contents.map((item) => (item.id === id ? { ...item, ...itemData } : item));
        recomputeAnalytics(store);
        saveStore(store);
        return { ok: true, id, bootstrap: b };
      }
      const newId = store.nextId++;
      b.contents.unshift({
        id: newId,
        ...itemData,
        views: 0,
        downloads: 0,
        likes: 0,
        ratingSum: 0,
        ratingCount: 0,
        createdAt: nowIso,
      });
      recomputeAnalytics(store);
      saveStore(store);
      return { ok: true, id: newId, bootstrap: b };
    }
    case "deleteContent": {
      const id = Number(payload.id ?? 0);
      b.contents = b.contents.filter((c) => c.id !== id);
      recomputeAnalytics(store);
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    case "savePlugin": {
      const key = String(payload.key ?? "");
      const enabled = Boolean(payload.enabled);
      const config = (payload.config && typeof payload.config === "object" ? payload.config : {}) as Record<string, unknown>;
      const existing = b.plugins.find((p) => p.key === key);
      if (existing) {
        existing.enabled = enabled;
        existing.config = config;
        existing.updatedAt = new Date().toISOString();
      } else {
        b.plugins.push({ key, enabled, config, updatedAt: new Date().toISOString() });
      }
      saveStore(store);
      return { ok: true, key, bootstrap: b };
    }
    case "saveLanguage": {
      const lang = (payload.language ?? {}) as LanguageRecord;
      const idx = b.languages.findIndex((l) => l.code === lang.code);
      if (idx >= 0) b.languages[idx] = { ...lang };
      else b.languages.push({ ...lang });
      b.languages.sort((a, z) => a.sort - z.sort);
      saveStore(store);
      return { ok: true, code: lang.code, bootstrap: b };
    }
    case "deleteLanguage": {
      const code = String(payload.code ?? "");
      b.languages = b.languages.filter((l) => l.code !== code);
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    case "saveUser": {
      const raw = (payload.user ?? {}) as Record<string, unknown>;
      const id = Number(raw.id ?? 0);
      const password = String(raw.password ?? "");
      if (id) {
        store.users = store.users.map((u) =>
          u.id === id
            ? {
                ...u,
                username: String(raw.username || u.username),
                displayName: String(raw.displayName ?? u.displayName),
                role: String(raw.role || u.role),
                permissions: strArr(raw.permissions),
                enabled: raw.enabled !== false,
                ...(password ? { password } : {}),
              }
            : u,
        );
        b.users = store.users.map(({ password: _pw, ...pub }) => pub);
        recomputeAnalytics(store);
        saveStore(store);
        return { ok: true, id, bootstrap: b };
      }
      const newId = store.nextId++;
      const rec: LocalUserRecord = {
        id: newId,
        username: String(raw.username || `user${newId}`),
        password: password || "1234",
        role: String(raw.role || "staff"),
        displayName: String(raw.displayName ?? ""),
        permissions: strArr(raw.permissions),
        profile: {},
        enabled: raw.enabled !== false,
        createdAt: new Date().toISOString(),
      };
      store.users.push(rec);
      const { password: _pw, ...pub } = rec;
      b.users.push(pub);
      recomputeAnalytics(store);
      saveStore(store);
      return { ok: true, id: newId, bootstrap: b };
    }
    case "deleteUser": {
      const id = Number(payload.id ?? 0);
      store.users = store.users.filter((u) => u.id !== id);
      b.users = store.users.map(({ password: _pw, ...pub }) => pub);
      recomputeAnalytics(store);
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    case "trackVisit": {
      b.analytics.totalVisits += 1;
      b.analytics.recentVisits = [
        { path: String(payload.path || "/"), topic: null, createdAt: new Date().toISOString() },
        ...b.analytics.recentVisits,
      ].slice(0, 8);
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    case "trackView": {
      const id = Number(payload.contentId ?? 0);
      const item = b.contents.find((c) => c.id === id);
      if (item) {
        item.views += 1;
        b.analytics.totalViews += 1;
        b.analytics.recentVisits = [
          { path: `/content/${id}`, topic: item.topic, createdAt: new Date().toISOString() },
          ...b.analytics.recentVisits,
        ].slice(0, 8);
        saveStore(store);
      }
      return { ok: true, topic: item?.topic, bootstrap: b };
    }
    case "like": {
      const id = Number(payload.contentId ?? 0);
      const item = b.contents.find((c) => c.id === id);
      if (item) {
        item.likes += 1;
        saveStore(store);
      }
      return { ok: true, bootstrap: b };
    }
    case "rate": {
      const id = Number(payload.contentId ?? 0);
      const val = Math.max(1, Math.min(5, Number(payload.value ?? 5)));
      const item = b.contents.find((c) => c.id === id);
      if (item) {
        item.ratingSum += val;
        item.ratingCount += 1;
        saveStore(store);
      }
      return { ok: true, bootstrap: b };
    }
    case "comment": {
      const id = Number(payload.contentId ?? 0);
      const text = String(payload.text ?? "").slice(0, 1000);
      const list = store.comments[id] ?? [];
      list.unshift({
        id: store.nextId++,
        contentId: id,
        visitorId: String(payload.visitorId || "anonymous"),
        userId: user?.id ?? null,
        type: "comment",
        value: 0,
        text,
        createdAt: new Date().toISOString(),
      });
      store.comments[id] = list;
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    case "getComments": {
      const id = Number(payload.contentId ?? 0);
      return { ok: true, comments: store.comments[id] ?? [], bootstrap: b };
    }
    case "recordDownload": {
      const id = Number(payload.contentId ?? 0);
      const item = b.contents.find((c) => c.id === id);
      if (item) {
        item.downloads += 1;
        b.analytics.totalDownloads += 1;
        saveStore(store);
      }
      return { ok: true, bootstrap: b };
    }
    case "getAnalytics": {
      recomputeAnalytics(store);
      return { ok: true, analytics: b.analytics, bootstrap: b };
    }
    case "backupPush": {
      b.backupLogs.unshift({
        id: store.nextId++,
        createdAt: new Date().toISOString(),
        mode: "manual",
        status: "skipped",
        target: "local-browser",
        recordCount: b.contents.length,
        message: "حالت بدون سرور فعال است؛ از خروجی JSON استفاده کنید.",
      });
      saveStore(store);
      return { ok: true, status: "skipped", bootstrap: b };
    }
    case "backupImport": {
      const source = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;
      if (!source.settings || !Array.isArray(source.contents)) {
        return { ok: false, error: "فایل پشتیبان معتبر نیست.", bootstrap: b };
      }
      b.settings = source.settings as Record<string, unknown>;
      b.contents = source.contents as ContentItem[];
      if (Array.isArray(source.categories)) b.categories = source.categories as CategoryRecord[];
      if (Array.isArray(source.languages)) b.languages = source.languages as LanguageRecord[];
      recomputeAnalytics(store);
      saveStore(store);
      return { ok: true, bootstrap: b };
    }
    default:
      return { ok: true, bootstrap: b };
  }
}

export function saveLocalUpload(name: string, dataUrl: string): { id: number; name: string; url: string } {
  const store = loadStore();
  const id = store.nextId++;
  store.media[String(id)] = dataUrl;
  saveStore(store);
  return { id, name, url: dataUrl };
}
