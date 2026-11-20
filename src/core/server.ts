import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  backupLogs as backupLogsTable,
  categories as categoriesTable,
  contents as contentsTable,
  downloads as downloadsTable,
  interactions as interactionsTable,
  languages as languagesTable,
  mediaFiles as mediaFilesTable,
  plugins as pluginsTable,
  sessions as sessionsTable,
  settings as settingsTable,
  users as usersTable,
  visits as visitsTable,
} from "@/db/schema";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CONTENTS,
  DEFAULT_LANGUAGE_ROWS,
  DEFAULT_PLUGINS,
  DEFAULT_SETTINGS,
  DEFAULT_USERS,
} from "@/config/defaults";
import { fileExtension, formatMeta } from "@/config/registry";
import { authService, hashPassword, verifyPassword } from "@/core/auth-service";
import { buildDefaultBootstrap } from "@/core/local-fallback";
import {
  getSetting,
  type AnalyticsSnapshot,
  type BackupConfig,
  type BackupLog,
  type Bootstrap,
  type CategoryRecord,
  type ContentItem,
  type LanguageRecord,
  type PluginRecord,
  type PublicUser,
  type RegistrationField,
  type SettingsMap,
  type SourceRef,
} from "@/core/types";

type Row<T> = T extends { $inferSelect: infer R } ? R : never;
type CategoryRow = Row<typeof categoriesTable>;
type ContentRow = Row<typeof contentsTable>;
type UserRow = Row<typeof usersTable>;
type PluginRow = Row<typeof pluginsTable>;
type LanguageRow = Row<typeof languagesTable>;
type BackupRow = Row<typeof backupLogsTable>;
type InteractionRow = Row<typeof interactionsTable>;
type Payload = Record<string, unknown>;

const globalSeed = globalThis as typeof globalThis & { __merajSeedPromise?: Promise<void> };

const obj = (v: unknown): Payload => (v && typeof v === "object" && !Array.isArray(v) ? (v as Payload) : {});
const str = (v: unknown, fallback = "") => (v === undefined || v === null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const nullableNum = (v: unknown) => (v === null || v === undefined || v === "" ? null : num(v));
const bool = (v: unknown, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (v === undefined || v === null) return fallback;
  return v === 1 || v === "1" || v === "true" || v === "on";
};
const nullableStr = (v: unknown) => (str(v).trim() ? str(v).trim() : null);
const iso = (v: Date | string) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString());
const date = (v: unknown) => {
  const d = new Date(str(v, new Date().toISOString()));
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

function stringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return str(v)
    .split(/[،,|\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function sourceArray(v: unknown): SourceRef[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => {
    const s = obj(x);
    return {
      title: str(s.title),
      publisher: str(s.publisher) || undefined,
      url: str(s.url) || undefined,
      year: str(s.year) || undefined,
    };
  }).filter((s) => s.title);
}

function stringRecord(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj(v))) out[key] = String(value ?? "");
  return out;
}

