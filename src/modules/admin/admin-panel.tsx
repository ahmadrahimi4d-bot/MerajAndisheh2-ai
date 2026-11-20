"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowDown, ArrowUp, BarChart3, ChevronLeft, Database, Eye, FilePlus2, LayoutDashboard,
  LogOut, Palette, Plus, Save, Search, Sparkles, Tags, Trash2, Upload,
} from "lucide-react";
import { ADMIN_SECTIONS, CATEGORY_KINDS, FORMAT_META, formatMeta, fileExtension } from "@/config/registry";
import { DEFAULT_AGE_THEMES, DEFAULT_HERO_SLIDES, DEFAULT_HOME_SECTIONS, DEFAULT_PORTAL_LINKS, DEFAULT_STORY_THEMES } from "@/config/defaults";
import { usePlatform } from "@/core/platform-context";
import { isUnreachableResponse, saveLocalUpload } from "@/core/local-fallback";
import { normalizeText } from "@/core/personalization";
import { getSetting, type AgeTheme, type CategoryRecord, type ContentItem, type HeroSlide, type HomeSection, type PortalLink, type SectionKey, type SourceRef, type StoryTheme } from "@/core/types";
import { useSettingsDraft } from "@/modules/admin/hooks";
import { BackupsSection, LanguagesSection, PluginsSection, UsersSection } from "@/modules/admin/admin-sections-2";
import { Field, Toggle } from "@/modules/shared";

function AnalyticsSection() {
  const { data, refresh, showToast, date } = usePlatform();
  const a = data.analytics;
  const stats = [
    { label: "بازدیدکنندگان یکتا", value: a.uniqueVisitors, icon: "👥", tone: "navy" },
    { label: "کل بازدیدها / نشستها", value: a.totalVisits, icon: "📈", tone: "blue" },
    { label: "بازدید محتوا", value: a.totalViews, icon: "👁", tone: "emerald" },
    { label: "کل دانلودها", value: a.totalDownloads, icon: "⬇", tone: "gold" },
    { label: "بازدیدکنندگان ثبتنامشده", value: a.visitors, icon: "🧾", tone: "purple" },
    { label: "محتوای منتشرشده", value: a.contentCount, icon: "📚", tone: "rose" },
  ];
  const maxTopic = Math.max(1, ...a.topTopics.map((x) => x.count));
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 01 · ANALYTICS</span><h2>آمار دقیق بازدید</h2><p>شمارش بازدید یکتا و نشستها، موضوعات داغ و آمار دانلود فایلها.</p></div><BarChart3 size={30} /></div>
    <div className="stat-grid">{stats.map((s) => <article className={`stat-card ${s.tone}`} key={s.label}><span>{s.icon}</span><strong>{s.value.toLocaleString("fa-IR")}</strong><small>{s.label}</small></article>)}</div>
    <div className="admin-two-col"><div className="panel-card"><h3>موضوعات پربازدید</h3><div className="bar-list">{a.topTopics.map((topic) => <div className="bar-row" key={topic.label}><span>{topic.label}</span><div><i style={{ width: `${(topic.count / maxTopic) * 100}%` }} /></div><b>{topic.count}</b></div>)}{!a.topTopics.length && <p>دادهای ثبت نشده است.</p>}</div></div><div className="panel-card"><h3>پردانلودترین محتواها</h3><div className="download-list">{a.topDownloads.map((d, i) => <div key={d.title}><span>{String(i + 1).padStart(2, "0")}</span><strong>{d.title}</strong><b>{d.count}</b></div>)}</div></div></div>
    <div className="panel-card"><div className="panel-card-head"><h3>آخرین نشستها</h3><button className="secondary-button small" onClick={async () => { await refresh(); showToast("آمار بهروزرسانی شد"); }}>بروزرسانی</button></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>مسیر</th><th>موضوع</th><th>زمان</th></tr></thead><tbody>{a.recentVisits.map((v, i) => <tr key={i}><td><bdi>{v.path}</bdi></td><td>{v.topic ?? "—"}</td><td>{date(v.createdAt)}</td></tr>)}</tbody></table></div></div>
  </div>;
}

