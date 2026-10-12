export type TrafficOrigin = {
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
  landingPage: string;
  capturedAt: string;
};

const STORAGE_KEY = "hivrasoft_traffic_source";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSource(value: string) {
  const source = clean(value).toLowerCase();

  if (["ig", "instagram", "instagram.com"].includes(source)) return "instagram";
  if (["fb", "facebook", "facebook.com", "meta"].includes(source)) return "facebook";
  if (["google", "googleads", "google_ads", "google-ads"].includes(source)) return "google";
  if (["yt", "youtube", "youtube.com"].includes(source)) return "youtube";
  if (["wa", "whatsapp", "whatsapp.com"].includes(source)) return "whatsapp";
  if (["direct", "none"].includes(source)) return "direct";

  return source || "direct";
}

function sourceFromReferrer(referrer: string) {
  if (!referrer) return "";

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();

    if (hostname.includes("instagram.com")) return "instagram";
    if (hostname.includes("facebook.com") || hostname.includes("fb.com")) return "facebook";
    if (hostname.includes("google.")) return "google";
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube";
    if (hostname.includes("whatsapp.com")) return "whatsapp";
    if (hostname.includes("bing.com")) return "bing";
    if (hostname.includes("duckduckgo.com")) return "duckduckgo";
    if (hostname.includes("t.co") || hostname.includes("twitter.com") || hostname.includes("x.com")) return "x";

    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function readStored(): TrafficOrigin | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<TrafficOrigin>;
    const capturedAt = clean(parsed.capturedAt);
    const capturedTime = capturedAt ? new Date(capturedAt).getTime() : Number.NaN;

    if (!Number.isFinite(capturedTime) || Date.now() - capturedTime > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      source: normalizeSource(clean(parsed.source)),
      medium: clean(parsed.medium),
      campaign: clean(parsed.campaign),
      referrer: clean(parsed.referrer),
      landingPage: clean(parsed.landingPage),
      capturedAt,
    };
  } catch {
    return null;
  }
}

function writeStored(origin: TrafficOrigin) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
  } catch {
    // Tracking must never block shopping or checkout if storage is unavailable.
  }
}

export function captureTrafficSource(): TrafficOrigin | null {
  if (typeof window === "undefined") return null;
  if (window.location.pathname.startsWith("/admin")) return readStored();

  const params = new URLSearchParams(window.location.search);
  const utmSource = clean(params.get("utm_source"));
  const utmMedium = clean(params.get("utm_medium"));
  const utmCampaign = clean(params.get("utm_campaign"));
  const hasGclid = Boolean(clean(params.get("gclid")));
  const hasFbclid = Boolean(clean(params.get("fbclid")));
  const rawReferrer = clean(document.referrer);
  let referrer = rawReferrer;

  try {
    if (referrer && new URL(referrer).origin === window.location.origin) {
      referrer = "";
    }
  } catch {
    // Keep malformed/non-standard referrers harmless; source detection will ignore them.
  }

  let detectedSource = utmSource;
  let detectedMedium = utmMedium;

  if (!detectedSource && hasGclid) {
    detectedSource = "google";
    detectedMedium ||= "cpc";
  }

  if (!detectedSource && hasFbclid) {
    detectedSource = "facebook";
    detectedMedium ||= "social";
  }

  if (!detectedSource) {
    detectedSource = sourceFromReferrer(referrer);
  }

  const explicitCampaignSource = Boolean(utmSource || hasGclid || hasFbclid);
  const existing = readStored();

  // A direct visit should not erase a useful campaign/referrer captured earlier.
  if (!detectedSource && existing) return existing;

  const next: TrafficOrigin = {
    source: normalizeSource(detectedSource || "direct"),
    medium: detectedMedium,
    campaign: utmCampaign,
    referrer,
    landingPage: window.location.href,
    capturedAt: new Date().toISOString(),
  };

  // Explicit campaign links are always the strongest signal. Otherwise keep a
  // non-direct source for up to 30 days instead of replacing it with direct.
  if (
    explicitCampaignSource ||
    !existing ||
    existing.source === "direct" ||
    next.source !== "direct"
  ) {
    writeStored(next);
    return next;
  }

  return existing;
}

export function getTrafficSourceForOrder(): TrafficOrigin {
  return (
    captureTrafficSource() ||
    readStored() || {
      source: "direct",
      medium: "",
      campaign: "",
      referrer: "",
      landingPage: "",
      capturedAt: new Date().toISOString(),
    }
  );
}
