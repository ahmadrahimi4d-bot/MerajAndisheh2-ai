import test from "node:test";
import assert from "node:assert/strict";
import { matchesFilters, normalizeText, searchContents, sortByAgeAndBehavior } from "./personalization";
import type { AgeTheme, ContentItem } from "./types";

function makeItem(overrides: Partial<ContentItem> & { id: number; title: string }): ContentItem {
  return {
    slug: `item-${overrides.id}`,
    summary: "",
    body: "",
    keywords: [],
    figures: [],
    sources: [],
    categoryId: null,
    treeId: null,
    portal: "bank",
    topic: "media",
    format: "pdf",
    mediaKind: "pdf",
    fileUrl: null,
    externalUrl: null,
    embedCode: null,
    thumbnail: "/images/hero.jpg",
    duration: null,
    slideCount: null,
    fileSize: null,
    slideTitles: [],
    ageGroups: ["adult"],
    gameKey: null,
    views: 100,
    downloads: 10,
    likes: 5,
    ratingSum: 20,
    ratingCount: 4,
    featured: false,
    published: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("normalizeText normalizes Arabic/Persian variants and whitespace", () => {
  assert.equal(normalizeText("  كتاب   معراج   أنديشة  "), "کتاب معراج اندیشه");
  assert.equal(normalizeText("سُوَاد رَسَانِه‌ای"), "سواد رسانه‌ای");
});

test("searchContents matches across title, keywords, figures, and sources", () => {
  const items = [
    makeItem({
      id: 1,
      title: "سواد رسانه‌ای در فضای مجازی",
      keywords: ["تحلیل", "اخبار"],
      sources: [{ title: "منبع معتبر", publisher: "پژوهشگاه معراج" }],
    }),
    makeItem({
      id: 2,
      title: "مستند هویت تاریخی",
      figures: ["علامه طباطبایی"],
    }),
  ];

  assert.equal(searchContents(items, "معراج اخبار").length, 1);
  assert.equal(searchContents(items, "علامه")[0]?.id, 2);
  assert.equal(searchContents(items, "").length, 2);
});

test("sortByAgeAndBehavior prioritizes matching age bracket, theme format priority, and behavioral topic scores", () => {
  const youthTheme: AgeTheme = {
    id: "youth",
    label: "جوان و دانشجو",
    min: 18,
    max: 29,
    icon: "🚀",
    description: "هویت بصری مدرن",
    colors: { primary: "#12314b", secondary: "#0f766e", accent: "#c8a45d", background: "#f5f4ef", surface: "#ffffff", text: "#172535", muted: "#6b7280" },
    radius: 10,
    fontScale: 0.98,
    mood: "modern",
    motif: "arabesque",
    priority: ["video", "pptx", "pdf"],
  };

  const items = [
    makeItem({ id: 1, title: "Child Game", mediaKind: "game", ageGroups: ["child"], topic: "games", createdAt: "2025-02-01T00:00:00.000Z" }),
    makeItem({ id: 2, title: "Youth Video", mediaKind: "video", ageGroups: ["youth"], topic: "history", createdAt: "2025-01-01T00:00:00.000Z" }),
    makeItem({ id: 3, title: "Youth Deck", mediaKind: "pptx", ageGroups: ["youth"], topic: "media", createdAt: "2025-01-02T00:00:00.000Z" }),
  ];

  const sortedByAge = sortByAgeAndBehavior(items, {
    personalization: true,
    ageGroup: "youth",
    theme: youthTheme,
    scores: {},
  });
  assert.equal(sortedByAge[0]?.id, 2);
  assert.equal(sortedByAge[2]?.id, 1);

  const sortedWithBehavior = sortByAgeAndBehavior(items, {
    personalization: true,
    ageGroup: "youth",
    theme: youthTheme,
    scores: { media: 4 },
  });
  assert.equal(sortedWithBehavior[0]?.id, 3);

  const chronoOnly = sortByAgeAndBehavior(items, {
    personalization: false,
    ageGroup: "youth",
    theme: youthTheme,
    scores: { media: 10 },
  });
  assert.equal(chronoOnly[0]?.id, 1);
});

test("matchesFilters evaluates portal, age, format, tree, and source requirements", () => {
  const item = makeItem({
    id: 10,
    title: "ارائه کلاس تبیین",
    portal: "bank",
    topic: "analysis",
    format: "pptx",
    mediaKind: "pptx",
    ageGroups: ["youth", "adult"],
    treeId: 42,
    sources: [{ title: "سند پشتیبان", url: "https://example.ir/ref" }],
  });

  assert.equal(matchesFilters(item, { age: ["youth"], format: ["pptx"], source: ["url"], tree: ["42"] }), true);
  assert.equal(matchesFilters(item, { age: ["child"] }), false);
  assert.equal(matchesFilters(item, { portal: ["games"] }), false);
});
