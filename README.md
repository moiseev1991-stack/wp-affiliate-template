# wp-affiliate-template

Reusable template for an SEO affiliate blog with monthly auto-generated articles. Designed to be scaffolded autonomously — give it a domain, donor URL, language, niche, money-page details, and a target GitHub repo, and it produces a complete site with 50 starter articles, unique visual identity, and a wired-up monthly cron that adds one new article per month.

**Stack:** Next.js 14 · React 18 · TypeScript · Tailwind · MDX · GitHub Actions · Cloudflare Workers.

## What it ships with

- Static Next.js site that emulates WordPress on the surface (`/wp-login.php`, `/xmlrpc.php`, `/wp-json/`, WP body classes, `<meta generator="WordPress 6.5.2">`). Useful camouflage for SEO.
- Flat URL structure — articles live at `/<slug>/`, no `/blog/` prefix.
- Home page: 10-card grid. Slot 1 = first money article (brand pin); slots 4 and 7 = the other two money-featured articles. Other slots = latest non-money articles.
- 5 money articles per site (configurable list in `lib/config.ts`). Their excerpts include a Vulkan-style anchor link to the money page; their bodies open with the brand link in the first paragraph (above the fold).
- 5 internal links injected automatically into every article body via `lib/internal-links.ts` — round-robin across the corpus, biased toward money articles for SEO juice flow.
- Per-site visual identity: `scripts/randomize-theme.mjs` rewrites `:root` CSS variables with a niche-anchored, seed-randomized palette. Two sites in the same niche will not look identical.
- 9 emoji-themed categories (`lib/categories.ts`) with category archive pages at `/kategoria/<slug>/`.
- `robots.txt` open to all major search engines AND AI/LLM crawlers (no opt-out for ChatGPT, Claude, Perplexity, Google AI, Bytespider, etc.).
- Monthly auto-post: GitHub Actions cron (`0 9 1 * *`) calls OpenAI `gpt-4o-mini` (~$0.005 per article), commits the new `.mdx` + SVG, then deploys to Cloudflare Workers automatically.
- Claude Code skill (`/scaffold-site`) that runs the entire scaffold autonomously — no interactive confirmations.

## Inputs

The scaffold-site skill takes these in one batch (no serial prompting):

| Input        | Format                                            | Example                                                                        |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Domain       | hostname                                          | `example.pl`                                                                   |
| Language     | ISO 639-1                                         | `pl`                                                                           |
| Niche        | preset                                            | `casino`, `sports`, `crypto`, `health`, `design`, `generic`                    |
| Money page   | `URL ‖ anchor ‖ bonus phrase`                     | `https://vulkankasyno.pl ‖ Vulkan Vegas ‖ 100% bonus do 4000 PLN`              |
| Donor URL    | competitor / reference site                       | `https://competitor.pl`                                                        |
| GitHub repo  | `owner/name` or full URL (must already exist)     | `moiseev1991-stack/example-pl`                                                 |
| Page count   | integer                                           | `50` (default)                                                                 |

Required env vars (read at runtime):
- `GITHUB_TOKEN` — for the push (or fall back to `gh auth token`).
- `OPENAI_API_KEY` — set as a repo secret for the monthly cron.
- `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` — set as repo secrets for the auto-deploy step. Optional — skip if absent.

## Pipeline (autonomous)

```
1.  scripts/scrape-donor.mjs    — fetch donor metadata for niche cues
2.  scripts/randomize-theme.mjs — generate unique :root palette per site
3.  rewrite lib/config.ts       — siteConfig, money fields, themeSeed
4.  rewrite lib/categories.ts   — labels translated to target language
5.  decide article corpus       — 5 money articles + (N-5) topical articles
6.  generate articles in-Claude — Write tool, content/posts/<slug>.mdx
7.  translate UI strings        — Header/Footer/page.tsx/etc
8.  rewrite scripts/generation.config.json — for the monthly cron
9.  npm install && npm run build — sanity check
10. git push to <owner>/<repo>
11. gh secret set OPENAI_API_KEY / CLOUDFLARE_*
12. wrangler deploy             — initial Cloudflare deploy (if CF env set)
13. final report
```

## Structure

```
.claude/skills/scaffold-site/SKILL.md     ← the autonomous scaffold flow
.github/workflows/monthly-post.yml        ← cron + Cloudflare deploy
app/
  [slug]/page.tsx                         ← article page (flat URL, linkifyMoney + 5 internal links)
  kategoria/[category]/page.tsx           ← category archive
  page.tsx                                ← home (10 cards, 3 money slots at 1/4/7)
  layout.tsx, sitemap.xml/, feed/, ...
components/
  Header.tsx                              ← categories dropdown
  PostCard.tsx                            ← per-slug SVG variation
  Footer.tsx, Sidebar.tsx, MoneyBlock.tsx, ...
lib/
  config.ts                               ← siteConfig (per-site values)
  categories.ts                           ← 9 emoji categories
  money.ts                                ← 5 money articles + featured slot logic
  internal-links.ts                       ← 5-link injection + linkifyMoney
  posts.ts
public/
  robots.txt                              ← search + AI bots, all allowed
  wp-login.php, wp-json/, xmlrpc.php      ← WordPress emulation
scripts/
  generate-post.mjs                       ← monthly cron post generator (OpenAI)
  generation.config.json                  ← niche/language/topics for the cron
  randomize-theme.mjs                     ← per-site palette
  scrape-donor.mjs                        ← donor metadata probe
  bootstrap-github.mjs                    ← repo secrets + push
content/posts/                            ← scaffold writes 50 .mdx files here
```

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to out/
```

## Manual usage (without Claude Code)

```bash
# 1. Theme
node scripts/randomize-theme.mjs --niche casino --seed example.pl

# 2. Edit lib/config.ts with siteConfig values
# 3. Edit scripts/generation.config.json with niche/language/topics
# 4. Drop your 50 .mdx files into content/posts/
# 5. Build + deploy
npm run build
wrangler deploy
```

## License

MIT.
