import Link from 'next/link'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import PostCard from '@/components/PostCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog – Inspiracje i Porady',
  description: 'Artykuły o aranżacji wnętrz, trendach w designie i pomysłach na piękne polskie domy.',
  alternates: { canonical: `${siteConfig.url}/blog/` },
}

export default function BlogPage() {
  const featuredPost = getPostBySlug(siteConfig.featuredPostSlug)
  const otherPosts = getAllPosts().filter(p => p.slug !== siteConfig.featuredPostSlug)
  const posts = featuredPost ? [featuredPost, ...otherPosts] : getAllPosts()

  return (
    <div className="archive blog max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: 'Blog', href: '/blog/' }]} />

      <header className="page-header mb-10">
        <h1 className="page-title font-heading text-4xl font-bold text-[var(--text)]">
          Blog – Inspiracje i Porady
        </h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {posts.map(post => (
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

      <nav className="navigation pagination mt-10" aria-label="Posty">
        <div className="nav-links flex gap-2 justify-center">
          <span aria-current="page" className="page-numbers current bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-medium">1</span>
        </div>
      </nav>
    </div>
  )
}