interface ContentDraft {
  id: number; title: string; summary: string; body: string; keywords: string; figures: string; slideTitles: string;
  categoryId: number | null; treeId: number | null; portal: string; topic: string; format: string; mediaKind: string;
  fileUrl: string; externalUrl: string; embedCode: string; thumbnail: string; duration: string; slideCount: number | null;
  fileSize: string; ageGroups: string[]; gameKey: string; featured: boolean; published: boolean; sources: SourceRef[];
}
const emptyContent: ContentDraft = {
  id: 0, title: "", summary: "", body: "", keywords: "", figures: "", slideTitles: "", categoryId: null, treeId: null,
  portal: "bank", topic: "media", format: "pdf", mediaKind: "pdf", fileUrl: "", externalUrl: "", embedCode: "",
  thumbnail: "/images/hero.jpg", duration: "", slideCount: null, fileSize: "", ageGroups: ["adult"], gameKey: "",
  featured: false, published: true, sources: [{ title: "", publisher: "", url: "", year: "" }],
};

function parseSmartPaste(text: string): Partial<ContentDraft> & { sourceText?: string } {
  const parts = text.split(/[|\n]/).map((p) => p.trim()).filter(Boolean);
  const pick = (keys: string[]) => {
    const part = parts.find((p) => keys.some((k) => normalizeText(p).startsWith(normalizeText(k))));
    return part ? part.replace(/^[^:：]+[:：]/, "").trim() : "";
  };
  const audience = pick(["مخاطب", "Audience", "گروه سنی"]);
  const ages = normalizeText(audience).includes("کودک") || normalizeText(audience).includes("child") ? ["child"] : normalizeText(audience).includes("نوجوان") || normalizeText(audience).includes("teen") ? ["teen"] : normalizeText(audience).includes("بزرگ") || normalizeText(audience).includes("adult") ? ["adult"] : ["adult"];
  return {
    title: pick(["موضوع", "عنوان", "Topic", "Title"]),
    summary: pick(["خلاصه", "Summary", "چکیده"]),
    keywords: pick(["کلیدواژهها", "کلیدواژه", "Keywords"]).replace(/[،]/g, ","),
    figures: pick(["شخصیتها", "Figures", "ارجاعات"]),
    sourceText: pick(["منبع", "Source", "مستندات"]),
    ageGroups: ages,
  };
}

