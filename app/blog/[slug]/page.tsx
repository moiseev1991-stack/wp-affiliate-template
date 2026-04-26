import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import Breadcrumbs from '@/components/Breadcrumbs'
import Sidebar from '@/components/Sidebar'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${siteConfig.url}/blog/${post.slug}/` },
    openGraph: {
      title: post.title, description: post.description,
      type: 'article', publishedTime: post.date,
      url: `${siteConfig.url}/blog/${post.slug}/`,
    },
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
}

function slugToPostId(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return (h % 9000) + 1000
}

const GRADIENTS: Record<string, [string, string]> = {
  '🎰': ['#1b4332', '#2d6a4f'],
  '🪟': ['#1e3a5f', '#2563eb'],
  '🪵': ['#451a03', '#92400e'],
  '🎨': ['#4a1d96', '#7c3aed'],
  '🌿': ['#134e4a', '#0d9488'],
  '💻': ['#1e293b', '#334155'],
  '✨': ['#365314', '#65a30d'],
  '🍳': ['#7c2d12', '#c2410c'],
  '💡': ['#713f12', '#d97706'],
}

const EMOJI_TO_CATEGORY: Record<string, string> = {
  '🎰': 'kasyna', '🪟': 'minimalizm', '🪵': 'skandynawski', '🎨': 'trendy',
  '🌿': 'rosliny', '💻': 'home-office', '✨': 'porady', '🍳': 'kuchnia', '💡': 'oswietlenie',
}

const EMOJI_TO_LABEL: Record<string, string> = {
  '🎰': 'Kasyna', '🪟': 'Minimalizm', '🪵': 'Skandynawski', '🎨': 'Trendy',
  '🌿': 'Rośliny', '💻': 'Home Office', '✨': 'Porady', '🍳': 'Kuchnia', '💡': 'Oświetlenie',
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const sidebarPosts = allPosts.filter(p => p.slug !== post.slug).slice(0, 5)
  const mins = readingTime(post.content)
  const postId = slugToPostId(post.slug)
  const category = EMOJI_TO_CATEGORY[post.emoji] ?? 'design'
  const categoryLabel = EMOJI_TO_LABEL[post.emoji] ?? 'Design'

  const [c1, c2] = GRADIENTS[post.emoji] ?? ['#1b4332', '#2d6a4f']

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: siteConfig.author },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    url: `${siteConfig.url}/blog/${post.slug}/`,
    inLanguage: 'pl',
  }

  return (
    <div className="nv-content-wrap max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: 'Blog', href: '/blog/' }, { label: post.title }]} />

      <div className="flex flex-col lg:flex-row gap-10">

        <div className="lg:w-[65%]">
          <article
            id={`post-${postId}`}
            className={`post-${postId} post type-post status-publish format-standard hentry category-${category} has-post-thumbnail`}
          >
            {/* Featured image */}
            <div
              className="post-thumbnail relative w-full rounded-2xl overflow-hidden mb-7 flex items-center justify-center"
              style={{ height: 280, background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
            >
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="art-dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="15" r="1" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#art-dots)"/>
              </svg>
              <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
              <span className="wp-post-image relative text-[110px] select-none drop-shadow-2xl" role="img" aria-label={post.title}>{post.emoji}</span>
            </div>

            <header className="entry-header">
              <div className="entry-meta flex flex-wrap items-center gap-3 mb-3">
                <span className="posted-on">
                  <time className="entry-date published updated text-sm text-[var(--text-muted)]" dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                <span className="reading-time text-sm text-[var(--text-muted)]">{mins} min czytania</span>
                <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                <span className="byline vcard">
                  <span className="author fn n text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-0.5 rounded-full">{siteConfig.author}</span>
                </span>
              </div>

              <h1 className="entry-title font-heading text-3xl sm:text-4xl font-bold text-[var(--text)] leading-tight mb-6">
                {post.title}
              </h1>
            </header>

            <div className="entry-content prose prose-lg max-w-none prose-headings:font-heading prose-a:text-[var(--accent)] wp-block-post-content">
              <MDXRemote source={post.content} />
            </div>

            <footer className="entry-footer mt-6 pt-4 border-t border-[var(--border)]">
              <span className="cat-links text-xs text-[var(--text-muted)]">
                Kategoria: <a href="/blog/" rel="category tag" className="text-[var(--accent)] hover:underline">{categoryLabel}</a>
              </span>
            </footer>
          </article>

          {/* Related articles */}
          <div className="mt-8 pt-8 border-t border-[var(--border)]">
            <h3 className="font-heading text-xl font-bold text-[var(--text)] mb-4">Czytaj również</h3>
            <div className="flex flex-col gap-3">
              {allPosts.filter(p => p.slug !== post.slug).slice(0, 3).map(related => (
                <a key={related.slug} href={`/blog/${related.slug}/`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-section)] transition-colors border border-[var(--border)] group">
                  <span className="text-2xl">{related.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">{related.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{readingTime(related.content)} min czytania</div>
                  </div>
                  <span className="ml-auto text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Comments section */}
          <div id="comments" className="comments-area mt-12">
            <div id="respond" className="comment-respond">
              <h3 id="reply-title" className="comment-reply-title font-heading text-xl font-bold text-[var(--text)] mb-6">
                Zostaw komentarz
              </h3>
              <form action="#" method="post" id="commentform" className="comment-form flex flex-col gap-4">
                <p className="comment-notes text-sm text-[var(--text-muted)] mb-2">
                  Twój adres e-mail nie zostanie opublikowany. <span className="required-field-message">Wymagane pola są oznaczone <span className="required" aria-hidden="true">*</span></span>
                </p>
                <p className="comment-form-comment">
                  <label htmlFor="comment" className="block text-sm font-medium text-[var(--text)] mb-1">Komentarz <span className="required" aria-hidden="true">*</span></label>
                  <textarea
                    id="comment" name="comment" cols={45} rows={5} maxLength={65525} required
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] resize-none bg-white"
                  />
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <p className="comment-form-author">
                    <label htmlFor="author" className="block text-sm font-medium text-[var(--text)] mb-1">Imię <span className="required" aria-hidden="true">*</span></label>
                    <input type="text" id="author" name="author" size={30} maxLength={245} required
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-white" />
                  </p>
                  <p className="comment-form-email">
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">E-mail <span className="required" aria-hidden="true">*</span></label>
                    <input type="email" id="email" name="email" size={30} maxLength={100} required
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-white" />
                  </p>
                </div>
                <p className="comment-form-cookies-consent flex items-center gap-2">
                  <input id="wp-comment-cookies-consent" name="wp-comment-cookies-consent" type="checkbox" value="yes" />
                  <label htmlFor="wp-comment-cookies-consent" className="text-xs text-[var(--text-muted)]">
                    Zapisz moje dane w tej przeglądarce podczas pisania kolejnych komentarzy.
                  </label>
                </p>
                <p className="form-submit">
                  <input
                    name="submit" type="submit" id="submit" className="submit cursor-pointer bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
                    value="Opublikuj komentarz"
                  />
                  <input type="hidden" name="comment_post_ID" value={String(postId)} id="comment_post_ID" />
                  <input type="hidden" name="comment_parent" id="comment_parent" value="0" />
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:w-[35%] nv-sidebar-wrap">
          <div className="sticky top-20">
            <Sidebar recentPosts={sidebarPosts} />
          </div>
        </div>
      </div>
    </div>
  )
}
