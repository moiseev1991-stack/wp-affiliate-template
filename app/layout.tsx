import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { siteConfig } from '@/lib/config'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
  other: {
    generator: `WordPress ${siteConfig.wpVersion}`,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteConfig.language} className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <link rel="dns-prefetch" href="//s.w.org" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="pingback" href={`${siteConfig.url}/xmlrpc.php`} />
        <link rel="https://api.w.org/" href={`${siteConfig.url}/wp-json/`} />
        <link rel="https://www.iana.org/assignments/link-relations/search" href={`${siteConfig.url}/wp-json/wp/v2/search`} />
        <link rel="EditURI" type="application/rsd+xml" title="RSD" href={`${siteConfig.url}/xmlrpc.php?rsd`} />
        <link rel="wlwmanifest" type="application/wlwmanifest+xml" href={`${siteConfig.url}/wp-includes/wlwmanifest.xml`} />
        <link rel="shortlink" href={siteConfig.url} />
        <meta name="generator" content={`WordPress ${siteConfig.wpVersion}`} />
        <script dangerouslySetInnerHTML={{ __html: `
window._wpemojiSettings = {"baseUrl":"https:\\/\\/s.w.org\\/images\\/core\\/emoji\\/15.0.3\\/72x72\\/","ext":".png","svgUrl":"https:\\/\\/s.w.org\\/images\\/core\\/emoji\\/15.0.3\\/svg\\/","svgExt":".svg","source":{"concatemoji":"${siteConfig.url}\\/wp-includes\\/js\\/wp-emoji-release.min.js?ver=${siteConfig.wpVersion}"}};
` }} />
        <script async src={`${siteConfig.url}/wp-includes/js/wp-emoji-release.min.js?ver=${siteConfig.wpVersion}`} />
        <link rel="stylesheet" id="dashicons-css" href={`${siteConfig.url}/wp-includes/css/dashicons.min.css?ver=${siteConfig.wpVersion}`} type="text/css" media="all" />
        <link rel="stylesheet" id={`neve-style-css`} href={`${siteConfig.url}/wp-content/themes/neve/style.css?ver=${siteConfig.wpVersion}`} type="text/css" media="all" />
      </head>
      <body className="wordpress home blog logged-out no-customize-support">
        <div id="page" className="site">
          <Header />
          <div id="content" className="site-content">
            <div id="primary" className="content-area">
              <main id="main" className="site-main min-h-screen">
                {children}
              </main>
            </div>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  )
}
