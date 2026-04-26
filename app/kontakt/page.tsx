import Breadcrumbs from '@/components/Breadcrumbs'
import { siteConfig } from '@/lib/config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Skontaktuj się z redakcją WP Design. Odpowiadamy na pytania dotyczące aranżacji wnętrz i współpracy.',
  alternates: { canonical: `${siteConfig.url}/kontakt/` },
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: 'Kontakt', href: '/kontakt/' }]} />
      <h1 className="font-heading text-4xl font-bold text-[var(--text)] mb-6">Kontakt</h1>

      <div className="prose prose-lg max-w-none prose-headings:font-heading">
        <p>
          Masz pytania, sugestie lub chcesz nawiązać współpracę? Chętnie odpiszemy na każdą wiadomość.
        </p>

        <h2>Napisz do nas</h2>
        <p>
          Możesz skontaktować się z redakcją WP Design pod adresem e-mail. Staramy się odpowiadać na wszystkie wiadomości w ciągu 2-3 dni roboczych.
        </p>

        <div className="not-prose bg-[var(--bg-section)] rounded-2xl p-6 border border-[var(--border)] my-6">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-sm text-[var(--text-muted)]">Portal</span>
              <p className="font-semibold text-[var(--text)]">{siteConfig.name}</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-muted)]">Temat:</span>
              <p className="font-semibold text-[var(--text)]">Redakcja, współpraca, reklama</p>
            </div>
            <div>
              <span className="text-sm text-[var(--text-muted)]">Język:</span>
              <p className="font-semibold text-[var(--text)]">Polski / English</p>
            </div>
          </div>
        </div>

        <h2>Współpraca</h2>
        <p>
          Jesteś marką, producentem mebli lub dekoracji i chcesz zaprezentować swoje produkty naszym czytelnikom? Zapraszamy do kontaktu w sprawie artykułów sponsorowanych, recenzji i innych form współpracy.
        </p>

        <h2>Tematyka wnętrz</h2>
        <p>
          Jeśli masz konkretne pytanie dotyczące aranżacji swojego wnętrza i chciałbyś, żebyśmy opisali podobny temat w naszym artykule – napisz do nas. Chętnie bierzemy pod uwagę sugestie czytelników przy planowaniu nowych treści.
        </p>
      </div>
    </div>
  )
}