function serializeCategory(r: CategoryRow): CategoryRecord {
  return { id: r.id, key: r.key, label: r.label, icon: r.icon, kind: r.kind, parentId: r.parentId, sort: r.sort, enabled: r.enabled, color: r.color };
}
function serializeContent(r: ContentRow): ContentItem {
  return {
    ...r,
    keywords: r.keywords ?? [],
    figures: r.figures ?? [],
    sources: r.sources ?? [],
    slideTitles: r.slideTitles ?? [],
    ageGroups: r.ageGroups ?? [],
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}
function serializeUser(r: UserRow): PublicUser {
  return {
    id: r.id, username: r.username, role: r.role, displayName: r.displayName,
    permissions: r.permissions ?? [], profile: r.profile ?? {}, enabled: r.enabled,
    createdAt: iso(r.createdAt),
  };
}
function serializePlugin(r: PluginRow): PluginRecord {
  return { key: r.key, enabled: r.enabled, config: r.config ?? {}, updatedAt: iso(r.updatedAt) };
}
function serializeLanguage(r: LanguageRow): LanguageRecord {
  return { ...r, labels: r.labels ?? {}, enabled: r.enabled };
}
function serializeBackup(r: BackupRow): BackupLog {
  return { id: r.id, createdAt: iso(r.createdAt), mode: r.mode, status: r.status, target: r.target, recordCount: r.recordCount, message: r.message };
}

async function settingsMap(): Promise<SettingsMap> {
  const rows = await db.select().from(settingsTable);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

async function seedInternal() {
  const existingSettings = await db.select().from(settingsTable).limit(1);
  if (!existingSettings.length) {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.execute(sql`insert into settings (key, value, updated_at) values (${key}, ${JSON.stringify(value)}::jsonb, now()) on conflict (key) do nothing`);
    }
  }

  const existingCategories = await db.select().from(categoriesTable).limit(1);
  if (!existingCategories.length) {
    const byKey = new Map<string, number>();
    for (const seed of DEFAULT_CATEGORIES.filter((c) => !c.parentKey)) {
      const { parentKey: _parentKey, ...rest } = seed;
      const [row] = await db.insert(categoriesTable).values({ ...rest, parentId: null }).returning();
      byKey.set(row.key, row.id);
    }
    for (const seed of DEFAULT_CATEGORIES.filter((c) => c.parentKey)) {
      const { parentKey, ...rest } = seed;
      const [row] = await db.insert(categoriesTable).values({ ...rest, parentId: byKey.get(parentKey ?? "") ?? null }).returning();
      byKey.set(row.key, row.id);
    }
  }

  const existingContents = await db.select().from(contentsTable).limit(1);
  if (!existingContents.length) {
    const categories = await db.select().from(categoriesTable);
    const byKey = new Map(categories.map((c) => [c.key, c.id]));
    for (const seed of DEFAULT_CONTENTS) {
      const { categoryKey, treeKey, daysAgo, ...rest } = seed;
      const format = str(rest.format, "article").toLowerCase();
      const mediaKind = str(rest.mediaKind, formatMeta(format).kind);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);
      await db.insert(contentsTable).values({
        slug: str(rest.slug, str(rest.title).replace(/\s+/g, "-")),
        title: str(rest.title), summary: str(rest.summary), body: str(rest.body),
        keywords: rest.keywords ?? [], figures: rest.figures ?? [], sources: rest.sources ?? [],
        categoryId: byKey.get(categoryKey) ?? null, treeId: byKey.get(treeKey) ?? null,
        portal: str(rest.portal, "bank"), topic: str(rest.topic, "general"), format, mediaKind,
        fileUrl: rest.fileUrl ?? null, externalUrl: rest.externalUrl ?? null, embedCode: rest.embedCode ?? null,
        thumbnail: str(rest.thumbnail, "/images/hero.jpg"), duration: rest.duration ?? null,
        slideCount: rest.slideCount ?? null, fileSize: rest.fileSize ?? null, slideTitles: rest.slideTitles ?? [],
        ageGroups: rest.ageGroups ?? ["adult"], gameKey: rest.gameKey ?? null,
        views: num(rest.views), downloads: num(rest.downloads), likes: num(rest.likes),
        ratingSum: num(rest.ratingSum), ratingCount: num(rest.ratingCount),
        featured: bool(rest.featured), published: bool(rest.published, true),
        createdAt, updatedAt: createdAt,
      });
    }
  }

  const existingUsers = await db.select().from(usersTable).limit(1);
  if (!existingUsers.length) {
    for (const u of DEFAULT_USERS) {
      await db.insert(usersTable).values({ ...u, password: hashPassword(u.password) });
    }
  }

  const existingPlugins = await db.select().from(pluginsTable).limit(1);
  if (!existingPlugins.length) {
    for (const p of DEFAULT_PLUGINS) await db.insert(pluginsTable).values(p);
  }

  const existingLanguages = await db.select().from(languagesTable).limit(1);
  if (!existingLanguages.length) {
    for (const l of DEFAULT_LANGUAGE_ROWS) await db.insert(languagesTable).values(l);
  }

  const contentRows = await db.select().from(contentsTable);
  const userRows = await db.select().from(usersTable);
  const existingVisits = await db.select().from(visitsTable).limit(1);
  if (!existingVisits.length && contentRows.length) {
    const topics = ["media", "history", "analysis", "culture", "skills", "family"];
    await db.insert(visitsTable).values(
      Array.from({ length: 42 }, (_, i) => {
        const item = contentRows[i % Math.min(contentRows.length, 8)];
        return {
          visitorId: `seed-visitor-${(i % 12) + 1}`,
          path: i % 3 === 0 ? `/content/${item.id}` : "/",
          topic: topics[i % topics.length],
          contentId: i % 3 === 0 ? item.id : null,
          userId: null,
          createdAt: new Date(Date.now() - (i % 14) * 86400000 - i * 3600000),
        };
      }),
    );
  }
  const existingDownloads = await db.select().from(downloadsTable).limit(1);
  if (!existingDownloads.length && contentRows.length) {
    await db.insert(downloadsTable).values(
      Array.from({ length: 24 }, (_, i) => ({
        userId: userRows[0]?.id ?? null,
        contentId: contentRows[i % Math.min(contentRows.length, 8)].id,
        createdAt: new Date(Date.now() - (i % 10) * 86400000),
      })),
    );
  }
  const existingInteractions = await db.select().from(interactionsTable).limit(1);
  if (!existingInteractions.length && contentRows.length) {
    await db.insert(interactionsTable).values([
      { contentId: contentRows[0].id, visitorId: "seed-visitor-1", type: "comment", value: 0, text: "بازی بسیار کاربردی برای کلاس سواد رسانه‌ای بود.", createdAt: new Date(Date.now() - 2 * 86400000) },
      { contentId: contentRows[1].id, visitorId: "seed-visitor-2", type: "comment", value: 0, text: "ارجاع به اسناد آرشیوی نقطه قوت این مستند است.", createdAt: new Date(Date.now() - 3 * 86400000) },
      { contentId: contentRows[3].id, visitorId: "seed-visitor-3", type: "comment", value: 0, text: "اسلایدها برای کارگاه مربیان بسیار مناسب است.", createdAt: new Date(Date.now() - 86400000) },
    ]);
  }
}

