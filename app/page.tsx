import Link from 'next/link'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { CATEGORIES, postsInCategory } from '@/lib/categories'
import { featuredHomeSlugs } from '@/lib/money'
import PostCard from '@/components/PostCard'
import type { Metadata } from 'next'

const homeTitle = `${siteConfig.name} — ${siteConfig.tagline}`
const homeDescription = siteConfig.description

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: siteConfig.url + '/' },
  openGraph: { title: homeTitle, description: homeDescription, url: siteConfig.url, type: 'website' },
}

export default function HomePage() {
  const allPosts = getAllPosts()
  const featuredSlugs = featuredHomeSlugs()
  const featuredPosts = featuredSlugs
    .map(s => getPostBySlug(s))
    .filter((p): p is NonNullable<typeof p> => p !== null)
  const restPosts = allPosts.filter(p => !featuredSlugs.includes(p.slug))

  // Home grid: exactly 10 cards. Slot 0 = first money article (the brand pin).
  // Remaining 2 money articles are interleaved at slots 3 and 6 so the home does
  // not start with a stack of money posts.
  const HOME_LIMIT = 10
  const [vFirst, ...vRest] = featuredPosts
  const fillers = restPosts.slice(0, HOME_LIMIT - 1 - vRest.length)
  const homeFeed: typeof allPosts = []
  if (vFirst) homeFeed.push(vFirst)
  const insertAt = [3, 6]
  const fillerIter = fillers[Symbol.iterator]()
  for (let i = 1; i < HOME_LIMIT; i++) {
    const vIdx = insertAt.indexOf(i)
    if (vIdx >= 0 && vRest[vIdx]) {
      homeFeed.push(vRest[vIdx])
    } else {
      const next = fillerIter.next()
      if (!next.done) homeFeed.push(next.value)
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    name: siteConfig.name, url: siteConfig.url, description: siteConfig.description, inLanguage: siteConfig.language,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── CATEGORIES ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
        <div className="mb-8">
          <span className="section-label">Categories</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text)] fancy-heading">
            Browse by topic
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => {
            const count = postsInCategory(allPosts, cat.slug).length
            return (
              <Link
                key={cat.slug}
                href={`/kategoria/${cat.slug}/`}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:bg-[var(--bg-section)] transition-all"
                style={{ boxShadow: 'var(--shadow)' }}
              >
                <span className="text-3xl shrink-0" role="img" aria-label={cat.label}>{cat.emoji}</span>
                <div className="min-w-0">
                  <div className="font-heading text-base font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">{cat.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{count} {count === 1 ? 'article' : 'articles'}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── LATEST + FEATURED ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <span className="section-label">Latest</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text)] fancy-heading">
            Reviews, bonuses and guides
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeFeed.map(post => {
            const moneyIdx = featuredSlugs.indexOf(post.slug)
            if (moneyIdx < 0) {
              return <PostCard key={post.slug} post={post} />
            }
            // For each money-featured slot, render the brand anchor as a link in the excerpt.
            const blurb = post.description.slice(0, 80).replace(/[\s,]+\S*$/, '') + '…'
            return (
              <PostCard
                key={post.slug}
                post={post}
                customExcerpt={
                  <>
                    {blurb}{' '}
                    <a
                      href={siteConfig.moneyPageUrl}
                      target="_blank"
                      rel="noopener nofollow sponsored"
                      className="text-[var(--accent)] font-semibold underline underline-offset-2 hover:text-[var(--accent-light)] transition-colors"
                    >
                      {siteConfig.moneyPageAnchor} →
                    </a>
                  </>
                }
              />
            )
          })}
        </div>
      </section>
    </>
  )
}
