import type { Post } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

// Slugs of articles that contain money-page links in body and excerpt.
// Set by the scaffold-site skill (5 articles total). The first 3 of these
// also become home-page featured slots (positions 1, 4, 7 in the 10-card grid).
export function moneyArticleSlugs(): readonly string[] {
  return siteConfig.moneyArticleSlugs ?? []
}

export function featuredHomeSlugs(): readonly string[] {
  return (siteConfig.moneyArticleSlugs ?? []).slice(0, 3)
}

export function isMoneyArticleSlug(slug: string): boolean {
  return moneyArticleSlugs().includes(slug)
}

// Round-robin selection of internal "see also" target across the money articles
// for non-money posts — gives equal inbound-link share to each money article.
export function pickMoneyTargetForSlug(slug: string, allPosts: Post[]): string | null {
  const money = moneyArticleSlugs()
  if (money.length === 0) return null
  if (isMoneyArticleSlug(slug)) return null
  const nonMoney = allPosts.map(p => p.slug).filter(s => !isMoneyArticleSlug(s)).sort()
  const idx = nonMoney.indexOf(slug)
  if (idx < 0) return null
  return money[idx % money.length]
}