export async function ensureSeed() {
  if (!globalSeed.__merajSeedPromise) {
    globalSeed.__merajSeedPromise = seedInternal().catch((error) => {
      globalSeed.__merajSeedPromise = undefined;
      throw error;
    });
  }
  await globalSeed.__merajSeedPromise;
}

async function computeAnalytics(): Promise<AnalyticsSnapshot> {
  const [visitRows, downloadRows, contentRows, userRows, categoryRows] = await Promise.all([
    db.select().from(visitsTable),
    db.select().from(downloadsTable),
    db.select().from(contentsTable),
    db.select().from(usersTable),
    db.select().from(categoriesTable),
  ]);
  const topicCounts = new Map<string, number>();
  for (const v of visitRows) if (v.topic) topicCounts.set(v.topic, (topicCounts.get(v.topic) ?? 0) + 1);
  const topicLabels = new Map<string, string>();
  for (const c of categoryRows) if (c.kind === "topic" && c.key.startsWith("topic-")) topicLabels.set(c.key.slice(6), c.label);
  const downloadCounts = new Map<number, number>();
  for (const d of downloadRows) downloadCounts.set(d.contentId, (downloadCounts.get(d.contentId) ?? 0) + 1);
  for (const c of contentRows) if (c.downloads) downloadCounts.set(c.id, (downloadCounts.get(c.id) ?? 0) + c.downloads);
  const contentTitles = new Map(contentRows.map((c) => [c.id, c.title]));
  return {
    uniqueVisitors: new Set(visitRows.map((v) => v.visitorId)).size,
    totalVisits: visitRows.length,
    totalDownloads: downloadRows.length + contentRows.reduce((sum, c) => sum + c.downloads, 0),
    totalViews: contentRows.reduce((sum, c) => sum + c.views, 0),
    visitors: userRows.filter((u) => u.role === "visitor").length,
    staff: userRows.filter((u) => u.role !== "visitor").length,
    contentCount: contentRows.length,
    topTopics: [...topicCounts.entries()].map(([key, count]) => ({ label: topicLabels.get(key) ?? key, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    topDownloads: [...downloadCounts.entries()].map(([id, count]) => ({ title: contentTitles.get(id) ?? `محتوای ${id}`, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    recentVisits: [...visitRows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8).map((v) => ({ path: v.path, topic: v.topic, createdAt: iso(v.createdAt) })),
  };
}

export async function getBootstrap(): Promise<Bootstrap> {
  if (process.env.GITHUB_PAGES === "true") {
    return buildDefaultBootstrap();
  }
  await ensureSeed();
  const [settingRows, categoryRows, contentRows, pluginRows, languageRows, userRows, logs, analytics] = await Promise.all([
    db.select().from(settingsTable),
    db.select().from(categoriesTable),
    db.select().from(contentsTable),
    db.select().from(pluginsTable),
    db.select().from(languagesTable),
    db.select().from(usersTable),
    db.select().from(backupLogsTable).orderBy(desc(backupLogsTable.createdAt)).limit(30),
    computeAnalytics(),
  ]);
  return {
    settings: Object.fromEntries(settingRows.map((r) => [r.key, r.value])),
    categories: categoryRows.map(serializeCategory),
    contents: contentRows.map(serializeContent).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    plugins: pluginRows.map(serializePlugin),
    languages: languageRows.map(serializeLanguage).sort((a, b) => a.sort - b.sort),
    users: userRows.map(serializeUser),
    analytics,
    backupLogs: logs.map(serializeBackup),
    serverTime: new Date().toISOString(),
  };
}

export async function getAnalytics() {
  await ensureSeed();
  return computeAnalytics();
}

export async function getSettings() {
  await ensureSeed();
  return settingsMap();
}

async function saveSettings(values: Payload): Promise<{ ok: true }> {
  for (const [key, value] of Object.entries(values)) {
    if (key === "section") continue;
    await db.execute(sql`insert into settings (key, value, updated_at) values (${key}, ${JSON.stringify(value ?? {})}::jsonb, now()) on conflict (key) do update set value = excluded.value, updated_at = now()`);
  }
  return { ok: true };
}

function normalizedContent(c: Payload, includeCounters: boolean) {
  const title = str(c.title, "محتوای بدون عنوان");
  let format = str(c.format, "article").toLowerCase().replace(".", "");
  const fileUrl = nullableStr(c.fileUrl);
  const externalUrl = nullableStr(c.externalUrl);
  if (format === "article" && (fileUrl || externalUrl)) format = fileExtension(fileUrl || externalUrl || "");
  const mediaKind = str(c.mediaKind, formatMeta(format).kind);
  const base = {
    slug: str(c.slug, title.trim().replace(/\s+/g, "-")),
    title, summary: str(c.summary), body: str(c.body),
    keywords: stringArray(c.keywords), figures: stringArray(c.figures), sources: sourceArray(c.sources),
    categoryId: nullableNum(c.categoryId), treeId: nullableNum(c.treeId),
    portal: str(c.portal, "bank"), topic: str(c.topic, "general"), format, mediaKind,
    fileUrl, externalUrl, embedCode: nullableStr(c.embedCode),
    thumbnail: str(c.thumbnail, "/images/hero.jpg"), duration: nullableStr(c.duration),
    slideCount: c.slideCount === "" || c.slideCount === undefined || c.slideCount === null ? null : num(c.slideCount),
    fileSize: nullableStr(c.fileSize), slideTitles: stringArray(c.slideTitles),
    ageGroups: stringArray(c.ageGroups).length ? stringArray(c.ageGroups) : ["adult"],
    gameKey: nullableStr(c.gameKey), featured: bool(c.featured), published: bool(c.published, true),
    updatedAt: new Date(),
  };
  const counters = includeCounters ? {
    views: num(c.views), downloads: num(c.downloads), likes: num(c.likes),
    ratingSum: num(c.ratingSum), ratingCount: num(c.ratingCount),
  } : {};
  return { ...base, ...counters };
}

async function saveContent(payload: Payload) {
  const c = obj(payload.content);
  const id = num(c.id);
  if (id) {
    await db.update(contentsTable).set(normalizedContent(c, false)).where(eq(contentsTable.id, id));
    return { id };
  }
  const [row] = await db.insert(contentsTable).values({
    ...normalizedContent(c, true),
    createdAt: new Date(),
  }).returning();
  return { id: row.id };
}

async function saveCategory(payload: Payload) {
  const c = obj(payload.category);
  const id = num(c.id);
  const values = {
    key: str(c.key, `category-${Date.now()}`), label: str(c.label, "دسته جدید"),
    icon: str(c.icon, "✦"), kind: str(c.kind, "topic"),
    parentId: nullableNum(c.parentId), sort: num(c.sort), enabled: bool(c.enabled, true),
    color: nullableStr(c.color),
  };
  if (id) {
    await db.update(categoriesTable).set(values).where(eq(categoriesTable.id, id));
    return { id };
  }
  const [row] = await db.insert(categoriesTable).values(values).returning();
  return { id: row.id };
}

async function saveUser(payload: Payload) {
  const u = obj(payload.user);
  const id = num(u.id);
  const password = str(u.password);
  const values = {
    username: str(u.username, `user${Date.now()}`),
    role: str(u.role, "staff"), displayName: str(u.displayName),
    permissions: stringArray(u.permissions), profile: stringRecord(u.profile),
    enabled: bool(u.enabled, true),
    ...(password ? { password: hashPassword(password) } : {}),
  };
  if (id) {
    await db.update(usersTable).set(values).where(eq(usersTable.id, id));
    return { id };
  }
  const [row] = await db.insert(usersTable).values({ ...values, password: password ? hashPassword(password) : hashPassword("1234") }).returning();
  return { id: row.id };
}

async function saveLanguage(payload: Payload) {
  const l = obj(payload.language);
  const values = {
    code: str(l.code, `lang-${Date.now()}`), label: str(l.label, str(l.code)), nativeLabel: str(l.nativeLabel, str(l.label)),
    direction: str(l.direction, "ltr"), font: str(l.font, "Inter"), calendar: str(l.calendar, "gregory"),
    motif: str(l.motif, "minimal"), enabled: bool(l.enabled, true), labels: stringRecord(l.labels), sort: num(l.sort, 99),
  };
  await db.insert(languagesTable).values(values).onConflictDoUpdate({ target: languagesTable.code, set: values });
  return { code: values.code };
}

async function savePlugin(payload: Payload) {
  const key = str(payload.key);
  const enabled = bool(payload.enabled, true);
  const config = obj(payload.config);
  await db.insert(pluginsTable).values({ key, enabled, config }).onConflictDoUpdate({ target: pluginsTable.key, set: { enabled, config, updatedAt: new Date() } });
  return { key };
}

async function rateContent(payload: Payload) {
  const contentId = num(payload.contentId);
  const visitorId = str(payload.visitorId, "anonymous");
  const value = Math.max(1, Math.min(5, num(payload.value, 5)));
  const [existing] = await db.select().from(interactionsTable).where(and(eq(interactionsTable.contentId, contentId), eq(interactionsTable.visitorId, visitorId), eq(interactionsTable.type, "rating"))).limit(1);
  const [item] = await db.select().from(contentsTable).where(eq(contentsTable.id, contentId)).limit(1);
  if (!item) return { ok: false };
  if (existing) {
    const delta = value - existing.value;
    await db.update(interactionsTable).set({ value }).where(eq(interactionsTable.id, existing.id));
    await db.update(contentsTable).set({ ratingSum: item.ratingSum + delta }).where(eq(contentsTable.id, contentId));
  } else {
    await db.insert(interactionsTable).values({ contentId, visitorId, type: "rating", value, text: "" });
    await db.update(contentsTable).set({ ratingSum: item.ratingSum + value, ratingCount: item.ratingCount + 1 }).where(eq(contentsTable.id, contentId));
  }
  return { ok: true };
}

export async function getComments(contentId: number) {
  const rows: InteractionRow[] = await db.select().from(interactionsTable).where(and(eq(interactionsTable.contentId, contentId), eq(interactionsTable.type, "comment"))).orderBy(desc(interactionsTable.createdAt)).limit(30);
  return rows.map((r) => ({ id: r.id, contentId: r.contentId, visitorId: r.visitorId, userId: r.userId, type: r.type, value: r.value, text: r.text, createdAt: iso(r.createdAt) }));
}

async function exportBackup() {
  await ensureSeed();
  const [settingRows, categoryRows, contentRows, pluginRows, languageRows, userRows, visitRows, downloadRows, interactionRows, mediaRows] = await Promise.all([
    db.select().from(settingsTable), db.select().from(categoriesTable), db.select().from(contentsTable),
    db.select().from(pluginsTable), db.select().from(languagesTable), db.select().from(usersTable),
    db.select().from(visitsTable), db.select().from(downloadsTable), db.select().from(interactionsTable),
    db.select().from(mediaFilesTable),
  ]);
  return {
    product: "Meraj Andisheh Studio Content Bank",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: Object.fromEntries(settingRows.map((r) => [r.key, r.value])),
    categories: categoryRows, contents: contentRows, plugins: pluginRows, languages: languageRows,
    users: userRows, visits: visitRows, downloads: downloadRows, interactions: interactionRows, mediaFiles: mediaRows,
  };
}

async function logBackup(mode: string, status: string, target: string, recordCount: number, message: string) {
  await db.insert(backupLogsTable).values({ mode, status, target, recordCount, message });
}

export async function pushBackup(mode: "manual" | "auto" = "manual") {
  await ensureSeed();
  const config = getSetting<BackupConfig>(await settingsMap(), "backup", { enabled: true, intervalDays: 7, webhookUrl: "", secretToken: "", autoPush: true });
  const payload = await exportBackup();
  const recordCount = payload.contents.length + payload.categories.length + Object.keys(payload.settings).length;
  if (!config.webhookUrl) {
    await logBackup(mode, "skipped", "", recordCount, "آدرس وب‍هوک هاست پیکربندی نشده است.");
    return { ok: false, status: "skipped", message: "آدرس وب‍هوک هاست پیکربندی نشده است." };
  }
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Backup-Token": config.secretToken || "",
        "X-Backup-Mode": mode,
      },
      body: JSON.stringify({ source: "meraj-andisheh-content-bank", sentAt: new Date().toISOString(), payload }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    const ok = response.ok;
    await logBackup(mode, ok ? "success" : "failed", config.webhookUrl, recordCount, `HTTP ${response.status}: ${text.slice(0, 300)}`);
    return { ok, status: ok ? "success" : "failed", message: `HTTP ${response.status}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Host sync failed";
    await logBackup(mode, "failed", config.webhookUrl, recordCount, message);
    return { ok: false, status: "failed", message };
  }
}

export async function maybeRunWeeklyBackup() {
  const config = getSetting<BackupConfig>(await settingsMap(), "backup", { enabled: true, intervalDays: 7, webhookUrl: "", secretToken: "", autoPush: true });
  if (!config.enabled || !config.autoPush || !config.webhookUrl) return;
  const logs = await db.select().from(backupLogsTable).where(eq(backupLogsTable.mode, "auto")).orderBy(desc(backupLogsTable.createdAt)).limit(20);
  const lastSuccess = logs.find((l) => l.status === "success");
  const interval = Math.max(1, num(config.intervalDays, 7)) * 86400000;
  if (lastSuccess && Date.now() - lastSuccess.createdAt.getTime() < interval) return;
  await pushBackup("auto");
}

async function importBackup(payload: Payload) {
  const source = obj(payload.data ?? payload);
  if (!source.settings || !Array.isArray(source.contents)) throw new Error("فایل پشتیبان معتبر نیست.");
  await db.delete(interactionsTable); await db.delete(downloadsTable); await db.delete(visitsTable);
  await db.delete(contentsTable); await db.delete(categoriesTable); await db.delete(pluginsTable);
  await db.delete(languagesTable); await db.delete(usersTable); await db.delete(settingsTable); await db.delete(mediaFilesTable);
  for (const [key, value] of Object.entries(obj(source.settings))) {
    await db.execute(sql`insert into settings (key, value, updated_at) values (${key}, ${JSON.stringify(value ?? {})}::jsonb, now())`);
  }
  const categories = (source.categories as Payload[] | undefined) ?? [];
  if (categories.length) await db.insert(categoriesTable).values(categories.map((c) => ({ id: num(c.id), key: str(c.key), label: str(c.label), icon: str(c.icon, "✦"), kind: str(c.kind, "topic"), parentId: nullableNum(c.parentId), sort: num(c.sort), enabled: bool(c.enabled, true), color: nullableStr(c.color) })));
  const contents = (source.contents as Payload[] | undefined) ?? [];
  if (contents.length) await db.insert(contentsTable).values(contents.map((c) => ({
    id: num(c.id), slug: str(c.slug), title: str(c.title), summary: str(c.summary), body: str(c.body),
    keywords: stringArray(c.keywords), figures: stringArray(c.figures), sources: sourceArray(c.sources),
    categoryId: nullableNum(c.categoryId), treeId: nullableNum(c.treeId), portal: str(c.portal, "bank"), topic: str(c.topic, "general"),
    format: str(c.format, "article"), mediaKind: str(c.mediaKind, "article"), fileUrl: nullableStr(c.fileUrl), externalUrl: nullableStr(c.externalUrl),
    embedCode: nullableStr(c.embedCode), thumbnail: str(c.thumbnail, "/images/hero.jpg"), duration: nullableStr(c.duration),
    slideCount: nullableNum(c.slideCount), fileSize: nullableStr(c.fileSize), slideTitles: stringArray(c.slideTitles),
    ageGroups: stringArray(c.ageGroups), gameKey: nullableStr(c.gameKey), views: num(c.views), downloads: num(c.downloads), likes: num(c.likes),
    ratingSum: num(c.ratingSum), ratingCount: num(c.ratingCount), featured: bool(c.featured), published: bool(c.published, true),
    createdAt: date(c.createdAt), updatedAt: date(c.updatedAt),
  })));
  const plugins = (source.plugins as Payload[] | undefined) ?? [];
  if (plugins.length) await db.insert(pluginsTable).values(plugins.map((p) => ({ key: str(p.key), enabled: bool(p.enabled, true), config: obj(p.config), updatedAt: date(p.updatedAt) })));
  const languages = (source.languages as Payload[] | undefined) ?? [];
  if (languages.length) await db.insert(languagesTable).values(languages.map((l) => ({ code: str(l.code), label: str(l.label), nativeLabel: str(l.nativeLabel), direction: str(l.direction, "ltr"), font: str(l.font, "Inter"), calendar: str(l.calendar, "gregory"), motif: str(l.motif, "minimal"), enabled: bool(l.enabled, true), labels: stringRecord(l.labels), sort: num(l.sort) })));
  const users = (source.users as Payload[] | undefined) ?? [];
  if (users.length) await db.insert(usersTable).values(users.map((u) => ({ id: num(u.id), username: str(u.username), password: str(u.password, hashPassword("1234")), role: str(u.role, "visitor"), displayName: str(u.displayName), permissions: stringArray(u.permissions), profile: stringRecord(u.profile), enabled: bool(u.enabled, true), createdAt: date(u.createdAt) })));
  const visits = (source.visits as Payload[] | undefined) ?? [];
  if (visits.length) await db.insert(visitsTable).values(visits.map((v) => ({ id: num(v.id), visitorId: str(v.visitorId), path: str(v.path, "/"), topic: nullableStr(v.topic), contentId: nullableNum(v.contentId), userId: nullableNum(v.userId), createdAt: date(v.createdAt) })));
  const downloads = (source.downloads as Payload[] | undefined) ?? [];
  if (downloads.length) await db.insert(downloadsTable).values(downloads.map((d) => ({ id: num(d.id), userId: nullableNum(d.userId), contentId: num(d.contentId), createdAt: date(d.createdAt) })));
  const interactions = (source.interactions as Payload[] | undefined) ?? [];
  if (interactions.length) await db.insert(interactionsTable).values(interactions.map((i) => ({ id: num(i.id), contentId: num(i.contentId), visitorId: str(i.visitorId), userId: nullableNum(i.userId), type: str(i.type), value: num(i.value), text: str(i.text), createdAt: date(i.createdAt) })));
  const media = (source.mediaFiles as Payload[] | undefined) ?? [];
  if (media.length) await db.insert(mediaFilesTable).values(media.map((m) => ({ id: num(m.id), name: str(m.name), mimeType: str(m.mimeType, "application/octet-stream"), size: num(m.size), data: str(m.data), createdAt: date(m.createdAt) })));
  if (!users.some((u) => str(u.role) === "super_admin")) {
    await db.insert(usersTable).values({ username: "admin", password: hashPassword("1234"), role: "super_admin", displayName: "مدیر کل استودیو", permissions: ["analytics", "content", "taxonomy", "visual", "plugins", "users", "languages", "backups"], profile: {}, enabled: true });
  }
  await logBackup("import", "success", "local-json", contents.length, "بازیابی کامل JSON انجام شد.");
  return { ok: true, count: contents.length };
}

export async function platformAction(action: string, payload: Payload, user: PublicUser | null) {
  switch (action) {
    case "saveSettings": return saveSettings(obj(payload.values));
    case "saveCategory": return { ok: true, ...(await saveCategory(payload)) };
    case "deleteCategory": {
      const id = num(payload.id);
      await db.delete(categoriesTable).where(eq(categoriesTable.parentId, id));
      await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
      return { ok: true };
    }
    case "saveContent": return { ok: true, ...(await saveContent(payload)) };
    case "deleteContent": await db.delete(contentsTable).where(eq(contentsTable.id, num(payload.id))); return { ok: true };
    case "savePlugin": return { ok: true, ...(await savePlugin(payload)) };
    case "saveLanguage": return { ok: true, ...(await saveLanguage(payload)) };
    case "deleteLanguage": await db.delete(languagesTable).where(eq(languagesTable.code, str(payload.code))); return { ok: true };
    case "saveUser": return { ok: true, ...(await saveUser(payload)) };
    case "deleteUser": await db.delete(usersTable).where(eq(usersTable.id, num(payload.id))); return { ok: true };
    case "trackVisit": {
      await db.insert(visitsTable).values({ visitorId: str(payload.visitorId, "anonymous"), path: str(payload.path, "/"), topic: null, contentId: null, userId: user?.id ?? null });
      return { ok: true };
    }
    case "trackView": {
      const id = num(payload.contentId);
      const [item] = await db.select().from(contentsTable).where(eq(contentsTable.id, id)).limit(1);
      if (!item) return { ok: false };
      await db.update(contentsTable).set({ views: item.views + 1 }).where(eq(contentsTable.id, id));
      await db.insert(visitsTable).values({ visitorId: str(payload.visitorId, "anonymous"), path: `/content/${id}`, topic: item.topic, contentId: id, userId: user?.id ?? null });
      return { ok: true, topic: item.topic };
    }
    case "like": {
      const id = num(payload.contentId);
      const [item] = await db.select().from(contentsTable).where(eq(contentsTable.id, id)).limit(1);
      if (item) {
        await db.insert(interactionsTable).values({ contentId: id, visitorId: str(payload.visitorId, "anonymous"), type: "like", value: 1, text: "" });
        await db.update(contentsTable).set({ likes: item.likes + 1 }).where(eq(contentsTable.id, id));
      }
      return { ok: true };
    }
    case "rate": return rateContent(payload);
    case "comment": {
      await db.insert(interactionsTable).values({ contentId: num(payload.contentId), visitorId: str(payload.visitorId, "anonymous"), type: "comment", value: 0, text: str(payload.text).slice(0, 1000) });
      return { ok: true };
    }
    case "getComments": return { ok: true, comments: await getComments(num(payload.contentId)) };
    case "getAnalytics": return { ok: true, analytics: await getAnalytics() };
    case "backupPush": return pushBackup("manual");
    case "backupImport": return importBackup(payload);
    default: return { ok: false, error: `Unknown action: ${action}` };
  }
}

const ACTION_SECTION: Record<string, string> = {
  saveCategory: "taxonomy", deleteCategory: "taxonomy",
  saveContent: "content", deleteContent: "content",
  savePlugin: "plugins", saveLanguage: "languages", deleteLanguage: "languages",
  saveUser: "users", deleteUser: "users",
  backupPush: "backups", backupImport: "backups",
  getAnalytics: "analytics",
};
const PUBLIC_ACTIONS = new Set(["trackVisit", "trackView", "like", "rate", "comment", "getComments"]);

export function canRunAction(action: string, payload: Payload, user: PublicUser | null) {
  if (PUBLIC_ACTIONS.has(action)) return true;
  if (!user || !user.enabled) return false;
  if (user.role === "super_admin") return true;
  const section = str(payload.section, ACTION_SECTION[action] ?? "");
  if (!section) return false;
  return user.permissions.includes(section);
}

export function hasSectionPermission(user: PublicUser | null, section: string) {
  if (!user || !user.enabled) return false;
  return user.role === "super_admin" || user.permissions.includes(section);
}

export async function getSessionUser(token: string | undefined | null): Promise<PublicUser | null> {
  if (!token) return null;
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token)).limit(1);
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  const [row] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
  return row && row.enabled ? serializeUser(row) : null;
}

export async function createSession(userId: number) {
  const token = randomUUID();
  await db.insert(sessionsTable).values({ token, userId, expiresAt: new Date(Date.now() + 30 * 86400000) });
  return token;
}

export async function authenticate(username: string, password: string) {
  await ensureSeed();
  const [row] = await db.select().from(usersTable).where(eq(usersTable.username, username.trim())).limit(1);
  if (!row || !row.enabled || !verifyPassword(password, row.password)) return null;
  const user = serializeUser(row);
  return { user, token: await createSession(user.id) };
}

export async function registerUser(payload: Payload) {
  await ensureSeed();
  const profile = stringRecord(obj(payload.profile));
  const password = str(payload.password, profile.password ?? "");
  const phone = profile.phone ?? "";
  const username = str(payload.username, phone || profile.email || "");
  if (!username || !password) throw new Error("نام کاربری و گذرواژه الزامی است.");
  const fields = getSetting<RegistrationField[]>(await settingsMap(), "registrationFields", []);
  for (const field of fields) {
    if (field.enabled && field.required && field.id !== "password" && !profile[field.id]) throw new Error(`تکمیل فیلد «${field.label}» الزامی است.`);
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing) throw new Error("این نام کاربری یا شماره تلفن پیشتر ثبت شده است.");
  delete profile.password;
  const [row] = await db.insert(usersTable).values({
    username, password: hashPassword(password), role: "visitor",
    displayName: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || username,
    permissions: [], profile, enabled: true,
  }).returning();
  if (phone) void authService.sendOtp(phone);
  const user = serializeUser(row);
  return { user, token: await createSession(user.id) };
}

export async function logoutSession(token: string | undefined | null) {
  if (token) await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
}

export async function getContentById(id: number) {
  const [row] = await db.select().from(contentsTable).where(eq(contentsTable.id, id)).limit(1);
  return row ? serializeContent(row) : null;
}

export async function recordDownload(userId: number | null, contentId: number) {
  const [item] = await db.select().from(contentsTable).where(eq(contentsTable.id, contentId)).limit(1);
  if (!item) return null;
  await db.insert(downloadsTable).values({ userId, contentId });
  await db.update(contentsTable).set({ downloads: item.downloads + 1 }).where(eq(contentsTable.id, contentId));
  return { fileUrl: item.fileUrl, externalUrl: item.externalUrl, title: item.title };
}

export async function getMediaFile(id: number) {
  const [row] = await db.select().from(mediaFilesTable).where(eq(mediaFilesTable.id, id)).limit(1);
  return row ?? null;
}

export async function saveMediaFile(name: string, mimeType: string, size: number, data: string) {
  const [row] = await db.insert(mediaFilesTable).values({ name, mimeType, size, data }).returning();
  return { id: row.id, name: row.name, mimeType: row.mimeType, size: row.size, url: `/api/media/${row.id}` };
}

export async function exportBackupJson() {
  return exportBackup();
}
