import { siteConfig } from '@/lib/config'

interface Props {
  variant: 'featured'
}

export default function MoneyBlock({ variant }: Props) {
  if (variant === 'featured') {
    return (
      <div className="bg-[var(--accent-dark)] text-white h-full flex flex-col justify-center p-8 lg:p-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[var(--gold)]/20 border border-[var(--gold)]/30 rounded-full px-3 py-1 text-[var(--gold)] text-xs font-bold uppercase tracking-widest mb-4">
            🏆 Polecane Kasyno
          </div>
          <div className="font-heading text-3xl lg:text-4xl font-bold text-white mb-1">{siteConfig.moneyPageAnchor}</div>
          <div className="text-[var(--gold)] text-xl font-semibold mb-3">{siteConfig.moneyPageBonus}</div>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            Licencjonowana platforma z ponad 2000 gier, błyskawicznymi wypłatami i dedykowaną obsługą dla polskich graczy.
          </p>

          <div className="flex flex-col gap-2 text-xs text-gray-400 mb-6">
            {['✓ Licencja MGA', '✓ Płatności BLIK', '✓ Wypłaty 24h'].map(f => (
              <span key={f}>{f}</span>
            ))}
          </div>

          <a
            href={siteConfig.moneyPageUrl}
            rel="sponsored noopener noreferrer"
            target="_blank"
            className="btn-gold inline-block text-black font-bold text-base px-7 py-3.5 rounded-xl text-center w-full sm:w-auto"
          >
            Zagraj teraz →
          </a>
          <p className="text-[11px] text-gray-500 mt-3 text-center">18+ | Hazard może uzależniać. Graj odpowiedzialnie.</p>
        </div>
      </div>
    )
  }

  return null
}
