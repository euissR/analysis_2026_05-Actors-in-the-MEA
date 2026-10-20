// chapters.js: the one place that knows which chapters exist, in what order,
// what they are called and where they live. Edit this file; nothing else
// needs to change when a chapter is added, reordered or moved.
//
// Where pages live:
//   dev  (localhost, github.io): files next to the current page, index_{chapter}_{region}.html
//   prod (Drupal):               PROD_ROOT/{region slug}/{chapter slug}

export const PROD_ROOT = "/publications/analysis/levers-influence";
export const TITLE = "Levers of influence";

const isDev =
  ["localhost", "127.0.0.1"].includes(location.hostname) ||
  location.hostname.endsWith("github.io");

// region code (data-region) -> name and Drupal slug
export const REGION_NAV = {
  AF: { name: "Africa", slug: "africa" },
  ME: { name: "Middle East and the Gulf", slug: "middle-east-gulf" },
};

// chapter id (data-chapter) -> card title, subtitle and Drupal slug
export const CHAPTERS = {
  dipl: {
    title: "Talking power",
    subtitle: "Diplomatic ties and political influence",
    slug: "diplomacy",
  },
  soft: {
    title: "Shaping perceptions",
    subtitle: "Cooperation, people and culture",
    slug: "soft-power",
  },
  trade: {
    title: "Shaping markets",
    subtitle: "Trade and commercial ties",
    slug: "trade",
  },
  invest: {
    title: "Financing influence",
    subtitle: "Investment, aid and debt",
    slug: "finance",
  },
  infra: {
    title: "Anchoring ties",
    subtitle: "Infrastructure and construction",
    slug: "infrastructure",
  },
  mil: {
    title: "Securing interests",
    subtitle: "Military engagement",
    slug: "military",
  },
};

// reading order per region = card order and numbering on the landing page.
// List only chapters that are live: anything missing here is hidden on the
// landing page and skipped by previous / next.
export const ORDER = {
  AF: ["dipl", "soft", "trade", "invest", "infra", "mil"],
  ME: ["dipl", "soft", "trade", "invest", "infra", "mil"],
};

// pages that are not chapters
export const PAGES = {
  landing: { title: "All chapters", dev: "index_landing.html", slug: "" },
  methodology: {
    title: "Methodological notes",
    dev: "index_methodology.html",
    slug: "/methodology",
  },
};

export function pageHref(key, hash = "") {
  const p = PAGES[key];
  return (isDev ? p.dev : PROD_ROOT + p.slug) + hash;
}

export function chapterHref(region, id) {
  return isDev
    ? `index_${id}_${region.toLowerCase()}.html`
    : `${PROD_ROOT}/${REGION_NAV[region].slug}/${CHAPTERS[id].slug}`;
}
