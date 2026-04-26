import Breadcrumbs from '@/components/Breadcrumbs'
import { siteConfig } from '@/lib/config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'O nas',
  description: 'Dowiedz się więcej o redakcji WP Design – portalu o aranżacji wnętrz i designie.',
  alternates: { canonical: `${siteConfig.url}/o-nas/` },
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: 'O nas', href: '/o-nas/' }]} />
      <h1 className="font-heading text-4xl font-bold text-[var(--text)] mb-6">O nas</h1>

      <div className="prose prose-lg max-w-none prose-headings:font-heading">
        <p>
          <strong>WP Design</strong> to polski portal o aranżacji wnętrz, designie i stylu życia. Tworzymy go z pasji do pięknych przestrzeni i chęci dzielenia się inspiracjami z polskimi czytelnikami.
        </p>

        <h2>Nasza misja</h2>
        <p>
          Wierzymy, że każde wnętrze – niezależnie od metrażu i budżetu – może być piękne i funkcjonalne. Naszą misją jest dostarczanie praktycznych porad, trendów i inspiracji, które pomagają polskim rodzinom tworzyć przestrzenie, w których chce się żyć.
        </p>

        <h2>Co znajdziesz na naszych stronach?</h2>
        <ul>
          <li>Praktyczne poradniki aranżacji wnętrz</li>
          <li>Przeglądy trendów i kolorów roku</li>
          <li>Wskazówki dotyczące wyboru mebli i dekoracji</li>
          <li>Pomysły na home office i strefy wypoczynku</li>
          <li>DIY projekty dekoracyjne</li>
        </ul>

        <h2>Redakcja</h2>
        <p>
          Nasz zespół tworzą pasjonaci designu, architekci wnętrz i styliści, którzy na co dzień śledzą krajowe i międzynarodowe trendy. Każdy artykuł powstaje w oparciu o rzetelną wiedzę i praktyczne doświadczenie.
        </p>

        <p>
          Zapraszamy do lektury i inspirowania się naszymi artykułami. Jeśli masz pytania lub sugestie, skontaktuj się z nami przez stronę <a href="/kontakt/">Kontakt</a>.
        </p>
      </div>
    </div>
  )
}
