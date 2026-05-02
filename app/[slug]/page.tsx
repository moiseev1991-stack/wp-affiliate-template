import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { CATEGORY_BY_SLUG, EMOJI_TO_CATEGORY } from '@/lib/categories'
import { pickMoneyTargetForSlug } from '@/lib/money'
import { processArticleBody } from '@/lib/internal-links'
import { getLayoutPreset } from '@/lib/uniqueness'
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
    alternates: { canonical: `${siteConfig.url}/${post.slug}/` },
    openGraph: {
      title: post.title, description: post.description,
      type: 'article', publishedTime: post.date,
      url: `${siteConfig.url}/${post.slug}/`,
    },
  }
}

const I18N: Record<string, { reading: string; alsoRead: string; comment: string; nameField: string; email: string; submit: string; commentNotes: string; required: string; cookieConsent: string; category: string; seeAlso: string; readArticle: string }> = {
  pl: { reading: 'min czytania', alsoRead: 'Czytaj również', comment: 'Komentarz', nameField: 'Imię', email: 'E-mail', submit: 'Opublikuj komentarz', commentNotes: 'Twój adres e-mail nie zostanie opublikowany.', required: 'Wymagane pola są oznaczone *', cookieConsent: 'Zapisz moje dane w tej przeglądarce podczas pisania kolejnych komentarzy.', category: 'Kategoria', seeAlso: 'Sprawdź też', readArticle: 'Czytaj artykuł' },
  en: { reading: 'min read', alsoRead: 'Read also', comment: 'Comment', nameField: 'Name', email: 'Email', submit: 'Post comment', commentNotes: 'Your email address will not be published.', required: 'Required fields are marked *', cookieConsent: 'Save my details in this browser for the next time I comment.', category: 'Category', seeAlso: 'See also', readArticle: 'Read article' },
  de: { reading: 'Min. Lesezeit', alsoRead: 'Auch lesen', comment: 'Kommentar', nameField: 'Name', email: 'E-Mail', submit: 'Kommentar absenden', commentNotes: 'Deine E-Mail-Adresse wird nicht veröffentlicht.', required: 'Erforderliche Felder sind markiert *', cookieConsent: 'Meine Daten in diesem Browser für den nächsten Kommentar speichern.', category: 'Kategorie', seeAlso: 'Siehe auch', readArticle: 'Artikel lesen' },
  cs: { reading: 'min čtení', alsoRead: 'Čtěte také', comment: 'Komentář', nameField: 'Jméno', email: 'E-mail', submit: 'Odeslat komentář', commentNotes: 'Vaše e-mailová adresa nebude zveřejněna.', required: 'Povinná pole jsou označena *', cookieConsent: 'Uložit moje údaje v tomto prohlížeči pro další komentář.', category: 'Kategorie', seeAlso: 'Viz také', readArticle: 'Číst článek' },
  sk: { reading: 'min čítania', alsoRead: 'Čítajte tiež', comment: 'Komentár', nameField: 'Meno', email: 'E-mail', submit: 'Odoslať komentár', commentNotes: 'Vaša e-mailová adresa nebude zverejnená.', required: 'Povinné polia sú označené *', cookieConsent: 'Uložiť moje údaje v tomto prehliadači pre ďalší komentár.', category: 'Kategória', seeAlso: 'Pozrite tiež', readArticle: 'Čítať článok' },
}
const LOCALES: Record<string, string> = { pl: 'pl-PL', en: 'en-US', de: 'de-DE', cs: 'cs-CZ', sk: 'sk-SK' }

