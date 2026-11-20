"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_AGE_THEMES } from "@/config/defaults";
import { formatDate, translate } from "@/locales";
import { readTopicScores, trackTopic } from "@/core/personalization";
import {
  getLocalBootstrap,
  isUnreachableResponse,
  runLocalAction,
  runLocalAuth,
  syncServerBootstrap,
} from "@/core/local-fallback";
import {
  getSetting,
  type AgeTheme,
  type Bootstrap,
  type ContentItem,
  type HomeSection,
  type LanguageRecord,
  type PublicUser,
  type SectionKey,
  type SettingsMap,
} from "@/core/types";

export type ViewKey = "home" | "bank" | "tree" | "profile" | "admin";
export type ActiveFilters = Record<string, string[]>;
type PendingAction = "download" | "story" | null;
export type LoginMode = "visitor" | "staff";

interface PlatformContextValue {
  data: Bootstrap;
  settings: SettingsMap;
  t: (key: string) => string;
  date: (value: string | Date) => string;
  language: string;
  setLanguageSafe: (code: string) => void;
  activeLanguage: LanguageRecord;
  ageGroup: string;
  setAgeGroupSafe: (id: string) => void;
  theme: AgeTheme;
  ageThemes: AgeTheme[];
  ageGateOpen: boolean;
  setAgeGateOpen: (v: boolean) => void;
  personalization: boolean;
  setPersonalizationSafe: (v: boolean) => void;
  topicScores: Record<string, number>;
  user: PublicUser | null;
  authChecked: boolean;
  token: string | null;
  loginOpen: boolean;
  setLoginOpen: (v: boolean) => void;
  loginMode: LoginMode;
  setLoginMode: (m: LoginMode) => void;
  openAdminLogin: () => void;
  offlineMode: boolean;
  pendingAction: PendingAction;
  consumePendingAction: () => PendingAction;
  ensureAuth: (intent?: PendingAction) => boolean;
  auth: (action: "login" | "register", payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  view: ViewKey;
  navigate: (view: ViewKey, options?: { portal?: string; filters?: ActiveFilters; q?: string }) => void;
  activePortal: string;
  bankFilters: ActiveFilters;
  setBankFilters: (v: ActiveFilters) => void;
  treeOpen: boolean;
  setTreeOpen: (v: boolean) => void;
  selectedTreeId: number | null;
  setSelectedTreeId: (v: number | null) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedContent: ContentItem | null;
  openContent: (item: ContentItem) => void;
  closeContent: () => void;
  bookmarks: number[];
  toggleBookmark: (id: number) => void;
  toast: string;
  showToast: (message: string) => void;
  refresh: () => Promise<void>;
  call: (action: string, payload?: Record<string, unknown>, options?: { refreshAfter?: boolean; section?: string }) => Promise<Record<string, unknown>>;
  canAccess: (section: SectionKey) => boolean;
  visitorId: string;
  homeSections: HomeSection[];
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

const DEFAULT_LANGUAGE: LanguageRecord = {
  code: "fa", label: "Persian", nativeLabel: "فارسی", direction: "rtl", font: "Vazirmatn",
  calendar: "persian", motif: "geometric", enabled: true, labels: {}, sort: 1,
};

function parseUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawView = params.get("view");
  const view: ViewKey = ["home", "bank", "tree", "profile", "admin"].includes(rawView ?? "") ? (rawView as ViewKey) : "home";
  const autostart = params.get("autostart") === "1";
  return { view, portal: params.get("portal") || "all", q: params.get("q") || "", autostart };
}

export function PlatformProvider({ initial, children }: { initial: Bootstrap; children: ReactNode }) {
  const [data, setData] = useState<Bootstrap>(initial);
  const [language, setLanguage] = useState("fa");
  const [ageGroup, setAgeGroup] = useState("adult");
  const [ageGateOpen, setAgeGateOpen] = useState(false);
  const [personalization, setPersonalization] = useState(getSetting<{ enabledByDefault?: boolean }>(initial.settings, "personalization", { enabledByDefault: true }).enabledByDefault ?? true);
  const [topicScores, setTopicScores] = useState<Record<string, number>>({});
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("visitor");
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [view, setView] = useState<ViewKey>("home");
  const [activePortal, setActivePortal] = useState("all");
  const [bankFilters, setBankFilters] = useState<ActiveFilters>({});
  const [treeOpen, setTreeOpen] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [visitorId, setVisitorId] = useState("anonymous");
  const visitTracked = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef(initial);

  const settings = data.settings;
  const activeLanguage = useMemo(() => data.languages.find((l) => l.code === language && l.enabled) ?? data.languages.find((l) => l.enabled) ?? DEFAULT_LANGUAGE, [data.languages, language]);
  const ageThemes = useMemo(() => getSetting<AgeTheme[]>(settings, "ageThemes", DEFAULT_AGE_THEMES), [settings]);
  const theme = useMemo(() => ageThemes.find((a) => a.id === ageGroup) ?? ageThemes[0] ?? DEFAULT_AGE_THEMES[3] ?? DEFAULT_AGE_THEMES[0], [ageThemes, ageGroup]);
  const homeSections = useMemo(() => getSetting<HomeSection[]>(settings, "homeSections", []).slice().sort((a, b) => a.order - b.order), [settings]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }, []);

