#!/usr/bin/env node
// Autonomous scaffold orchestrator. Single entry point for headless / remote-server
// usage. Reads scaffold.config.json (or env vars), validates, then runs the full
// pipeline: donor probe → theme → config → 50 articles → build → push → secrets → deploy.
//
// FAILS FAST on missing inputs. Never asks the user anything.
//
// Usage:
//   cp scaffold.config.example.json scaffold.config.json
//   # edit scaffold.config.json
//   export OPENAI_API_KEY=…
//   export GITHUB_TOKEN=…
//   export CLOUDFLARE_API_TOKEN=…       # optional
//   export CLOUDFLARE_ACCOUNT_ID=…      # optional
//   node scripts/scaffold.mjs

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'
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
  // Source priority: scaffold.config.json > env vars
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
        bonus: process.env.SCAFFOLD_MONEY_BONUS,
      },
      donor: process.env.SCAFFOLD_DONOR,
      repo: process.env.SCAFFOLD_REPO,
      pages: parseInt(process.env.SCAFFOLD_PAGES || '50', 10),
    }
  }

  // Validate
  const errors = []
  if (!cfg.domain) errors.push('domain')
  if (!cfg.language) errors.push('language')
  if (!cfg.niche) errors.push('niche')
  if (!cfg.money?.url) errors.push('money.url')
  if (!cfg.money?.anchor) errors.push('money.anchor')
  if (!cfg.money?.bonus) errors.push('money.bonus')
  if (!cfg.repo) errors.push('repo')
  if (errors.length) {
    fatal(`Missing required fields: ${errors.join(', ')}. Fill scaffold.config.json or set SCAFFOLD_* env vars.`)
  }
  if (!process.env.OPENAI_API_KEY) {
    fatal('OPENAI_API_KEY env is required for article generation. Set it and retry.')
  }

  // Defaults / derivations
  cfg.pages = cfg.pages || 50
  cfg.languageName = cfg.languageName || languageNameFor(cfg.language)
  cfg.siteName = cfg.siteName || deriveSiteName(cfg.domain)
  cfg.tagline = cfg.tagline || `Editorial coverage of ${cfg.niche}`
  cfg.description = cfg.description || `Reviews, guides, and analysis on ${cfg.niche} — ${cfg.siteName}.`
  cfg.openaiModel = cfg._optional_overrides?.openaiModel || cfg.openaiModel || 'gpt-4o-mini'
  cfg.skipDeploy = cfg._optional_overrides?.skipDeploy ?? cfg.skipDeploy ?? false
  cfg.skipBuild = cfg._optional_overrides?.skipBuild ?? cfg.skipBuild ?? false

  // Default money article titles per niche/language
  if (!cfg.moneyArticleTitles && !cfg._optional_overrides?.moneyArticleTitles) {
    cfg.moneyArticleTitles = defaultMoneyTitles(cfg)
  } else if (cfg._optional_overrides?.moneyArticleTitles) {
    cfg.moneyArticleTitles = cfg._optional_overrides.moneyArticleTitles
  }

  // Repo normalization → owner/name
  cfg.repo = cfg.repo.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '')

  log(`Config OK: ${cfg.domain} | ${cfg.language} | ${cfg.niche} | ${cfg.pages} pages | repo ${cfg.repo}`)
  return cfg
}

function languageNameFor(code) {
  return ({ pl: 'Polish', en: 'English', de: 'German', cs: 'Czech', sk: 'Slovak', es: 'Spanish', fr: 'French', it: 'Italian', pt: 'Portuguese', ru: 'Russian' }[code]) || code.toUpperCase()
}

