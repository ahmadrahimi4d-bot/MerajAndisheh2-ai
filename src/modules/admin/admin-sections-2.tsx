"use client";

import { useState, type ChangeEvent } from "react";
import { CloudUpload, Download, Globe2, KeyRound, LockKeyhole, ShieldCheck, Trash2, Upload, UserCog, Users as UsersIcon } from "lucide-react";
import { ADMIN_SECTIONS, CALENDARS, MOTIFS, PLUGIN_DEFINITIONS } from "@/config/registry";
import { isStaticExportMode } from "@/core/assets";
import { usePlatform } from "@/core/platform-context";
import { isUnreachableResponse } from "@/core/local-fallback";
import { getSetting, type BackupConfig, type LanguageRecord, type PluginRecord, type RegistrationField } from "@/core/types";
import { useSettingsDraft } from "@/modules/admin/hooks";
import { Toggle } from "@/modules/shared";

function PluginCard({ definition, plugin }: { definition: (typeof PLUGIN_DEFINITIONS)[number]; plugin?: PluginRecord }) {
  const { call, showToast } = usePlatform();
  const [configText, setConfigText] = useState("");
  return <article className="plugin-card">
    <div className="plugin-icon">{definition.icon}</div><div className="plugin-body"><h3>{definition.name}</h3><p>{definition.description}</p><code>plugins/{definition.key}</code>
      <Toggle checked={plugin?.enabled ?? false} label={plugin?.enabled ? "فعال" : "غیرفعال"} onChange={async (enabled) => { await call("savePlugin", { section: "plugins", key: definition.key, enabled, config: plugin?.config ?? {} }); showToast("وضعیت افزونه ذخیره شد"); }} />
      <textarea rows={4} value={configText || JSON.stringify(plugin?.config ?? {}, null, 2)} onChange={(e) => setConfigText(e.target.value)} /><button className="secondary-button" onClick={async () => { try { const config = JSON.parse(configText || JSON.stringify(plugin?.config ?? {})); await call("savePlugin", { section: "plugins", key: definition.key, enabled: plugin?.enabled ?? false, config }); showToast("پیکربندی افزونه ذخیره شد"); } catch { showToast("JSON پیکربندی معتبر نیست"); } }}>ذخیره پیکربندی</button>
    </div>
  </article>;
}

export function PluginsSection() {
  const { data } = usePlatform();
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 05 · PLUGIN REGISTRY</span><h2>مدیریت افزونهها</h2><p>هر افزونه کاملاً مستقل و بدون تغییر کد قابل روشن/خاموش و پیکربندی است.</p></div></div>
    <div className="plugin-grid">{PLUGIN_DEFINITIONS.map((definition) => (
      <PluginCard key={definition.key} definition={definition} plugin={data.plugins.find((p) => p.key === definition.key)} />
    ))}</div>
  </div>;
}

const emptyStaff = { id: 0, username: "", password: "", displayName: "", role: "staff", permissions: [] as string[], enabled: true };