function formatDate(d: string, lang: string) {
  return new Date(d).toLocaleDateString(LOCALES[lang] ?? 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
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
  '🎰': ['#1a0d05', '#6a0723'],
  '🪟': ['#1a0d05', '#8e1538'],
  '🪵': ['#231410', '#5c2c0b'],
  '🎨': ['#1c0d27', '#4a1968'],
  '🌿': ['#1a0d05', '#9c4a1a'],
  '💻': ['#0f0a1a', '#3d1d56'],
  '✨': ['#3d2106', '#a3781d'],
  '🍳': ['#231410', '#7c2d12'],
  '💡': ['#3d2106', '#8e6911'],
}

export default function PostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const sidebarPosts = allPosts.filter(p => p.slug !== post.slug).slice(0, 5)
  const mins = readingTime(post.content)
  const postId = slugToPostId(post.slug)
  const category = EMOJI_TO_CATEGORY[post.emoji] ?? 'guides'
  const categoryLabel = CATEGORY_BY_SLUG[category]?.label ?? 'Guides'

  const moneyTarget = pickMoneyTargetForSlug(post.slug, allPosts)
  const moneyTargetPost = moneyTarget ? getPostBySlug(moneyTarget) : null

  const [c1, c2] = GRADIENTS[post.emoji] ?? ['#1a0d05', '#6a0723']
  const lang = (siteConfig.language || 'en') as keyof typeof I18N
  const t = I18N[lang] ?? I18N.en
  const layout = getLayoutPreset()

  const processedContent = processArticleBody(post.content, post.slug, allPosts)

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: siteConfig.author },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    url: `${siteConfig.url}/${post.slug}/`,
    inLanguage: siteConfig.language,
  }

  const sidebarSide = layout.sidebar
  const wrapFlexDir = sidebarSide === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'
  const contentWidth = sidebarSide === 'none' ? 'lg:w-full' : 'lg:w-[65%]'
  const sidebarWidth = sidebarSide === 'none' ? 'hidden' : 'lg:w-[35%]'

  return (
    <div className="content-wrap entry-wrap max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: post.title }]} />

      <div className={`flex flex-col ${wrapFlexDir} gap-10`}>
        <div className={contentWidth}>
          <article
            id={`post-${postId}`}
            className={`post-${postId} post type-post status-publish format-standard hentry category-${category} has-post-thumbnail`}
          >
            <div
              className="post-thumbnail relative w-full rounded-2xl overflow-hidden mb-7 flex items-center justify-center"
              style={{ height: 280, background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
            >
              <img
                src={`/illustrations/${post.slug}.svg`}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
              <span className="wp-post-image relative text-[110px] select-none drop-shadow-2xl" role="img" aria-label={post.title}>{post.emoji}</span>
            </div>

            <header className="entry-header">
              <div className="entry-meta flex flex-wrap items-center gap-3 mb-3">
                <span className="posted-on">
                  <time className="entry-date published updated text-sm text-[var(--text-muted)]" dateTime={post.date}>{formatDate(post.date, lang)}</time>
                </span>
                <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                <span className="reading-time text-sm text-[var(--text-muted)]">{mins} {t.reading}</span>
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
              <MDXRemote
                source={processedContent}
                components={{
                  a: (props: any) => {
                    const isExternal = typeof props.href === 'string' && /^https?:\/\//i.test(props.href)
                    return isExternal
                      ? <a {...props} target="_blank" rel="noopener nofollow sponsored" />
                      : <a {...props} />
                  },
                }}
              />
            </div>

            <footer className="entry-footer mt-6 pt-4 border-t border-[var(--border)]">
              <span className="cat-links text-xs text-[var(--text-muted)]">
                {t.category}: <a href={`/kategoria/${category}/`} rel="category tag" className="text-[var(--accent)] hover:underline">{categoryLabel}</a>
              </span>
            </footer>
          </article>

          {moneyTargetPost && (
            <aside className="mt-8 p-6 rounded-2xl border-2 border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)]/10 via-[var(--bg-card)] to-transparent">
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0" role="img" aria-label={siteConfig.moneyPageAnchor}>{moneyTargetPost.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1.5">{t.seeAlso}</div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--text)] mb-2 leading-snug">{moneyTargetPost.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">{moneyTargetPost.description}</p>
                  <a
                    href={`/${moneyTargetPost.slug}/`}
                    className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    {t.readArticle} →
                  </a>
                </div>
              </div>
            </aside>
          )}

          <div className="mt-8 pt-8 border-t border-[var(--border)]">
            <h3 className="font-heading text-xl font-bold text-[var(--text)] mb-4">{t.alsoRead}</h3>
            <div className="flex flex-col gap-3">
              {allPosts.filter(p => p.slug !== post.slug).slice(0, 3).map(related => (
                <a key={related.slug} href={`/${related.slug}/`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-section)] transition-colors border border-[var(--border)] group">
                  <span className="text-2xl">{related.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">{related.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{readingTime(related.content)} {t.reading}</div>
                  </div>
                  <span className="ml-auto text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </a>
              ))}
            </div>
          </div>

          <div id="comments" className="comments-area mt-12">
            <div id="respond" className="comment-respond">
              <h3 id="reply-title" className="comment-reply-title font-heading text-xl font-bold text-[var(--text)] mb-6">
                {t.comment}
              </h3>
              <form action="#" method="post" id="commentform" className="comment-form flex flex-col gap-4">
                <p className="comment-notes text-sm text-[var(--text-muted)] mb-2">
                  {t.commentNotes} <span className="required-field-message">{t.required}</span>
                </p>
                <p className="comment-form-comment">
                  <label htmlFor="comment" className="block text-sm font-medium text-[var(--text)] mb-1">{t.comment} <span className="required" aria-hidden="true">*</span></label>
                  <textarea
                    id="comment" name="comment" cols={45} rows={5} maxLength={65525} required
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] resize-none bg-white"
                  />
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <p className="comment-form-author">
                    <label htmlFor="author" className="block text-sm font-medium text-[var(--text)] mb-1">{t.nameField} <span className="required" aria-hidden="true">*</span></label>
                    <input type="text" id="author" name="author" size={30} maxLength={245} required
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-white" />
                  </p>
                  <p className="comment-form-email">
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">{t.email} <span className="required" aria-hidden="true">*</span></label>
                    <input type="email" id="email" name="email" size={30} maxLength={100} required
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] bg-white" />
                  </p>
                </div>
                <p className="comment-form-cookies-consent flex items-center gap-2">
                  <input id="wp-comment-cookies-consent" name="wp-comment-cookies-consent" type="checkbox" value="yes" />
                  <label htmlFor="wp-comment-cookies-consent" className="text-xs text-[var(--text-muted)]">
                    {t.cookieConsent}
                  </label>
                </p>
                <p className="form-submit">
                  <input
                    name="submit" type="submit" id="submit" className="submit cursor-pointer bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
                    value={t.submit}
                  />
                  <input type="hidden" name="comment_post_ID" value={String(postId)} id="comment_post_ID" />
                  <input type="hidden" name="comment_parent" id="comment_parent" value="0" />
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className={`${sidebarWidth} sidebar-wrap`}>
          <div className="sticky top-20">
            <Sidebar recentPosts={sidebarPosts} allPosts={allPosts} />
          </div>
        </div>
      </div>
    </div>
  )
}
