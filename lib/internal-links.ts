import type { Post } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { isMoneyArticleSlug, featuredHomeSlugs } from '@/lib/money'

const FALLBACK_LEAD: Record<string, (anchor: string, url: string) => string> = {
  pl: (a, u) => ` Sprawdź pełną recenzję na [${a}](${u}).`,
  en: (a, u) => ` See our full guide on [${a}](${u}).`,
  de: (a, u) => ` Mehr in unserem [${a}](${u})-Test.`,
  cs: (a, u) => ` Více v naší recenzi [${a}](${u}).`,
  sk: (a, u) => ` Viac v našej recenzii [${a}](${u}).`,
}

function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Pick 5 deterministic-but-varied internal link targets for the given post.
// Excludes the post itself; rotates across the corpus by hash so each article
// gets a different mix; biased toward money articles (1 of 5 slots) so SEO
// juice flows to commercial pages.
export function pickInternalTargets(currentSlug: string, all: Post[], count = 5): Post[] {
  const candidates = all.filter(p => p.slug !== currentSlug)
  if (candidates.length === 0) return []
  const sorted = [...candidates].sort((a, b) => a.slug.localeCompare(b.slug))
  const seed = slugHash(currentSlug)
  const picks: Post[] = []
  const used = new Set<string>()

  // Slot 0: a money article (deterministic round-robin)
  const money = sorted.filter(p => isMoneyArticleSlug(p.slug))
  if (money.length > 0) {
    const m = money[seed % money.length]
    picks.push(m)
    used.add(m.slug)
  }

  // Remaining slots: spread across the corpus
  const stride = Math.max(1, Math.floor(sorted.length / count))
  for (let i = 0; picks.length < count && i < sorted.length * 2; i++) {
    const idx = (seed + i * stride + 7 * i) % sorted.length
    const p = sorted[idx]
    if (used.has(p.slug)) continue
    picks.push(p)
    used.add(p.slug)
  }
  return picks.slice(0, count)
}

// Pre-process MDX body before render:
//  - For money articles: ensure the brand anchor in the FIRST paragraph
//    becomes a link to siteConfig.moneyPageUrl (above the fold).
//  - Linkify any remaining standalone brand mentions (not already inside
//    [text](url) markdown links).
//  - Inject N internal links by replacing N matching keyword occurrences
//    in section bodies with links to other posts on this site.
export function processArticleBody(content: string, currentSlug: string, all: Post[]): string {
  let out = content

  // Money links live ONLY on the 3 home-featured posts (one per page,
  // first paragraph). Every other article: strip all money links and
  // strip the bold formatting on the brand so it reads as plain text.
  const isFeaturedMoney = (featuredHomeSlugs() as readonly string[]).includes(currentSlug)
  out = enforceMoneyLinkPolicy(out, isFeaturedMoney)

  // Inject 5 internal links — find keyword matches from target titles in the body
  // and replace the first occurrence with a markdown link. Skip text already
  // inside markdown links.
  const targets = pickInternalTargets(currentSlug, all, 5)
  for (const t of targets) {
    out = injectKeywordLinkOnce(out, t)
  }

  return out
}

// Money-link policy:
//  - On a featured money post (1 of the 3 home-featured slugs): place exactly
//    one link to the money page in the first paragraph (above the fold). Strip
//    bold formatting on every other brand mention in the body.
//  - On any other article: strip every existing money link AND strip the bold
//    formatting on plain brand mentions. The brand reads as plain prose, never
//    bold-without-link.
function enforceMoneyLinkPolicy(content: string, isFeaturedMoney: boolean): string {
  const url = siteConfig.moneyPageUrl
  const anchor = siteConfig.moneyPageAnchor
  if (!anchor) return content

  const escUrl = escapeReg(url)
  const escAnchor = escapeReg(anchor)

  // Always remove every existing markdown link to the money URL.
  let out = content
    .replace(new RegExp(`\\[\\*\\*([^\\]]*)\\*\\*\\]\\(${escUrl}\\)`, 'g'), '**$1**')
    .replace(new RegExp(`\\[([^\\]]*)\\]\\(${escUrl}\\)`, 'g'), '$1')

  if (!isFeaturedMoney) {
    // Strip bold on every brand mention so it reads as plain prose.
    out = out.replace(new RegExp(`\\*\\*${escAnchor}\\*\\*`, 'g'), anchor)
    return out
  }

  // Featured money post: place exactly one link in the first paragraph.
  const anchorRe = new RegExp(escAnchor)
  if (!anchorRe.test(out)) return out

  const lines = out.split('\n')
  let firstParaIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim()
    if (!ln) continue
    if (ln.startsWith('#') || ln.startsWith('---')) continue
    firstParaIdx = i
    break
  }
  if (firstParaIdx < 0) return out

  let para = lines[firstParaIdx]
  const boldRe = new RegExp(`\\*\\*${escAnchor}\\*\\*`)
  const plainRe = new RegExp(`(^|[^\\[\\*\\w])${escAnchor}(?![\\w\\]\\*])`)

  if (boldRe.test(para)) {
    para = para.replace(boldRe, `[**${anchor}**](${url})`)
  } else if (plainRe.test(para)) {
    para = para.replace(plainRe, `$1[${anchor}](${url})`)
  } else {
    const lang = (siteConfig.language || 'en') as keyof typeof FALLBACK_LEAD
    const lead = (FALLBACK_LEAD[lang] ?? FALLBACK_LEAD.en)(anchor, url)
    para = para.replace(/\s*$/, '') + lead
  }
  lines[firstParaIdx] = para

  // Strip bold from any remaining standalone brand mentions in the body so the
  // page has exactly one styled mention — the link in the first paragraph.
  return lines.join('\n').replace(new RegExp(`\\*\\*${escAnchor}\\*\\*`, 'g'), anchor)
}

function injectKeywordLinkOnce(content: string, target: { slug: string; title: string }): string {
  // Build a 2-3 word keyword from the target title, take the longest meaningful chunk.
  const keyword = pickKeyword(target.title)
  if (!keyword) return content
  const url = `/${target.slug}/`
  const parts = content.split(/(\[[^\]]*\]\([^)]+\))|(```[\s\S]*?```)/g).filter(p => p !== undefined)
  let injected = false
  return parts
    .map(part => {
      if (injected) return part
      if (!part) return part
      if (part.startsWith('[') || part.startsWith('```')) return part
      const re = new RegExp(`(^|[^\\[\\*\\w])(${escapeReg(keyword)})(?![\\w\\]])`, 'i')
      const m = part.match(re)
      if (!m) return part
      injected = true
      return part.replace(re, `$1[$2](${url})`)
    })
    .join('')
}

function pickKeyword(title: string): string {
  // Strip leading numbers, em dashes, bracket parts; pick the first 2-3 word noun phrase.
  const cleaned = title
    .replace(/^[\d\.\s—\-]+/, '')
    .replace(/[—\-\(\):,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = cleaned.split(' ').filter(w => w.length >= 4)
  if (words.length === 0) return ''
  return words.slice(0, Math.min(3, words.length)).join(' ')
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
