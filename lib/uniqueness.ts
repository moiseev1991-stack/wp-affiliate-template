// Per-site uniqueness layer. Reads `siteConfig.themeSeed` and deterministically
// chooses layout/menu/emoji/WordPress fingerprint variants so two sites
// scaffolded from this template never look or fingerprint identically.
//
// Two sites with the same themeSeed are reproducible — same seed → same picks.

import { siteConfig } from '@/lib/config'

function seededInt(seed: string, salt: string): number {
  const s = `${seed}::${salt}`
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0
  return h >>> 0
}

function pickFrom<T>(arr: readonly T[], seed: string, salt: string): T {
  return arr[seededInt(seed, salt) % arr.length]
}

export type MenuPreset = {
  // Where the brand sits in the header bar.
  brandAlign: 'left' | 'center'
  // Where the nav links sit relative to brand.
  navAlign: 'left' | 'right' | 'center'
  // Whether categories appear as a dropdown or flat row.
  categoriesAs: 'dropdown' | 'flat' | 'sidebar'
  // Whether a search affordance is rendered.
  showSearch: boolean
  // Whether the header has a thin top tagbar above the main row.
  topBar: boolean
}

const MENU_PRESETS: readonly MenuPreset[] = [
  { brandAlign: 'left',   navAlign: 'right',  categoriesAs: 'dropdown', showSearch: true,  topBar: false },
  { brandAlign: 'left',   navAlign: 'right',  categoriesAs: 'flat',     showSearch: false, topBar: true  },
  { brandAlign: 'center', navAlign: 'center', categoriesAs: 'flat',     showSearch: true,  topBar: false },
  { brandAlign: 'left',   navAlign: 'left',   categoriesAs: 'dropdown', showSearch: false, topBar: false },
  { brandAlign: 'left',   navAlign: 'right',  categoriesAs: 'sidebar',  showSearch: true,  topBar: false },
]

export function getMenuPreset(): MenuPreset {
  const seed = siteConfig.themeSeed || 'default'
  return pickFrom(MENU_PRESETS, seed, 'menu')
}

export type LayoutPreset = {
  // Sidebar position on article pages. 'none' = full-width article.
  sidebar: 'right' | 'left' | 'none'
  // Order of home sections.
  homeOrder: 'categories-first' | 'latest-first'
  // Whether the home renders an extra "topics" tag cloud above the grid.
  homeTagCloud: boolean
  // Card grid columns at desktop.
  homeColumns: 2 | 3
}

const LAYOUT_PRESETS: readonly LayoutPreset[] = [
  { sidebar: 'right', homeOrder: 'categories-first', homeTagCloud: false, homeColumns: 3 },
  { sidebar: 'left',  homeOrder: 'latest-first',     homeTagCloud: true,  homeColumns: 3 },
  { sidebar: 'none',  homeOrder: 'categories-first', homeTagCloud: true,  homeColumns: 2 },
  { sidebar: 'right', homeOrder: 'latest-first',     homeTagCloud: false, homeColumns: 2 },
  { sidebar: 'left',  homeOrder: 'categories-first', homeTagCloud: false, homeColumns: 3 },
]

export function getLayoutPreset(): LayoutPreset {
  const seed = siteConfig.themeSeed || 'default'
  return pickFrom(LAYOUT_PRESETS, seed, 'layout')
}

export type EmojiStyle = 'plain' | 'circle' | 'badge' | 'bordered' | 'soft-shadow'

const EMOJI_STYLES: readonly EmojiStyle[] = ['plain', 'circle', 'badge', 'bordered', 'soft-shadow']

export function getEmojiStyle(): EmojiStyle {
  const seed = siteConfig.themeSeed || 'default'
  return pickFrom(EMOJI_STYLES, seed, 'emoji-style')
}

// CSS class snippet for wrapping an emoji, given the per-site style.
// Keeps the actual emoji glyph identical — only the visual treatment changes.
export function emojiWrapClass(style: EmojiStyle = getEmojiStyle()): string {
  switch (style) {
    case 'circle':
      return 'inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/25'
    case 'badge':
      return 'inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-section)] border border-[var(--border)] shadow-sm'
    case 'bordered':
      return 'inline-flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-[var(--accent)]/40'
    case 'soft-shadow':
      return 'inline-flex items-center justify-center w-9 h-9 drop-shadow-md'
    case 'plain':
    default:
      return 'inline-flex items-center justify-center'
  }
}