  const openAdminLogin = useCallback(() => {
    setLoginMode("staff");
    setLoginOpen(true);
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem("meraj.language") || "fa";
    const storedAge = localStorage.getItem("meraj.ageGroup");
    const storedSmart = localStorage.getItem("meraj.personalization");
    const storedBookmarks = localStorage.getItem("meraj.bookmarks");
    const storedToken = localStorage.getItem("meraj.token");
    let id = localStorage.getItem("meraj.visitorId");
    if (!id) {
      id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `visitor-${Date.now()}`;
      localStorage.setItem("meraj.visitorId", id);
    }
    const initialUrl = parseUrl();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setVisitorId(id);
      setLanguage(storedLang);
      if (storedAge) setAgeGroup(storedAge);
      else if (!initialUrl.autostart && initialUrl.view !== "admin") setAgeGateOpen(true);
      if (storedSmart !== null) setPersonalization(storedSmart === "true");
      setTopicScores(readTopicScores());
      setToken(storedToken);
      try { setBookmarks(JSON.parse(storedBookmarks || "[]") as number[]); } catch { setBookmarks([]); }
      setView(initialUrl.view);
      setActivePortal(initialUrl.portal);
      setSearchQuery(initialUrl.q);
      if (initialUrl.view === "admin") setLoginMode("staff");
    });

