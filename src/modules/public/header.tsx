"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  Bookmark, BrainCircuit, ChevronDown, ChevronLeft, Globe2, Grid2X2, Languages, Menu, Search,
  Sparkles, UserRound, X, LogIn, UserPlus, ShieldCheck,
} from "lucide-react";
import { withBasePath } from "@/core/assets";
import { usePlatform } from "@/core/platform-context";
import { searchContents } from "@/core/personalization";
import { getSetting, type PortalLink, type RegistrationField } from "@/core/types";
import { formatMeta } from "@/config/registry";
import { DEFAULT_PORTAL_LINKS, DEFAULT_REGISTRATION_FIELDS } from "@/config/defaults";
import { BreakingTicker } from "@/plugins/components";
import { IconButton, Modal } from "@/modules/shared";

export function SiteHeader() {
  const {
    data, settings, t, activeLanguage, language, setLanguageSafe, ageThemes, ageGroup, setAgeGroupSafe,
    personalization, setPersonalizationSafe, bookmarks, navigate, searchQuery, setSearchQuery,
    openContent, user, setLoginOpen, view, activePortal,
  } = usePlatform();
  const site = getSetting<{ title?: string; subtitle?: string; logo?: string }>(settings, "site", {});
  const portalLinks = useMemo(() => getSetting<PortalLink[]>(settings, "portalLinks", DEFAULT_PORTAL_LINKS).filter((l) => l.enabled).sort((a, b) => a.order - b.order), [settings]);
  const suggestions = useMemo(() => searchQuery.trim() ? searchContents(data.contents, searchQuery).slice(0, 6) : [], [data.contents, searchQuery]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [ageMenu, setAgeMenu] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (target: string) => {
    setMegaOpen(false); setMobileNav(false);
    if (target === "home") navigate("home", { portal: "all" });
    else if (target === "tree") navigate("tree", { portal: "all" });
    else navigate("bank", { portal: target, filters: {} });
  };

  const treeRoots = data.categories.filter((c) => c.kind === "tree" && !c.parentId && c.enabled).sort((a, b) => a.sort - b.sort);
  const topics = data.categories.filter((c) => c.kind === "topic" && c.enabled).sort((a, b) => a.sort - b.sort);
  const formats = data.categories.filter((c) => c.kind === "format" && c.enabled).sort((a, b) => a.sort - b.sort);

  return (
    <>
      <BreakingTicker />
      <header className="main-header">
        <div className="header-inner">
          <button className="brand-block" onClick={() => navigate("home", { portal: "all" })}>
            <span className="brand-mark">{site.logo || "✦"}</span>
            <span className="brand-copy"><strong>{site.title || t("siteTitle")}</strong><small>{site.subtitle || t("siteSubtitle")}</small></span>
          </button>

          <div className="search-wrap" ref={null}>
            <div className="search-box">
              <Search size={19} className="search-icon" />
              <input ref={searchRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 160)} onKeyDown={(e) => { if (e.key === "Enter") { setSearchFocused(false); navigate("bank", { q: searchQuery, portal: "all", filters: {} }); } }} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
              {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")} aria-label="clear"><X size={15} /></button>}
              <span className="search-kbd">⌘ K</span>
            </div>
            {searchFocused && searchQuery.trim() && <div className="autocomplete">
              <div className="autocomplete-head">نتایج جستجو · {suggestions.length}</div>
              {suggestions.map((item) => {
                const meta = formatMeta(item.format, item.mediaKind);
                return <button key={item.id} onMouseDown={() => { openContent(item); setSearchFocused(false); }} className="suggestion">
                  <span className="suggestion-icon" style={{ background: meta.color }}>{meta.icon}</span>
                  <span><strong>{item.title}</strong><small>{item.summary.slice(0, 78)}…</small><em>{item.sources[0]?.publisher || item.keywords[0] || meta.label}</em></span>
                  <ChevronLeft size={15} />
                </button>;
              })}
              {!suggestions.length && <div className="autocomplete-empty">{t("noResults")}</div>}
              <button className="autocomplete-all" onMouseDown={() => navigate("bank", { q: searchQuery, portal: "all", filters: {} })}>مشاهده همه نتایج در بانک محتوا ←</button>
            </div>}
          </div>

          <div className="header-actions">
            <div className="age-switcher">
              <button className="age-badge" onClick={() => setAgeMenu(!ageMenu)} title={t("ageSwitcher")}>
                <span>{ageThemes.find((a) => a.id === ageGroup)?.icon ?? "🎯"}</span>
                <b>{ageThemes.find((a) => a.id === ageGroup)?.label.split("(")[0] ?? t("ageGroup")}</b>
                <ChevronDown size={14} />
              </button>
              {ageMenu && <div className="popover age-popover">
                <div className="popover-title">{t("ageSwitcher")}</div>
                {ageThemes.map((a) => <button key={a.id} className={a.id === ageGroup ? "selected" : ""} onClick={() => { setAgeGroupSafe(a.id); setAgeMenu(false); }}>
                  <span className="age-swatch" style={{ background: `linear-gradient(135deg, ${a.colors.primary}, ${a.colors.accent})` }}>{a.icon}</span>
                  <span><strong>{a.label}</strong><small>{a.min}–{a.max} · {a.description}</small></span>
                </button>)}
              </div>}
            </div>
            <IconButton title={personalization ? t("smartOn") : t("smartOff")} active={personalization} onClick={() => setPersonalizationSafe(!personalization)} className="smart-toggle"><BrainCircuit size={19} /></IconButton>
            <div className="language-select"><Languages size={17} /><select value={language} onChange={(e) => setLanguageSafe(e.target.value)} aria-label={t("language")}>
              {data.languages.filter((l) => l.enabled).map((l) => <option key={l.code} value={l.code}>{l.nativeLabel}</option>)}
            </select><ChevronDown size={13} /></div>
            <IconButton title={t("bookmarks")} onClick={() => navigate("profile", { portal: "all" })}><Bookmark size={19} />{bookmarks.length > 0 && <i className="count-dot">{bookmarks.length}</i>}</IconButton>
            <button className="account-button" onClick={() => { if (user) navigate(user.role === "visitor" ? "profile" : "admin"); else setLoginOpen(true); }}><UserRound size={18} /><span>{user ? user.displayName || user.username : t("account")}</span></button>
            <IconButton className="mobile-menu-button" onClick={() => setMobileNav(!mobileNav)} title="Menu"><Menu size={20} /></IconButton>
          </div>
        </div>
      </header>

      <nav className={`sub-header ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sub-header-inner">
          <div className="mega-wrap">
            <button className={`mega-button ${megaOpen ? "open" : ""}`} onClick={() => setMegaOpen(!megaOpen)}><Grid2X2 size={18} /><span>{t("categoriesMega")}</span><ChevronDown size={15} /></button>
            {megaOpen && <div className="mega-menu">
              <div className="mega-column"><h4><Globe2 size={15} /> درگاه‌ها</h4>{portalLinks.map((link) => <button key={link.id} onClick={() => goTo(link.target)}>{link.labelKey ? t(link.labelKey) : link.label}<ChevronLeft size={13} /></button>)}</div>
              <div className="mega-column"><h4>🌳 {t("treeCategories")}</h4>{treeRoots.map((c) => <button key={c.id} onClick={() => { navigate("tree", { portal: "all" }); setMegaOpen(false); }}>{c.icon} {c.label}<ChevronLeft size={13} /></button>)}{treeRoots.slice(0, 4).flatMap((r) => data.categories.filter((c) => c.parentId === r.id).slice(0, 2)).map((c) => <button className="mega-child" key={c.id} onClick={() => { navigate("bank", { portal: "all", filters: { tree: [String(c.id)] } }); setMegaOpen(false); }}>↳ {c.label}</button>)}</div>
              <div className="mega-column"><h4>🧭 موضوعات</h4>{topics.map((c) => <button key={c.id} onClick={() => { navigate("bank", { portal: "all", filters: { topic: [c.key.replace("topic-", "")] } }); setMegaOpen(false); }}>{c.icon} {c.label}<ChevronLeft size={13} /></button>)}</div>
              <div className="mega-column"><h4>📎 {t("allFormats")}</h4>{formats.map((c) => <button key={c.id} onClick={() => { navigate("bank", { portal: "all", filters: { format: [c.key.replace("fmt-", "")] } }); setMegaOpen(false); }}>{c.icon} {c.label}<ChevronLeft size={13} /></button>)}</div>
              <div className="mega-feature" style={{ backgroundImage: `url('${withBasePath("/images/hero.jpg")}')` }}><div><span>✦</span><h3>بانک محتوای مستند</h3><p>هر محتوا با منبع، سند و قابلیت ردیابی</p><button onClick={() => goTo("bank")}>{t("explore")} ←</button></div></div>
            </div>}
          </div>
          <div className="portal-links">{portalLinks.map((link) => {
            const active = (link.target === "home" && view === "home") || (link.target === "tree" && view === "tree") || (link.target === activePortal && view === "bank");
            return <button key={link.id} className={active ? "active" : ""} onClick={() => goTo(link.target)}>{link.labelKey ? t(link.labelKey) : link.label}</button>;
          })}</div>
          <div className="nav-meta"><Sparkles size={15} /><span>{activeLanguage.font} · {activeLanguage.calendar}</span></div>
        </div>
      </nav>
      {megaOpen && <div className="mega-scrim" onClick={() => setMegaOpen(false)} />}
    </>
  );
}

export function AgeGateModal() {
  const { ageGateOpen, setAgeGateOpen, ageThemes, setAgeGroupSafe, t, activeLanguage } = usePlatform();
  if (!ageGateOpen) return null;
  return (
    <div className="age-gate-backdrop">
      <div className="age-gate" dir={activeLanguage.direction}>
        <div className="age-gate-head"><span className="gate-ornament">✦</span><div className="eyebrow">MERAJ ANDISHEH · CONTENT BANK</div><h1>{t("ageGate")}</h1><p>{t("ageGateSubtitle")}</p></div>
        <div className="age-options">{ageThemes.map((a) => (
          <button key={a.id} className="age-option" onClick={() => setAgeGroupSafe(a.id)} style={{ "--card-primary": a.colors.primary, "--card-accent": a.colors.accent, "--card-radius": `${a.radius}px` } as CSSProperties}>
            <span className="age-option-icon">{a.icon}</span><strong>{a.label}</strong><small>{a.description}</small>
            <span className="age-priority">{a.priority.slice(0, 3).map((p) => <i key={p}>{formatMeta(p, p).icon} {p}</i>)}</span>
            <span className="age-palette">{Object.values(a.colors).slice(0, 5).map((c, idx) => <i key={`${a.id}-c-${idx}`} style={{ background: c }} />)}</span>
          </button>
        ))}</div>
        <div className="age-gate-foot"><span>{t("allFormats")} · {t("smartOn")}</span><button onClick={() => setAgeGateOpen(false)}>ادامه با نمای پیشفرض</button></div>
      </div>
    </div>
  );
}

export function LoginModal() {
  const { loginOpen, setLoginOpen, loginMode, setLoginMode, auth, t, settings, showToast } = usePlatform();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fields = getSetting<RegistrationField[]>(settings, "registrationFields", DEFAULT_REGISTRATION_FIELDS).filter((f) => f.enabled);
  if (!loginOpen) return null;
  const close = () => {
    setError("");
    setBusy(false);
    setLoginMode("visitor");
    setLoginOpen(false);
  };
  const effectiveMode = loginMode === "staff" ? "login" : mode;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    const result = effectiveMode === "login"
      ? await auth("login", { username, password })
      : await auth("register", { username: profile.phone || username, password: profile.password || password, profile });
    if (!result.ok) setError(result.error ?? "خطا");
    else showToast(effectiveMode === "login" ? "ورود با موفقیت انجام شد" : "حساب کاربری ایجاد شد");
    setBusy(false);
  };
  return (
    <Modal onClose={close} className="login-modal" backdropClassName="login-backdrop" label={loginMode === "staff" ? t("adminPanel") : t("loginTitle")}>
      <div className="login-brand">
        <span>{loginMode === "staff" ? "◈" : "✦"}</span>
        <h2>{loginMode === "staff" ? "ورود اختصاصی مدیران و همکاران (RBAC)" : t("loginTitle")}</h2>
        <p>{loginMode === "staff" ? "دسترسی سطح‌بندی‌شده بر اساس نقش سازمانی" : t("siteSubtitle")}</p>
      </div>
      {loginMode !== "staff" && (
        <div className="login-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}><LogIn size={16} /> {t("login")}</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}><UserPlus size={16} /> {t("register")}</button>
        </div>
      )}
      <form onSubmit={submit} className="login-form">
        {effectiveMode === "login" ? <>
          <label><span>{t("username")}</span><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={loginMode === "staff" ? "admin" : "09123456789"} autoComplete="username" required /></label>
          <label><span>{t("password")}</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" autoComplete="current-password" required /></label>
          {loginMode === "staff" && <div className="test-hint"><ShieldCheck size={14} /> ورود مدیران و همکاران · دسترسی بر اساس نقش (RBAC)</div>}
        </> : <>
          <div className="register-grid">{fields.map((f) => <label key={f.id} className={f.type === "textarea" ? "full" : ""}><span>{f.label}{f.required && " *"}</span>
            {f.type === "select" ? <select required={f.required} value={profile[f.id] ?? ""} onChange={(e) => setProfile({ ...profile, [f.id]: e.target.value })}><option value="">انتخاب…</option>{(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
              : <input type={f.type === "password" ? "password" : f.type === "tel" ? "tel" : "text"} required={f.required} value={profile[f.id] ?? ""} placeholder={f.placeholder ?? ""} onChange={(e) => setProfile({ ...profile, [f.id]: e.target.value })} />}
          </label>)}</div>
          {!fields.some((f) => f.type === "password") && <label><span>{t("password")}</span><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
          <div className="otp-note">◈ {t("otpReady")}</div>
        </>}
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button full" type="submit" disabled={busy}>{busy ? "…" : effectiveMode === "login" ? t("login") : t("registerTitle")}</button>
      </form>
      <div className="login-foot">
        <span>نمایش و پخش محتوا آزاد است</span>
        {loginMode === "staff"
          ? <button type="button" className="text-link" onClick={() => setLoginMode("visitor")}>بازگشت به ورود بازدیدکنندگان</button>
          : <span>{t("downloadGate")}: {t("loginToDownload")}</span>}
      </div>
    </Modal>
  );
}
