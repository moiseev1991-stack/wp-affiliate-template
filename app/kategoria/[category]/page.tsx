import { notFound } from 'next/navigation'
import { getAllPosts } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { CATEGORIES, CATEGORY_BY_SLUG, postsInCategory } from '@/lib/categories'
import PostCard from '@/components/PostCard'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { Metadata } from 'next'

interface Props {
  params: { category: string }
}

export async function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = CATEGORY_BY_SLUG[params.category]
  if (!cat) return {}
  const title = `${cat.label} — ${siteConfig.name}`
  return {
    title,
    description: cat.description,
    alternates: { canonical: `${siteConfig.url}/kategoria/${cat.slug}/` },
    openGraph: {
      title, description: cat.description,
      url: `${siteConfig.url}/kategoria/${cat.slug}/`,
      type: 'website',
    },
  }
}

const ARTICLES_LABEL: Record<string, (n: number) => string> = {
  pl: n => `${n} ${n === 1 ? 'artykuł' : n < 5 ? 'artykuły' : 'artykułów'}`,
  en: n => `${n} ${n === 1 ? 'article' : 'articles'}`,
  de: n => `${n} ${n === 1 ? 'Artikel' : 'Artikel'}`,
  cs: n => `${n} ${n === 1 ? 'článek' : n < 5 ? 'články' : 'článků'}`,
  sk: n => `${n} ${n === 1 ? 'článok' : n < 5 ? 'články' : 'článkov'}`,
}

export default function CategoryArchivePage({ params }: Props) {
  const cat = CATEGORY_BY_SLUG[params.category]
  if (!cat) notFound()

  const all = getAllPosts()
  const posts = postsInCategory(all, cat.slug)
  const lang = (siteConfig.language || 'en') as keyof typeof ARTICLES_LABEL
  const fmt = ARTICLES_LABEL[lang] ?? ARTICLES_LABEL.en

  return (
    <div className="archive category max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: cat.label }]} />

      <header className="page-header mb-10">
        <div className="text-5xl mb-3" role="img" aria-label={cat.label}>{cat.emoji}</div>
        <h1 className="page-title font-heading text-4xl font-bold text-[var(--text)] mb-3">
          {cat.label}
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-2xl">{cat.description}</p>
        <div className="text-sm text-[var(--text-muted)] mt-3">{fmt(posts.length)}</div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {posts.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
