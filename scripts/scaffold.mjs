#!/usr/bin/env node
// Scaffold orchestrator (infra-only).
//
// IMPORTANT: This script does NOT generate articles. Article generation at
// scaffold time is performed by Claude Code via the /scaffold-site skill —
// Claude writes each .mdx file directly through its Write tool, no OpenAI
// involvement at scaffold time.
//
// What this script does (after Claude has written the articles, OR before —
// either order works because article generation is independent of infra):
//   1. Probes donor URL (optional, non-fatal)
//   2. Randomizes :root palette per niche+seed
//   3. Picks a random monthly-post day (1..28) from the seed
//   4. Writes lib/config.ts with siteConfig (name, lang, money fields,
//      themeSeed, monthlyPostDay)
//   5. Writes scripts/generation.config.json (used by the MONTHLY cron
//      generator — never at scaffold time)
//   6. Writes infra (package.json name, robots.txt sitemap host, wrangler.toml)
//   7. Optional: npm install + build
//   8. Optional: git init + push (only if GITHUB_TOKEN OR `gh auth` works AND
//      cfg.repo is set)
//   9. Optional: gh secret set OPENAI_API_KEY / CLOUDFLARE_* (only secrets
//      that are present in env)
//   10. Optional: wrangler deploy (only if CLOUDFLARE_API_TOKEN +
//       CLOUDFLARE_ACCOUNT_ID present)
//
// Required env: NONE. All keys are optional.
// Required config: domain, language, niche, money.{url,anchor,bonus}.
// Optional config: repo, donor, pages, siteName, tagline, description.

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import process from 'node:process'

const ROOT = process.cwd()
const CONFIG_PATH = path.join(ROOT, 'scaffold.config.json')
const POSTS_DIR = path.join(ROOT, 'content', 'posts')
const ILLUSTRATIONS_DIR = path.join(ROOT, 'public', 'illustrations')

function log(msg) { console.log(`[scaffold] ${msg}`) }
function fatal(msg) { console.error(`[scaffold] FATAL: ${msg}`); process.exit(1) }
function warn(msg) { console.warn(`[scaffold] WARN: ${msg}`) }

// ─── 1. Load + validate config ──────────────────────────────────────────────

function loadConfig() {
  let cfg = {}
  if (fs.existsSync(CONFIG_PATH)) {
    log(`Reading config from ${CONFIG_PATH}`)
    cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  } else {
    log('No scaffold.config.json — falling back to SCAFFOLD_* env vars')
    cfg = {
      domain: process.env.SCAFFOLD_DOMAIN,
      language: process.env.SCAFFOLD_LANGUAGE,
      languageName: process.env.SCAFFOLD_LANGUAGE_NAME,
      niche: process.env.SCAFFOLD_NICHE,
      siteName: process.env.SCAFFOLD_SITE_NAME,
      tagline: process.env.SCAFFOLD_TAGLINE,
      description: process.env.SCAFFOLD_DESCRIPTION,
      money: {
        url: process.env.SCAFFOLD_MONEY_URL,
        anchor: process.env.SCAFFOLD_MONEY_ANCHOR,
        anchorAlt: process.env.SCAFFOLD_MONEY_ANCHOR_ALT,
        bonus: process.env.SCAFFOLD_MONEY_BONUS,
      },
      donor: process.env.SCAFFOLD_DONOR,
      repo: process.env.SCAFFOLD_REPO,
      pages: parseInt(process.env.SCAFFOLD_PAGES || '50', 10),
    }
  }

  const errors = []
  if (!cfg.domain) errors.push('domain')
  if (!cfg.language) errors.push('language')
  if (!cfg.niche) errors.push('niche')
  if (!cfg.money?.url) errors.push('money.url')
  if (!cfg.money?.anchor) errors.push('money.anchor')
  if (!cfg.money?.bonus) errors.push('money.bonus')
  if (errors.length) {
    fatal(`Missing required fields: ${errors.join(', ')}. Fill scaffold.config.json or set SCAFFOLD_* env vars.`)
  }

  cfg.pages = cfg.pages || 50
  cfg.languageName = cfg.languageName || languageNameFor(cfg.language)
  cfg.siteName = cfg.siteName || deriveSiteName(cfg.domain)
  cfg.tagline = cfg.tagline || `Editorial coverage of ${cfg.niche}`
  cfg.description = cfg.description || `Reviews, guides, and analysis on ${cfg.niche} — ${cfg.siteName}.`
  cfg.skipDeploy = cfg._optional_overrides?.skipDeploy ?? cfg.skipDeploy ?? false
  cfg.skipBuild = cfg._optional_overrides?.skipBuild ?? cfg.skipBuild ?? false

  if (cfg.repo) {
    cfg.repo = cfg.repo.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '')
  }

  log(`Config OK: ${cfg.domain} | ${cfg.language} | ${cfg.niche} | ${cfg.pages} pages | repo ${cfg.repo || '(none)'}`)
  return cfg
}

