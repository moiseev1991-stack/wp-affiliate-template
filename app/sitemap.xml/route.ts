import { getAllPosts } from '@/lib/posts'
import { siteConfig } from '@/lib/config'
import { CATEGORIES } from '@/lib/categories'

const ABOUT_SLUG: Record<string, string> = { pl: 'o-nas', en: 'about', de: 'ueber-uns', cs: 'o-nas', sk: 'o-nas' }
const CONTACT_SLUG: Record<string, string> = { pl: 'kontakt', en: 'contact', de: 'kontakt', cs: 'kontakt', sk: 'kontakt' }
const PRIVACY_SLUG: Record<string, string> = { pl: 'polityka-prywatnosci', en: 'privacy-policy', de: 'datenschutz', cs: 'ochrana-osobnich-udaju', sk: 'ochrana-osobnych-udajov' }

export async function GET() {
  const posts = getAllPosts()
  const base = siteConfig.url
  const lang = siteConfig.language || 'en'

  const aboutSlug = ABOUT_SLUG[lang] ?? 'about'
  const contactSlug = CONTACT_SLUG[lang] ?? 'contact'
  const privacySlug = PRIVACY_SLUG[lang] ?? 'privacy-policy'

  const staticPages = [
    { url: `${base}/`, priority: '1.0', changefreq: 'weekly' },
    { url: `${base}/${aboutSlug}/`, priority: '0.5', changefreq: 'monthly' },
    { url: `${base}/${contactSlug}/`, priority: '0.5', changefreq: 'monthly' },
    { url: `${base}/${privacySlug}/`, priority: '0.5', changefreq: 'monthly' },
  ]

  const categoryPages = CATEGORIES.map(c => ({
    url: `${base}/kategoria/${c.slug}/`,
    priority: '0.7',
    changefreq: 'weekly',
  }))

  const postEntries = posts.map(p => ({
    url: `${base}/${p.slug}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: p.date,
  }))

  const allEntries = [...staticPages, ...categoryPages, ...postEntries]

  const urlsXml = allEntries.map((e: any) => `
  <url>
    <loc>${e.url}</loc>
    ${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
