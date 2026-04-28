#!/usr/bin/env node
// Monthly auto-post generator. Driven by scripts/generation.config.json
// (written at scaffold-time by the scaffold-site skill) so this script never
// has to be edited per-site.
//
// Inputs (env):
//   OPENAI_API_KEY  required
//   OPENAI_MODEL    default: gpt-4o-mini
//   COUNT           default: 1 (number of articles to generate in this run)
//   BACKDATE=1      optional: backdate posts up to 6 months for batch backfills
//
// Outputs:
//   content/posts/<slug>.mdx
//   public/illustrations/<slug>.svg

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
const CONFIG_PATH = path.join(ROOT, 'scripts', 'generation.config.json')

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`generation.config.json not found at ${CONFIG_PATH}.`)
  console.error(`Run the scaffold-site skill first to write this config.`)
  process.exit(1)
}
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))

const {
  language,
  languageName,
  niche,
  moneyPageUrl,
  moneyPageAnchor,
  moneyPageBonus,
  topicCategories,
  allowedEmojis,
  emojiGuide,
  siteName,
  moneyBlockHeading,
  moneyBlockBrief,
  responsibleDisclaimer,
} = CONFIG

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
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
  // Hard-pinned topic: scaffold.mjs uses this to force the 5 money-article titles
  // and the orchestrator passes them in via FORCE_TOPIC env (JSON-encoded).
  if (process.env.FORCE_TOPIC) {
    const forced = JSON.parse(process.env.FORCE_TOPIC)
    if (!forced.slug || !forced.title || !forced.description || !forced.emoji) {
      throw new Error('FORCE_TOPIC must include slug, title, description, emoji')
    }
    return forced
  }
  const messages = [
    {
      role: 'system',
      content:
        `You are a content strategist for ${siteName} — a ${languageName}-language affiliate blog covering ${niche}. You always respond with strict JSON.`,
    },
    {
      role: 'user',
      content: `Pick a fresh topic for a new SEO-optimized blog post in ${languageName}. The post must NOT duplicate any of the existing posts.

Existing slugs:
${existingSlugs.map(s => `- ${s}`).join('\n')}

Existing titles:
${existingTitles.map(t => `- ${t}`).join('\n')}

Good topic categories:
${topicCategories.map(c => `- ${c}`).join('\n')}

Pick ONE allowed emoji from this list that best fits the topic: ${allowedEmojis.join(' ')}.
Emoji guide:
${emojiGuide}

Return strict JSON:
{
  "slug": "lowercase-kebab-case-without-diacritics-max-50-chars",
  "title": "${languageName} title, attention-grabbing, max 70 chars, Title Case, with em dash if useful",
  "description": "SEO meta description in ${languageName}, max 155 chars, must mention concrete value (numbers, brand, percentages, etc.)",
  "emoji": "one of: ${allowedEmojis.join(' ')}"
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
  if (!allowedEmojis.includes(parsed.emoji)) {
    parsed.emoji = allowedEmojis[0]
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
      content: `Generate a clean, modern decorative SVG illustration (320x180 viewBox) for a ${languageName} blog post in the ${niche} niche.

Topic: "${title}"
Emoji theme: ${emoji}

Style requirements:
- viewBox="0 0 320 180", width="320" height="180"
- dark gradient background fitting the niche aesthetic
- a centered circular badge / focal element
- subtle decorative accents (stars, dots, lines) in corners
- a thin bottom strip / label area
- semi-transparent whites and one accent color
- no text, no emoji, no raster images, no external fonts
- clean, minimal, suitable as a thumbnail
- self-contained, valid SVG

Return ONLY the SVG markup starting with <svg ...> and ending with </svg>.`,
    },
  ]
  let svg = ''
  try {
    const raw = await callOpenAI({ messages, jsonMode: false, maxTokens: 2000 })
    svg = raw.trim()
    svg = svg.replace(/^```(?:svg|xml)?\s*/i, '').replace(/```\s*$/i, '').trim()
    if (!svg.startsWith('<svg')) {
      console.warn('  SVG response invalid, falling back to placeholder')
      svg = ''
    }
  } catch (err) {
    console.warn('  SVG generation failed, falling back to placeholder:', err.message)
  }
  if (!svg) {
    svg = buildFallbackSvg({ slug, emoji })
  }
  const outPath = path.join(ILLUSTRATIONS_DIR, `${slug}.svg`)
  fs.writeFileSync(outPath, svg, 'utf-8')
  return `/illustrations/${slug}.svg`
}

function buildFallbackSvg({ slug, emoji }) {
  const palette = CONFIG.fallbackPalette ?? ['#1e293b', '#334155', '#94a3b8']
  const [c1, c2, accent] = palette
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  const cx = 160
  const cy = 80
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="bg-${hash}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="dots-${hash}" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1" fill="white" fill-opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="320" height="180" fill="url(#bg-${hash})"/>
  <rect width="320" height="180" fill="url(#dots-${hash})"/>
  <circle cx="${cx}" cy="${cy}" r="44" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.25" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy}" r="28" fill="${accent}" fill-opacity="0.55"/>
  <circle cx="${cx}" cy="${cy}" r="14" fill="white" fill-opacity="0.7"/>
  <rect x="0" y="160" width="320" height="20" fill="black" fill-opacity="0.25"/>
  <rect x="120" y="167" width="80" height="6" rx="3" fill="${accent}" fill-opacity="0.7"/>
</svg>`
}

async function generateOutline({ title, description }) {
  const messages = [
    {
      role: 'system',
      content:
        `You are a senior content editor writing in ${languageName} for a ${niche} blog. You always respond with strict JSON.`,
    },
    {
      role: 'user',
      content: `Plan a 1600+ word SEO blog post in ${languageName}.

Title: "${title}"
Description: "${description}"

Return strict JSON:
{
  "intro_points": ["3 concrete points to cover in the intro, in ${languageName} — hook + value proposition + what reader will learn"],
  "sections": [
    { "title": "## 1. Section title in ${languageName}", "key_points": ["point1", "point2", "point3", "point4"] },
    ... exactly 8 sections numbered 1 to 8
  ]
}

Make sections specific, practical, non-overlapping. Cover concrete details and numbers. Use ${languageName}.`,
    },
  ]
  const raw = await callOpenAI({ messages, jsonMode: true, maxTokens: 2000 })
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed.sections) || parsed.sections.length !== 8) {
    throw new Error(`Outline must have 8 sections, got ${parsed.sections?.length}`)
  }
  return parsed
}

