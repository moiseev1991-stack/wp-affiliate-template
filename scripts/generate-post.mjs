#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set')
  process.exit(1)
}

const ROOT = process.cwd()
const POSTS_DIR = path.join(ROOT, 'content', 'posts')
const ILLUSTRATIONS_DIR = path.join(ROOT, 'public', 'illustrations')

const MONEY_PAGE_URL = 'https://vulkankasyno.pl'
const MONEY_PAGE_ANCHOR = 'Vulkan Vegas'
const MONEY_PAGE_BONUS = 'bonus powitalny do 4000 PLN'

const ALLOWED_EMOJIS = ['🎰', '🪟', '🪵', '🎨', '🌿', '💻', '✨', '🍳', '💡']

const TOPIC_CATEGORIES = [
  'aranżacja wnętrz i style (skandynawski, minimalizm, boho, loft, japandi)',
  'kolory roku i palety w aranżacji',
  'meble i materiały (drewno, tkaniny, dodatki)',
  'oświetlenie i nastrój wnętrza',
  'rośliny doniczkowe i zieleń w domu',
  'home office i ergonomia',
  'kuchnia, jadalnia, łazienka — projekty i porady',
  'DIY, dekoracje, sezonowe inspiracje',
  'porady dla małych mieszkań i kawalerek',
  'kasyna online dla polskich graczy (rzadko, max 1 na 5 artykułów)',
]

if (!fs.existsSync(ILLUSTRATIONS_DIR)) fs.mkdirSync(ILLUSTRATIONS_DIR, { recursive: true })
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })

function readExistingPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx'))
  const slugs = []
  const titles = []
  for (const f of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8')
    const slugMatch = raw.match(/^slug:\s*"([^"]+)"/m)
    const titleMatch = raw.match(/^title:\s*"([^"]+)"/m)
    if (slugMatch) slugs.push(slugMatch[1])
    if (titleMatch) titles.push(titleMatch[1])
  }
  return { slugs, titles }
}

async function callOpenAI({ messages, jsonMode = false, maxTokens = 6000 }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

async function pickTopic({ existingSlugs, existingTitles }) {
  const messages = [
    {
      role: 'system',
      content:
        'You are a content strategist for a Polish interior design and lifestyle blog (wp-design.org). The blog also occasionally covers online casinos for Polish players. You always respond with strict JSON.',
    },
    {
      role: 'user',
      content: `Pick a fresh topic for a new SEO-optimized blog post in Polish. The post must NOT duplicate any of the existing posts.

Existing slugs:
${existingSlugs.map(s => `- ${s}`).join('\n')}

Existing titles:
${existingTitles.map(t => `- ${t}`).join('\n')}

Good topic categories:
${TOPIC_CATEGORIES.map(c => `- ${c}`).join('\n')}

Pick ONE allowed emoji from this list that best fits the topic: ${ALLOWED_EMOJIS.join(' ')}.
Emoji guide:
- 🎰 = casino/gambling
- 🪟 = minimalism
- 🪵 = scandinavian
- 🎨 = trends/colors
- 🌿 = plants/greenery
- 💻 = home office
- ✨ = general tips
- 🍳 = kitchen
- 💡 = lighting

Return strict JSON:
{
  "slug": "lowercase-kebab-case-without-polish-diacritics-max-50-chars",
  "title": "Polish title, attention-grabbing, max 70 chars, Title Case, with em dash if useful",
  "description": "SEO meta description in Polish, max 155 chars, must mention concrete value",
  "emoji": "one of: ${ALLOWED_EMOJIS.join(' ')}"
}`,
    },
  ]
  const raw = await callOpenAI({ messages, jsonMode: true, maxTokens: 500 })
  const parsed = JSON.parse(raw)
  if (!parsed.slug || !parsed.title || !parsed.description || !parsed.emoji) {
    throw new Error(`Topic JSON missing fields: ${raw}`)
  }
  if (existingSlugs.includes(parsed.slug)) {
    throw new Error(`Topic duplicates existing slug: ${parsed.slug}`)
  }
  if (!ALLOWED_EMOJIS.includes(parsed.emoji)) {
    parsed.emoji = '✨'
  }
  return parsed
}

async function generateSvg({ slug, title, emoji }) {
  const messages = [
    {
      role: 'system',
      content:
        'You are an SVG illustrator. You return only raw SVG markup, no explanation, no markdown.',
    },
    {
      role: 'user',
      content: `Generate a clean, modern decorative SVG illustration (320x180 viewBox) for a Polish blog post.

Topic: "${title}"
Emoji theme: ${emoji}

Style requirements:
- viewBox="0 0 320 180", width="320" height="180"
- dark gradient background fitting the theme (no white background)
- a centered circular badge / focal element
- subtle decorative accents (stars, dots, lines) in corners
- a thin bottom strip / label area
- use semi-transparent whites and one accent color
- no text, no emoji, no raster images, no external fonts
- clean, minimal, suitable as a thumbnail
- self-contained, valid SVG

Return ONLY the SVG markup starting with <svg ...> and ending with </svg>.`,
    },
  ]
  const raw = await callOpenAI({ messages, jsonMode: false, maxTokens: 2000 })
  let svg = raw.trim()
  svg = svg.replace(/^```(?:svg|xml)?\s*/i, '').replace(/```\s*$/i, '').trim()
  if (!svg.startsWith('<svg')) {
    throw new Error(`SVG response did not start with <svg: ${svg.slice(0, 200)}`)
  }
  const outPath = path.join(ILLUSTRATIONS_DIR, `${slug}.svg`)
  fs.writeFileSync(outPath, svg, 'utf-8')
  return `/illustrations/${slug}.svg`
}

async function generateOutline({ title, description }) {
  const messages = [
    {
      role: 'system',
      content:
        'You are a senior content editor writing in Polish for an interior design and lifestyle blog. You always respond with strict JSON.',
    },
    {
      role: 'user',
      content: `Plan a 1600+ word SEO blog post in Polish.

Title: "${title}"
Description: "${description}"

Return strict JSON:
{
  "intro_points": ["3 concrete points to cover in the intro, in Polish"],
  "sections": [
    { "title": "## 1. Section title in Polish", "key_points": ["point1", "point2", "point3", "point4"] },
    ... exactly 8 sections numbered 1 to 8
  ]
}

Make sections specific, practical, non-overlapping. Use Polish.`,
    },
  ]
  const raw = await callOpenAI({ messages, jsonMode: true, maxTokens: 2000 })
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed.sections) || parsed.sections.length !== 8) {
    throw new Error(`Outline must have 8 sections, got ${parsed.sections?.length}`)
  }
  return parsed
}

