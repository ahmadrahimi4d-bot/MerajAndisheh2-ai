import type { AgeTheme, ContentItem, SourceRef } from "@/core/types";

const TOPIC_KEY = "meraj.topicScores.v1";

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, "ی")
    .replace(/[\u0643]/g, "ک")
    .replace(/[\u0622\u0623\u0625\u0627]/g, "ا")
    .replace(/[\u0624]/g, "و")
    .replace(/[\u0626]/g, "ی")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[ة]/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function readTopicScores(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TOPIC_KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export function trackTopic(topic: string) {
  if (typeof window === "undefined" || !topic) return;
  const scores = readTopicScores();
  scores[topic] = (scores[topic] ?? 0) + 1;
  localStorage.setItem(TOPIC_KEY, JSON.stringify(scores));
}

export function searchContents(items: ContentItem[], query: string) {
  const q = normalizeText(query);
  if (!q) return items;
  const words = q.split(" ").filter(Boolean);
  return items.filter((item) => {
    const sourceText = (item.sources as SourceRef[]).map((s) => `${s.title} ${s.publisher ?? ""} ${s.year ?? ""} ${s.url ?? ""}`).join(" ");
    const haystack = normalizeText([
      item.title, item.summary, item.body, item.keywords.join(" "), item.figures.join(" "),
      sourceText, item.topic, item.portal, item.format, item.slideTitles.join(" "),
    ].join(" "));
    return words.every((word) => haystack.includes(word));
  });
}

export function sortByAgeAndBehavior(items: ContentItem[], options: {
  personalization: boolean;
  ageGroup: string;
  theme?: AgeTheme;
  scores?: Record<string, number>;
}) {
  if (!options.personalization) {
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const priority = options.theme?.priority ?? [];
  const scores = options.scores ?? {};
  const rating = (item: ContentItem) => item.ratingCount ? item.ratingSum / item.ratingCount : 0;
  return [...items].sort((a, b) => {
    const score = (item: ContentItem) => {
      const formatIndex = priority.indexOf(item.mediaKind);
      return (scores[item.topic] ?? 0) * 12
        + (item.ageGroups.includes(options.ageGroup) ? 8 : -4)
        + (formatIndex >= 0 ? (priority.length - formatIndex) * 2 : 0)
        + Math.min(3, item.views / 1000)
        + rating(item);
    };
    return score(b) - score(a) || b.createdAt.localeCompare(a.createdAt);
  });
}

export type ActiveFilters = Record<string, string[]>;

export function matchesFilters(item: ContentItem, filters: ActiveFilters) {
  for (const [group, values] of Object.entries(filters)) {
    if (!values?.length) continue;
    const matched = values.some((value) => {
      switch (group) {
        case "topic": return item.topic === value;
        case "format": return item.mediaKind === value || item.format === value;
        case "age": return item.ageGroups.includes(value);
        case "portal": return item.portal === value;
        case "source": return value === "url" ? item.sources.some((s) => Boolean(s.url)) : item.sources.length > 0;
        case "tree": return String(item.treeId) === value;
        default: return item.keywords.includes(value) || item.topic === value;
      }
    });
    if (!matched) return false;
  }
  return true;
}