export function UsersSection() {
  const { data, call, showToast, user } = usePlatform();
  const { draft, setKey, saveKeys } = useSettingsDraft();
  const [staff, setStaff] = useState(emptyStaff);
  const fields = getSetting<RegistrationField[]>(draft, "registrationFields", []);
  const gate = getSetting<{ requireLogin?: boolean; previewOpen?: boolean; message?: string }>(draft, "downloadGate", { requireLogin: true });
  const saveStaff = async () => {
    await call("saveUser", { section: "users", user: staff });
    setStaff(emptyStaff); showToast("حساب همکار ذخیره شد");
  };
  const updateField = (index: number, patch: Partial<RegistrationField>) => setKey("registrationFields", fields.map((f, i) => i === index ? { ...f, ...patch } : f));
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 06 · RBAC & PROFILE SCHEMA</span><h2>کاربران، همکاران و فیلدهای پویا</h2><p>سطوح دسترسی بخشبهبخش، بازدیدکنندگان و فیلدهای دلخواه ثبتنام.</p></div><UserCog size={30} /></div>
    <div className="admin-two-col">
      <div className="panel-card"><h3>ایجاد / ویرایش همکار</h3><div className="form-grid">
        <label><span>نام کاربری</span><input value={staff.username} onChange={(e) => setStaff({ ...staff, username: e.target.value })} /></label>
        <label><span>گذرواژه</span><input type="password" value={staff.password} onChange={(e) => setStaff({ ...staff, password: e.target.value })} placeholder="خالی = بدون تغییر" /></label>
        <label><span>نام نمایشی</span><input value={staff.displayName} onChange={(e) => setStaff({ ...staff, displayName: e.target.value })} /></label>
        <label><span>نقش</span><select value={staff.role} onChange={(e) => setStaff({ ...staff, role: e.target.value })}><option value="staff">همکار / Staff</option><option value="super_admin">مدیر کل</option></select></label>
      </div><div className="permission-grid">{ADMIN_SECTIONS.map((s) => <label key={s.key}><input type="checkbox" checked={staff.permissions.includes(s.key)} onChange={(e) => setStaff({ ...staff, permissions: e.target.checked ? [...staff.permissions, s.key] : staff.permissions.filter((p) => p !== s.key) })} />{s.icon} {s.title}</label>)}</div><button className="primary-button" onClick={() => void saveStaff()}>ذخیره همکار</button></div>
      <div className="panel-card"><h3><UsersIcon size={17} /> حسابهای سامانه</h3><div className="table-scroll"><table className="admin-table"><thead><tr><th>کاربر</th><th>نقش</th><th>دسترسیها</th><th></th></tr></thead><tbody>{data.users.map((u) => <tr key={u.id}><td><strong>{u.displayName || u.username}</strong><small>{u.username}</small></td><td><span className="role-badge">{u.role === "super_admin" ? "مدیر کل" : u.role === "staff" ? "همکار" : "بازدیدکننده"}</span></td><td>{u.permissions.length ? `${u.permissions.length} بخش` : "—"}</td><td>{u.id !== user?.id && <button className="danger-icon" onClick={async () => { await call("deleteUser", { section: "users", id: u.id }); showToast("کاربر حذف شد"); }}><Trash2 size={15} /></button>}</td></tr>)}</tbody></table></div></div>
    </div>
    <div className="panel-card"><h3><LockKeyhole size={17} /> فیلدهای ثبتنام و دروازه دانلود</h3><div className="dynamic-rows">{fields.map((field, i) => <div className="dynamic-row" key={`${field.id}-${i}`}><input value={field.id} onChange={(e) => updateField(i, { id: e.target.value })} /><input value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} /><select value={field.type} onChange={(e) => updateField(i, { type: e.target.value })}>{["text", "tel", "password", "email", "select", "textarea"].map((type) => <option key={type}>{type}</option>)}</select><label><input type="checkbox" checked={field.required} onChange={(e) => updateField(i, { required: e.target.checked })} /> اجباری</label><label><input type="checkbox" checked={field.enabled} onChange={(e) => updateField(i, { enabled: e.target.checked })} /> فعال</label><button onClick={() => setKey("registrationFields", fields.filter((_, x) => x !== i))}><Trash2 size={14} /></button></div>)}</div>
      <button className="secondary-button" onClick={() => setKey("registrationFields", [...fields, { id: `field${Date.now()}`, label: "فیلد جدید", type: "text", required: false, enabled: true }])}>+ فیلد جدید</button>
      <div className="gate-row"><Toggle checked={gate.requireLogin !== false} label="دانلود نیازمند ورود / ثبتنام" onChange={(v) => setKey("downloadGate", { ...gate, requireLogin: v })} /><Toggle checked={gate.previewOpen !== false} label="نمایش و پخش همگانی آزاد" onChange={(v) => setKey("downloadGate", { ...gate, previewOpen: v })} /><label className="wide"><span>پیام دروازه</span><input value={gate.message ?? ""} onChange={(e) => setKey("downloadGate", { ...gate, message: e.target.value })} /></label></div>
      <button className="primary-button" onClick={async () => { await saveKeys("users", ["registrationFields", "downloadGate"]); }}>ذخیره قوانین و فیلدها</button>
    </div>
  </div>;
}

