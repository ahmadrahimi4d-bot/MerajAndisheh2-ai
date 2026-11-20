"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, FolderTree, Search, SlidersHorizontal, X } from "lucide-react";
import { usePlatform, type ActiveFilters } from "@/core/platform-context";
import { matchesFilters, searchContents } from "@/core/personalization";
import { formatMeta } from "@/config/registry";
import { getSetting, type CategoryRecord, type PortalLink } from "@/core/types";
import { DEFAULT_PORTAL_LINKS } from "@/config/defaults";
import { ContentCard } from "@/modules/public/content-card";
import { EmptyState, SectionTitle } from "@/modules/shared";

function TreeBranch({ node, nodes, level, onSelect }: { node: CategoryRecord; nodes: CategoryRecord[]; level: number; onSelect: (id: number) => void }) {
  const [open, setOpen] = useState(level < 1);
  const children = nodes.filter((n) => n.parentId === node.id && n.enabled);
  return (
    <div className="tree-branch" style={{ paddingInlineStart: level * 12 }}>
      <div className="tree-node">
        {children.length ? <button className="tree-caret" onClick={() => setOpen(!open)}><ChevronDown size={14} className={open ? "open" : ""} /></button> : <i className="tree-leaf">◇</i>}
        <button onClick={() => onSelect(node.id)}><span>{node.icon || "◇"}</span>{node.label}</button>
      </div>
      {open && children.map((child) => <TreeBranch key={child.id} node={child} nodes={nodes} level={level + 1} onSelect={onSelect} />)}
    </div>
  );
}

export function TreePage() {
  const { data, t, navigate, setSelectedTreeId } = usePlatform();
  const roots = data.categories.filter((c) => c.kind === "tree" && !c.parentId && c.enabled).sort((a, b) => a.sort - b.sort);
  const allTree = data.categories.filter((c) => c.kind === "tree" && c.enabled);
  const select = (id: number) => { setSelectedTreeId(id); navigate("bank", { portal: "all", filters: { tree: [String(id)] } }); };
  return (
    <div className="tree-page">
      <SectionTitle eyebrow="ZONE 6 · TAXONOMY" title={t("tree")} description="شاخهبندی درختی پویا؛ هر شاخه قابل ویرایش و گسترش از پنل مدیریت است." />
      <div className="tree-cards">{roots.map((root) => {
        const children = allTree.filter((c) => c.parentId === root.id);
        const branchIds = [root.id, ...children.flatMap((c) => [c.id, ...allTree.filter((g) => g.parentId === c.id).map((g) => g.id)])];
        const count = data.contents.filter((c) => c.treeId && branchIds.includes(c.treeId)).length;
        return <article className="tree-root-card" key={root.id}>
          <div className="tree-root-head" style={{ background: root.color || "var(--primary)" }}><span>{root.icon}</span><strong>{root.label}</strong><b>{count} محتوا</b></div>
          <div className="tree-root-body"><TreeBranch node={root} nodes={allTree} level={0} onSelect={select} /></div>
          <button className="tree-root-cta" onClick={() => select(root.id)}>{t("explore")} <ChevronLeft size={15} /></button>
        </article>;
      })}</div>
      <div className="tree-source-note">✦ تمامی محتواهای شاخهها دارای کادر «منبع و مستندات محتوا» در پنجره جزئیات هستند.</div>
    </div>
  );
}

