import type { Post } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { isMoneyArticleSlug } from '@/lib/money'

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

  out = linkifyMoneyInFirstParagraph(out)

  // Inject 5 internal links — find keyword matches from target titles in the body
  // and replace the first occurrence with a markdown link. Skip text already
  // inside markdown links.
  const targets = pickInternalTargets(currentSlug, all, 5)
  for (const t of targets) {
    out = injectKeywordLinkOnce(out, t)
  }

  return out
}

// Hard rule: AT MOST ONE outbound money link per article body, and that link
// MUST live in the first paragraph (above the fold). Algorithm:
//  1. Strip every existing markdown link to siteConfig.moneyPageUrl — turn
//     each back into plain or bold brand text. Generation may have placed
//     extra links in editor's-pick sections; we wipe them so the only
//     remaining link is the one we add to the first paragraph.
//  2. Find first paragraph (first non-empty, non-heading line block).
//  3. Inside that paragraph, link the first **Brand** (bold) mention, or
//     fall back to the first plain mention.
//  4. If the first paragraph has no mention but body does, append a localized
//     lead-out sentence with the link.
//  5. If body has no brand mention at all, leave content untouched.
function linkifyMoneyInFirstParagraph(content: string): string {
  const url = siteConfig.moneyPageUrl
  const anchor = siteConfig.moneyPageAnchor
  if (!anchor) return content

  // Strip every existing money-URL link first.
  const escUrl = escapeReg(url)
  let stripped = content
    .replace(new RegExp(`\\[\\*\\*([^\\]]*)\\*\\*\\]\\(${escUrl}\\)`, 'g'), '**$1**')
    .replace(new RegExp(`\\[([^\\]]*)\\]\\(${escUrl}\\)`, 'g'), '$1')
  content = stripped

  const anchorRe = new RegExp(escapeReg(anchor))
  if (!anchorRe.test(content)) return content

  const lines = content.split('\n')
  let firstParaIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim()
    if (!ln) continue
    if (ln.startsWith('#') || ln.startsWith('---')) continue
    firstParaIdx = i
    break
  }
  if (firstParaIdx < 0) return content

  let para = lines[firstParaIdx]
  const boldRe = new RegExp(`\\*\\*${escapeReg(anchor)}\\*\\*`)
  const plainRe = new RegExp(`(^|[^\\[\\*\\w])${escapeReg(anchor)}(?![\\w\\]\\*])`)

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
  return lines.join('\n')
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
