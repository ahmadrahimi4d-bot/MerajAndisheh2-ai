import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("✦"),
  kind: text("kind").notNull(),
  parentId: integer("parent_id"),
  sort: integer("sort").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  color: text("color"),
});

export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  body: text("body").notNull().default(""),
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
  figures: jsonb("figures").$type<string[]>().notNull().default([]),
  sources: jsonb("sources").$type<{ title: string; publisher?: string; url?: string; year?: string }[]>().notNull().default([]),
  categoryId: integer("category_id"),
  treeId: integer("tree_id"),
  portal: text("portal").notNull().default("bank"),
  topic: text("topic").notNull().default("general"),
  format: text("format").notNull().default("article"),
  mediaKind: text("media_kind").notNull().default("article"),
  fileUrl: text("file_url"),
  externalUrl: text("external_url"),
  embedCode: text("embed_code"),
  thumbnail: text("thumbnail").notNull().default("/images/hero.jpg"),
  duration: text("duration"),
  slideCount: integer("slide_count"),
  fileSize: text("file_size"),
  slideTitles: jsonb("slide_titles").$type<string[]>().notNull().default([]),
  ageGroups: jsonb("age_groups").$type<string[]>().notNull().default(["adult"]),
  gameKey: text("game_key"),
  views: integer("views").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("visitor"),
  displayName: text("display_name").notNull().default(""),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  profile: jsonb("profile").$type<Record<string, string>>().notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  path: text("path").notNull().default("/"),
  topic: text("topic"),
  contentId: integer("content_id"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  contentId: integer("content_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  userId: integer("user_id"),
  type: text("type").notNull(),
  value: integer("value").notNull().default(1),
  text: text("text").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plugins = pgTable("plugins", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const languages = pgTable("languages", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  nativeLabel: text("native_label").notNull(),
  direction: text("direction").notNull().default("ltr"),
  font: text("font").notNull().default("Inter"),
  calendar: text("calendar").notNull().default("gregory"),
  motif: text("motif").notNull().default("minimal"),
  enabled: boolean("enabled").notNull().default(true),
  labels: jsonb("labels").$type<Record<string, string>>().notNull().default({}),
  sort: integer("sort").notNull().default(0),
});

export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  mode: text("mode").notNull().default("manual"),
  status: text("status").notNull(),
  target: text("target").notNull().default(""),
  recordCount: integer("record_count").notNull().default(0),
  message: text("message").notNull().default(""),
});

export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull().default(0),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
