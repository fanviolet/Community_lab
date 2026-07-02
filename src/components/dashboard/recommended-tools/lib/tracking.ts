import { recordToolImpression } from "../services/recommended-tools.service";

const SESSION_KEY = "recommendedToolsImpressions";

function getSessionSet(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveSessionSet(set: Set<string>) {
  if (typeof window === "undefined") return;
  const values = Array.from(set);
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(values));
}

export function hasTrackedImpression(slug: string) {
  return getSessionSet().has(slug);
}

export async function trackImpressionOnce(slug: string) {
  const impressions = getSessionSet();
  if (impressions.has(slug)) return;

  impressions.add(slug);
  saveSessionSet(impressions);

  await recordToolImpression(slug);
}

export function preloadLogo(url?: string | null) {
  if (!url || typeof window === "undefined") return;
  const image = new Image();
  image.src = url;
}
