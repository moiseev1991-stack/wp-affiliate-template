#!/usr/bin/env node
// MONTHLY auto-post generator.
//
// This script runs ONLY on the deployed server, ONLY from the monthly cron
// workflow, and only on the chosen day-of-month for the site (siteConfig.monthlyPostDay).
//
// Behavior:
//   - Generates ONE topical article in the site's language and niche.
//   - The article has NO money links, NO money anchors, NO outbound brand
//     mentions. Pure topical content.
//   - Writes content/posts/<slug>.mdx + public/illustrations/<slug>.svg.
//
// This script is NEVER invoked at scaffold time. Scaffold-time articles are
// produced by Claude Code via the /scaffold-site skill (Claude writes each
// .mdx directly through its Write tool — no OpenAI involvement at scaffold).
//
// Inputs (env):
//   OPENAI_API_KEY  required at runtime (only).
//   OPENAI_MODEL    default: gpt-4o-mini.
//   FORCE=1         optional: bypass the day-of-month gate (for manual runs).

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set. Set the repo secret and re-run.')
  process.exit(1)
}

const ROOT = process.cwd()
const POSTS_DIR = path.join(ROOT, 'content', 'posts')
const ILLUSTRATIONS_DIR = path.join(ROOT, 'public', 'illustrations')
const CONFIG_PATH = path.join(ROOT, 'scripts', 'generation.config.json')

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`generation.config.json not found at ${CONFIG_PATH}.`)
  console.error(`Run /scaffold-site first — it writes this config.`)
  process.exit(1)
}
const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))

const {
  language,
  languageName,
  niche,
  topicCategories,
  allowedEmojis,
  siteName,
  responsibleDisclaimer,
  monthlyPostDay,
} = CONFIG

if (!fs.existsSync(ILLUSTRATIONS_DIR)) fs.mkdirSync(ILLUSTRATIONS_DIR, { recursive: true })
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })

// ─── Day-of-month gate ──────────────────────────────────────────────────────
// Cron fires daily; generation only happens on the site's chosen day.

function isPostingDay() {
  if (process.env.FORCE === '1') return true
  if (!monthlyPostDay) {
    console.warn('No monthlyPostDay in generation.config.json — assuming day 1.')
    return new Date().getUTCDate() === 1
  }
  return new Date().getUTCDate() === Number(monthlyPostDay)
}

if (!isPostingDay()) {
  const today = new Date().getUTCDate()
  console.log(`Today is day ${today} UTC. Site posts on day ${monthlyPostDay}. Skipping.`)
  process.exit(0)
}

console.log(`Today is day ${monthlyPostDay} — generating monthly topical post.`)

// ─── Existing posts (avoid duplicates) ─────────────────────────────────────

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

// ─── OpenAI client ──────────────────────────────────────────────────────────

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

// ─── Pick fresh topic ──────────────────────────────────────────────────────

