"use client";

import { BookOpen, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { DEFAULT_PORTAL_LINKS } from "@/config/defaults";
import { usePlatform } from "@/core/platform-context";
import { getSetting, type PortalLink } from "@/core/types";

export function SiteFooter() {
  const { settings, t, navigate, openAdminLogin, user } = usePlatform();
  const site = getSetting<{ title?: string; footerBio?: string; footerContact?: string; footerRules?: string; watermark?: string }>(settings, "site", {});
  const links = getSetting<PortalLink[]>(settings, "portalLinks", DEFAULT_PORTAL_LINKS).filter((l) => l.enabled).sort((a, b) => a.order - b.order);
  const go = (target: string) => target === "home" ? navigate("home") : target === "tree" ? navigate("tree") : navigate("bank", { portal: target, filters: {} });
  const triggerStaff = () => {
    if (user && user.role !== "visitor") navigate("admin");
    else openAdminLogin();
  };
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section className="footer-col footer-bio"><div className="footer-brand"><button type="button" className="footer-emblem-btn" onClick={triggerStaff} title="ورود همکاران" aria-label="ورود همکاران">✦</button><div><strong>{site.title || t("siteTitle")}</strong><small>CONTENT BANK · STUDIO</small></div></div><p>{site.footerBio}</p><div className="footer-motto"><BookOpen size={16} /> محتوا، با سند و روایت مسئولانه</div></section>
        <section className="footer-col"><h4>دسترسی سریع</h4><div className="footer-links">{links.map((l) => <button key={l.id} onClick={() => go(l.target)}>{l.labelKey ? t(l.labelKey) : l.label}</button>)}<button onClick={() => navigate("bank", { portal: "all", filters: {} })}>جستجوی پیشرفته محتوا</button></div><h4 className="footer-sub">زبانها</h4><div className="footer-lang">فارسی · العربية · English</div></section>
        <section className="footer-col"><h4>ارتباط و قوانین</h4><div className="footer-contact"><span><MapPin size={15} /> تهران، استودیو معراج اندیشه</span><span><Phone size={15} /> ۰۲۱-۱۲۳۴۵۶۷۸</span><span><Mail size={15} /> content@merajandisheh.ir</span></div><div className="footer-rules"><ShieldCheck size={16} /><p>{site.footerRules}</p></div></section>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {site.watermark || "استودیو معراج اندیشه"} — بانک محتوای مستند</span><span>پلتفرم ماژولار، چندزبانه و متناسب با سن</span></div>
    </footer>
  );
}
