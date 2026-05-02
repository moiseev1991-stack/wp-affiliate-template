// Site configuration — replaced wholesale by the scaffold-site skill per new site.
// Keep this shape stable; the skill writes new values, not new keys.

export interface SiteConfig {
  name: string
  tagline: string
  url: string
  description: string
  language: string

  // Money page (the single affiliate target the whole site funnels traffic toward).
  moneyPageUrl: string
  moneyPageAnchor: string
  moneyPageAnchorAlt?: string
  moneyPageBonus: string

  // Donor reference site — used only at scaffold time for niche/style cues. Never queried at runtime.
  donorSite?: string

  // Slugs of the 5 articles that contain money-page links.
  // First 3 of these become home-page featured slots (positions 1, 4, 7 of the 10-card grid).
  moneyArticleSlugs: readonly string[]

  // Visual identity seed — distinguishes one scaffolded site from another.
  // Drives lib/uniqueness.ts: menu preset, layout preset, emoji style, WP fingerprint.
  themeSeed?: string

  author: string

  // Day of month (1..28) on which the monthly auto-post fires.
  // Picked deterministically from themeSeed at scaffold time so each site has a
  // different posting day. Stored here so the daily cron can compare.
  monthlyPostDay: number
}

export const siteConfig: SiteConfig = {
  name: "WP Affiliate",
  tagline: "Editorial inspirations and guides",
  url: "https://example.com",
  description: "Editorial coverage of the niche for readers.",
  language: "en",

  moneyPageUrl: "https://example.com",
  moneyPageAnchor: "Brand",
  moneyPageAnchorAlt: "the operator",
  moneyPageBonus: "welcome bonus",

  donorSite: "",

  moneyArticleSlugs: [],

  themeSeed: "default",

  author: "Editorial team",

  monthlyPostDay: 17,
}
