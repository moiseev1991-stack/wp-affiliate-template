#!/usr/bin/env node
// Lightweight donor-site metadata probe. Fetches the donor URL, extracts
// title / description / og tags / h1 / a few keywords. Used by the scaffold-site
// skill as niche/style cues before generating content.
//
// No crawling, no rate-limit risk — single GET, 8s timeout.
//
// Usage:
//   node scripts/scrape-donor.mjs --url https://example.com [--out scripts/donor.json]

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const args = parseArgs(process.argv.slice(2))
const url = args.url || process.env.DONOR_URL
if (!url) {
  console.error('Missing --url <donor site URL>')
  process.exit(1)
}
const outPath = args.out || path.join(process.cwd(), 'scripts', 'donor.json')

try {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AffiliateBootstrap/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: ctrl.signal,
    redirect: 'follow',
  })
  clearTimeout(timer)
  const html = await res.text()

  const meta = {
    url,
    fetchedAt: new Date().toISOString(),
    status: res.status,
    title: extract(/<title[^>]*>([\s\S]*?)<\/title>/i, html),
    description: extractAttr(/<meta\s+[^>]*name=["']description["'][^>]*>/i, /content=["']([^"']*)/i, html),
    ogTitle: extractAttr(/<meta\s+[^>]*property=["']og:title["'][^>]*>/i, /content=["']([^"']*)/i, html),
    ogDescription: extractAttr(/<meta\s+[^>]*property=["']og:description["'][^>]*>/i, /content=["']([^"']*)/i, html),
    keywords: extractAttr(/<meta\s+[^>]*name=["']keywords["'][^>]*>/i, /content=["']([^"']*)/i, html),
    lang: extractAttr(/<html[^>]*>/i, /lang=["']([a-zA-Z-]+)/i, html),
    h1: extract(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html),
    h2s: [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].slice(0, 8).map(m => stripTags(m[1])),
  }

  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2), 'utf-8')
  console.log(`✓ donor metadata → ${outPath}`)
  console.log(`  title: ${meta.title || '(none)'}`)
  console.log(`  description: ${meta.description ? meta.description.slice(0, 120) + '…' : '(none)'}`)
} catch (err) {
  console.error(`Donor scrape failed: ${err.message}`)
  fs.writeFileSync(outPath, JSON.stringify({ url, error: err.message }, null, 2), 'utf-8')
  process.exit(0) // non-fatal — skill can proceed without donor cues
}

function extract(re, html) {
  const m = html.match(re)
  return m ? stripTags(m[1]).trim() : ''
}
function extractAttr(reTag, reAttr, html) {
  const tagMatch = html.match(reTag)
  if (!tagMatch) return ''
  const attrMatch = tagMatch[0].match(reAttr)
  return attrMatch ? attrMatch[1].trim() : ''
}
function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
      out[k] = v
    }
  }
  return out
}