function deriveSiteName(domain) {
  const stem = domain.replace(/\.[a-z]+$/, '').replace(/^www\./, '')
  return stem.split(/[-_.]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function defaultMoneyTitles(cfg) {
  const year = new Date().getFullYear()
  const A = cfg.money.anchor
  // Title templates per language. The orchestrator falls back to English form if locale not listed.
  const tpl = ({
    pl: [
      `Recenzja ${A} ${year} — Pełna Analiza`,
      `${A} Bonus Powitalny — ${cfg.money.bonus}`,
      `${A} — Aplikacja Mobilna Android i iOS`,
      `${A} — Program VIP i Cashback`,
      `${A} — Płatności i Szybkie Wypłaty`,
    ],
    en: [
      `${A} Review ${year} — Full Analysis`,
      `${A} Welcome Bonus — ${cfg.money.bonus}`,
      `${A} Mobile App — Android & iOS`,
      `${A} VIP Program & Cashback`,
      `${A} Payments & Fast Withdrawals`,
    ],
    de: [
      `${A} im Test ${year} — Vollständige Analyse`,
      `${A} Willkommensbonus — ${cfg.money.bonus}`,
      `${A} Mobile App — Android & iOS`,
      `${A} VIP-Programm & Cashback`,
      `${A} Zahlungen & Schnelle Auszahlungen`,
    ],
    cs: [
      `${A} Recenze ${year} — Kompletní Analýza`,
      `${A} Uvítací Bonus — ${cfg.money.bonus}`,
      `${A} Mobilní Aplikace — Android & iOS`,
      `${A} VIP Program a Cashback`,
      `${A} Platby a Rychlé Výběry`,
    ],
    sk: [
      `${A} Recenzia ${year} — Kompletná Analýza`,
      `${A} Uvítací Bonus — ${cfg.money.bonus}`,
      `${A} Mobilná Aplikácia — Android a iOS`,
      `${A} VIP Program a Cashback`,
      `${A} Platby a Rýchle Výbery`,
    ],
  })[cfg.language] || ([
    `${A} Review ${year} — Full Analysis`,
    `${A} Welcome Bonus — ${cfg.money.bonus}`,
    `${A} Mobile App — Android & iOS`,
    `${A} VIP Program & Cashback`,
    `${A} Payments & Fast Withdrawals`,
  ])
  return tpl.slice(0, 5)
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

// ─── 4. Write lib/config.ts ─────────────────────────────────────────────────

function writeSiteConfig(cfg, moneyArticleSlugs) {
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
  wpVersion: string
  wpTheme: string
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
  wpVersion: "6.5.2",
  wpTheme: "neve",
}
`
  fs.writeFileSync(path.join(ROOT, 'lib', 'config.ts'), out, 'utf-8')
  log(`Wrote lib/config.ts`)
}

// ─── 5. Write scripts/generation.config.json ───────────────────────────────

function writeGenerationConfig(cfg) {
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
    casino: `*Hazard / gambling content for adults only (18+). Play responsibly.*`,
    sports: `*Sports betting for adults only (18+). Bet responsibly.*`,
    crypto: `*Crypto investments are volatile and high risk. Not financial advice.*`,
    health: `*Health information for educational purposes only. Consult a medical professional.*`,
    design: `*Editorial inspiration only — verify product specs with manufacturers before purchase.*`,
    generic: `*Editorial content. Verify details with the source before acting on them.*`,
  }

  const out = {
    language: cfg.language,
    languageName: cfg.languageName,
    niche: cfg.niche,
    siteName: cfg.siteName,
    moneyPageUrl: cfg.money.url,
    moneyPageAnchor: cfg.money.anchor,
    moneyPageBonus: cfg.money.bonus,
    moneyBlockHeading: `${cfg.money.anchor} — Editor's Pick`,
    moneyBlockBrief: `Mention key product features, why it stands out (${cfg.money.bonus}), and what users get.`,
    responsibleDisclaimer: responsibleByNiche[cfg.niche] || responsibleByNiche.generic,
    topicCategories,
    allowedEmojis: ['🎰', '🪟', '🪵', '🎨', '🌿', '💻', '✨', '🍳', '💡'],
    emojiGuide: 'Map: 🎰=top picks, 🪟=live, 🪵=classics, 🎨=strategies, 🌿=promos, 💻=mobile, ✨=bonuses, 🍳=reviews, 💡=guides.',
    fallbackPalette: palette,
  }
  fs.writeFileSync(path.join(ROOT, 'scripts', 'generation.config.json'), JSON.stringify(out, null, 2), 'utf-8')
  log(`Wrote scripts/generation.config.json`)
}

// ─── 6. Generate articles ───────────────────────────────────────────────────

function existingPostSlugs() {
  if (!fs.existsSync(POSTS_DIR)) return []
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8')
      const m = raw.match(/^slug:\s*"([^"]+)"/m)
      return m ? m[1] : null
    })
    .filter(Boolean)
}

function slugify(s, lang) {
  // Strip diacritics for slug, lowercase, kebab.
  return s.normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function generateMoneyArticle(cfg, title, idx) {
  const slug = slugify(title, cfg.language)
  log(`  [money ${idx + 1}/5] ${slug}`)
  const forceTopic = JSON.stringify({
    slug,
    title,
    description: `${title} — ${cfg.money.bonus}. ${cfg.siteName} editorial coverage.`.slice(0, 155),
    emoji: ['🎰', '✨', '💻', '🍳', '💡'][idx],
  })
  try {
    execSync('node scripts/generate-post.mjs', {
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_TOPIC: forceTopic,
        MONEY_ARTICLE: '1',
        OPENAI_MODEL: cfg.openaiModel,
      },
    })
    return slug
  } catch (err) {
    warn(`  money article ${idx + 1} failed — will retry without FORCE_TOPIC: ${err.message}`)
    return null
  }
}