export function BankPage() {
  const {
    data, settings, t, activePortal, bankFilters, setBankFilters, searchQuery, setSearchQuery,
    navigate, treeOpen, setTreeOpen, selectedTreeId, setSelectedTreeId, ageGroup,
  } = usePlatform();
  const [quick, setQuick] = useState<Record<string, string>>({});
  const [openGroups, setOpenGroups] = useState<string[]>(["topic", "format", "age"]);
  const [sort, setSort] = useState("newest");
  const groups = useMemo(() => data.categories.filter((c) => c.kind === "filter-group" && c.enabled).sort((a, b) => a.sort - b.sort), [data.categories]);
  const treeNodes = data.categories.filter((c) => c.kind === "tree" && c.enabled);
  const portalLinks = getSetting<PortalLink[]>(settings, "portalLinks", DEFAULT_PORTAL_LINKS);
  const portalLabel = portalLinks.find((p) => p.target === activePortal)?.label ?? t("bank");

  const toggleFilter = (group: string, value: string) => {
    const current = bankFilters[group] ?? [];
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    setBankFilters({ ...bankFilters, [group]: next });
  };
  const removeFilter = (group: string, value: string) => {
    const next = { ...bankFilters, [group]: (bankFilters[group] ?? []).filter((x) => x !== value) };
    setBankFilters(next);
  };
  const selectTree = (id: number) => {
    setSelectedTreeId(id);
    setBankFilters({ ...bankFilters, tree: [String(id)] });
  };

  let items = data.contents.filter((c) => c.published);
  if (activePortal !== "all") items = items.filter((c) => c.portal === activePortal);
  items = searchContents(items, searchQuery);
  items = items.filter((c) => matchesFilters(c, bankFilters));
  if (selectedTreeId && !bankFilters.tree?.includes(String(selectedTreeId))) items = items.filter((c) => c.treeId === selectedTreeId);
  items = [...items].sort((a, b) => {
    if (sort === "popular") return b.views - a.views;
    if (sort === "rating") return (b.ratingCount ? b.ratingSum / b.ratingCount : 0) - (a.ratingCount ? a.ratingSum / a.ratingCount : 0);
    if (sort === "title") return a.title.localeCompare(b.title, "fa");
    if (sort === "age") return Number(b.ageGroups.includes(ageGroup)) - Number(a.ageGroups.includes(ageGroup)) || b.createdAt.localeCompare(a.createdAt);
    return b.createdAt.localeCompare(a.createdAt);
  });
  const activeChips = Object.entries(bankFilters).flatMap(([group, values]) => values.map((value) => ({ group, value })));
  const groupLabel = (key: string) => data.categories.find((c) => c.key === key && c.kind === "filter-group")?.label ?? key;

  return (
    <div className="bank-layout">
      <aside className="filter-sidebar">
        <div className="sidebar-head"><div><SlidersHorizontal size={18} /><strong>{t("filters")}</strong></div><button onClick={() => { setBankFilters({}); setSelectedTreeId(null); setSearchQuery(""); }}>{t("clearAll")}</button></div>
        <div className="sidebar-search"><Search size={16} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("quickFilterSearch")} /></div>
        <button className={`tree-toggle ${treeOpen ? "active" : ""}`} onClick={() => setTreeOpen(!treeOpen)}><FolderTree size={17} />{treeOpen ? t("hideTree") : t("showTree")}<ChevronDown size={15} className={treeOpen ? "open" : ""} /></button>
        {treeOpen && <div className="sidebar-tree">{treeNodes.filter((c) => !c.parentId).map((root) => <TreeBranch key={root.id} node={root} nodes={treeNodes} level={0} onSelect={selectTree} />)}</div>}
        <div className="filter-accordions">{groups.map((group) => {
          const options = data.categories.filter((c) => c.parentId === group.id && c.enabled).sort((a, b) => a.sort - b.sort);
          const query = quick[group.key] ?? "";
          const visible = options.filter((o) => o.label.includes(query));
          const isOpen = openGroups.includes(group.key);
          return <div className={`filter-group ${isOpen ? "open" : ""}`} key={group.id}>
            <button className="filter-group-head" onClick={() => setOpenGroups(isOpen ? openGroups.filter((x) => x !== group.key) : [...openGroups, group.key])}><span>{group.icon} {group.label}</span><ChevronDown size={15} className={isOpen ? "open" : ""} /></button>
            {isOpen && <div className="filter-group-body">
              {options.length > 6 && <div className="filter-quick"><Search size={13} /><input value={query} onChange={(e) => setQuick({ ...quick, [group.key]: e.target.value })} placeholder={t("quickFilterSearch")} /></div>}
              {visible.map((option) => {
                const value = option.key.split(":").slice(1).join(":");
                const checked = (bankFilters[group.key] ?? []).includes(value);
                const count = data.contents.filter((c) => matchesFilters(c, { [group.key]: [value] })).length;
                return <label className="filter-option" key={option.id}><input type="checkbox" checked={checked} onChange={() => toggleFilter(group.key, value)} /><span>{option.label}</span><i>{count}</i></label>;
              })}
            </div>}
          </div>;
        })}</div>
        <div className="sidebar-note"><span>◈</span><p>{t("allFormats")}<br />{t("hybridHosting")}</p></div>
      </aside>

      <main className="bank-main">
        <div className="breadcrumb"><button onClick={() => navigate("home")}>{t("home")}</button><ChevronLeft size={13} /><button onClick={() => navigate("bank", { portal: "all", filters: {} })}>{t("bank")}</button>{activePortal !== "all" && <><ChevronLeft size={13} /><span>{portalLabel}</span></>}{selectedTreeId && <><ChevronLeft size={13} /><span>{data.categories.find((c) => c.id === selectedTreeId)?.label}</span></>}</div>
        <div className="bank-title"><div><span className="eyebrow">ZONE 6 · CONTENT GRID</span><h1>{activePortal === "all" ? t("bank") : portalLabel}</h1><p>{items.length} {t("results")} · {t("sort")}: {sort === "newest" ? t("sortNewest") : sort === "popular" ? t("sortPopular") : t("sortRating")}</p></div><div className="bank-format-legend">{Object.entries({ mp4: "🎬", mp3: "🎧", pdf: "📕", pptx: "📊", game: "🎮" }).map(([f, icon]) => <span key={f}>{icon} {formatMeta(f).label}</span>)}</div></div>
        {activeChips.length > 0 && <div className="active-chips"><span>{t("activeFilters")}:</span>{activeChips.map(({ group, value }) => {
          const option = data.categories.find((c) => c.key === `${group}:${value}`);
          return <button key={`${group}:${value}`} onClick={() => removeFilter(group, value)}>{groupLabel(group)}: {option?.label ?? value}<X size={13} /></button>;
        })}</div>}
        <div className="sort-bar"><div><span>{items.length}</span> {t("results")} {searchQuery && <>برای «{searchQuery}»</>}</div><label>{t("sort")}<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">{t("sortNewest")}</option><option value="popular">{t("sortPopular")}</option><option value="rating">{t("sortRating")}</option><option value="age">{t("ageBadge")}</option><option value="title">{t("sortTitle")}</option></select></label></div>
        {items.length ? <div className="content-grid">{items.map((item) => <ContentCard key={item.id} item={item} />)}</div> : <EmptyState text={t("noResults")} />}
      </main>
    </div>
  );
}
