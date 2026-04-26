import Link from 'next/link'
import { siteConfig } from '@/lib/config'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-8" style={{ background: 'linear-gradient(160deg, #0a1f12 0%, #1b4332 100%)' }}>
      {/* Top wave */}
      <div className="-mt-1">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d="M0 0C240 50 480 60 720 40C960 20 1200 55 1440 30L1440 60L0 60Z" fill="#0a1f12"/>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="text-2xl font-bold font-heading text-[var(--accent-light)] mb-3">WP Design</div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Portal o aranżacji wnętrz, designie i stylu życia dla polskich czytelników.
            </p>
            <div className="flex gap-3">
              {/* Decorative social placeholders */}
              {['🌿', '📐', '🏡'].map(icon => (
                <span key={icon} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm cursor-default">{icon}</span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Nawigacja</div>
            <nav className="flex flex-col gap-2.5">
              {[
                { label: 'Blog', href: '/blog/' },
                { label: 'O nas', href: '/o-nas/' },
                { label: 'Kontakt', href: '/kontakt/' },
                { label: 'Polityka prywatności', href: '/polityka-prywatnosci/' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Topics */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Tematy</div>
            <div className="flex flex-wrap gap-2">
              {['Minimalizm', 'Skandynawski', 'Home Office', 'DIY', 'Oświetlenie', 'Kolory'].map(tag => (
                <Link key={tag} href="/blog/" className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-full transition-colors border border-white/10">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <span>© {year} {siteConfig.name}. Wszelkie prawa zastrzeżone.</span>
          <span className="site-info">
            Treści hazardowe tylko dla osób pełnoletnich (18+). Hazard może uzależniać. &nbsp;·&nbsp;
            <a href="/wp-login.php" className="text-gray-700 hover:text-gray-500 transition-colors">Zaloguj się</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