    const onPop = () => {
      const parsed = parseUrl();
      setView(parsed.view); setActivePortal(parsed.portal); setSearchQuery(parsed.q);
    };
    const onShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setLoginMode("staff");
        setLoginOpen(true);
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onShortcut);

    syncServerBootstrap(initialRef.current);

    fetch("/api/auth", { cache: "no-store" })
      .then(async (r) => {
        if (isUnreachableResponse(r)) throw new Error("unreachable");
        return r.json();
      })
      .then((r) => {
        setUser(r.user ?? null);
        setAuthChecked(true);
      })
      .catch(() => {
        setOfflineMode(true);
        const localData = getLocalBootstrap(initialRef.current);
        setData(localData);
        const localRes = runLocalAuth("session", { token: storedToken ?? "" }, localData);
        setUser(localRes.user ?? null);
        setAuthChecked(true);
      });

    if (!sessionStorage.getItem("meraj.visitTracked")) {
      sessionStorage.setItem("meraj.visitTracked", "1");
      visitTracked.current = true;
      fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trackVisit", payload: { visitorId: id, path: window.location.pathname + window.location.search } }),
      }).catch(() => {
        runLocalAction("trackVisit", { visitorId: id, path: window.location.pathname + window.location.search }, null, initialRef.current);
      });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onShortcut);
    };
  }, []);

  const visualFont = getSetting<{ fontFamily?: string }>(settings, "visual", {}).fontFamily;
  const resolvedFont = visualFont && visualFont !== "auto" ? visualFont : activeLanguage.font;
  const fontStack = resolvedFont === "Cairo" ? "'Cairo', sans-serif" : resolvedFont === "Inter" ? "'Inter', sans-serif" : "'Vazirmatn', 'Tahoma', sans-serif";
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.lang = activeLanguage.code;
    root.dir = activeLanguage.direction === "rtl" ? "rtl" : "ltr";
    body.dataset.ageTheme = theme.id;
    body.dataset.motif = theme.motif || activeLanguage.motif;
    body.style.setProperty("--primary", theme.colors.primary);
    body.style.setProperty("--secondary", theme.colors.secondary);
    body.style.setProperty("--accent", theme.colors.accent);
    body.style.setProperty("--bg", theme.colors.background);
    body.style.setProperty("--surface", theme.colors.surface);
    body.style.setProperty("--text", theme.colors.text);
    body.style.setProperty("--muted", theme.colors.muted);
    body.style.setProperty("--radius", `${theme.radius}px`);
    body.style.setProperty("--font-scale", String(theme.fontScale));
    body.style.setProperty("--app-font", fontStack);
    body.style.setProperty("--motif-opacity", String(getSetting<{ motifOpacity?: number }>(settings, "visual", {}).motifOpacity ?? 0.075));
  }, [activeLanguage, theme, fontStack, settings]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/bootstrap", { cache: "no-store" });
      if (isUnreachableResponse(response)) throw new Error("unreachable");
      const result = await response.json();
      if (result.ok) {
        const next = result.data as Bootstrap;
        setData(next);
        syncServerBootstrap(next);
        setOfflineMode(false);
        return;
      }
      throw new Error("bootstrap failed");
    } catch {
      setOfflineMode(true);
      setData(getLocalBootstrap(initialRef.current));
    }
  }, []);

  const call = useCallback(async (action: string, payload: Record<string, unknown> = {}, options: { refreshAfter?: boolean; section?: string } = {}) => {
    const bodyPayload = { ...payload };
    if (options.section && !bodyPayload.section) bodyPayload.section = options.section;
    try {
      const response = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, payload: bodyPayload }),
      });
      if (isUnreachableResponse(response)) throw new Error("__LOCAL_FALLBACK__");
      const result = await response.json() as Record<string, unknown>;
      if (!response.ok || result.ok === false) {
        showToast(String(result.error ?? "خطا در انجام عملیات"));
        throw new Error(String(result.error ?? "Action failed"));
      }
      setOfflineMode(false);
      if (options.refreshAfter !== false && !["trackView", "trackVisit", "getComments", "getAnalytics"].includes(action)) await refresh();
      return result;
    } catch (err) {
      if (err instanceof Error && err.message !== "__LOCAL_FALLBACK__" && err.name !== "TypeError" && !err.message.includes("fetch")) {
        throw err;
      }
      setOfflineMode(true);
      const localRes = runLocalAction(action, bodyPayload, user, data);
      if (localRes.ok === false) {
        showToast(String(localRes.error ?? "خطا در انجام عملیات"));
        throw new Error(String(localRes.error ?? "Action failed"));
      }
      setData({ ...localRes.bootstrap });
      return localRes as Record<string, unknown>;
    }
  }, [token, refresh, showToast, user, data]);

  const navigate = useCallback((nextView: ViewKey, options: { portal?: string; filters?: ActiveFilters; q?: string } = {}) => {
    setView(nextView);
    const portal = options.portal ?? (nextView === "home" || nextView === "profile" || nextView === "admin" ? "all" : activePortal);
    setActivePortal(portal);
    if (options.filters) setBankFilters(options.filters);
    if (options.q !== undefined) setSearchQuery(options.q);
    const params = new URLSearchParams();
    if (nextView !== "home") params.set("view", nextView);
    if (portal && portal !== "all") params.set("portal", portal);
    const q = options.q !== undefined ? options.q : searchQuery;
    if (q && nextView === "bank") params.set("q", q);
    const url = params.toString() ? `/?${params.toString()}` : "/";
    if (window.location.pathname + window.location.search !== url) window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePortal, searchQuery]);

  const openContent = useCallback((item: ContentItem) => {
    setSelectedContent(item);
    trackTopic(item.topic);
    setTopicScores(readTopicScores());
    fetch("/api/platform", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trackView", payload: { contentId: item.id, visitorId } }),
    })
      .then((r) => {
        if (isUnreachableResponse(r)) throw new Error("offline");
      })
      .catch(() => {
        const res = runLocalAction("trackView", { contentId: item.id, visitorId }, user, data);
        setData({ ...res.bootstrap });
      });
  }, [visitorId, user, data]);

  const closeContent = useCallback(() => setSelectedContent(null), []);

  const toggleBookmark = useCallback((id: number) => {
    setBookmarks((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      localStorage.setItem("meraj.bookmarks", JSON.stringify(next));
      return next;
    });
  }, []);

  const setLanguageSafe = useCallback((code: string) => { localStorage.setItem("meraj.language", code); setLanguage(code); }, []);
  const setAgeGroupSafe = useCallback((id: string) => { localStorage.setItem("meraj.ageGroup", id); setAgeGroup(id); setAgeGateOpen(false); }, []);
  const setPersonalizationSafe = useCallback((v: boolean) => { localStorage.setItem("meraj.personalization", String(v)); setPersonalization(v); }, []);

  const ensureAuth = useCallback((intent: PendingAction = null) => {
    if (user) return true;
    if (intent) setPendingAction(intent);
    setLoginMode("visitor");
    setLoginOpen(true);
    return false;
  }, [user]);

  const consumePendingAction = useCallback(() => {
    const action = pendingAction;
    if (action) setPendingAction(null);
    return action;
  }, [pendingAction]);

  const auth = useCallback(async (action: "login" | "register", payload: Record<string, unknown>) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (isUnreachableResponse(response)) throw new Error("__LOCAL_AUTH__");
      const result = await response.json();
      if (!response.ok || !result.ok) return { ok: false, error: String(result.error ?? "خطا") };
      setOfflineMode(false);
      setUser(result.user as PublicUser);
      setToken(result.token as string);
      localStorage.setItem("meraj.token", String(result.token));
      setLoginOpen(false);
      const role = (result.user as PublicUser).role;
      if (!pendingAction) navigate(role === "visitor" ? "profile" : "admin");
      showToast(role === "visitor" ? "به حساب کاربری خود خوش آمدید" : "به داشبورد مدیریت خوش آمدید");
      await refresh();
      return { ok: true };
    } catch (error) {
      if (error instanceof Error && error.message !== "__LOCAL_AUTH__" && error.name !== "TypeError" && !error.message.includes("fetch")) {
        return { ok: false, error: error.message };
      }
      setOfflineMode(true);
      const localRes = runLocalAuth(action, payload, data);
      if (!localRes.ok || !localRes.user) return { ok: false, error: localRes.error ?? "خطا" };
      setUser(localRes.user);
      setToken(localRes.token ?? null);
      if (localRes.token) localStorage.setItem("meraj.token", localRes.token);
      setData({ ...getLocalBootstrap(data) });
      setLoginOpen(false);
      const role = localRes.user.role;
      if (!pendingAction) navigate(role === "visitor" ? "profile" : "admin");
      showToast(role === "visitor" ? "به حساب کاربری خود خوش آمدید" : "به داشبورد مدیریت خوش آمدید");
      return { ok: true };
    }
  }, [navigate, refresh, showToast, pendingAction, data]);

  const logout = useCallback(async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }).catch(() => {
      runLocalAuth("logout", { token: token ?? "" }, data);
    });
    localStorage.removeItem("meraj.token");
    setToken(null); setUser(null); navigate("home"); showToast("خروج انجام شد");
  }, [navigate, showToast, token, data]);

  const canAccess = useCallback((section: SectionKey) => {
    if (!user) return false;
    return user.role === "super_admin" || user.permissions.includes(section);
  }, [user]);

  const t = useCallback((key: string) => translate(activeLanguage.code, key, activeLanguage.labels), [activeLanguage]);
  const date = useCallback((value: string | Date) => formatDate(value, activeLanguage.code, activeLanguage.calendar), [activeLanguage]);

  const value: PlatformContextValue = {
    data, settings, t, date, language, setLanguageSafe, activeLanguage,
    ageGroup, setAgeGroupSafe, theme, ageThemes, ageGateOpen, setAgeGateOpen,
    personalization, setPersonalizationSafe, topicScores, user, authChecked, token,
    loginOpen, setLoginOpen, loginMode, setLoginMode, openAdminLogin, offlineMode,
    pendingAction, consumePendingAction, ensureAuth, auth, logout,
    view, navigate, activePortal, bankFilters, setBankFilters, treeOpen, setTreeOpen,
    selectedTreeId, setSelectedTreeId, searchQuery, setSearchQuery,
    selectedContent, openContent, closeContent, bookmarks, toggleBookmark,
    toast, showToast, refresh, call, canAccess, visitorId, homeSections,
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used inside PlatformProvider");
  return context;
}
