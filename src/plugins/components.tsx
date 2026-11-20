"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, MessageCircle, Send, Share2, Star, TrendingUp } from "lucide-react";
import { buildAppUrl } from "@/core/assets";
import { usePlatform } from "@/core/platform-context";
import { isPluginEnabled, pluginConfig } from "@/plugins";
import type { CommentItem, ContentItem } from "@/core/types";
import { ContentCard } from "@/modules/public/content-card";
import { SectionTitle, Toggle } from "@/modules/shared";

export function BreakingTicker() {
  const { data, t } = usePlatform();
  if (!isPluginEnabled(data, "ticker")) return null;
  const config = pluginConfig(data, "ticker", { messages: [] as string[], speed: 38 });
  const messages = config.messages?.length ? config.messages : ["بانک محتوای استودیو معراج اندیشه"];
  return (
    <div className="ticker-zone" aria-label={t("breakingNews")}>
      <div className="ticker-label"><span className="ticker-dot" /> {t("breakingNews")}</div>
      <div className="ticker-viewport"><div className="ticker-track" style={{ animationDuration: `${config.speed ?? 38}s` }}>
        {[...messages, ...messages].map((message, i) => <span key={`${message}-${i}`}><i>◆</i> {message}</span>)}
      </div></div>
    </div>
  );
}

export function WeeklyTrendingShelf() {
  const { data, t, navigate } = usePlatform();
  const scroller = useRef<HTMLDivElement>(null);
  if (!isPluginEnabled(data, "trending")) return null;
  const config = pluginConfig(data, "trending", { limit: 10 });
  const items = [...data.contents].filter((c) => c.published).sort((a, b) => b.views - a.views).slice(0, config.limit ?? 10);
  const scroll = (direction: number) => scroller.current?.scrollBy({ left: direction * 620, behavior: "smooth" });
  return (
    <section className="home-section trending-section">
      <SectionTitle eyebrow="PLUGIN · WEEKLY" title={t("trending")} description="افزونه اسلایدر پربازدید هفته" action={
        <div className="shelf-controls"><button onClick={() => scroll(1)} aria-label="next"><ChevronRight size={18} /></button><button onClick={() => scroll(-1)} aria-label="prev"><ChevronLeft size={18} /></button><button className="text-link" onClick={() => navigate("bank")}>{t("explore")} ←</button></div>
      } />
      <div className="trending-strip" ref={scroller}>{items.map((item, index) => (
        <div className="trending-item" key={item.id}><span className="trend-rank">{String(index + 1).padStart(2, "0")}</span><ContentCard item={item} compact /></div>
      ))}</div>
    </section>
  );
}

export function RatingComments({ item }: { item: ContentItem }) {
  const { data, t, call, visitorId, user, ensureAuth, showToast, date } = usePlatform();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const enabled = isPluginEnabled(data, "ratings");
  const config = pluginConfig(data, "ratings", { comments: true, requireLoginForComment: false });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    call("getComments", { contentId: item.id }, { refreshAfter: false })
      .then((result) => {
        if (!cancelled) setComments((result.comments as CommentItem[]) ?? []);
      })
      .catch(() => { /* handled by context toast */ });
    return () => { cancelled = true; };
  }, [item.id, enabled, call]);

  if (!enabled) return null;

  const reloadComments = async () => {
    try {
      const result = await call("getComments", { contentId: item.id }, { refreshAfter: false });
      setComments((result.comments as CommentItem[]) ?? []);
    } catch { /* handled by context toast */ }
  };
  const submitRating = async (value: number) => {
    setRating(value);
    try { await call("rate", { contentId: item.id, visitorId, value }, { refreshAfter: false }); showToast("امتیاز شما ثبت شد"); } catch { /* noop */ }
  };
  const submitComment = async () => {
    if (!text.trim()) return;
    if (config.requireLoginForComment && !ensureAuth()) return;
    try { await call("comment", { contentId: item.id, visitorId, text }, { refreshAfter: false }); setText(""); await reloadComments(); showToast("دیدگاه ثبت شد"); } catch { /* noop */ }
  };
  return (
    <div className="rating-comments plugin-block">
      <div className="rating-row"><div><Star size={18} /> <strong>{t("rating")}</strong><span> {item.ratingCount ? (item.ratingSum / item.ratingCount).toFixed(1) : "—"} / ۵</span></div>
        <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => void submitRating(n)} className={n <= rating ? "on" : ""} aria-label={`${n}`}><Star size={20} fill={n <= rating ? "currentColor" : "none"} /></button>)}</div>
      </div>
      {config.comments !== false && <div className="comments-block">
        <h4><MessageCircle size={17} /> {t("comments")} <span>{comments.length}</span></h4>
        <div className="comment-input"><input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("commentsPlaceholder")} onKeyDown={(e) => { if (e.key === "Enter") void submitComment(); }} /><button onClick={() => void submitComment()}><Send size={16} /></button></div>
        <div className="comment-list">{comments.map((c) => <div className="comment" key={c.id}><div className="comment-avatar">{user?.displayName?.[0] ?? "م"}</div><div><strong>{user?.displayName && user.id === c.userId ? user.displayName : "بازدیدکننده"}</strong><small>{date(c.createdAt)}</small><p>{c.text}</p></div></div>)}</div>
      </div>}
    </div>
  );
}

export function SocialShare({ item }: { item: ContentItem }) {
  const { data, t, showToast } = usePlatform();
  if (!isPluginEnabled(data, "share")) return null;
  const config = pluginConfig(data, "share", { networks: [] as string[] });
  const link = typeof window === "undefined" ? "" : `${window.location.origin}${buildAppUrl(`view=bank&q=${encodeURIComponent(item.title)}`)}`;
  const share = async (network: string) => {
    if (network === "کپی پیوند" || network === "Copy link") {
      await navigator.clipboard?.writeText(link);
      showToast(t("copied"));
      return;
    }
    const url = encodeURIComponent(link), text = encodeURIComponent(item.title);
    if (network === "تلگرام") window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
    else if (network === "واتساپ") window.open(`https://wa.me/?text=${text}%20${url}`, "_blank", "noopener,noreferrer");
    else window.open(`mailto:?subject=${text}&body=${url}`, "_blank");
  };
  return (
    <div className="share-block plugin-block"><span><Share2 size={16} /> {t("share")}</span>
      <div className="share-actions">{(config.networks ?? []).map((network) => <button key={network} onClick={() => void share(network)}>{network === "کپی پیوند" && <Copy size={13} />}{network}</button>)}</div>
    </div>
  );
}

export function PluginStatusBadge({ pluginKey }: { pluginKey: string }) {
  const { data, t } = usePlatform();
  return <Toggle checked={isPluginEnabled(data, pluginKey)} onChange={() => undefined} label={t("status")} />;
}

export function TrendingIcon() {
  return <TrendingUp size={18} />;
}
