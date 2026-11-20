"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark, Download, ExternalLink, FileArchive, FileSpreadsheet, FileText, Heart, Image as ImageIcon,
  Info, Layers, Link2, LockKeyhole, Palette, Play, Sparkles, Star, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { DEFAULT_STORY_THEMES } from "@/config/defaults";
import { formatMeta } from "@/config/registry";
import { usePlatform } from "@/core/platform-context";
import { generateStory } from "@/core/story";
import { getSetting, type ContentItem, type StoryTheme } from "@/core/types";
import { RatingComments, SocialShare } from "@/plugins/components";
import { IconButton, Modal, Pill } from "@/modules/shared";

const QUIZ = [
  { question: "پیش از بازنشر یک خبر، نخستین پرسش ضروری چیست؟", options: ["منبع اصلی خبر کجاست؟", "چند نفر آن را لایک کردهاند؟"], correct: 0, note: "منبع، تاریخ و سند سه رکن اعتبارسنجی هستند." },
  { question: "کدام نشانه احتمال شایعه بودن یک پیام را افزایش میدهد؟", options: ["نبود تاریخ و نام ناشر", "وجود پیوند به سند اصلی"], correct: 0, note: "ناشناس بودن منبع و ابهام زمانی از نشانههای شایعه است." },
  { question: "بهترین کار هنگام دیدن یک آمار بدون منبع چیست؟", options: ["جستجوی منبع اولیه و مقایسه", "بازنشر سریع برای اطلاعرسانی"], correct: 0, note: "همیشه آمار را به منبع اولیه ارجاع دهید." },
];

