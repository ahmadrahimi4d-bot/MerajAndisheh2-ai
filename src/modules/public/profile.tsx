"use client";

import { Bookmark, BrainCircuit, Globe2, LogOut, UserRound } from "lucide-react";
import { usePlatform } from "@/core/platform-context";
import { getSetting, type RegistrationField } from "@/core/types";
import { DEFAULT_REGISTRATION_FIELDS } from "@/config/defaults";
import { ContentCard } from "@/modules/public/content-card";
import { SectionTitle, Toggle } from "@/modules/shared";

export function ProfilePage() {
  const {
    data, settings, t, user, logout, bookmarks, personalization, setPersonalizationSafe,
    ageGroup, ageThemes, setAgeGroupSafe, language, setLanguageSafe, topicScores, setLoginOpen,
  } = usePlatform();
  const fields = getSetting<RegistrationField[]>(settings, "registrationFields", DEFAULT_REGISTRATION_FIELDS).filter((f) => f.enabled);
  const bookmarked = data.contents.filter((c) => bookmarks.includes(c.id));
  if (!user) return <div className="profile-gate"><UserRound size={40} /><h2>{t("profile")}</h2><p>{t("loginRequired")}</p><button className="primary-button" onClick={() => setLoginOpen(true)}>{t("login")}</button></div>;
  return <div className="profile-page">
    <div className="profile-hero"><div className="profile-avatar">{user.displayName?.[0] ?? user.username[0]}</div><div><span className="eyebrow">USER PROFILE DASHBOARD</span><h1>{t("welcome")}، {user.displayName || user.username}</h1><p>{user.role === "visitor" ? "بازدیدکننده ثبتنامشده" : "حساب همکاری"} · {t("otpReady")}</p></div><button className="ghost-button" onClick={() => void logout()}><LogOut size={16} /> {t("logout")}</button></div>
    <div className="profile-grid">
      <section className="profile-card"><h3><UserRound size={17} /> {t("profileFields")}</h3><div className="profile-fields">{fields.filter((f) => f.id !== "password").map((f) => <div key={f.id}><span>{f.label}</span><strong>{user.profile[f.id] || "—"}</strong></div>)}<div><span>نام کاربری</span><strong>{user.username}</strong></div></div></section>
      <section className="profile-card"><h3><BrainCircuit size={17} /> {t("smartPersonalization")}</h3><Toggle checked={personalization} label={personalization ? t("smartOn") : t("smartOff")} onChange={setPersonalizationSafe} /><p className="muted">علاقهمندیها فقط در مرورگر شما ذخیره میشوند و خوراک صفحه اصلی را بازچینی میکنند.</p><div className="topic-scores">{Object.entries(topicScores).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, count]) => <span key={topic}>{topic} <b>{count}×</b></span>)}{!Object.keys(topicScores).length && <span>هنوز تعاملی ثبت نشده است</span>}</div></section>
      <section className="profile-card"><h3><Globe2 size={17} /> ترجیحات نمایش</h3><label className="field"><span className="field-label">{t("ageGroup")}</span><select value={ageGroup} onChange={(e) => setAgeGroupSafe(e.target.value)}>{ageThemes.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}</select></label><label className="field"><span className="field-label">{t("preferredLanguage")}</span><select value={language} onChange={(e) => setLanguageSafe(e.target.value)}>{data.languages.filter((l) => l.enabled).map((l) => <option key={l.code} value={l.code}>{l.nativeLabel}</option>)}</select></label></section>
    </div>
    <section className="profile-bookmarks"><SectionTitle eyebrow="SAVED ITEMS" title={t("myBookmarks")} action={<span className="bookmark-count"><Bookmark size={16} /> {bookmarked.length}</span>} />{bookmarked.length ? <div className="content-grid">{bookmarked.map((item) => <ContentCard key={item.id} item={item} />)}</div> : <div className="empty-state"><span>◇</span><p>هنوز محتوایی نشانکگذاری نشده است.</p></div>}</section>
  </div>;
}