const emptyLanguage: LanguageRecord = { code: "", label: "", nativeLabel: "", direction: "ltr", font: "Inter", calendar: "gregory", motif: "minimal", enabled: true, labels: {}, sort: 99 };

export function LanguagesSection() {
  const { data, call, showToast, language, setLanguageSafe } = usePlatform();
  const [form, setForm] = useState<LanguageRecord>(emptyLanguage);
  const [labelsText, setLabelsText] = useState("{}");
  const edit = (l: LanguageRecord) => { setForm(l); setLabelsText(JSON.stringify(l.labels ?? {}, null, 2)); };
  const save = async () => {
    try {
      await call("saveLanguage", { section: "languages", language: { ...form, labels: JSON.parse(labelsText || "{}") } });
      setForm(emptyLanguage); setLabelsText("{}"); showToast("زبان ذخیره شد");
    } catch { showToast("برچسبهای سفارشی باید JSON معتبر باشند"); }
  };
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 07 · CULTURAL LOCALIZATION</span><h2>زبانها و فرهنگبندی</h2><p>جهت، فونت، تقویم، نقش بصری و برچسبها همگی پویا هستند.</p></div><Globe2 size={30} /></div>
    <div className="admin-two-col"><div className="panel-card"><h3>افزودن / ویرایش زبان</h3><div className="form-grid">
      <label><span>کد</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="fr" /></label><label><span>نام</span><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label><label><span>نام بومی</span><input value={form.nativeLabel} onChange={(e) => setForm({ ...form, nativeLabel: e.target.value })} /></label>
      <label><span>جهت</span><select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="rtl">RTL</option><option value="ltr">LTR</option></select></label>
      <label><span>فونت</span><select value={form.font} onChange={(e) => setForm({ ...form, font: e.target.value })}>{["Vazirmatn", "Cairo", "Inter", "system"].map((f) => <option key={f}>{f}</option>)}</select></label>
      <label><span>تقویم</span><select value={form.calendar} onChange={(e) => setForm({ ...form, calendar: e.target.value })}>{CALENDARS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
      <label><span>نقش فرهنگی</span><select value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })}>{MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
    </div><label className="field"><span className="field-label">برچسبهای سفارشی (JSON)</span><textarea rows={5} value={labelsText} onChange={(e) => setLabelsText(e.target.value)} /></label><Toggle checked={form.enabled} label="زبان فعال" onChange={(v) => setForm({ ...form, enabled: v })} /><button className="primary-button" onClick={() => void save()}>ذخیره زبان</button></div>
      <div className="panel-card"><h3>زبانهای فعال</h3><div className="language-list">{data.languages.map((l) => <div className="language-row" key={l.code}><span className="lang-code">{l.code.toUpperCase()}</span><div><strong>{l.nativeLabel}</strong><small>{l.font} · {l.calendar} · {l.motif} · {l.direction.toUpperCase()}</small></div><button className="secondary-button small" onClick={() => setLanguageSafe(l.code)}>{language === l.code ? "فعلی" : "امتحان"}</button><button className="secondary-button small" onClick={() => edit(l)}>ویرایش</button><button className="danger-icon" onClick={async () => { await call("deleteLanguage", { section: "languages", code: l.code }); showToast("زبان حذف شد"); }}><Trash2 size={14} /></button></div>)}</div></div>
    </div>
  </div>;
}

