import { getAllPosts } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

export async function GET() {
  const posts = getAllPosts()
  const base = siteConfig.url

  const staticPages: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [
    { url: `${base}/`, priority: '1.0', changefreq: 'weekly' },
    { url: `${base}/blog/`, priority: '0.9', changefreq: 'daily' },
    { url: `${base}/o-nas/`, priority: '0.5', changefreq: 'monthly' },
    { url: `${base}/kontakt/`, priority: '0.5', changefreq: 'monthly' },
    { url: `${base}/polityka-prywatnosci/`, priority: '0.5', changefreq: 'monthly' },
  ]

  const postEntries: { url: string; priority: string; changefreq: string; lastmod?: string }[] = posts.map(p => ({
    url: `${base}/blog/${p.slug}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: p.date,
  }))

  const allEntries = [...staticPages, ...postEntries]

  const urlsXml = allEntries.map(e => `
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
