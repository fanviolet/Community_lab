/**
 * Server-safe translation utilities
 * This file has NO "use client" directive, so it can be used in Server Components.
 */

type TranslationDictionary = Record<string, any>;

// Initialize with default Vietnamese translations so server components
// can render translated strings before the client-side provider runs.
// This keeps behavior stable and is the smallest safe localization fix.
let currentDictionary: TranslationDictionary | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const vi = require("../messages/vi.json");
  if (vi) {
    currentDictionary = vi as TranslationDictionary;
  }
} catch (err) {
  // If loading fails, leave dictionary null — client will set it later.
}

export function setTranslationDictionary(dictionary: TranslationDictionary) {
  currentDictionary = dictionary;
}

export function getTranslationDictionary(): TranslationDictionary | null {
  return currentDictionary;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

function interpolate(template: string, values: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
}

export function t(key: string, values?: Record<string, any>): string {
  if (!currentDictionary) {
    return key;
  }

  const value = getNestedValue(currentDictionary, key);

  if (value === undefined) {
    if (
      typeof process !== "undefined" &&
      process.env?.NODE_ENV === "development"
    ) {
      console.warn(`Translation key not found: ${key}`);
    }
    return key;
  }

  if (typeof value === "string") {
    return values ? interpolate(value, values) : value;
  }

  return key;
}
