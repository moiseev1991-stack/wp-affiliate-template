import type { Post } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { isMoneyArticleSlug } from '@/lib/money'

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

  out = linkifyMoneyAnchor(out)

  // For money articles, force the link to appear in the first paragraph.
  if (isMoneyArticleSlug(currentSlug)) {
    out = ensureMoneyLinkInFirstParagraph(out)
  }

  // Inject 5 internal links — find keyword matches from target titles in the body
  // and replace the first occurrence with a markdown link. Skip text already
  // inside markdown links.
  const targets = pickInternalTargets(currentSlug, all, 5)
  for (const t of targets) {
    out = injectKeywordLinkOnce(out, t)
  }

  return out
}

// Convert AT MOST ONE plain mention of the brand into a link to the money page.
//  - Skip mentions already inside an existing markdown link [text](url).
//  - Prefer the first **Brand** (bold) mention. If none, take the first plain mention.
//  - All subsequent mentions stay as plain text — exactly one outbound money link
//    per article, regardless of how many times the brand appears.
function linkifyMoneyAnchor(content: string): string {
  const url = siteConfig.moneyPageUrl
  const anchor = siteConfig.moneyPageAnchor
  if (!anchor) return content

  // Already linked anywhere? Then we're done — no further linkification.
  const linkedRe = new RegExp(`\\[[^\\]]*${escapeReg(anchor)}[^\\]]*\\]\\(${escapeReg(url)}\\)`)
  if (linkedRe.test(content)) return content

  const parts = content.split(/(\[[^\]]*\]\([^)]+\))/g)
  let replaced = false

  // Pass 1: try to upgrade the FIRST **Brand** to a linked **Brand**.
  for (let i = 0; i < parts.length && !replaced; i++) {
    if (i % 2 === 1) continue // existing link — skip
    const re = new RegExp(`\\*\\*${escapeReg(anchor)}\\*\\*`)
    const m = parts[i].match(re)
    if (m) {
      parts[i] = parts[i].replace(re, `[**${anchor}**](${url})`)
      replaced = true
    }
  }

  // Pass 2: if no bold form, link the first plain mention.
  if (!replaced) {
    for (let i = 0; i < parts.length && !replaced; i++) {
      if (i % 2 === 1) continue
      const re = new RegExp(`(^|[^\\[\\*\\w])${escapeReg(anchor)}(?![\\w\\]\\*])`)
      const m = parts[i].match(re)
      if (m) {
        parts[i] = parts[i].replace(re, `$1[${anchor}](${url})`)
        replaced = true
      }
    }
  }

  return parts.join('')
}

function ensureMoneyLinkInFirstParagraph(content: string): string {
  const url = siteConfig.moneyPageUrl
  const anchor = siteConfig.moneyPageAnchor
  if (!anchor) return content

  // Already exactly one outbound money link somewhere in the body? Done —
  // do not add another. Hard cap of 1 link per article.
  if (content.includes(`(${url})`)) return content

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
  // Append a sponsored link sentence to the first paragraph (only path that adds a link).
  const tail = ` See our full guide on [${anchor}](${url}).`
  lines[firstParaIdx] = lines[firstParaIdx].replace(/\s*$/, '') + tail
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