async function pickTopic({ existingSlugs, existingTitles }) {
  const messages = [
    {
      role: 'system',
      content: `You are a content strategist for ${siteName} — a ${languageName}-language editorial blog covering ${niche}. You always respond with strict JSON.`,
    },
    {
      role: 'user',
      content: `Pick a fresh topic for a new SEO-optimized blog post in ${languageName}. The post must NOT duplicate any existing posts.

Existing slugs:
${existingSlugs.map(s => `- ${s}`).join('\n')}

Existing titles:
${existingTitles.map(t => `- ${t}`).join('\n')}

Good topic categories:
${topicCategories.map(c => `- ${c}`).join('\n')}

The article will NOT contain any external brand links, sponsorships, or affiliate anchors. Pure topical editorial content.

Pick ONE allowed emoji from this list that best fits the topic: ${allowedEmojis.join(' ')}.

Return strict JSON:
{
  "slug": "lowercase-kebab-case-without-diacritics-max-50-chars",
  "title": "${languageName} title, attention-grabbing, max 70 chars",
  "description": "SEO meta description in ${languageName}, max 155 chars",
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

// ─── SVG illustration ──────────────────────────────────────────────────────

async function generateSvg({ slug, title, emoji }) {
  const messages = [
    {
      role: 'system',
      content: 'You are an SVG illustrator. You return only raw SVG markup, no explanation, no markdown.',
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
- subtle decorative accents in corners
- no text, no emoji, no raster images, no external fonts
- clean, minimal, suitable as a thumbnail
- self-contained, valid SVG

Return ONLY the SVG markup starting with <svg ...> and ending with </svg>.`,
    },
  ]
  let svg = ''
  try {
    const raw = await callOpenAI({ messages, jsonMode: false, maxTokens: 2000 })
    svg = raw.trim().replace(/^```(?:svg|xml)?\s*/i, '').replace(/```\s*$/i, '').trim()
    if (!svg.startsWith('<svg')) {
      console.warn('  SVG response invalid, falling back to placeholder')
      svg = ''
    }
  } catch (err) {
    console.warn('  SVG generation failed, falling back to placeholder:', err.message)
  }
  if (!svg) svg = buildFallbackSvg({ slug })
  fs.writeFileSync(path.join(ILLUSTRATIONS_DIR, `${slug}.svg`), svg, 'utf-8')
  return `/illustrations/${slug}.svg`
}

function buildFallbackSvg({ slug }) {
  const palette = CONFIG.fallbackPalette ?? ['#1e293b', '#334155', '#94a3b8']
  const [c1, c2, accent] = palette
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="bg-${hash}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#bg-${hash})"/>
  <circle cx="160" cy="80" r="44" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.25" stroke-width="1.5"/>
  <circle cx="160" cy="80" r="28" fill="${accent}" fill-opacity="0.55"/>
  <circle cx="160" cy="80" r="14" fill="white" fill-opacity="0.7"/>
  <rect x="0" y="160" width="320" height="20" fill="black" fill-opacity="0.25"/>
  <rect x="120" y="167" width="80" height="6" rx="3" fill="${accent}" fill-opacity="0.7"/>
</svg>`
}

// ─── Outline + body ────────────────────────────────────────────────────────

async function generateOutline({ title, description }) {
  const messages = [
    {
      role: 'system',
      content: `You are a senior content editor writing in ${languageName} for a ${niche} blog. You always respond with strict JSON.`,
    },
    {
      role: 'user',
      content: `Plan a 1600+ word SEO blog post in ${languageName}.

Title: "${title}"
Description: "${description}"

Return strict JSON:
{
  "intro_points": ["3 concrete points to cover in the intro, in ${languageName}"],
  "sections": [
    { "title": "## 1. Section title in ${languageName}", "key_points": ["point1", "point2", "point3", "point4"] },
    ... exactly 8 sections numbered 1 to 8
  ]
}

Make sections specific, practical, non-overlapping. Use ${languageName}.`,
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
  const messages = [
    {
      role: 'system',
      content: `You write long-form SEO articles in fluent, natural ${languageName} for a ${niche} blog. No fluff, no filler. Concrete, practical, useful.`,
    },
    {
      role: 'user',
      content: `Write the full article body in ${languageName} based on this outline.

Title: "${title}"
Description: "${description}"

Intro must cover:
${outline.intro_points.map(p => `- ${p}`).join('\n')}

Sections (write each as ## heading + 200+ words of dense, useful ${languageName} prose, with **bold** key terms and concrete numbers):
${outline.sections.map(s => `${s.title}\n  Key points: ${s.key_points.join('; ')}`).join('\n\n')}

End with a single italic disclaimer line in ${languageName}: ${responsibleDisclaimer}

Constraints:
- Total length: at least 1600 words.
- Use markdown headings (##), bold (**term**), and occasional bullet lists.
- No H1, no frontmatter, no images, no code blocks.
- DO NOT include any external URLs, brand recommendations, affiliate links, or "editor's pick" sections that link out. Pure topical content.
- ${languageName} only.

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

// ─── Run ───────────────────────────────────────────────────────────────────

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

main().catch(err => {
  console.error('GENERATION FAILED:', err.message || err)
  process.exit(1)
})
