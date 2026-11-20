"use client";

import { Bookmark, Eye, Star, BadgeCheck, Clock3 } from "lucide-react";
import { formatMeta } from "@/config/registry";
import { usePlatform } from "@/core/platform-context";
import type { ContentItem } from "@/core/types";
import { Pill } from "@/modules/shared";

export function ContentCard({ item, compact = false }: { item: ContentItem; compact?: boolean }) {
  const { openContent, bookmarks, toggleBookmark, t, date, ageGroup, ageThemes } = usePlatform();
  const meta = formatMeta(item.format, item.mediaKind);
  const rating = item.ratingCount ? (item.ratingSum / item.ratingCount).toFixed(1) : "—";
  const matched = item.ageGroups.includes(ageGroup);
  const ageLabel = ageThemes.find((a) => a.id === item.ageGroups[0])?.label.split("(")[0] ?? "";
  return (
    <article className={`content-card ${compact ? "compact" : ""}`} onClick={() => openContent(item)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") openContent(item); }}>
      <div className="card-cover" style={{ backgroundImage: `url('${item.thumbnail}')` }}>
        <div className="card-cover-overlay" />
        <span className="format-badge" style={{ background: meta.color }}>{meta.icon} {meta.label}</span>
        {item.featured && <span className="featured-badge">✦ ویژه</span>}
        <button className={`card-bookmark ${bookmarks.includes(item.id) ? "is-active" : ""}`} onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }} aria-label={t("bookmark")}>
          <Bookmark size={17} fill={bookmarks.includes(item.id) ? "currentColor" : "none"} />
        </button>
        <div className="cover-bottom"><span><Eye size={14} /> {item.views.toLocaleString("fa-IR")}</span><span><Star size={14} fill="currentColor" /> {rating}</span></div>
      </div>
      <div className="card-body">
        <div className="card-kicker">
          <span>{item.portal === "games" ? t("games") : item.portal === "docs" ? t("documentaries") : item.portal === "books" ? t("books") : t("bank")}</span>
          <span><Clock3 size={12} /> {date(item.createdAt).split(",")[0]}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="card-tags">
          {item.sources.length > 0 && <Pill tone="source"><BadgeCheck size={12} /> {t("sourceBadge")}</Pill>}
          {matched && <Pill tone="age">{ageLabel}</Pill>}
          {item.keywords.slice(0, 2).map((k) => <Pill key={k}>{k}</Pill>)}
        </div>
      </div>
    </article>
  );
}
