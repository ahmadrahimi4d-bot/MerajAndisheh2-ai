import { ar } from "./ar";
import { en } from "./en";
import { fa } from "./fa";

export const dictionaries: Record<string, Record<string, string>> = { fa, ar, en };

export function translate(lang: string, key: string, customLabels?: Record<string, string>) {
  return customLabels?.[key] || dictionaries[lang]?.[key] || fa[key] || key;
}

export function formatDate(value: string | Date, lang: string, calendar: string) {
  try {
    const locale = lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-SA" : "en-US";
    const calendarKey = calendar === "persian" ? "persian" : calendar === "gregory" ? "gregory" : "islamic-umalqura";
    return new Intl.DateTimeFormat(`${locale}-u-ca-${calendarKey}`, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}
