import Breadcrumbs from '@/components/Breadcrumbs'
import { siteConfig } from '@/lib/config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  description: 'Polityka prywatności portalu WP Design. Informacje o przetwarzaniu danych osobowych zgodnie z RODO.',
  alternates: { canonical: `${siteConfig.url}/polityka-prywatnosci/` },
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: 'Polityka prywatności', href: '/polityka-prywatnosci/' }]} />
      <h1 className="font-heading text-4xl font-bold text-[var(--text)] mb-6">Polityka prywatności</h1>

      <div className="prose prose-lg max-w-none prose-headings:font-heading">
        <p className="text-[var(--text-muted)] text-sm">Ostatnia aktualizacja: 1 stycznia 2026 r.</p>

        <h2>1. Administrator danych</h2>
        <p>
          Administratorem danych osobowych zbieranych za pośrednictwem serwisu {siteConfig.url} jest redakcja WP Design. Serwis jest przeznaczony dla użytkowników z Polski i działa zgodnie z przepisami Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).
        </p>

        <h2>2. Cel i podstawa przetwarzania danych</h2>
        <p>Dane osobowe mogą być przetwarzane w następujących celach:</p>
        <ul>
          <li>Zapewnienia prawidłowego funkcjonowania serwisu (podstawa prawna: art. 6 ust. 1 lit. f RODO)</li>
          <li>Odpowiedzi na zapytania przesłane przez formularz kontaktowy (podstawa prawna: art. 6 ust. 1 lit. b RODO)</li>
          <li>Analityki i statystyk odwiedzin (dane anonimowe)</li>
        </ul>

        <h2>3. Pliki cookies</h2>
        <p>
          Serwis wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania strony, analizy ruchu oraz personalizacji treści. Użytkownik może zarządzać ustawieniami plików cookies za pomocą ustawień przeglądarki internetowej.
        </p>

        <h2>4. Linki zewnętrzne i treści sponsorowane</h2>
        <p>
          Serwis może zawierać linki do zewnętrznych stron internetowych, oznaczone atrybutem <code>rel="sponsored"</code>. Administrator nie ponosi odpowiedzialności za politykę prywatności ani treści tych serwisów. Linki sponsorowane są wyraźnie oznaczone zgodnie z obowiązującymi przepisami.
        </p>

        <h2>5. Prawa użytkownika</h2>
        <p>Każdej osobie, której dane są przetwarzane, przysługuje prawo do:</p>
        <ul>
          <li>Dostępu do swoich danych osobowych</li>
          <li>Sprostowania danych</li>
          <li>Usunięcia danych ("prawo do bycia zapomnianym")</li>
          <li>Ograniczenia przetwarzania</li>
          <li>Przenoszenia danych</li>
          <li>Wniesienia sprzeciwu wobec przetwarzania</li>
          <li>Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych</li>
        </ul>

        <h2>6. Bezpieczeństwo danych</h2>
        <p>
          Serwis stosuje odpowiednie środki techniczne i organizacyjne w celu ochrony danych osobowych przed nieuprawnionym dostępem, zmianą, ujawnieniem lub zniszczeniem.
        </p>

        <h2>7. Kontakt</h2>
        <p>
          W sprawach związanych z ochroną danych osobowych można kontaktować się przez stronę <a href="/kontakt/">Kontakt</a>.
        </p>
      </div>
    </div>
  )
}
