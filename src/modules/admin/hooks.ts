"use client";

import { useState } from "react";
import { usePlatform } from "@/core/platform-context";
import type { SettingsMap } from "@/core/types";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function useSettingsDraft() {
  const { data, call, showToast } = usePlatform();
  const [state, setState] = useState<{ source: SettingsMap; draft: SettingsMap }>(() => ({
    source: data.settings,
    draft: clone(data.settings),
  }));
  const draft = state.source === data.settings ? state.draft : clone(data.settings);
  const setDraft = (updater: SettingsMap | ((current: SettingsMap) => SettingsMap)) => {
    setState((prev) => {
      const base = prev.source === data.settings ? prev.draft : clone(data.settings);
      const next = typeof updater === "function" ? updater(base) : updater;
      return { source: data.settings, draft: next };
    });
  };
  const setKey = (key: string, value: unknown) => setDraft((current) => ({ ...current, [key]: value }));
  const saveKeys = async (section: string, keys: string[]) => {
    const values: SettingsMap = {};
    for (const key of keys) values[key] = draft[key];
    await call("saveSettings", { section, values });
    showToast("تنظیمات ذخیره شد");
  };
  return { draft, setDraft, setKey, saveKeys, clone };
}