function ContentSection() {
  const { data, call, token, showToast, ageThemes } = usePlatform();
  const [draft, setDraft] = useState<ContentDraft>(emptyContent);
  const [aiText, setAiText] = useState("");
  const [search, setSearch] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const topics = data.categories.filter((c) => c.kind === "topic" && c.enabled);
  const trees = data.categories.filter((c) => c.kind === "tree" && c.enabled);
  const portals = getSetting<PortalLink[]>(data.settings, "portalLinks", DEFAULT_PORTAL_LINKS);
  const edit = (item: ContentItem) => setDraft({
    ...emptyContent, ...item, keywords: item.keywords.join("، "), figures: item.figures.join("، "),
    slideTitles: item.slideTitles.join("، "), sources: item.sources.length ? item.sources.map((s) => ({ ...s })) : [{ title: "", publisher: "", url: "", year: "" }],
    fileUrl: item.fileUrl ?? "", externalUrl: item.externalUrl ?? "", embedCode: item.embedCode ?? "", duration: item.duration ?? "", fileSize: item.fileSize ?? "", gameKey: item.gameKey ?? "",
  });
  const applyAi = () => {
    const parsed = parseSmartPaste(aiText);
    setDraft((current) => ({
      ...current,
      title: parsed.title || current.title, summary: parsed.summary || current.summary,
      keywords: parsed.keywords || current.keywords, figures: parsed.figures || current.figures,
      ageGroups: parsed.ageGroups ?? current.ageGroups,
      sources: parsed.sourceText ? [{ ...current.sources[0], title: parsed.sourceText, publisher: parsed.sourceText }] : current.sources,
    }));
    showToast("متادیتا تجزیه و در فرم تکمیل شد");
  };
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadLabel("در حال بارگذاری…");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("read failed")); reader.readAsDataURL(file);
      });
      const ext = fileExtension(file.name);
      const meta = formatMeta(ext);
      try {
        const response = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ name: file.name, dataUrl }) });
        if (isUnreachableResponse(response)) throw new Error("__LOCAL_UPLOAD__");
        const result = await response.json();
        if (!result.ok) throw new Error(String(result.error));
        setDraft((current) => ({ ...current, fileUrl: String(result.file.url), fileSize: `${ext.toUpperCase()} • ${(file.size / 1024).toFixed(1)} KB`, format: ext, mediaKind: meta.kind }));
      } catch (err) {
        if (err instanceof Error && err.message !== "__LOCAL_UPLOAD__" && err.name !== "TypeError" && !err.message.includes("fetch")) {
          throw err;
        }
        const localFile = saveLocalUpload(file.name, dataUrl);
        setDraft((current) => ({ ...current, fileUrl: localFile.url, fileSize: `${ext.toUpperCase()} • ${(file.size / 1024).toFixed(1)} KB`, format: ext, mediaKind: meta.kind }));
      }
      setUploadLabel(`${file.name} بارگذاری شد`);
    } catch (error) { showToast(error instanceof Error ? error.message : "خطا در بارگذاری"); setUploadLabel(""); }
  };
  const save = async () => {
    if (!draft.title.trim()) { showToast("عنوان محتوا الزامی است"); return; }
    await call("saveContent", { section: "content", content: { ...draft, sources: draft.sources.filter((s) => s.title.trim()) } });
    setDraft(emptyContent); showToast("محتوا ذخیره شد");
  };
  const filtered = data.contents.filter((c) => normalizeText(`${c.title} ${c.summary} ${c.keywords.join(" ")}`).includes(normalizeText(search)));
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 02 · CONTENT & AI SMART PASTE</span><h2>مدیریت محتوا و ورود هوشمند</h2><p>یککلیک از متادیتای تولیدشده، بارگذاری هر فرمت و پیوند/جاسازی خارجی.</p></div><Sparkles size={30} /></div>
    <div className="panel-card ai-panel"><h3><Sparkles size={17} /> ورود هوشمند متادیتا</h3><textarea rows={3} value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="موضوع: سواد رسانه‌ای | خلاصه: آموزش تشخیص شایعه | مخاطب: نوجوان | کلیدواژه‌ها: رسانه، تفکر نقادانه | منبع: یونسکو" /><button className="secondary-button" onClick={applyAi}>تجزیه و تکمیل خودکار</button></div>
    <div className="panel-card"><h3><FilePlus2 size={17} /> {draft.id ? "ویرایش محتوا" : "افزودن محتوای جدید"}</h3><div className="form-grid three">
      <Field label="عنوان"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
      <Field label="خلاصه"><input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></Field>
      <Field label="کلیدواژهها"><input value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} /></Field>
      <Field label="متن کامل"><textarea rows={2} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></Field>
      <Field label="شخصیتها / ارجاعات"><input value={draft.figures} onChange={(e) => setDraft({ ...draft, figures: e.target.value })} /></Field>
      <Field label="عناوین اسلاید"><input value={draft.slideTitles} onChange={(e) => setDraft({ ...draft, slideTitles: e.target.value })} /></Field>
      <Field label="دسته موضوعی"><select value={draft.categoryId ?? ""} onChange={(e) => setDraft({ ...draft, categoryId: Number(e.target.value) || null, topic: topics.find((t) => t.id === Number(e.target.value))?.key.replace("topic-", "") ?? draft.topic })}><option value="">انتخاب…</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field>
      <Field label="شاخه درختواره"><select value={draft.treeId ?? ""} onChange={(e) => setDraft({ ...draft, treeId: Number(e.target.value) || null })}><option value="">انتخاب…</option>{trees.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field>
      <Field label="درگاه"><select value={draft.portal} onChange={(e) => setDraft({ ...draft, portal: e.target.value })}>{portals.map((p) => <option key={p.id} value={p.target}>{p.label}</option>)}</select></Field>
      <Field label="فرمت فایل"><select value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value, mediaKind: formatMeta(e.target.value).kind })}>{Object.keys(FORMAT_META).map((f) => <option key={f} value={f}>{f.toUpperCase()} · {FORMAT_META[f].label}</option>)}</select></Field>
      <Field label="نوع رسانه"><input value={draft.mediaKind} onChange={(e) => setDraft({ ...draft, mediaKind: e.target.value })} /></Field>
      <Field label="تعداد اسلاید"><input type="number" value={draft.slideCount ?? ""} onChange={(e) => setDraft({ ...draft, slideCount: Number(e.target.value) || null })} /></Field>
      <Field label="تصویر شاخص"><input value={draft.thumbnail} onChange={(e) => setDraft({ ...draft, thumbnail: e.target.value })} /></Field>
      <Field label="مدت / اندازه"><input value={draft.duration || draft.fileSize} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} /></Field>
      <Field label="کلید بازی (gameKey)"><input value={draft.gameKey} onChange={(e) => setDraft({ ...draft, gameKey: e.target.value })} placeholder="quiz / memory" /></Field>
      <Field label="پیوند خارجی / دانلود"><input value={draft.externalUrl} onChange={(e) => setDraft({ ...draft, externalUrl: e.target.value })} /></Field>
      <Field label="آدرس فایل بارگذاریشده"><input value={draft.fileUrl} onChange={(e) => setDraft({ ...draft, fileUrl: e.target.value })} /></Field>
      <Field label="کد جاسازی"><textarea rows={2} value={draft.embedCode} onChange={(e) => setDraft({ ...draft, embedCode: e.target.value })} /></Field>
    </div>
      <div className="upload-row"><label className="file-button"><input type="file" onChange={(e) => void upload(e)} /><Upload size={16} /> بارگذاری مستقیم هر فرمت</label><span>{uploadLabel}</span></div>
      <div className="source-editor"><h4>منابع معتبر و مستندات</h4>{draft.sources.map((s, i) => <div className="source-row" key={i}><input placeholder="عنوان منبع" value={s.title} onChange={(e) => setDraft({ ...draft, sources: draft.sources.map((x, xIndex) => xIndex === i ? { ...x, title: e.target.value } : x) })} /><input placeholder="ناشر / مرجع" value={s.publisher ?? ""} onChange={(e) => setDraft({ ...draft, sources: draft.sources.map((x, xIndex) => xIndex === i ? { ...x, publisher: e.target.value } : x) })} /><input placeholder="پیوند" value={s.url ?? ""} onChange={(e) => setDraft({ ...draft, sources: draft.sources.map((x, xIndex) => xIndex === i ? { ...x, url: e.target.value } : x) })} /><input placeholder="سال" value={s.year ?? ""} onChange={(e) => setDraft({ ...draft, sources: draft.sources.map((x, xIndex) => xIndex === i ? { ...x, year: e.target.value } : x) })} /><button onClick={() => setDraft({ ...draft, sources: draft.sources.filter((_, x) => x !== i) })}><Trash2 size={14} /></button></div>)}<button className="secondary-button small" onClick={() => setDraft({ ...draft, sources: [...draft.sources, { title: "", publisher: "", url: "", year: "" }] })}><Plus size={14} /> منبع</button></div>
      <div className="form-footer"><div className="age-checkboxes">{ageThemes.map((a) => <label key={a.id}><input type="checkbox" checked={draft.ageGroups.includes(a.id)} onChange={(e) => setDraft({ ...draft, ageGroups: e.target.checked ? [...draft.ageGroups, a.id] : draft.ageGroups.filter((x) => x !== a.id) })} />{a.icon} {a.label}</label>)}</div><Toggle checked={draft.featured} label="ویژه / هیرو" onChange={(v) => setDraft({ ...draft, featured: v })} /><Toggle checked={draft.published} label="منتشرشده" onChange={(v) => setDraft({ ...draft, published: v })} /><button className="primary-button" onClick={() => void save()}><Save size={16} /> ذخیره محتوا</button></div>
    </div>
    <div className="panel-card"><div className="panel-card-head"><h3><Database size={17} /> فهرست محتواها</h3><div className="inline-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو…" /></div></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>عنوان</th><th>درگاه</th><th>فرمت</th><th>بازدید</th><th>عملیات</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.sources[0]?.publisher || "بدون ناشر"}</small></td><td>{item.portal}</td><td>{item.format}</td><td>{item.views}</td><td className="row-actions"><button onClick={() => edit(item)}>ویرایش</button><button className="danger-icon" onClick={async () => { if (window.confirm("حذف این محتوا؟")) { await call("deleteContent", { section: "content", id: item.id }); showToast("محتوا حذف شد"); } }}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div></div>
  </div>;
}

