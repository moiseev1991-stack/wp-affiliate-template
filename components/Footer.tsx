import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { CATEGORIES } from '@/lib/categories'
import { getCssPrefix, getMenuPreset } from '@/lib/uniqueness'

const FOOTER_I18N: Record<string, { nav: string; topics: string; rights: string; login: string; navLabels: { about: string; contact: string; privacy: string }; disclaimer: string }> = {
  pl: { nav: 'Nawigacja', topics: 'Tematy', rights: 'Wszelkie prawa zastrzeżone', login: 'Zaloguj się', navLabels: { about: 'O nas', contact: 'Kontakt', privacy: 'Polityka prywatności' }, disclaimer: 'Treści edytorialne — sprawdzaj szczegóły u źródła.' },
  en: { nav: 'Navigation', topics: 'Topics', rights: 'All rights reserved', login: 'Log in', navLabels: { about: 'About', contact: 'Contact', privacy: 'Privacy Policy' }, disclaimer: 'Editorial content — verify details with the source.' },
  de: { nav: 'Navigation', topics: 'Themen', rights: 'Alle Rechte vorbehalten', login: 'Anmelden', navLabels: { about: 'Über uns', contact: 'Kontakt', privacy: 'Datenschutz' }, disclaimer: 'Redaktionelle Inhalte — Details bei der Quelle prüfen.' },
  cs: { nav: 'Navigace', topics: 'Témata', rights: 'Všechna práva vyhrazena', login: 'Přihlásit se', navLabels: { about: 'O nás', contact: 'Kontakt', privacy: 'Ochrana osobních údajů' }, disclaimer: 'Redakční obsah — ověřte podrobnosti u zdroje.' },
  sk: { nav: 'Navigácia', topics: 'Témy', rights: 'Všetky práva vyhradené', login: 'Prihlásiť sa', navLabels: { about: 'O nás', contact: 'Kontakt', privacy: 'Ochrana osobných údajov' }, disclaimer: 'Redakčný obsah — overte podrobnosti pri zdroji.' },
  ru: { nav: 'Навигация', topics: 'Темы', rights: 'Все права защищены', login: 'Войти', navLabels: { about: 'О нас', contact: 'Контакты', privacy: 'Политика конфиденциальности' }, disclaimer: 'Редакционный контент — уточняйте детали у первоисточника.' },
}

const ABOUT_SLUG: Record<string, string> = { pl: 'o-nas', en: 'about', de: 'ueber-uns', cs: 'o-nas', sk: 'o-nas', ru: 'o-nas' }
const CONTACT_SLUG: Record<string, string> = { pl: 'kontakt', en: 'contact', de: 'kontakt', cs: 'kontakt', sk: 'kontakt', ru: 'kontakty' }
const PRIVACY_SLUG: Record<string, string> = { pl: 'polityka-prywatnosci', en: 'privacy-policy', de: 'datenschutz', cs: 'ochrana-osobnich-udaju', sk: 'ochrana-osobnych-udajov', ru: 'politika-konfidencialnosti' }

export default function Footer() {
  const year = new Date().getFullYear()
  const lang = (siteConfig.language || 'en') as keyof typeof FOOTER_I18N
  const t = FOOTER_I18N[lang] ?? FOOTER_I18N.en
  const aboutSlug = ABOUT_SLUG[lang] ?? 'about'
  const contactSlug = CONTACT_SLUG[lang] ?? 'contact'
  const privacySlug = PRIVACY_SLUG[lang] ?? 'privacy-policy'
  const cssPrefix = getCssPrefix()
  const preset = getMenuPreset()

  return (
    <footer
      id="colophon"
      className={`site-footer ${cssPrefix}-footer mt-8`}
      style={{ background: `linear-gradient(160deg, var(--bg) 0%, var(--bg-section) 100%)` }}
      role="contentinfo"
    >
      <div className="-mt-1">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d="M0 0C240 50 480 60 720 40C960 20 1200 55 1440 30L1440 60L0 60Z" fill="var(--bg)"/>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className={`grid grid-cols-1 ${preset.brandAlign === 'center' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-10`}>
          <div className="sm:col-span-1">
            <div className="text-2xl font-bold font-heading text-[var(--accent-light)] mb-3">{siteConfig.name}</div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{siteConfig.tagline}</p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">{t.nav}</div>
            <nav className="flex flex-col gap-2.5" aria-label="Footer navigation">
              {[
                { label: t.navLabels.about, href: `/${aboutSlug}/` },
                { label: t.navLabels.contact, href: `/${contactSlug}/` },
                { label: t.navLabels.privacy, href: `/${privacySlug}/` },
              ].map(l => (
                <Link key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {preset.brandAlign !== 'center' && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">{t.topics}</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(0, 6).map(cat => (
                  <Link key={cat.slug} href={`/kategoria/${cat.slug}/`} className="text-xs bg-white/10 hover:bg-white/20 text-[var(--text)] px-3 py-1.5 rounded-full transition-colors border border-white/10">
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>© {year} {siteConfig.name}. {t.rights}.</span>
          <span className="site-info">
            {t.disclaimer} &nbsp;·&nbsp;
            <a href="/wp-login.php" className="text-gray-700 hover:text-gray-500 transition-colors">{t.login}</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
