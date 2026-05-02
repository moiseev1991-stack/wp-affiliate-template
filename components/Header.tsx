'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CATEGORIES } from '@/lib/categories'
import { siteConfig } from '@/lib/config'
import { getMenuPreset, emojiWrapClass, getEmojiStyle } from '@/lib/uniqueness'

const NAV_LABELS: Record<string, { home: string; categories: string; about: string; contact: string; search: string; tag: string }> = {
  pl: { home: 'Główna', categories: 'Kategorie', about: 'O nas', contact: 'Kontakt', search: 'Szukaj', tag: 'Edytorial' },
  en: { home: 'Home', categories: 'Categories', about: 'About', contact: 'Contact', search: 'Search', tag: 'Editorial' },
  de: { home: 'Startseite', categories: 'Kategorien', about: 'Über uns', contact: 'Kontakt', search: 'Suche', tag: 'Redaktion' },
  cs: { home: 'Domů', categories: 'Kategorie', about: 'O nás', contact: 'Kontakt', search: 'Hledat', tag: 'Redakce' },
  sk: { home: 'Domov', categories: 'Kategórie', about: 'O nás', contact: 'Kontakt', search: 'Hľadať', tag: 'Redakcia' },
  ru: { home: 'Главная', categories: 'Категории', about: 'О нас', contact: 'Контакты', search: 'Поиск', tag: 'Редакция' },
}

const ABOUT_SLUG: Record<string, string> = { pl: 'o-nas', en: 'about', de: 'ueber-uns', cs: 'o-nas', sk: 'o-nas', ru: 'o-nas' }
const CONTACT_SLUG: Record<string, string> = { pl: 'kontakt', en: 'contact', de: 'kontakt', cs: 'kontakt', sk: 'kontakt', ru: 'kontakty' }

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const lang = (siteConfig.language || 'en') as keyof typeof NAV_LABELS
  const labels = NAV_LABELS[lang] ?? NAV_LABELS.en
  const aboutSlug = ABOUT_SLUG[lang] ?? 'about'
  const contactSlug = CONTACT_SLUG[lang] ?? 'contact'

  const preset = getMenuPreset()
  const emojiStyle = getEmojiStyle()
  const emojiCls = emojiWrapClass(emojiStyle)

  const brand = siteConfig.name || 'Site'
  const split = Math.max(2, Math.ceil(brand.length / 2))
  const brandA = brand.slice(0, split)
  const brandB = brand.slice(split)

  const brandLink = (
    <Link href="/" className="text-2xl font-black font-heading tracking-tight text-[var(--accent)]">
      {brandA}<span className="text-[var(--accent-light)]">{brandB}</span>
    </Link>
  )

  const linkClass = 'text-sm font-medium px-4 py-2 rounded-lg transition-all text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-section)]'

  const homeLink = <Link href="/" className={linkClass}>{labels.home}</Link>
  const aboutLink = <Link href={`/${aboutSlug}/`} className={linkClass}>{labels.about}</Link>
  const contactLink = <Link href={`/${contactSlug}/`} className={linkClass}>{labels.contact}</Link>

  const categoriesDropdown = (
    <div
      className="relative"
      onMouseEnter={() => setCatOpen(true)}
      onMouseLeave={() => setCatOpen(false)}
    >
      <button
        type="button"
        className={`${linkClass} inline-flex items-center gap-1.5`}
        onClick={() => setCatOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={catOpen}
      >
        {labels.categories}
        <span className={`text-xs transition-transform ${catOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {catOpen && (
        <div className="absolute left-0 top-full pt-2 w-72 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl p-2 grid grid-cols-1 gap-0.5">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/kategoria/${cat.slug}/`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-section)] transition-colors group"
                onClick={() => setCatOpen(false)}
              >
                <span className={emojiCls + ' text-xl shrink-0'} role="img" aria-label={cat.label}>{cat.emoji}</span>
                <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const categoriesFlat = CATEGORIES.slice(0, 6).map(cat => (
    <Link key={cat.slug} href={`/kategoria/${cat.slug}/`} className={linkClass}>{cat.label}</Link>
  ))

  const categoriesLink = <Link href="/#categories" className={linkClass}>{labels.categories}</Link>

  let categoriesNode: React.ReactNode
  if (preset.categoriesAs === 'dropdown') categoriesNode = categoriesDropdown
  else if (preset.categoriesAs === 'flat') categoriesNode = <>{categoriesFlat}</>
  else categoriesNode = categoriesLink

  const searchAffordance = preset.showSearch ? (
    <form className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-section)] border border-[var(--border)]" role="search" method="get" action="/">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        name="s"
        className="bg-transparent text-sm focus:outline-none w-32 placeholder:text-[var(--text-muted)]"
        placeholder={labels.search}
        aria-label={labels.search}
      />
    </form>
  ) : null

  const navInner = (
    <nav className="hidden md:flex items-center gap-1 nav-menu primary-menu" role="navigation" aria-label="Primary">
      {homeLink}
      {categoriesNode}
      {aboutLink}
      {contactLink}
    </nav>
  )

  const justify = preset.brandAlign === 'center'
    ? 'justify-center'
    : preset.navAlign === 'left'
      ? 'justify-start gap-6'
      : 'justify-between'

  return (
    <header className="site-header sticky top-0 z-50 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm" role="banner">
      {preset.topBar && (
        <div className="border-b border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-7 flex items-center justify-between">
            <span>{labels.tag} · {siteConfig.language.toUpperCase()}</span>
            <span className="hidden sm:inline">{siteConfig.tagline}</span>
          </div>
        </div>
      )}

      <div className={`max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center ${justify}`}>
        {preset.brandAlign === 'center' ? (
          <div className="flex-1 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-3 flex-1">{searchAffordance}</div>
            <div className="flex-1 flex justify-center">{brandLink}</div>
            <div className="hidden md:flex items-center gap-1 flex-1 justify-end">
              {homeLink}{aboutLink}{contactLink}
            </div>
          </div>
        ) : preset.navAlign === 'left' ? (
          <>
            {brandLink}
            {navInner}
            <div className="ml-auto">{searchAffordance}</div>
          </>
        ) : (
          <>
            {brandLink}
            <div className="flex items-center gap-3">
              {navInner}
              {searchAffordance}
            </div>
          </>
        )}

        <button
          className="md:hidden p-2 rounded-lg transition-colors text-[var(--text)]"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <div className="w-5 space-y-1.5">
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {preset.categoriesAs === 'flat' && !preset.topBar && (
        <div className="hidden md:block border-t border-[var(--border)] bg-[var(--bg-section)]/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap gap-1">
            {categoriesFlat}
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="md:hidden bg-[var(--bg-card)] border-t border-[var(--border)] px-4 py-4 flex flex-col gap-1 nav-menu shadow-lg">
          {homeLink}
          {aboutLink}
          {contactLink}
          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <div className="px-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{labels.categories}</div>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/kategoria/${cat.slug}/`}
                className="flex items-center gap-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-section)] px-4 py-2.5 rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <span className={emojiCls} role="img" aria-label={cat.label}>{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