async function generateBody({ title, description, outline }) {
  const isMoney = process.env.MONEY_ARTICLE === '1'
  const moneyBlock = `After the 8 sections, add a section "## ${moneyBlockHeading}" (2-3 paragraphs) that naturally recommends [${moneyPageAnchor}](${moneyPageUrl}). ${moneyBlockBrief} Frame it as the editor's pick relevant to the article topic, not a hard sell.`
  const moneyLeadInstruction = isMoney
    ? `\n\nIMPORTANT: This is a money-focused article about ${moneyPageAnchor}. The FIRST paragraph of the intro must mention [${moneyPageAnchor}](${moneyPageUrl}) as a clickable markdown link. Refer to ${moneyPageAnchor} naturally throughout the article (5-8 mentions total). Mention the bonus phrase "${moneyPageBonus}" verbatim at least once in the body.`
    : ''

  const messages = [
    {
      role: 'system',
      content:
        `You write long-form SEO articles in fluent, natural ${languageName} for a ${niche} affiliate blog. No fluff, no filler. Concrete, practical, useful.`,
    },
    {
      role: 'user',
      content: `Write the full article body in ${languageName} based on this outline.

Title: "${title}"
Description: "${description}"

Intro must cover:
${outline.intro_points.map(p => `- ${p}`).join('\n')}

Sections (write each section as ## heading + 200+ words of dense, useful ${languageName} prose, with **bold** key terms and concrete numbers):
${outline.sections.map(s => `${s.title}\n  Key points: ${s.key_points.join('; ')}`).join('\n\n')}

${moneyBlock}${moneyLeadInstruction}

End with a single italic disclaimer line in ${languageName}: ${responsibleDisclaimer}

Constraints:
- Total length: at least 1600 words.
- Use markdown headings (##), bold (**term**), and occasional bullet lists.
- No H1, no frontmatter, no images, no code blocks.
- Do NOT include the article title as a heading — start directly with the intro paragraphs.
- ${languageName} only.

Return only the markdown body.`,
    },
  ]
  const body = await callOpenAI({ messages, jsonMode: false, maxTokens: 6000 })
  return body.trim()
}

function getPostDate() {
  if (process.env.BACKDATE === '1') {
    const sixMonthsMs = 180 * 24 * 60 * 60 * 1000
    const offset = Math.floor(Math.random() * sixMonthsMs)
    return new Date(Date.now() - offset).toISOString().slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

function buildMdx({ title, slug, description, emoji, image, body }) {
  const today = getPostDate()
  const featured = process.env.MONEY_ARTICLE === '1' ? 'true' : 'false'
  const fm = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `slug: "${slug}"`,
    `date: "${today}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `emoji: "${emoji}"`,
    `featured: ${featured}`,
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
  const body = await generateBody({ title: topic.title, description: topic.description, outline })
  const wordCount = body.split(/\s+/).filter(Boolean).length
  console.log(`  ${wordCount} words`)

  const mdx = buildMdx({ ...topic, image, body })
  const outFile = path.join(POSTS_DIR, `${topic.slug}.mdx`)
  fs.writeFileSync(outFile, mdx, 'utf-8')
  console.log(`✓ Wrote ${outFile}`)
}

const COUNT = Math.max(1, parseInt(process.env.COUNT || '1', 10))

async function runBatch() {
  let ok = 0, fail = 0
  for (let i = 1; i <= COUNT; i++) {
    console.log(`\n========== Article ${i}/${COUNT} ==========`)
    try {
      await main()
      ok++
    } catch (err) {
      fail++
      console.error(`FAILED article ${i}:`, err.message || err)
    }
    if (i < COUNT) await new Promise(r => setTimeout(r, 1500))
  }
  console.log(`\n==========================================`)
  console.log(`Batch done: ${ok} ok, ${fail} failed (of ${COUNT})`)
  if (fail > 0 && ok === 0) process.exit(1)
}

runBatch().catch(err => {
  console.error('BATCH FAILED:', err)
  process.exit(1)
})
