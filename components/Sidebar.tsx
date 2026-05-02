import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { CATEGORIES, postsInCategory } from '@/lib/categories'
import { getEmojiStyle, emojiWrapClass } from '@/lib/uniqueness'

interface Props {
  recentPosts: Post[]
  allPosts?: Post[]
}

const SIDEBAR_I18N: Record<string, { recent: string; categories: string; about: string; more: string }> = {
  pl: { recent: 'Ostatnie artykuły', categories: 'Kategorie', about: 'O nas', more: 'Dowiedz się więcej' },
  en: { recent: 'Recent posts', categories: 'Categories', about: 'About', more: 'Read more' },
  de: { recent: 'Neueste Beiträge', categories: 'Kategorien', about: 'Über uns', more: 'Mehr erfahren' },
  cs: { recent: 'Nejnovější články', categories: 'Kategorie', about: 'O nás', more: 'Více informací' },
  sk: { recent: 'Najnovšie články', categories: 'Kategórie', about: 'O nás', more: 'Viac informácií' },
  ru: { recent: 'Свежие статьи', categories: 'Категории', about: 'О проекте', more: 'Подробнее' },
}

const ABOUT_SLUG: Record<string, string> = { pl: 'o-nas', en: 'about', de: 'ueber-uns', cs: 'o-nas', sk: 'o-nas', ru: 'o-nas' }

const LOCALES: Record<string, string> = { pl: 'pl-PL', en: 'en-US', de: 'de-DE', cs: 'cs-CZ', sk: 'sk-SK', ru: 'ru-RU' }

function formatDate(d: string, lang: string) {
  return new Date(d).toLocaleDateString(LOCALES[lang] ?? 'en-US', { day: 'numeric', month: 'short' })
}

export default function Sidebar({ recentPosts, allPosts }: Props) {
  const lang = (siteConfig.language || 'en') as keyof typeof SIDEBAR_I18N
  const t = SIDEBAR_I18N[lang] ?? SIDEBAR_I18N.en
  const aboutSlug = ABOUT_SLUG[lang] ?? 'about'
  const emojiCls = emojiWrapClass(getEmojiStyle())

  const categoriesWithCount = allPosts
    ? CATEGORIES.map(cat => ({ ...cat, count: postsInCategory(allPosts, cat.slug).length }))
    : CATEGORIES.map(cat => ({ ...cat, count: 0 }))

  return (
    <aside id="secondary" className="widget-area sidebar primary-sidebar flex flex-col gap-6">

      {/* Recent posts widget */}
      <section className="widget widget_recent_entries bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow)' }}>
        <div className="widget-title bg-[var(--accent-dark)] px-5 py-3.5">
          <h3 className="font-heading text-sm font-bold text-white">{t.recent}</h3>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {recentPosts.map(post => (
            <li key={post.slug} className="flex gap-3 items-start p-4 hover:bg-[var(--bg-section)] transition-colors">
              <span className={emojiCls + ' text-2xl mt-0.5 shrink-0'}>{post.emoji}</span>
              <div className="min-w-0">
                <Link href={`/${post.slug}/`} className="text-sm font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2 block">
                  {post.title}
                </Link>
                <time className="text-xs text-[var(--text-muted)] mt-0.5 block">{formatDate(post.date, lang)}</time>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories widget */}
      <section className="widget widget_categories bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow)' }}>
        <div className="widget-title mb-4 pb-2 border-b border-[var(--border)]">
          <h3 className="font-heading text-sm font-bold text-[var(--text)]">{t.categories}</h3>
        </div>
        <ul className="cat-list flex flex-col gap-1">
          {categoriesWithCount.map(cat => (
            <li key={cat.slug} className={`cat-item cat-item-${cat.slug}`}>
              <Link href={`/kategoria/${cat.slug}/`} className="flex justify-between items-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors py-1">
                <span className="flex items-center gap-2">
                  <span className={emojiCls + ' text-base'}>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </span>
                {cat.count > 0 && (
                  <span className="text-xs bg-[var(--bg-section)] px-2 py-0.5 rounded-full border border-[var(--border)]">{cat.count}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* About widget */}
      <section className="widget widget_text bg-[var(--bg-section)] rounded-2xl border border-[var(--border)] p-5 text-center" style={{ boxShadow: 'var(--shadow)' }}>
        <div className="widget-title mb-3">
          <h3 className="font-heading text-base font-bold text-[var(--text)]">{siteConfig.name}</h3>
        </div>
        <div className="textwidget widget-text">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
            {siteConfig.description}
          </p>
          <Link href={`/${aboutSlug}/`} className="text-xs text-[var(--accent)] font-semibold hover:underline">
            {t.more} →
          </Link>
        </div>
      </section>

    </aside>
  )
}
