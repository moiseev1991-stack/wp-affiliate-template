'use client'

import Link from 'next/link'
import { useState } from 'react'

const navLinks = [
  { label: 'Główna', href: '/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'O nas', href: '/o-nas/' },
  { label: 'Kontakt', href: '/kontakt/' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black font-heading tracking-tight text-[var(--accent)]">
          WP<span className="text-[var(--accent-light)]">Design</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 nav-menu">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-section)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

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

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[var(--border)] px-4 py-4 flex flex-col gap-1 nav-menu shadow-lg">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-section)] px-4 py-2.5 rounded-lg transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