// WordPress fingerprint randomization. Picks a believable theme + version + plugin
// set per site so the HTML source doesn't tell automated tools "this site is from
// the same template as that other site".

export type WpFingerprint = {
  themeSlug: string                         // wp-content/themes/<slug>
  themeStylesheetVer: string                // ?ver= for theme style.css
  wpVersion: string                         // 6.x.y for <meta generator>
  bodyClasses: readonly string[]            // theme-specific body classes
  plugins: readonly { slug: string; ver: string }[]  // emitted as <link>/<script> tags
}

const WP_THEMES = [
  { slug: 'neve',             extraBodyClasses: ['neve-customer', 'header-layout-default'] },
  { slug: 'astra',            extraBodyClasses: ['astra-3-9-9', 'ast-blog-single-style-1'] },
  { slug: 'generatepress',    extraBodyClasses: ['generatepress', 'one-container'] },
  { slug: 'kadence',          extraBodyClasses: ['wp-custom-logo', 'kadence-elementor-colors'] },
  { slug: 'twentytwentyfour', extraBodyClasses: ['wp-singular', 'has-global-padding'] },
  { slug: 'oceanwp',          extraBodyClasses: ['oceanwp-theme', 'page-with-pagebuilder'] },
] as const

const WP_VERSIONS = ['6.3.5', '6.4.4', '6.5.5', '6.6.2', '6.7.1'] as const

const WP_PLUGIN_POOL = [
  { slug: 'wordpress-seo',           ver: '21.7' },     // Yoast
  { slug: 'contact-form-7',          ver: '5.9.5' },
  { slug: 'wpforms-lite',            ver: '1.8.7.2' },
  { slug: 'classic-editor',          ver: '1.6.4' },
  { slug: 'akismet',                 ver: '5.3' },
  { slug: 'jetpack',                 ver: '13.5' },
  { slug: 'wp-super-cache',          ver: '1.12.0' },
  { slug: 'all-in-one-seo-pack',     ver: '4.5.7' },
  { slug: 'litespeed-cache',         ver: '6.2.0.1' },
  { slug: 'autoptimize',             ver: '3.1.12' },
  { slug: 'wordfence',               ver: '7.11.6' },
  { slug: 'updraftplus',             ver: '1.23.16' },
] as const

export function getWpFingerprint(): WpFingerprint {
  const seed = siteConfig.themeSeed || siteConfig.url || 'default'

  const theme = WP_THEMES[seededInt(seed, 'wp-theme') % WP_THEMES.length]
  const wpVersion = WP_VERSIONS[seededInt(seed, 'wp-version') % WP_VERSIONS.length]

  // Pick 3-5 plugins, always include a SEO plugin in the pick for realism.
  const pluginCount = 3 + (seededInt(seed, 'wp-plugin-count') % 3)
  const shuffled = [...WP_PLUGIN_POOL].sort((a, b) => {
    const ah = seededInt(seed, `plugin-${a.slug}`)
    const bh = seededInt(seed, `plugin-${b.slug}`)
    return ah - bh
  })
  const plugins = shuffled.slice(0, pluginCount)

  const bodyClasses = ['wordpress', 'home', 'blog', 'logged-out', 'no-customize-support', ...theme.extraBodyClasses]

  return {
    themeSlug: theme.slug,
    themeStylesheetVer: wpVersion,
    wpVersion,
    bodyClasses,
    plugins,
  }
}

// Per-site CSS class prefix. Used in `wp-block-*` style tags so two sites have
// different surface-level class names. Real WordPress sites add a theme-specific
// prefix, so this fits the camouflage.
export function getCssPrefix(): string {
  const seed = siteConfig.themeSeed || 'default'
  return pickFrom(['nv', 'ast', 'gp', 'kt', 'ttf', 'ow'] as const, seed, 'css-prefix')
}