async function generateBody({ title, description, outline, emoji }) {
  const isCasino = emoji === '🎰'
  const moneyBlock = isCasino
    ? `After the 8 sections, add a section "## Polecane kasyno" (2 paragraphs) that naturally recommends [${MONEY_PAGE_ANCHOR}](${MONEY_PAGE_URL}) — mention ${MONEY_PAGE_BONUS}, MGA license, fast payouts.`
    : `After the 8 sections, add a short closing section "## Podsumowanie" (1-2 paragraphs) summarizing key takeaways.`

  const messages = [
    {
      role: 'system',
      content:
        'You write long-form SEO articles in fluent, natural Polish for a Polish interior design and lifestyle blog. No fluff, no filler. Concrete, practical, useful.',
    },
    {
      role: 'user',
      content: `Write the full article body in Polish based on this outline.

Title: "${title}"
Description: "${description}"

Intro must cover:
${outline.intro_points.map(p => `- ${p}`).join('\n')}

Sections (write each section as ## heading + 200+ words of dense, useful Polish prose, with **bold** key terms):
${outline.sections.map(s => `${s.title}\n  Key points: ${s.key_points.join('; ')}`).join('\n\n')}

${moneyBlock}

End with a single italic disclaimer line in Polish appropriate to the topic (e.g. about responsible decoration choices, or for casino topics: about responsible gambling and 18+).

Constraints:
- Total length: at least 1600 words.
- Use markdown headings (##), bold (**term**), and occasional bullet lists.
- No H1, no frontmatter, no images, no code blocks.
- Do NOT include the article title as a heading — start directly with the intro paragraphs.
- Polish only.

Return only the markdown body.`,
    },
  ]
  const body = await callOpenAI({ messages, jsonMode: false, maxTokens: 6000 })
  return body.trim()
}

function buildMdx({ title, slug, description, emoji, image, body }) {
  const today = new Date().toISOString().slice(0, 10)
  const fm = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `slug: "${slug}"`,
    `date: "${today}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `emoji: "${emoji}"`,
    `featured: false`,
    `image: "${image}"`,
    '---',
    '',
    body,
    '',
  ].join('\n')
  return fm
}

async function main() {
  console.log('→ Reading existing posts')
  const { slugs, titles } = readExistingPosts()
  console.log(`  ${slugs.length} existing posts`)

  console.log('→ Picking topic')
  const topic = await pickTopic({ existingSlugs: slugs, existingTitles: titles })
  console.log(`  topic: ${topic.slug} | ${topic.emoji} | ${topic.title}`)

  console.log('→ Generating SVG illustration')
  const image = await generateSvg({ slug: topic.slug, title: topic.title, emoji: topic.emoji })
  console.log(`  saved ${image}`)

  console.log('→ Generating outline')
  const outline = await generateOutline({ title: topic.title, description: topic.description })

  console.log('→ Generating body')
  const body = await generateBody({
    title: topic.title,
    description: topic.description,
    outline,
    emoji: topic.emoji,
  })
  const wordCount = body.split(/\s+/).filter(Boolean).length
  console.log(`  ${wordCount} words`)

  const mdx = buildMdx({ ...topic, image, body })
  const outFile = path.join(POSTS_DIR, `${topic.slug}.mdx`)
  fs.writeFileSync(outFile, mdx, 'utf-8')
  console.log(`✓ Wrote ${outFile}`)
}

main().catch(err => {
  console.error('FAILED:', err)
  process.exit(1)
})