function QuizGame() {
  const { t } = usePlatform();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const current = QUIZ[step];
  const choose = (index: number) => {
    if (answer !== null) return;
    setAnswer(index);
    if (index === current.correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (step === QUIZ.length - 1) setDone(true);
    else { setStep(step + 1); setAnswer(null); }
  };
  return <div className="mini-game quiz-game"><div className="game-top"><span><Play size={15} /> {t("miniGame")}</span><b>{t("score")}: {score}/{QUIZ.length}</b></div>
    {done ? <div className="game-result"><span>🏆</span><h3>بازی پایان یافت</h3><p>شما {score} پاسخ درست دادید. تشخیص منبع، اولین گام سواد رسانهای است.</p><button className="primary-button" onClick={() => { setStep(0); setScore(0); setAnswer(null); setDone(false); }}>{t("restart")}</button></div>
      : <div className="quiz-body"><div className="quiz-progress">{QUIZ.map((_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</div><h3>{current.question}</h3><div className="quiz-options">{current.options.map((option, i) => <button key={option} className={answer !== null ? (i === current.correct ? "correct" : i === answer ? "wrong" : "") : ""} onClick={() => choose(i)}>{option}</button>)}</div>{answer !== null && <div className={`quiz-note ${answer === current.correct ? "ok" : "no"}`}><strong>{answer === current.correct ? t("correct") : t("incorrect")}</strong> · {current.note}</div>}<button className="primary-button" disabled={answer === null} onClick={next}>{step === QUIZ.length - 1 ? "پایان" : "پرسش بعدی ←"}</button></div>}
  </div>;
}

function MemoryGame() {
  const { t } = usePlatform();
  const cards = useMemo(() => ["📰", "📚", "🎬", "🧭", "✦", "🎧"].flatMap((icon, i) => [{ id: `${i}-a`, icon }, { id: `${i}-b`, icon }]).map((card, i) => ({ ...card, sort: (i * 7) % 12 })).sort((a, b) => a.sort - b.sort), []);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [solved, setSolved] = useState<string[]>([]);
  const click = (id: string, icon: string) => {
    if (flipped.includes(id) || solved.includes(icon) || flipped.length === 2) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      const first = cards.find((c) => c.id === next[0]);
      const second = cards.find((c) => c.id === next[1]);
      setTimeout(() => {
        if (first?.icon === second?.icon) setSolved((s) => [...s, icon]);
        setFlipped([]);
      }, 650);
    }
  };
  return <div className="mini-game memory-game"><div className="game-top"><span>🎮 {t("miniGame")}</span><b>{t("score")}: {solved.length}/{cards.length / 2}</b></div><h3>جفت کارتهای مفاهیم فرهنگی را پیدا کنید</h3><div className="memory-grid">{cards.map((card) => {
    const open = flipped.includes(card.id) || solved.includes(card.icon);
    return <button key={card.id} className={`memory-card ${open ? "open" : ""}`} onClick={() => click(card.id, card.icon)}>{open ? card.icon : "✦"}</button>;
  })}</div>{solved.length === cards.length / 2 && <div className="game-win">✦ آفرین! همه جفتها پیدا شد. <button onClick={() => { setSolved([]); setFlipped([]); }}>{t("restart")}</button></div>}</div>;
}

function SlidePreviewer({ item, onDownload }: { item: ContentItem; onDownload: () => void }) {
  const { t } = usePlatform();
  const titles = item.slideTitles.length ? item.slideTitles : ["معرفی", "مخاطب و پیام", "ساختار روایت", "منبع و سند", "تمرین", "جمع بندی"];
  const [activeSlide, setActiveSlide] = useState(0);
  const currentTitle = titles[activeSlide % titles.length];
  return <div className="slide-previewer">
    <div className="slide-file-head"><div className="slide-file-icon">📊</div><div><span className="eyebrow">POWERPOINT · OFFICE PREVIEW</span><h3>{t("slides")}</h3><p>{item.fileSize || "PPTX"} · {t("slideCount")}: {item.slideCount ?? titles.length} · {item.format.toUpperCase()}</p></div><button className="primary-button" onClick={onDownload}><Download size={16} /> {t("originalFile")}</button></div>
    <div className="slide-stage">
      <div className="slide-stage-meta"><span>SLIDE {String(activeSlide + 1).padStart(2, "0")} / {String(titles.length).padStart(2, "0")}</span><div className="slide-stage-nav"><button type="button" onClick={() => setActiveSlide((s) => (s - 1 + titles.length) % titles.length)}>قبلی</button><button type="button" onClick={() => setActiveSlide((s) => (s + 1) % titles.length)}>بعدی</button></div></div>
      <h4>{currentTitle}</h4>
      <p>{item.summary}</p>
    </div>
    <div className="slide-grid">{titles.slice(0, 6).map((title, i) => <button type="button" className={`slide-thumb ${i === activeSlide ? "active" : ""}`} key={`${title}-${i}`} onClick={() => setActiveSlide(i)}><span>{String(i + 1).padStart(2, "0")}</span><strong>{title}</strong><i>استودیو معراج اندیشه</i><div className="slide-shape" /></button>)}</div>
    <div className="slide-footer"><Info size={15} /> پیشنمایش بومی اسلایدها در سامانه؛ فایل اصلی پاورپوینت بدون تغییر قابل دانلود است.</div>
  </div>;
}

function FileCard({ item, onDownload }: { item: ContentItem; onDownload: () => void }) {
  const { t } = usePlatform();
  const meta = formatMeta(item.format, item.mediaKind);
  const icon = item.mediaKind === "spreadsheet" ? <FileSpreadsheet size={40} /> : item.mediaKind === "archive" ? <FileArchive size={40} /> : item.mediaKind === "link" ? <Link2 size={40} /> : <FileText size={40} />;
  return <div className="universal-file-card"><div className="file-card-icon" style={{ background: meta.color }}>{icon}</div><div className="file-card-info"><span className="eyebrow">{t("fileInfo")}</span><h3>{meta.label} · {item.format.toUpperCase()}</h3><p>{item.fileSize || "فایل پیوست"} {item.duration && `· ${item.duration}`}</p><div className="file-metadata"><Pill>{t("originalFile")}</Pill><Pill tone="source">{item.sources.length} منبع</Pill></div></div><div className="file-card-actions">{item.mediaKind === "link" && item.externalUrl ? <a className="primary-button" href={item.externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t("openLink")}</a> : <button className="primary-button" onClick={onDownload}><Download size={16} /> {t("download")}</button>}</div></div>;
}

function UniversalViewer({ item, onDownload }: { item: ContentItem; onDownload: () => void }) {
  const { t } = usePlatform();
  const [zoom, setZoom] = useState(false);
  const source = item.externalUrl || item.fileUrl || "";
  if (item.embedCode) return <div className="universal-viewer embed-viewer"><iframe srcDoc={item.embedCode} title={item.title} allowFullScreen /></div>;
  if (item.mediaKind === "game") return <div className="universal-viewer game-viewer">{item.gameKey === "memory" ? <MemoryGame /> : <QuizGame />}</div>;
  if (item.mediaKind === "video") return <div className="universal-viewer media-viewer">{source ? <video controls poster={item.thumbnail} src={source} /> : <div className="media-fallback">ویدئو پیوست نشده است</div>}<div className="media-caption"><span>🎬 {item.title}</span><span>{item.duration || "ویدئو"}</span></div></div>;
  if (item.mediaKind === "audio") return <div className="universal-viewer audio-viewer" style={{ backgroundImage: `url('${item.thumbnail}')` }}><div className="audio-panel"><span>🎧 پادکست و فایل صوتی</span><h3>{item.title}</h3><p>{item.summary}</p>{source ? <audio controls src={source} /> : <div className="media-fallback">فایل صوتی پیوست نشده است</div>}</div></div>;
  if (item.mediaKind === "image") return <div className="universal-viewer image-viewer"><img src={item.fileUrl || item.externalUrl || item.thumbnail} alt={item.title} className={zoom ? "zoomed" : ""} onClick={() => setZoom(!zoom)} /><button className="zoom-button" onClick={() => setZoom(!zoom)}>{zoom ? <ZoomOut size={17} /> : <ZoomIn size={17} />} {zoom ? "کوچک کردن" : "بزرگنمایی"}</button><ImageIcon className="viewer-watermark" size={30} /></div>;
  if (item.mediaKind === "pdf") return <div className="universal-viewer pdf-viewer"><div className="pdf-toolbar"><span>📕 نمایشگر درونبرنامهای PDF</span><button onClick={onDownload} disabled={!source}><Download size={15} /> {t("download")}</button></div>{source ? <iframe src={`${source}#view=FitH`} title={item.title} /> : <div className="media-fallback">فایل PDF پیوست نشده است</div>}</div>;
  if (item.mediaKind === "article") return <div className="universal-viewer article-viewer"><span className="eyebrow">ARTICLE · FULL TEXT</span><h2>{item.title}</h2><p className="article-lead">{item.summary}</p>{item.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}<div className="article-figures"><strong>{t("figures")}:</strong> {item.figures.map((f) => <Pill key={f}>{f}</Pill>)}</div></div>;
  if (item.mediaKind === "presentation") return <div className="universal-viewer presentation-viewer"><SlidePreviewer item={item} onDownload={onDownload} /></div>;
  return <div className="universal-viewer"><FileCard item={item} onDownload={onDownload} /></div>;
}

function StoryGenerator({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const { settings, t, ensureAuth, showToast } = usePlatform();
  const themes = getSetting<StoryTheme[]>(settings, "storyThemes", DEFAULT_STORY_THEMES);
  const site = getSetting<{ watermark?: string }>(settings, "site", {});
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "editorial");
  const [watermark, setWatermark] = useState(site.watermark || "استودیو معراج اندیشه");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const theme = themes.find((x) => x.id === themeId) ?? themes[0] ?? DEFAULT_STORY_THEMES[0];
  const build = async () => {
    setBusy(true);
    try {
      const result = await generateStory({ theme, title: item.title, summary: item.summary, source: item.sources[0]?.publisher || item.sources[0]?.title || "استودیو معراج اندیشه", image: item.thumbnail, watermark });
      setImage(result);
    } catch (error) { showToast(error instanceof Error ? error.message : "خطا در ساخت استوری"); }
    setBusy(false);
  };
  const download = () => {
    if (!image) return;
    if (!ensureAuth("story")) return;
    const link = document.createElement("a");
    link.href = image; link.download = `meraj-story-${item.id}.png`; link.click();
    showToast("استوری PNG دانلود شد");
  };
  useEffect(() => {
    let active = true;
    generateStory({
      theme,
      title: item.title,
      summary: item.summary,
      source: item.sources[0]?.publisher || item.sources[0]?.title || "استودیو معراج اندیشه",
      image: item.thumbnail,
      watermark,
    })
      .then((result) => { if (active) setImage(result); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [theme, item, watermark]);
  return <div className="story-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="story-generator">
    <button className="modal-close" onClick={onClose}><X size={20} /></button>
    <div className="story-controls"><span className="eyebrow">STORY EXPORT · 1080×1920</span><h2><Sparkles size={20} /> {t("generateStory")}</h2><p>سه تم بصری، تصویر کاور، خلاصه، نشان منبع معتبر و واترمارک قابل تنظیم.</p>
      <label className="field"><span className="field-label"><Palette size={14} /> {t("storyTheme")}</span><div className="story-theme-grid">{themes.map((st) => <button key={st.id} className={st.id === themeId ? "active" : ""} onClick={() => setThemeId(st.id)} style={{ background: st.background, borderColor: st.accent }}><i style={{ background: st.accent }} />{st.label}</button>)}</div></label>
      <label className="field"><span className="field-label">{t("watermark")}</span><input value={watermark} onChange={(e) => setWatermark(e.target.value)} /></label>
      <button className="primary-button full" onClick={() => void build()} disabled={busy}>{busy ? "در حال رندر…" : "بازتولید پیشنمایش"}</button>
      <button className="primary-button full story-download" onClick={download} disabled={!image}><Download size={17} /> {t("downloadStory")}</button>
      <div className="story-gate-note"><LockKeyhole size={14} /> {t("loginRequired")}</div>
    </div>
    <div className="story-preview">{image ? <img src={image} alt="Story preview" /> : <div className="story-loading"><Layers size={32} /><span>در حال ترسیم استوری…</span></div>}<small>پیشنمایش ۱۰۸۰ × ۱۹۲۰ پیکسل · خروجی PNG</small></div>
  </div></div>;
}

export function ContentDetailModal() {
  const {
    selectedContent: item, closeContent, t, bookmarks, toggleBookmark, call, visitorId,
    ensureAuth, user, pendingAction, consumePendingAction, showToast, offlineMode,
  } = usePlatform();
  const [liked, setLiked] = useState(false);
  const [rating, setRating] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
  const triggerDownload = useCallback(() => {
    if (!item) return;
    if (!ensureAuth("download")) return;
    const directUrl = item.fileUrl || item.externalUrl;
    if (offlineMode || directUrl?.startsWith("data:")) {
      if (!directUrl) return;
      void call("recordDownload", { contentId: item.id }, { refreshAfter: false }).catch(() => undefined);
      const link = document.createElement("a");
      link.href = directUrl;
      link.download = `${item.slug || item.id}.${item.format || "bin"}`;
      if (directUrl.startsWith("http")) link.target = "_blank";
      document.body.appendChild(link); link.click(); link.remove();
      showToast("دانلود فایل آغاز شد");
      return;
    }
    const link = document.createElement("a");
    link.href = `/api/download/${item.id}`;
    document.body.appendChild(link); link.click(); link.remove();
    showToast("دانلود فایل آغاز شد");
  }, [item, ensureAuth, showToast, offlineMode, call]);
  useEffect(() => {
    if (!user || !pendingAction) return;
    const action = consumePendingAction();
    if (action === "download") triggerDownload();
    if (action === "story") {
      const id = setTimeout(() => setStoryOpen(true), 0);
      return () => clearTimeout(id);
    }
  }, [user, pendingAction, consumePendingAction, triggerDownload]);
  if (!item) return null;
  const meta = formatMeta(item.format, item.mediaKind);
  const available = Boolean(item.fileUrl || item.externalUrl);
  const like = async () => {
    if (liked) return;
    setLiked(true);
    try { await call("like", { contentId: item.id, visitorId }, { refreshAfter: false }); } catch { /* toast in context */ }
  };
  const quickRate = async (value: number) => {
    setRating(value);
    try { await call("rate", { contentId: item.id, visitorId, value }, { refreshAfter: false }); showToast("امتیاز ثبت شد"); } catch { /* noop */ }
  };
  return <>
    <Modal onClose={closeContent} className="detail-modal" label={item.title}>
      <div className="detail-top"><span className="detail-format" style={{ background: meta.color }}>{meta.icon} {meta.label}</span><div><span className="eyebrow">{item.portal} · {item.topic} · {item.format.toUpperCase()}</span><h2>{item.title}</h2></div><Pill tone="age">{item.ageGroups.length} {t("ageBadge")}</Pill></div>
      <UniversalViewer item={item} onDownload={triggerDownload} />
      <div className="citation-box"><div className="citation-title"><span>◈</span><div><strong>{t("sources")}</strong><small>هر محتوا با ارجاع قابل پیگیری مستند شده است</small></div><Pill tone="source">✓ {t("sourceBadge")}</Pill></div><div className="citation-list">{item.sources.length ? item.sources.map((source, i) => <div className="citation-item" key={`${source.title}-${i}`}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{source.title}</strong><p>{source.publisher} {source.year && `· ${source.year}`}</p></div>{source.url && <a href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>}</div>) : <div className="citation-item"><span>01</span><div><strong>استودیو معراج اندیشه</strong><p>منبع داخلی تولید محتوا</p></div></div>}</div><div className="citation-keywords"><strong>{t("keywords")}:</strong> {item.keywords.map((k) => <Pill key={k}>{k}</Pill>)}</div></div>
      <div className="detail-action-bar">
        <button className={`action-button ${liked ? "active" : ""}`} onClick={() => void like()}><Heart size={18} fill={liked ? "currentColor" : "none"} /> {t("like")} <b>{item.likes + (liked ? 1 : 0)}</b></button>
        <button className={`action-button ${bookmarks.includes(item.id) ? "active" : ""}`} onClick={() => toggleBookmark(item.id)}><Bookmark size={18} fill={bookmarks.includes(item.id) ? "currentColor" : "none"} /> {t("bookmark")}</button>
        <div className="action-rating"><span>{t("rating")}</span>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= rating ? "on" : ""} onClick={() => void quickRate(n)}><Star size={17} fill={n <= rating ? "currentColor" : "none"} /></button>)}</div>
        <button className="primary-button download-button" onClick={triggerDownload} disabled={!available}><Download size={17} /> {available ? t("download") : t("noFile")}</button>
        <button className="story-button" onClick={() => setStoryOpen(true)}><Sparkles size={17} /> {t("story")}</button>
      </div>
      <div className="detail-extra"><p className="detail-summary">{item.summary}</p><RatingComments item={item} /><SocialShare item={item} /></div>
    </Modal>
    {storyOpen && <StoryGenerator item={item} onClose={() => setStoryOpen(false)} />}
  </>;
}
