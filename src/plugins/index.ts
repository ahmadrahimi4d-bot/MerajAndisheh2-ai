import { PLUGIN_DEFINITIONS } from "@/config/registry";
import type { Bootstrap } from "@/core/types";

export { PLUGIN_DEFINITIONS };

export function isPluginEnabled(data: Bootstrap, key: string) {
  return data.plugins.find((p) => p.key === key)?.enabled ?? false;
}

export function pluginConfig<T>(data: Bootstrap, key: string, fallback: T): T {
  const config = data.plugins.find((p) => p.key === key)?.config;
  return config ? ({ ...fallback, ...config } as T) : fallback;
}

export interface PluginComponentProps {
  data: Bootstrap;
}
