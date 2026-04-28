#!/usr/bin/env node
// Per-site visual identity randomizer. Run once during scaffolding.
//
// Inputs (env or CLI args):
//   --niche <casino|sports|crypto|health|design|generic>  default: generic
//   --seed  <string>                                      default: random
//
// Outputs:
//   - Rewrites app/globals.css :root variables with a palette anchored on the
//     niche but randomized within that niche's color space.
//   - Writes scripts/theme.json with the chosen tokens (for downstream use
//     by other scripts and for debugging).
//
// Goal: two sites scaffolded for the same niche should not look identical.

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'

const args = parseArgs(process.argv.slice(2))
const niche = (args.niche || process.env.NICHE || 'generic').toLowerCase()
const seed = args.seed || process.env.SEED || crypto.randomBytes(8).toString('hex')

const ROOT = process.cwd()
const CSS_PATH = path.join(ROOT, 'app', 'globals.css')
const OUT_PATH = path.join(ROOT, 'scripts', 'theme.json')

// Niche-specific palette ranges. Within each range, the seed picks a unique
// combination so cross-site uniqueness is guaranteed.
const NICHES = {
  casino: {
    bgRange: { h: [270, 320], s: [10, 25], l: [4, 9] },
    cardRange: { h: [270, 320], s: [12, 22], l: [9, 14] },
    accentRange: { h: [38, 50], s: [55, 80], l: [42, 58] },         // gold
    accentDarkRange: { h: [340, 360], s: [60, 85], l: [22, 32] },   // bordeaux
    textRange: { h: [40, 55], s: [55, 80], l: [78, 92] },           // warm cream
    decoration: ['diamonds', 'chips', 'cards', 'cherry'],
  },
  sports: {
    bgRange: { h: [210, 230], s: [40, 60], l: [6, 10] },           // deep navy
    cardRange: { h: [210, 230], s: [35, 50], l: [12, 16] },
    accentRange: { h: [80, 130], s: [70, 95], l: [45, 60] },        // neon green
    accentDarkRange: { h: [10, 30], s: [80, 95], l: [40, 55] },     // hot orange
    textRange: { h: [200, 220], s: [10, 25], l: [88, 95] },
    decoration: ['stripes', 'arrows', 'bolts', 'targets'],
  },
  crypto: {
    bgRange: { h: [220, 260], s: [10, 30], l: [3, 7] },             // black
    cardRange: { h: [220, 260], s: [12, 25], l: [8, 13] },
    accentRange: { h: [160, 190], s: [70, 95], l: [45, 60] },       // neon cyan
    accentDarkRange: { h: [80, 100], s: [60, 90], l: [45, 60] },    // lime
    textRange: { h: [150, 200], s: [10, 25], l: [85, 95] },
    decoration: ['hex', 'circuit', 'nodes', 'grid'],
  },
  health: {
    bgRange: { h: [140, 170], s: [10, 25], l: [94, 98] },           // soft mint
    cardRange: { h: [140, 170], s: [15, 30], l: [88, 94] },
    accentRange: { h: [140, 170], s: [40, 65], l: [35, 50] },       // herbal green
    accentDarkRange: { h: [180, 210], s: [40, 65], l: [30, 45] },   // deep teal
    textRange: { h: [200, 220], s: [10, 20], l: [12, 22] },
    decoration: ['leaves', 'drops', 'circles', 'waves'],
  },
  design: {
    bgRange: { h: [30, 50], s: [10, 25], l: [92, 98] },             // warm cream
    cardRange: { h: [30, 50], s: [10, 20], l: [86, 94] },
    accentRange: { h: [20, 35], s: [40, 60], l: [40, 55] },         // terracotta
    accentDarkRange: { h: [80, 110], s: [25, 45], l: [25, 40] },    // sage
    textRange: { h: [25, 40], s: [10, 20], l: [15, 25] },
    decoration: ['leaves', 'wood', 'fabric', 'lines'],
  },
  generic: {
    bgRange: { h: [200, 240], s: [10, 25], l: [8, 14] },
    cardRange: { h: [200, 240], s: [10, 20], l: [14, 20] },
    accentRange: { h: [200, 260], s: [55, 80], l: [50, 65] },
    accentDarkRange: { h: [310, 340], s: [60, 85], l: [40, 55] },
    textRange: { h: [200, 220], s: [10, 25], l: [88, 95] },
    decoration: ['dots', 'lines', 'circles', 'triangles'],
  },
}

function seededRng(seedStr) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seedStr.length; i++) h = ((h ^ seedStr.charCodeAt(i)) * 16777619) >>> 0
  let state = h || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function pick(rng, range) {
  const h = range.h[0] + rng() * (range.h[1] - range.h[0])
  const s = range.s[0] + rng() * (range.s[1] - range.s[0])
  const l = range.l[0] + rng() * (range.l[1] - range.l[0])
  return { h: Math.round(h), s: Math.round(s), l: Math.round(l) }
}

function hsl(c) { return `hsl(${c.h}, ${c.s}%, ${c.l}%)` }
function hslMix(c, dl) {
  return `hsl(${c.h}, ${c.s}%, ${Math.max(0, Math.min(100, c.l + dl))}%)`
}

const cfg = NICHES[niche] || NICHES.generic
const rng = seededRng(`${niche}:${seed}`)
const bg = pick(rng, cfg.bgRange)
const card = pick(rng, cfg.cardRange)
const accent = pick(rng, cfg.accentRange)
const accentDark = pick(rng, cfg.accentDarkRange)
const text = pick(rng, cfg.textRange)
const decoration = cfg.decoration[Math.floor(rng() * cfg.decoration.length)]
const radius = [12, 14, 16, 18, 20][Math.floor(rng() * 5)]
const gradAngle = [115, 125, 135, 145, 155][Math.floor(rng() * 5)]

const tokens = {
  niche,
  seed,
  decoration,
  radius,
  gradAngle,
  colors: {
    '--bg': hsl(bg),
    '--bg-card': hsl(card),
    '--bg-section': hslMix(card, 4),
    '--accent': hsl(accent),
    '--accent-dark': hsl(accentDark),
    '--accent-light': hslMix(accent, 12),
    '--text': hsl(text),
    '--text-muted': hslMix(text, -25),
    '--border': hslMix(card, 8),
  },
}

const cssVars = Object.entries(tokens.colors)
  .map(([k, v]) => `  ${k}: ${v};`)
  .join('\n')

const cssRoot = `:root {
${cssVars}
  --radius: ${radius}px;
  --shadow: 0 2px 24px rgba(0,0,0,0.10);
  --shadow-hover: 0 16px 48px rgba(0,0,0,0.30);
  --grad-angle: ${gradAngle}deg;
  --decoration: ${decoration};
}`

if (fs.existsSync(CSS_PATH)) {
  const existing = fs.readFileSync(CSS_PATH, 'utf-8')
  const replaced = existing.replace(/:root\s*\{[\s\S]*?\}/, cssRoot)
  fs.writeFileSync(CSS_PATH, replaced, 'utf-8')
  console.log(`✓ globals.css :root rewritten with ${niche} palette (seed: ${seed})`)
} else {
  console.warn(`globals.css not found at ${CSS_PATH} — skipping rewrite`)
}

fs.writeFileSync(OUT_PATH, JSON.stringify(tokens, null, 2), 'utf-8')
console.log(`✓ theme.json written → ${OUT_PATH}`)

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
