import { getAllPosts } from '@/lib/posts'
import { siteConfig } from '@/lib/config'

export async function GET() {
  const posts = getAllPosts()

  const items = posts.map((p, i) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${siteConfig.url}/blog/${p.slug}/</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.description}]]></description>
      <wp:post_id>${i + 1}</wp:post_id>
      <wp:post_type>post</wp:post_type>
      <wp:status>publish</wp:status>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/modules/content/"
  xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.description}</description>
    <language>pl</language>
    <generator>https://wordpress.org/?v=${siteConfig.wpVersion}</generator>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
