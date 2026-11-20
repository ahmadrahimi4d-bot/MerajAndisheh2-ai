"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Layers3 } from "lucide-react";
import { DEFAULT_HERO_SLIDES } from "@/config/defaults";
import { withBasePath } from "@/core/assets";
import { usePlatform } from "@/core/platform-context";
import { sortByAgeAndBehavior } from "@/core/personalization";
import { getSetting, type ContentItem, type HeroSlide, type HomeSection } from "@/core/types";
import { ContentCard } from "@/modules/public/content-card";
import { WeeklyTrendingShelf } from "@/plugins/components";
import { SectionTitle } from "@/modules/shared";

function HeroSlider({ slides, onCta }: { slides: HeroSlide[]; onCta: (target: string) => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [slides.length]);
  if (!slides.length) return null;
  const slide = slides[index % slides.length];
  return (
    <section className="hero-zone" style={{ backgroundImage: `url('${withBasePath(slide.image)}')` }}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge"><span>✦</span> {slide.badge}</div>
        <h1>{slide.title}</h1><p>{slide.subtitle}</p>
        <div className="hero-actions"><button className="primary-button hero-cta" onClick={() => onCta(slide.target)}>{slide.cta}<ArrowLeft size={18} /></button><button className="ghost-button" onClick={() => onCta("bank")}>جستجوی پیشرفته</button></div>
      </div>
      <div className="hero-pagination">{slides.map((s, i) => <button key={s.id} className={i === index ? "active" : ""} onClick={() => setIndex(i)} aria-label={`slide ${i + 1}`} />)}</div>
      <div className="hero-arrows"><button onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}><ChevronRight size={20} /></button><button onClick={() => setIndex((i) => (i + 1) % slides.length)}><ChevronLeft size={20} /></button></div>
      <div className="hero-side-note"><Layers3 size={20} /><span>پشتیبانی از هر فرمت<br />مستندسازی با منبع معتبر</span></div>
    </section>
  );
}

function Shelf({ section, items, accent }: { section: HomeSection; items: ContentItem[]; accent?: string }) {
  const { navigate, t } = usePlatform();
  const scroller = useRef<HTMLDivElement>(null);
  const target = section.categoryKey?.replace("portal-", "") ?? "all";
  const scroll = (direction: number) => scroller.current?.scrollBy({ left: direction * 760, behavior: "smooth" });
  return (
    <section className="home-section" style={accent ? { "--shelf-accent": accent } as CSSProperties : undefined}>
      <SectionTitle eyebrow="CONTENT SHELF" title={section.title} action={
        <div className="shelf-controls"><button onClick={() => scroll(1)}><ChevronRight size={18} /></button><button onClick={() => scroll(-1)}><ChevronLeft size={18} /></button><button className="text-link" onClick={() => navigate("bank", { portal: target, filters: {} })}>{t("explore")} ←</button></div>
      } />
      <div className="card-shelf" ref={scroller}>{items.slice(0, section.limit).map((item) => <ContentCard key={item.id} item={item} compact />)}</div>
    </section>
  );
}

export function HomePage() {
  const { data, settings, t, navigate, homeSections, personalization, topicScores, ageGroup, theme } = usePlatform();
  const heroSlides = getSetting<HeroSlide[]>(settings, "heroSlides", DEFAULT_HERO_SLIDES);
  const published = useMemo(() => data.contents.filter((c) => c.published), [data.contents]);
  const smartItems = useMemo(() => sortByAgeAndBehavior(published, { personalization, ageGroup, theme, scores: topicScores }), [published, personalization, ageGroup, theme, topicScores]);
  const topicHighlights = Object.entries(topicScores).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const goCta = (target: string) => target === "home" ? navigate("home") : target === "tree" ? navigate("tree") : navigate("bank", { portal: target, filters: {} });

  const sectionItems = (section: HomeSection) => {
    if (section.source === "smart") return smartItems;
    if (section.source === "trending") return [...published].sort((a, b) => b.views - a.views);
    if (section.source === "latest" || section.source === "multimedia") return [...published].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (section.source === "category") {
      const key = section.categoryKey ?? "";
      if (key.startsWith("portal-")) return published.filter((c) => c.portal === key.replace("portal-", ""));
      const topic = key.replace("topic-", "");
      return published.filter((c) => c.topic === topic || c.keywords.includes(key));
    }
    return published;
  };

  return (
    <>
      <HeroSlider slides={heroSlides} onCta={goCta} />
      <div className="home-feed">
        {homeSections.filter((s) => s.enabled).map((section) => {
          if (section.source === "trending") return <WeeklyTrendingShelf key={section.id} />;
          if (section.source === "smart") return (
            <section className="home-section smart-section" key={section.id}>
              <div className="smart-ribbon"><Sparkles size={16} /><span>{personalization ? t("smartOn") : t("smartOff")}</span><i /> <span>{t("ageBadge")}: {theme.label.split("(")[0]}</span></div>
              <SectionTitle eyebrow="ROW 01 · PERSONALIZED" title={section.title} description={personalization ? "بر اساس تعاملات اخیر، گروه سنی و اولویت رسانهای شما چینش شده است." : "چینش استاندارد زمانی و ترتیب تعیینشده توسط مدیر سامانه"} action={<button className="text-link" onClick={() => navigate("bank", { portal: "all", filters: {} })}>{t("explore")} ←</button>} />
              {personalization && topicHighlights.length > 0 && <div className="topic-boost"><TrendingUp size={15} /> علاقهمندیهای شناساییشده: {topicHighlights.map(([topic, count]) => <span key={topic}>{topic} <b>{count}×</b></span>)}</div>}
              <div className="card-shelf smart-shelf">{smartItems.slice(0, section.limit).map((item) => <ContentCard key={item.id} item={item} compact />)}</div>
            </section>
          );
          return <Shelf key={section.id} section={section} items={sectionItems(section)} accent={section.id === "games" ? "#f59e0b" : section.id === "docs" ? "#dc2626" : undefined} />;
        })}
      </div>
    </>
  );
}