function generateBatch(cfg) {
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })
  if (!fs.existsSync(ILLUSTRATIONS_DIR)) fs.mkdirSync(ILLUSTRATIONS_DIR, { recursive: true })

  // Skip welcome.mdx — placeholder, replace with real content.
  const welcomePath = path.join(POSTS_DIR, 'welcome.mdx')
  if (fs.existsSync(welcomePath)) {
    fs.unlinkSync(welcomePath)
    log('Removed placeholder welcome.mdx')
  }

  // Step 6a: 5 money articles with pinned titles
  log(`Generating 5 money articles…`)
  const moneySlugs = []
  for (let i = 0; i < 5; i++) {
    const slug = generateMoneyArticle(cfg, cfg.moneyArticleTitles[i], i)
    if (slug) moneySlugs.push(slug)
  }
  if (moneySlugs.length < 3) {
    fatal(`Only ${moneySlugs.length}/5 money articles generated. Need at least 3 for home featured slots. Aborting.`)
  }

  // Step 6b: remaining N-5 topical articles (no FORCE_TOPIC, normal flow)
  const remaining = Math.max(0, cfg.pages - moneySlugs.length)
  log(`Generating ${remaining} topical articles…`)
  if (remaining > 0) {
    try {
      execSync('node scripts/generate-post.mjs', {
        stdio: 'inherit',
        env: {
          ...process.env,
          COUNT: String(remaining),
          BACKDATE: '1',
          OPENAI_MODEL: cfg.openaiModel,
        },
      })
    } catch (err) {
      warn(`Topical batch had failures (continuing): ${err.message}`)
    }
  }

  const finalCount = existingPostSlugs().length
  log(`Article generation done. ${finalCount} posts on disk (target: ${cfg.pages}).`)

  return moneySlugs
}

// ─── 7. Build ───────────────────────────────────────────────────────────────

function build(cfg) {
  if (cfg.skipBuild) { log('skipBuild=true — skipping npm run build'); return }
  log('npm install')
  execSync('npm install --no-audit --no-fund', { stdio: 'inherit' })
  log('npm run build')
  execSync('npm run build', { stdio: 'inherit' })
}

// ─── 8. Git push ────────────────────────────────────────────────────────────

function gitPush(cfg) {
  const token = process.env.GITHUB_TOKEN || tryGhAuthToken()
  if (!token) {
    warn('GITHUB_TOKEN not set and `gh auth token` failed. Skipping push. Set GITHUB_TOKEN to enable auto-push.')
    return false
  }

  const remoteUrl = `https://moiseev1991-stack:${token}@github.com/${cfg.repo}.git`
  try {
    if (!fs.existsSync(path.join(ROOT, '.git'))) {
      execSync('git init -b main', { stdio: 'inherit' })
    }
    // Remove any existing origin and set ours
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

// ─── 9. Repo secrets ────────────────────────────────────────────────────────

function setRepoSecrets(cfg) {
  const repo = cfg.repo
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
      execSync(`gh secret set ${name} -R ${repo} -b ${JSON.stringify(value)}`, {
        stdio: 'pipe',
        env: { ...process.env, GH_TOKEN: ghToken },
      })
      log(`  [secret] ${name} set on ${repo}`)
    } catch (err) {
      warn(`  [secret] ${name} failed: ${err.message}`)
    }
  }
}

// ─── 10. Cloudflare deploy ──────────────────────────────────────────────────

function cloudflareDeploy(cfg) {
  if (cfg.skipDeploy) { log('skipDeploy=true — skipping Cloudflare deploy'); return }
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    warn('CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID not set — skipping deploy')
    return
  }
  // wrangler.toml worker name should be repo name (without owner/)
  const workerName = cfg.repo.split('/')[1].replace(/[^a-z0-9-]/gi, '').toLowerCase()
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

// ─── 11. package.json + wrangler.toml + robots ──────────────────────────────

function writeInfra(cfg) {
  const pkgPath = path.join(ROOT, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.name = cfg.repo.split('/')[1]
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
  log('───── starting pipeline ─────')

  probeDonor(cfg)
  randomizeTheme(cfg)
  // First write generation.config.json so generate-post.mjs has the niche/lang context.
  writeGenerationConfig(cfg)
  // Then write a temporary lib/config.ts with empty moneyArticleSlugs (the post pipeline doesn't use it).
  writeSiteConfig(cfg, [])
  writeInfra(cfg)

  const moneySlugs = generateBatch(cfg)
  // Re-write lib/config.ts with the actual money slugs picked by generation.
  writeSiteConfig(cfg, moneySlugs.slice(0, 5))

  build(cfg)
  const pushed = gitPush(cfg)
  if (pushed) {
    setRepoSecrets(cfg)
  }
  cloudflareDeploy(cfg)

  log('───── done ─────')
  console.log(`
✓ Scaffold complete for ${cfg.domain}
  - ${existingPostSlugs().length} articles generated (${moneySlugs.length} money-articles with first-paragraph anchor)
  - 3 home featured slots: ${moneySlugs.slice(0, 3).join(', ')}
  - Theme: ${cfg.niche} palette, seed ${cfg.domain}
  - Repo: https://github.com/${cfg.repo}
  - Monthly cron: 1st of each month, 09:00 UTC
  - Custom domain wiring: pending — point DNS to Cloudflare
`)
}

main().catch(err => {
  console.error('[scaffold] PIPELINE FAILED:', err)
  process.exit(1)
})
