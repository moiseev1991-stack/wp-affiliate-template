import Link from 'next/link'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import PostCard from '@/components/PostCard'
import type { Metadata } from 'next'


const homeTitle = 'Vulkan Vegas – Najlepsze Kasyno Online dla Polskich Graczy 2026'
const homeDescription = 'Vulkan Vegas to lider wśród kasyn online dla polskich graczy – licencja MGA, bonus powitalny do 4000 PLN, błyskawiczne wypłaty BLIK i tysiące gier od topowych dostawców.'

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: siteConfig.url + '/' },
  openGraph: { title: homeTitle, description: homeDescription, url: siteConfig.url, type: 'website' },
}

export default function HomePage() {
  const allPosts = getAllPosts()
  const featuredPost = getPostBySlug(siteConfig.featuredPostSlug)
  const otherPosts = allPosts.filter(p => p.slug !== siteConfig.featuredPostSlug).slice(0, 5)
  const latestPosts = featuredPost ? [featuredPost, ...otherPosts] : allPosts.slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    name: siteConfig.name, url: siteConfig.url, description: siteConfig.description, inLanguage: 'pl',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />


      {/* ── LATEST ARTICLES ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="section-label">Najnowsze</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--text)] fancy-heading">
              Artykuły i inspiracje
            </h2>
          </div>
          <Link href="/blog/" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[var(--accent)] font-semibold hover:gap-3 transition-all">
            Wszystkie artykuły <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestPosts.map(post => (
            <PostCard
              key={post.slug}
              post={post}
              customExcerpt={post.slug === siteConfig.featuredPostSlug ? (
                <>
                  Sprawdź najlepsze kasyna dla polskich graczy.{' '}
                  <a href={siteConfig.moneyPageUrl} target="_blank" rel="noopener" className="text-[var(--accent)] font-semibold underline underline-offset-2 hover:text-[var(--accent-dark)] transition-colors">
                    {siteConfig.moneyPageAnchor}
                  </a>
                  {' '}– {siteConfig.moneyPageBonus} i błyskawiczne wypłaty.
                </>
              ) : undefined}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Link href="/blog/" className="text-sm text-[var(--accent)] font-semibold border border-[var(--accent)] px-6 py-2.5 rounded-xl hover:bg-[var(--accent)] hover:text-white transition-colors">
            Wszystkie artykuły →
          </Link>
        </div>
      </section>

      {/* ── DECORATIVE DIVIDER ───────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-[var(--bg-section)] rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-[var(--border)]">
          <div className="absolute inset-0 opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="diamonds" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <polygon points="15,0 30,15 15,30 0,15" fill="none" stroke="currentColor" strokeWidth="0.8"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diamonds)" className="text-[var(--accent)]" />
            </svg>
          </div>
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="text-5xl mb-4">🛋️</div>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text)] mb-3">
              Stwórz wnętrze swoich marzeń
            </h3>
            <p className="text-[var(--text-muted)] mb-6">
              Odkryj nasze poradniki o stylach, kolorach i aranżacji — od minimalizmu po skandynawski chic.
            </p>
            <Link href="/blog/" className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-bold px-7 py-3.5 rounded-xl transition-colors">
              Odkryj wszystkie artykuły →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