function TaxonomySection() {
  const { data, call, showToast } = usePlatform();
  const { draft, setKey, saveKeys } = useSettingsDraft();
  const empty: CategoryRecord = { id: 0, key: "", label: "", icon: "✦", kind: "topic", parentId: null, sort: 0, enabled: true, color: null };
  const [form, setForm] = useState<CategoryRecord>(empty);
  const [kindFilter, setKindFilter] = useState("all");
  const links = getSetting<PortalLink[]>(draft, "portalLinks", DEFAULT_PORTAL_LINKS);
  const rows = data.categories.filter((c) => kindFilter === "all" || c.kind === kindFilter);
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 03 · DYNAMIC TAXONOMY</span><h2>دستهها و فیلترهای دیجیکالایی</h2><p>مگامنو، درختواره، گروههای فیلتر، نشان فرمت و پیوند درگاهها.</p></div><Tags size={30} /></div>
    <div className="admin-two-col"><div className="panel-card"><h3>افزودن / ویرایش شاخه</h3><div className="form-grid">
      <Field label="کلید یکتا"><input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} /></Field><Field label="عنوان"><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
      <Field label="نوع"><select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{CATEGORY_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></Field>
      <Field label="والد"><select value={form.parentId ?? ""} onChange={(e) => setForm({ ...form, parentId: Number(e.target.value) || null })}><option value="">بدون والد</option>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
      <Field label="نشان"><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></Field><Field label="ترتیب"><input type="number" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} /></Field>
    </div><Toggle checked={form.enabled} label="فعال" onChange={(v) => setForm({ ...form, enabled: v })} /><button className="primary-button" onClick={async () => { await call("saveCategory", { section: "taxonomy", category: form }); setForm(empty); showToast("شاخه ذخیره شد"); }}>ذخیره شاخه</button></div>
      <div className="panel-card"><h3>پیوندهای ناوبری درگاهها</h3><div className="dynamic-rows">{links.map((link, i) => <div className="dynamic-row" key={`${link.id}-${i}`}><input value={link.label} onChange={(e) => setKey("portalLinks", links.map((l, x) => x === i ? { ...l, label: e.target.value } : l))} /><input value={link.target} onChange={(e) => setKey("portalLinks", links.map((l, x) => x === i ? { ...l, target: e.target.value } : l))} /><input type="number" value={link.order} onChange={(e) => setKey("portalLinks", links.map((l, x) => x === i ? { ...l, order: Number(e.target.value) } : l))} /><label><input type="checkbox" checked={link.enabled} onChange={(e) => setKey("portalLinks", links.map((l, x) => x === i ? { ...l, enabled: e.target.checked } : l))} />فعال</label><button onClick={() => setKey("portalLinks", links.filter((_, x) => x !== i))}><Trash2 size={14} /></button></div>)}</div><button className="secondary-button" onClick={() => setKey("portalLinks", [...links, { id: `portal-${Date.now()}`, label: "درگاه جدید", target: "bank", enabled: true, order: links.length + 1 }])}><Plus size={14} /> درگاه</button><button className="primary-button" onClick={async () => { await saveKeys("taxonomy", ["portalLinks"]); }}>ذخیره ناوبری</button></div></div>
    <div className="panel-card"><div className="panel-card-head"><h3>همه شاخهها</h3><select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}><option value="all">همه انواع</option>{CATEGORY_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>نشان</th><th>عنوان</th><th>کلید</th><th>نوع</th><th>والد</th><th></th></tr></thead><tbody>{rows.map((c) => <tr key={c.id}><td>{c.icon}</td><td><strong>{c.label}</strong></td><td><bdi>{c.key}</bdi></td><td>{CATEGORY_KINDS.find((k) => k.value === c.kind)?.label ?? c.kind}</td><td>{data.categories.find((p) => p.id === c.parentId)?.label ?? "—"}</td><td className="row-actions"><button onClick={() => setForm(c)}>ویرایش</button><button className="danger-icon" onClick={async () => { await call("deleteCategory", { section: "taxonomy", id: c.id }); showToast("شاخه حذف شد"); }}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div></div>
  </div>;
}

function VisualSection() {
  const { showToast } = usePlatform();
  const { draft, setKey, saveKeys } = useSettingsDraft();
  const site = getSetting<Record<string, string>>(draft, "site", {});
  const themes = getSetting<AgeTheme[]>(draft, "ageThemes", DEFAULT_AGE_THEMES);
  const sections = getSetting<HomeSection[]>(draft, "homeSections", DEFAULT_HOME_SECTIONS).slice().sort((a, b) => a.order - b.order);
  const slides = getSetting<HeroSlide[]>(draft, "heroSlides", DEFAULT_HERO_SLIDES);
  const stories = getSetting<StoryTheme[]>(draft, "storyThemes", DEFAULT_STORY_THEMES);
  const smart = getSetting<{ enabledByDefault?: boolean; allowUserToggle?: boolean; decayDays?: number }>(draft, "personalization", {});
  const visual = getSetting<Record<string, unknown>>(draft, "visual", {});
  const move = (index: number, direction: number) => {
    const next = [...sections]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setKey("homeSections", next.map((s, i) => ({ ...s, order: i + 1 })));
  };
  const saveAll = async () => { await saveKeys("visual", ["site", "ageThemes", "homeSections", "heroSlides", "storyThemes", "personalization", "visual"]); };
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 04 · ZERO-CODE APPEARANCE</span><h2>ظاهر، تمهای سنی، شخصیسازی و جانمایی</h2><p>تمام رنگها، فونتها، کادرها، بازههای سنی و ترتیب ردیفها بدون کد قابل تنظیم است.</p></div><Palette size={30} /></div>
    <div className="panel-card"><h3>هویت و تایپوگرافی</h3><div className="form-grid three"><Field label="عنوان سامانه"><input value={site.title ?? ""} onChange={(e) => setKey("site", { ...site, title: e.target.value })} /></Field><Field label="زیرعنوان"><input value={site.subtitle ?? ""} onChange={(e) => setKey("site", { ...site, subtitle: e.target.value })} /></Field><Field label="واترمارک"><input value={site.watermark ?? ""} onChange={(e) => setKey("site", { ...site, watermark: e.target.value })} /></Field><Field label="فونت پایه"><select value={String(visual.fontFamily ?? "auto")} onChange={(e) => setKey("visual", { ...visual, fontFamily: e.target.value })}><option value="auto">خودکار بر اساس زبان</option><option value="Vazirmatn">Vazirmatn</option><option value="Cairo">Cairo</option><option value="Inter">Inter</option></select></Field><Field label="شفافیت نقش فرهنگی"><input type="range" min={0} max={0.3} step={0.01} value={Number(visual.motifOpacity ?? 0.075)} onChange={(e) => setKey("visual", { ...visual, motifOpacity: Number(e.target.value) })} /></Field><Field label="معرفی استودیو"><input value={site.footerBio ?? ""} onChange={(e) => setKey("site", { ...site, footerBio: e.target.value })} /></Field></div></div>
    <div className="panel-card"><div className="panel-card-head"><h3>بازهها و تمهای سنی</h3><button className="secondary-button small" onClick={() => setKey("ageThemes", [...themes, { ...DEFAULT_AGE_THEMES[0], id: `age-${Date.now()}`, label: "گروه سنی جدید", min: 0, max: 99 }])}><Plus size={14} /> بازه</button></div><div className="age-theme-editor">{themes.map((theme, i) => <article key={theme.id} style={{ borderTopColor: theme.colors.primary }}><div className="age-theme-head"><input value={theme.label} onChange={(e) => setKey("ageThemes", themes.map((t, x) => x === i ? { ...t, label: e.target.value } : t))} /><button onClick={() => setKey("ageThemes", themes.filter((_, x) => x !== i))}><Trash2 size={14} /></button></div><div className="color-grid">{Object.entries(theme.colors).map(([key, color]) => <label key={key}><span>{key}</span><input type="color" value={color} onChange={(e) => setKey("ageThemes", themes.map((t, x) => x === i ? { ...t, colors: { ...t.colors, [key]: e.target.value } } : t))} /></label>)}</div><div className="theme-numbers"><label>از <input type="number" value={theme.min} onChange={(e) => setKey("ageThemes", themes.map((t, x) => x === i ? { ...t, min: Number(e.target.value) } : t))} /></label><label>تا <input type="number" value={theme.max} onChange={(e) => setKey("ageThemes", themes.map((t, x) => x === i ? { ...t, max: Number(e.target.value) } : t))} /></label><label>گردی <input type="number" value={theme.radius} onChange={(e) => setKey("ageThemes", themes.map((t, x) => x === i ? { ...t, radius: Number(e.target.value) } : t))} /></label><label>مقیاس فونت <input type="number" step="0.01" value={theme.fontScale} onChange={(e) => setKey("ageThemes", themes.map((t, x) => x === i ? { ...t, fontScale: Number(e.target.value) } : t))} /></label></div></article>)}</div></div>
    <div className="panel-card"><div className="panel-card-head"><h3><LayoutDashboard size={17} /> جانمایی کادرهای صفحه اصلی</h3><Toggle checked={smart.enabledByDefault ?? true} label="شخصیسازی هوشمند: پیشفرض روشن" onChange={(v) => setKey("personalization", { ...smart, enabledByDefault: v, allowUserToggle: true })} /></div><div className="layout-rows">{sections.map((section, i) => <div className="layout-row" key={section.id}><span className="layout-order">{String(i + 1).padStart(2, "0")}</span><input value={section.title} onChange={(e) => setKey("homeSections", sections.map((s, x) => x === i ? { ...s, title: e.target.value } : s))} /><select value={section.source} onChange={(e) => setKey("homeSections", sections.map((s, x) => x === i ? { ...s, source: e.target.value as HomeSection["source"] } : s))}>{["smart", "trending", "category", "latest", "multimedia", "tree"].map((s) => <option key={s}>{s}</option>)}</select><input type="number" value={section.limit} onChange={(e) => setKey("homeSections", sections.map((s, x) => x === i ? { ...s, limit: Number(e.target.value) } : s))} /><Toggle checked={section.enabled} label={section.enabled ? "فعال" : "خاموش"} onChange={(v) => setKey("homeSections", sections.map((s, x) => x === i ? { ...s, enabled: v } : s))} /><button onClick={() => move(i, -1)}><ArrowUp size={14} /></button><button onClick={() => move(i, 1)}><ArrowDown size={14} /></button></div>)}</div><button className="secondary-button" onClick={() => setKey("homeSections", [...sections, { id: `section-${Date.now()}`, title: "کادر جدید", source: "latest", enabled: true, limit: 8, order: sections.length + 1 }])}><Plus size={14} /> کادر</button></div>
    <div className="admin-two-col"><div className="panel-card"><div className="panel-card-head"><h3>اسلایدهای هیرو</h3><button className="secondary-button small" onClick={() => setKey("heroSlides", [...slides, { id: `hero-${Date.now()}`, title: "اسلاید جدید", subtitle: "توضیحات", image: "/images/hero.jpg", cta: "مشاهده", target: "bank", badge: "جدید" }])}><Plus size={14} /></button></div><div className="hero-editor">{slides.map((slide, i) => <div key={slide.id}><input value={slide.title} onChange={(e) => setKey("heroSlides", slides.map((s, x) => x === i ? { ...s, title: e.target.value } : s))} /><input value={slide.subtitle} onChange={(e) => setKey("heroSlides", slides.map((s, x) => x === i ? { ...s, subtitle: e.target.value } : s))} /><input value={slide.image} onChange={(e) => setKey("heroSlides", slides.map((s, x) => x === i ? { ...s, image: e.target.value } : s))} /><button onClick={() => setKey("heroSlides", slides.filter((_, x) => x !== i))}><Trash2 size={14} /></button></div>)}</div></div><div className="panel-card"><h3>تمهای استوری ۱۰۸۰×۱۹۲۰</h3>{stories.map((theme, i) => <div className="story-theme-row" key={theme.id}><input value={theme.label} onChange={(e) => setKey("storyThemes", stories.map((s, x) => x === i ? { ...s, label: e.target.value } : s))} /><input type="color" value={theme.background} onChange={(e) => setKey("storyThemes", stories.map((s, x) => x === i ? { ...s, background: e.target.value } : s))} /><input type="color" value={theme.accent} onChange={(e) => setKey("storyThemes", stories.map((s, x) => x === i ? { ...s, accent: e.target.value } : s))} /></div>)}</div></div>
    <div className="sticky-save"><button className="primary-button" onClick={() => void saveAll()}><Save size={17} /> ذخیره تمام تنظیمات ظاهری</button><span>تغییرات بلافاصله در کل سامانه اعمال میشوند.</span></div>
  </div>;
}

export function AdminPanel() {
  const { user, canAccess, navigate, logout, t, data } = usePlatform();
  const sections = useMemo(() => ADMIN_SECTIONS.filter((s) => canAccess(s.key)), [canAccess]);
  const [active, setActive] = useState<SectionKey>(sections[0]?.key ?? "analytics");
  const effectiveActive = sections.some((s) => s.key === active) ? active : (sections[0]?.key ?? "analytics");
  if (!user || !sections.length) return <div className="admin-no-access"><ShieldCheckIcon /><h1>{t("noPermission")}</h1><button className="primary-button" onClick={() => navigate("home")}>{t("backToSite")}</button></div>;
  return <div className="admin-shell">
    <aside className="admin-sidebar"><div className="admin-brand"><span>✦</span><div><strong>استودیو معراج اندیشه</strong><small>ADMIN DASHBOARD</small></div></div><div className="admin-user"><div>{user.displayName?.[0] ?? "A"}</div><span><strong>{user.displayName || user.username}</strong><small>{user.role === "super_admin" ? "مدیر کل" : "همکار با دسترسی محدود"}</small></span></div><nav>{sections.map((s, i) => <button key={s.key} className={effectiveActive === s.key ? "active" : ""} onClick={() => setActive(s.key)}><span>{String(i + 1).padStart(2, "0")}</span><i>{s.icon}</i><b>{s.title}</b></button>)}</nav><div className="admin-sidebar-foot"><button onClick={() => navigate("home")}><ChevronLeft size={15} /> {t("backToSite")}</button><button onClick={() => void logout()}><LogOut size={15} /> {t("logout")}</button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">MODULAR ADMIN · 8 SECTIONS</span><h1>{ADMIN_SECTIONS.find((s) => s.key === effectiveActive)?.title}</h1></div><div className="admin-topbar-meta"><span><Eye size={15} /> {data.analytics.totalVisits.toLocaleString("fa-IR")} بازدید</span><span><Database size={15} /> {data.contents.length} محتوا</span><span className="live-dot">● سامانه آنلاین</span></div></header><div className="admin-content">
      {effectiveActive === "analytics" && <AnalyticsSection />}
      {effectiveActive === "content" && <ContentSection />}
      {effectiveActive === "taxonomy" && <TaxonomySection />}
      {effectiveActive === "visual" && <VisualSection />}
      {effectiveActive === "plugins" && <PluginsSection />}
      {effectiveActive === "users" && <UsersSection />}
      {effectiveActive === "languages" && <LanguagesSection />}
      {effectiveActive === "backups" && <BackupsSection />}
    </div></main>
  </div>;
}

function ShieldCheckIcon() {
  return <span className="shield-icon">◇</span>;
}
