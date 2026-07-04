export const SITE_URL = "https://www.runelogs.com";
export const SITE_NAME = "Runelogs";
export const DEFAULT_TITLE =
  "Runelogs - OSRS Combat Log Analysis & DPS Tracking";
export const DEFAULT_DESCRIPTION =
  "Runelogs is an OSRS combat log analyzer for the RuneLite Combat Logger plugin. Upload logs, view DPS breakdowns, fight replays, and leaderboards for Theatre of Blood, Tombs of Amascut, Inferno, and more.";
export const DEFAULT_KEYWORDS =
  "OSRS, Old School RuneScape, RuneLite, combat log, Combat Logger, DPS tracker, raid logs, Theatre of Blood, Tombs of Amascut, Inferno, Colosseum, leaderboards, fight replay";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;

export type PageMetaOptions = {
  title: string;
  description: string;
  /** Path and optional query string, e.g. `/about` or `/leaderboards?leaderboard=Theatre+of+Blood` */
  canonicalPath?: string;
  jsonLd?: object | object[];
  noIndex?: boolean;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let element = document.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

function setJsonLd(id: string, data: object | object[]) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function applyOpenGraphTags(
  title: string,
  description: string,
  canonicalUrl: string,
) {
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonicalUrl);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", DEFAULT_OG_IMAGE);
}

export function applyPageMeta({
  title,
  description,
  canonicalPath = "/",
  jsonLd,
  noIndex = false,
}: PageMetaOptions) {
  const canonicalUrl = `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  document.title = title;
  upsertMeta("name", "description", description);
  upsertLink("canonical", canonicalUrl);
  applyOpenGraphTags(title, description, canonicalUrl);

  if (noIndex) {
    upsertMeta("name", "robots", "noindex");
  } else {
    const robots = document.querySelector('meta[name="robots"]');
    robots?.remove();
  }

  const jsonLdId = "page-jsonld";
  if (jsonLd) {
    setJsonLd(jsonLdId, jsonLd);
  } else {
    document.getElementById(jsonLdId)?.remove();
  }

  document.documentElement.dataset.seoReady = "true";
}

export function resetPageMeta() {
  document.title = DEFAULT_TITLE;
  upsertMeta("name", "description", DEFAULT_DESCRIPTION);
  upsertLink("canonical", SITE_URL);
  applyOpenGraphTags(DEFAULT_TITLE, DEFAULT_DESCRIPTION, SITE_URL);
  document.querySelector('meta[name="robots"]')?.remove();
  document.getElementById("page-jsonld")?.remove();
  delete document.documentElement.dataset.seoReady;
}