function languageNameFor(code) {
  return ({ pl: 'Polish', en: 'English', de: 'German', cs: 'Czech', sk: 'Slovak', es: 'Spanish', fr: 'French', it: 'Italian', pt: 'Portuguese', ru: 'Russian' }[code]) || code.toUpperCase()
}

function deriveSiteName(domain) {
  const stem = domain.replace(/\.[a-z]+$/, '').replace(/^www\./, '')
  return stem.split(/[-_.]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

// ─── 2. Donor probe ─────────────────────────────────────────────────────────

function probeDonor(cfg) {
  if (!cfg.donor) { log('No donor URL set — skipping donor probe'); return }
  log(`Probing donor: ${cfg.donor}`)
  try {
    execSync(`node scripts/scrape-donor.mjs --url ${JSON.stringify(cfg.donor)}`, { stdio: 'inherit' })
  } catch (err) {
    warn(`Donor probe failed (non-fatal): ${err.message}`)
  }
}

// ─── 3. Theme randomization ─────────────────────────────────────────────────

function randomizeTheme(cfg) {
  log(`Randomizing :root palette for niche=${cfg.niche}, seed=${cfg.domain}`)
  execSync(`node scripts/randomize-theme.mjs --niche ${cfg.niche} --seed ${cfg.domain}`, { stdio: 'inherit' })
}

// ─── 4. Pick monthly post day deterministically from seed (1..28) ───────────

function pickMonthlyDay(seed) {
  let h = 2166136261 >>> 0
  const s = `${seed}::monthly-day`
  for (let i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0
  return (h >>> 0) % 28 + 1
}

// ─── 5. Resolve money article slugs from disk ───────────────────────────────
// At the time scaffold.mjs runs the orchestrator may already have Claude-
// generated articles on disk. Pick up to 5 slugs whose mdx frontmatter has
// `featured: true` to use as money articles.

function resolveMoneyArticleSlugs() {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx'))
  const featured = []
  const all = []
  for (const f of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8')
    const slugMatch = raw.match(/^slug:\s*"([^"]+)"/m)
    const featuredMatch = raw.match(/^featured:\s*(true|false)/m)
    if (!slugMatch) continue
    all.push(slugMatch[1])
    if (featuredMatch && featuredMatch[1] === 'true') featured.push(slugMatch[1])
  }
  if (featured.length >= 1) return featured.slice(0, 5)
  return all.slice(0, 5)
}

// ─── 6. Write lib/config.ts ─────────────────────────────────────────────────

function writeSiteConfig(cfg, moneyArticleSlugs, monthlyDay) {
  const out = `// Auto-generated by scripts/scaffold.mjs — do not hand-edit unless you know what you're doing.

export interface SiteConfig {
  name: string
  tagline: string
  url: string
  description: string
  language: string
  moneyPageUrl: string
  moneyPageAnchor: string
  moneyPageAnchorAlt?: string
  moneyPageBonus: string
  donorSite?: string
  moneyArticleSlugs: readonly string[]
  themeSeed?: string
  author: string
  monthlyPostDay: number
}

export const siteConfig: SiteConfig = {
  name: ${JSON.stringify(cfg.siteName)},
  tagline: ${JSON.stringify(cfg.tagline)},
  url: ${JSON.stringify(`https://${cfg.domain}`)},
  description: ${JSON.stringify(cfg.description)},
  language: ${JSON.stringify(cfg.language)},

  moneyPageUrl: ${JSON.stringify(cfg.money.url)},
  moneyPageAnchor: ${JSON.stringify(cfg.money.anchor)},
  moneyPageAnchorAlt: ${JSON.stringify(cfg.money.anchorAlt || cfg.money.anchor)},
  moneyPageBonus: ${JSON.stringify(cfg.money.bonus)},

  donorSite: ${JSON.stringify(cfg.donor || '')},

  moneyArticleSlugs: ${JSON.stringify(moneyArticleSlugs)},

  themeSeed: ${JSON.stringify(cfg.domain)},

  author: ${JSON.stringify(cfg.author || `${cfg.siteName} editorial`)},

  monthlyPostDay: ${monthlyDay},
}
`
  fs.writeFileSync(path.join(ROOT, 'lib', 'config.ts'), out, 'utf-8')
  log(`Wrote lib/config.ts (monthlyPostDay=${monthlyDay})`)
}

// ─── 7. Write scripts/generation.config.json ───────────────────────────────
// Used ONLY by the monthly cron generator. Scaffold-time articles are not
// produced by this config — Claude writes them directly.

function writeGenerationConfig(cfg, monthlyDay) {
  const themePath = path.join(ROOT, 'scripts', 'theme.json')
  const theme = fs.existsSync(themePath) ? JSON.parse(fs.readFileSync(themePath, 'utf-8')) : null
  const palette = theme?.colors
    ? [theme.colors['--bg'], theme.colors['--bg-card'], theme.colors['--accent']]
    : ['#1e293b', '#334155', '#94a3b8']

  const nicheTopicMap = {
    casino: [
      'reviews of online casino operators for the local market',
      'welcome bonus comparisons and wagering requirement breakdowns',
      'slot machine reviews — RTP, mechanics, providers',
      'live casino — blackjack, roulette, baccarat with real dealers',
      'payment methods — local options, e-wallets, crypto',
      'mobile casinos — apps and PWA',
      'strategies and bankroll management',
      'VIP programs, cashback, loyalty tiers',
      'responsible gambling — limits, self-exclusion',
      'classic table games — rules, variations',
    ],
    sports: [
      'sportsbook operator reviews',
      'pre-match and live betting strategies',
      'bonus comparisons across operators',
      'football, tennis, basketball betting markets',
      'esports betting',
      'mobile betting apps',
      'odds comparisons',
      'cashout, accumulator, and special bet types',
      'responsible gambling',
      'historical match analyses',
    ],
    crypto: [
      'cryptocurrency exchange reviews',
      'wallet comparisons (hot vs cold)',
      'altcoin analysis',
      'DeFi yield strategies',
      'NFT marketplace overviews',
      'on-chain analytics',
      'tax implications by jurisdiction',
      'Bitcoin and Ethereum guides',
      'security best practices',
      'staking and earning yields',
    ],
    health: [
      'supplement reviews and ingredient analysis',
      'workout plans and routines',
      'diet comparisons (keto, mediterranean, etc.)',
      'sleep optimization',
      'stress management',
      'longevity research',
      'home medical devices',
      'fitness app reviews',
      'mental health practices',
      'preventive checkups',
    ],
    design: [
      'interior styling — Scandinavian, minimalist, boho, japandi',
      'color palettes for living spaces',
      'furniture and material guides',
      'lighting and ambiance',
      'home office ergonomics',
      'small apartment optimization',
      'DIY and seasonal decor',
      'kitchen and bathroom design',
      'plants and biophilic design',
      'sustainable and eco-friendly choices',
    ],
    generic: [
      'in-depth product reviews',
      'buyer\'s guides and comparisons',
      'how-to tutorials',
      'industry news and analysis',
      'user FAQs',
      'top picks and rankings',
    ],
  }
  const topicCategories = nicheTopicMap[cfg.niche] || nicheTopicMap.generic

  const responsibleByNiche = {
    casino: `*Editorial content for adults only (18+).*`,
    sports: `*Editorial content for adults only (18+).*`,
    crypto: `*Editorial content. Markets are volatile — not financial advice.*`,
    health: `*Editorial content for educational purposes only. Consult a medical professional.*`,
    design: `*Editorial inspiration only — verify product specs with manufacturers.*`,
    generic: `*Editorial content. Verify details with the source before acting on them.*`,
  }

  const out = {
    _comment: 'Used ONLY by scripts/generate-post.mjs (monthly cron). Scaffold-time articles are produced by Claude Code, not by this generator.',
    language: cfg.language,
    languageName: cfg.languageName,
    niche: cfg.niche,
    siteName: cfg.siteName,
    domain: cfg.domain,
    monthlyPostDay: monthlyDay,
    responsibleDisclaimer: responsibleByNiche[cfg.niche] || responsibleByNiche.generic,
    topicCategories,
    allowedEmojis: ['🎰', '🪟', '🪵', '🎨', '🌿', '💻', '✨', '🍳', '💡'],
    fallbackPalette: palette,
  }
  fs.writeFileSync(path.join(ROOT, 'scripts', 'generation.config.json'), JSON.stringify(out, null, 2), 'utf-8')
  log(`Wrote scripts/generation.config.json`)
}

// ─── 8. Build ───────────────────────────────────────────────────────────────

function build(cfg) {
  if (cfg.skipBuild) { log('skipBuild=true — skipping npm run build'); return }
  if (!fs.existsSync(POSTS_DIR) || fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx')).length === 0) {
    warn('No articles found in content/posts/. Build will fail. Generate articles via /scaffold-site skill first, then re-run with skipBuild=false.')
    return
  }
  log('npm install')
  execSync('npm install --no-audit --no-fund', { stdio: 'inherit' })
  log('npm run build')
  execSync('npm run build', { stdio: 'inherit' })
}

// ─── 9. Git push (optional) ─────────────────────────────────────────────────

function gitPush(cfg) {
  if (!cfg.repo) { log('No repo set — skipping git push'); return false }
  const token = process.env.GITHUB_TOKEN || tryGhAuthToken()
  if (!token) {
    warn('GITHUB_TOKEN not set and `gh auth token` failed. Skipping push. Set GITHUB_TOKEN or run `gh auth login`.')
    return false
  }

  const owner = cfg.repo.split('/')[0]
  const remoteUrl = `https://${owner}:${token}@github.com/${cfg.repo}.git`
  try {
    if (!fs.existsSync(path.join(ROOT, '.git'))) {
      execSync('git init -b main', { stdio: 'inherit' })
    }
    try { execSync('git remote remove origin', { stdio: 'pipe' }) } catch {}
    execSync(`git remote add origin ${remoteUrl}`, { stdio: 'pipe' })

    execSync('git add -A', { stdio: 'inherit' })
    try {
      execSync(`git commit -m "feat: initial scaffold for ${cfg.domain}"`, { stdio: 'inherit' })
    } catch {
      log('Nothing to commit (maybe re-running scaffold) — pushing existing HEAD')
    }
    execSync('git branch -M main', { stdio: 'inherit' })
    execSync('git push -u origin main --force', { stdio: 'inherit' })
    log(`Pushed to https://github.com/${cfg.repo}`)
    return true
  } catch (err) {
    warn(`git push failed: ${err.message}. Repo must exist on GitHub before scaffold runs.`)
    return false
  }
}

function tryGhAuthToken() {
  try { return execSync('gh auth token', { encoding: 'utf-8' }).trim() } catch { return null }
}

// ─── 10. Repo secrets (optional) ────────────────────────────────────────────

function setRepoSecrets(cfg) {
  if (!cfg.repo) return
  const ghToken = process.env.GITHUB_TOKEN || tryGhAuthToken()
  if (!ghToken) { warn('No GitHub token — skipping repo secrets'); return }

  const secrets = [
    ['OPENAI_API_KEY', process.env.OPENAI_API_KEY],
    ['CLOUDFLARE_API_TOKEN', process.env.CLOUDFLARE_API_TOKEN],
    ['CLOUDFLARE_ACCOUNT_ID', process.env.CLOUDFLARE_ACCOUNT_ID],
    ['ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY],
  ]
  for (const [name, value] of secrets) {
    if (!value) { log(`  [secret] ${name} not in env — skipping`); continue }
    try {
      execSync(`gh secret set ${name} -R ${cfg.repo} -b ${JSON.stringify(value)}`, {
        stdio: 'pipe',
        env: { ...process.env, GH_TOKEN: ghToken },
      })
      log(`  [secret] ${name} set on ${cfg.repo}`)
    } catch (err) {
      warn(`  [secret] ${name} failed: ${err.message}`)
    }
  }
}

// ─── 11. Cloudflare deploy (optional) ──────────────────────────────────────

function cloudflareDeploy(cfg) {
  if (cfg.skipDeploy) { log('skipDeploy=true — skipping Cloudflare deploy'); return }
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    warn('CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID not set — skipping deploy')
    return
  }
  const workerName = (cfg.repo ? cfg.repo.split('/')[1] : cfg.siteName.toLowerCase()).replace(/[^a-z0-9-]/gi, '').toLowerCase()
  try {
    const wranglerPath = path.join(ROOT, 'wrangler.toml')
    let wrangler = fs.readFileSync(wranglerPath, 'utf-8')
    wrangler = wrangler.replace(/^name\s*=\s*".*"/m, `name = "${workerName}"`)
    fs.writeFileSync(wranglerPath, wrangler, 'utf-8')
    log(`Updated wrangler.toml worker name → ${workerName}`)
    execSync('npx wrangler deploy', { stdio: 'inherit' })
    log(`Deployed to Cloudflare. Live at https://${workerName}.<account>.workers.dev`)
  } catch (err) {
    warn(`Cloudflare deploy failed: ${err.message}`)
  }
}

// ─── 12. package.json + wrangler.toml + robots ─────────────────────────────

function writeInfra(cfg) {
  const pkgPath = path.join(ROOT, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.name = cfg.repo ? cfg.repo.split('/')[1] : cfg.domain.replace(/\./g, '-')
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  const robotsPath = path.join(ROOT, 'public', 'robots.txt')
  let robots = fs.readFileSync(robotsPath, 'utf-8')
  robots = robots.replace(/Sitemap:\s+https:\/\/[^\s]+\/sitemap\.xml/g, `Sitemap: https://${cfg.domain}/sitemap.xml`)
  fs.writeFileSync(robotsPath, robots, 'utf-8')

  log(`Updated package.json name + robots.txt sitemap host`)
}

// ─── Run pipeline ───────────────────────────────────────────────────────────

async function main() {
  const cfg = loadConfig()
  log('───── starting infra pipeline ─────')

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })
  if (!fs.existsSync(ILLUSTRATIONS_DIR)) fs.mkdirSync(ILLUSTRATIONS_DIR, { recursive: true })

  // Skip welcome.mdx — placeholder, will be replaced by Claude-written articles.
  const welcomePath = path.join(POSTS_DIR, 'welcome.mdx')
  if (fs.existsSync(welcomePath)) {
    fs.unlinkSync(welcomePath)
    log('Removed placeholder welcome.mdx')
  }

  probeDonor(cfg)
  randomizeTheme(cfg)

  const monthlyDay = pickMonthlyDay(cfg.domain)
  log(`Monthly post day: ${monthlyDay} (deterministic from domain seed)`)

  const moneySlugs = resolveMoneyArticleSlugs()
  if (moneySlugs.length === 0) {
    log('No articles on disk yet — writing siteConfig with empty moneyArticleSlugs.')
    log('After Claude generates articles, re-run: node scripts/scaffold.mjs')
  } else {
    log(`Found ${moneySlugs.length} candidate money articles on disk: ${moneySlugs.join(', ')}`)
  }

  writeGenerationConfig(cfg, monthlyDay)
  writeSiteConfig(cfg, moneySlugs, monthlyDay)
  writeInfra(cfg)

  build(cfg)
  const pushed = gitPush(cfg)
  if (pushed) {
    setRepoSecrets(cfg)
  }
  cloudflareDeploy(cfg)

  log('───── done ─────')
  console.log(`
✓ Infra scaffold complete for ${cfg.domain}
  - Theme: ${cfg.niche} palette, seed ${cfg.domain}
  - Monthly post day: ${monthlyDay} of each month
  - Articles on disk: ${moneySlugs.length === 0 ? '(none — generate via /scaffold-site skill)' : `${moneySlugs.length}+`}
  - Repo: ${cfg.repo ? `https://github.com/${cfg.repo}` : '(not configured)'}
  - Custom domain wiring: pending — point DNS to Cloudflare
`)
}

main().catch(err => {
  console.error('[scaffold] PIPELINE FAILED:', err)
  process.exit(1)
})