export function BackupsSection() {
  const { data, call, token, showToast, date } = usePlatform();
  const { draft, setKey, saveKeys } = useSettingsDraft();
  const config = getSetting<BackupConfig>(draft, "backup", { enabled: true, intervalDays: 7, webhookUrl: "", secretToken: "", autoPush: true });
  const [importing, setImporting] = useState(false);
  const exportJson = async () => {
    let blob: Blob;
    const makeLocalBlob = () => new Blob([JSON.stringify({
      product: "Meraj Andisheh Studio Content Bank",
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: data.settings,
      categories: data.categories,
      contents: data.contents,
      plugins: data.plugins,
      languages: data.languages,
      users: data.users,
    }, null, 2)], { type: "application/json;charset=utf-8" });
    if (isStaticExportMode()) {
      blob = makeLocalBlob();
    } else {
      try {
        const response = await fetch("/api/backup-export", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (isUnreachableResponse(response)) throw new Error("offline");
        if (!response.ok) { showToast("دسترسی به خروجی مجاز نیست"); return; }
        blob = await response.blob();
      } catch {
        blob = makeLocalBlob();
      }
    }
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `meraj-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text());
      await call("backupImport", { section: "backups", data: parsed });
      showToast("بازیابی کامل انجام شد");
    } catch { showToast("فایل JSON پشتیبان معتبر نیست"); }
    setImporting(false);
  };
  return <div className="admin-section"><div className="admin-heading"><div><span className="eyebrow">SECTION 08 · WEEKLY HOST SYNC</span><h2>پشتیبانگیری خودکار هفتگی</h2><p>زمانبند ۷ روزه، ارسال JSON با توکن امنیتی، گزارش و بازیابی کامل.</p></div><CloudUpload size={30} /></div>
    <div className="admin-two-col"><div className="panel-card"><h3><KeyRound size={17} /> پیکربندی هاست</h3><div className="form-grid"><label className="wide"><span>آدرس Webhook هاست</span><input value={config.webhookUrl} onChange={(e) => setKey("backup", { ...config, webhookUrl: e.target.value })} placeholder="https://example.ir/server-scripts/host-backup-receiver.php" /></label><label><span>توکن امنیتی</span><input type="password" value={config.secretToken} onChange={(e) => setKey("backup", { ...config, secretToken: e.target.value })} /></label><label><span>بازه (روز)</span><input type="number" min={1} value={config.intervalDays} onChange={(e) => setKey("backup", { ...config, intervalDays: Number(e.target.value) })} /></label></div>
      <div className="gate-row"><Toggle checked={config.enabled} label="پشتیبانگیری فعال" onChange={(v) => setKey("backup", { ...config, enabled: v })} /><Toggle checked={config.autoPush} label="ارسال خودکار هفتگی" onChange={(v) => setKey("backup", { ...config, autoPush: v })} /></div>
      <div className="button-row"><button className="primary-button" onClick={async () => { await saveKeys("backups", ["backup"]); }}>ذخیره تنظیمات</button><button className="secondary-button" onClick={async () => { const result = await call("backupPush", { section: "backups" }, { refreshAfter: true }); showToast(result.status === "success" ? "پشتیبان به هاست ارسال شد" : "ارسال انجام نشد: تنظیمات هاست را بررسی کنید"); }}><Upload size={16} /> ارسال دستی</button></div>
      <div className="button-row"><button className="secondary-button" onClick={() => void exportJson()}><Download size={16} /> خروجی JSON</button><label className="file-button"><input type="file" accept="application/json" onChange={(e) => void importJson(e)} />{importing ? "در حال بازیابی…" : "بازیابی JSON"}</label></div>
      <div className="receiver-note"><ShieldCheck size={16} /><div><strong>گیرنده هاست</strong><code>server-scripts/host-backup-receiver.php</code><small>توکن را در متغیر محیطی <bdi>MERAJ_BACKUP_SECRET</bdi> هاست قرار دهید. فراخوانی اختیاری: <bdi>/api/cron/backup</bdi></small></div></div>
    </div><div className="panel-card"><h3>گزارش پشتیبانگیری</h3><div className="table-scroll"><table className="admin-table"><thead><tr><th>زمان</th><th>حالت</th><th>وضعیت</th><th>رکورد</th><th>پیام</th></tr></thead><tbody>{data.backupLogs.map((log) => <tr key={log.id}><td>{date(log.createdAt)}</td><td>{log.mode}</td><td><span className={`status-badge ${log.status}`}>{log.status}</span></td><td>{log.recordCount}</td><td className="log-message">{log.message}</td></tr>)}{!data.backupLogs.length && <tr><td colSpan={5}>هنوز گزارشی ثبت نشده است.</td></tr>}</tbody></table></div></div></div>
  </div>;
}
