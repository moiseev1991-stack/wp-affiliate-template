---
name: scaffold-site
description: Bootstrap a new affiliate-blog site from this template fully autonomously. Inputs domain, donor URL, language, niche, page count, money-page, and target GitHub repo — outputs a reskinned, content-complete (default 50 articles), unique-look site, pushed to the user-provided GitHub repo, with monthly auto-generation wired up. Trigger when the user says "scaffold a new site", "/scaffold-site", or first opens this folder fresh on a server.
---

# Scaffold-site skill (autonomous edition)

You take a fresh checkout of `wp-affiliate-template` and produce a complete, deployed-ready affiliate site without any interactive confirmation steps. This skill is designed to run on a remote server where there is no human to click "next/next/next". Your job: take inputs once, then execute the full pipeline silently end-to-end.

## Inputs — collected in ONE batch only

If the user has already supplied inputs (env vars, args, or just told you in the prompt), parse them and skip prompting. Otherwise, use ONE `AskUserQuestion` call with all of the following — do not ask in serial rounds.

Required:
1. **Domain** — e.g. `example.pl`. No protocol, no trailing slash.
2. **Language** — ISO 639-1 (`pl`, `en`, `de`, `cs`, `sk`, ...).
3. **Niche** — one of `casino`, `sports`, `crypto`, `health`, `design`, `generic`. (Affects palette range and topic seed.)
4. **Money page** — three pipe-separated parts: `URL | brand anchor | bonus phrase`. Example: `https://vulkankasyno.pl | Vulkan Vegas | 100% bonus do 4000 PLN`. The brand anchor is the exact text that becomes a clickable link in articles and previews.
5. **Donor site URL** — competitor / reference site. Used only as cue for niche/style. Single fetch, no crawling.
6. **GitHub repo** — full URL or `owner/name` form. The repo must exist (do NOT create it). Push target.
7. **Page count** — total number of articles to generate at scaffold time. Default `50`.

Optional:
8. **Target deploy** — `cloudflare-workers` (default) or `pages-only` (just push code, skip deploy).

After parsing, derive:
- `siteName` — short brand name from the domain (`example.pl` → `Example`).
- `tagline` — niche-appropriate tagline in the chosen language. Generate it.
- `description` — 1-2 sentence meta description in the chosen language.
- `repoName` — slugified domain (`example.pl` → `example-pl`).

Do NOT confirm derived values. Just write them. The user can correct via a follow-up edit.

## Pipeline — execute steps in order, no prompting between steps

### Step 1 — Donor probe
```
node scripts/scrape-donor.mjs --url <donor URL>
```
Writes `scripts/donor.json`. Use the `title`, `description`, `keywords`, and `h2s` as additional context when writing the article batch. Non-fatal — proceed even if the fetch fails.

### Step 2 — Visual reskin (per-site uniqueness)
```
node scripts/randomize-theme.mjs --niche <niche> --seed <domain>
```
This rewrites `:root` in `app/globals.css` with niche-anchored but seed-randomized colors. Two scaffolded sites in the same niche will not look identical.

### Step 3 — Update `lib/config.ts`

Fill in `siteConfig` — name, tagline, url, description, language, money fields, donor, themeSeed (set to the seed used in Step 2). Leave `moneyArticleSlugs` empty for now; populated in Step 5.

### Step 4 — Update categories and i18n

Update `lib/categories.ts` to match the niche (labels in target language; descriptions in target language). Keep the 9-category structure and emoji set so PostCard's THEMES still match.

### Step 5 — Plan the article corpus

Decide:
- **Page count** = N (default 50).
- **Money articles** = exactly 5 slugs. These are articles whose body and excerpt feature direct money-page links. Pick titles like:
  - `<Brand> — full review <year>`
  - `<Brand> welcome bonus — <bonus phrase> guide`
  - `<Brand> mobile app — Android / iOS`
  - `<Brand> VIP / cashback program`
  - `<Brand> payments & fast withdrawals` (or analogous in chosen language)
- **Featured home slugs** = first 3 of those 5. They occupy home grid slots 1, 4, 7 (the rest of the home grid pulls from latest non-money articles).
- **Topic categories** for the remaining N–5 articles: derived from niche + donor h2s. Aim for even distribution across the 9 categories from `lib/categories.ts`.

Write `scripts/generation.config.json` with the niche-specific values (used by the monthly cron later):
- `language`, `languageName`, `niche`, `siteName`, `moneyPage*`, `topicCategories`, `allowedEmojis`, `emojiGuide`, `moneyBlockHeading`, `moneyBlockBrief`, `responsibleDisclaimer`, `fallbackPalette` (use the colors from `scripts/theme.json`).

Update `lib/config.ts` `moneyArticleSlugs` to the 5 chosen slugs.

### Step 6 — Generate the article corpus IN-CONVERSATION

You (Claude) generate all N articles directly, writing each via the `Write` tool. Do NOT call OpenAI for the initial batch — the user has already given you Anthropic context (you ARE Claude). The OpenAI key is only used by the monthly cron going forward.

For each article:
- Frontmatter: `title`, `slug`, `date` (random within last 6 months for the corpus to look organic; today for money articles), `description` (≤155 chars), `emoji` (from `ALLOWED_EMOJIS` set in lib/categories), `featured: <true for money articles>`, `image: "/illustrations/<slug>.svg"`.
- Body: 1600+ words of dense, natural prose in the target language. 8 ## sections + intro + responsible-use disclaimer.
- For the 5 money articles: include the brand anchor as a clickable link `[Brand](moneyPageUrl)` in the FIRST paragraph (above the fold), and 2-3 more times sprinkled through the body. Mention the bonus phrase verbatim at least once.
- For non-money articles: do NOT mention the brand more than once. The post-render pipeline will handle linkification automatically; you just write naturally.
- Ensure every article includes 5 internal-link-friendly keyword phrases from other articles' titles. The post-render `processArticleBody` injects 5 internal links automatically by keyword matching, so writing diverse titles helps.

Save each as `content/posts/<slug>.mdx`.

For SVG illustrations, write a simple deterministic SVG by hand for each (320x180 viewBox, gradient from theme.json colors, central circle, corner accents). Save to `public/illustrations/<slug>.svg`. Do NOT call OpenAI for SVGs in the initial batch — quality of hand-written placeholders is fine, and OpenAI will overwrite them with model-generated SVGs at the next monthly cron run anyway.

### Step 7 — Update navigation and content

- `app/layout.tsx`: keep WordPress emulation; only verify `<html lang>` reflects siteConfig.language.
- `app/page.tsx`: already uses `featuredHomeSlugs()` and HOME_LIMIT=10. Just translate user-facing strings ("Latest", "Categories", "Browse by topic", "Reviews, bonuses and guides") to the target language.
- `components/Footer.tsx`: translate brand description, footer headings, topic tags. Add niche-appropriate disclaimer.
- `components/Sidebar.tsx`, `components/Breadcrumbs.tsx`, `components/MoneyBlock.tsx`, `components/FeaturedCard.tsx`: translate any hardcoded strings.
- `app/o-nas/page.tsx`, `app/kontakt/page.tsx`, `app/polityka-prywatnosci/page.tsx`: translate body text. If language ≠ pl, rename folders to language-appropriate slugs and update the references in `Header.tsx` (it already maps slugs by language for the canonical 5 languages — extend if user picked a different one).
- `app/sitemap.xml/route.ts`: update static URL list to match renamed folders + include all generated post slugs.
- `app/feed/route.ts`: update language code.
- `public/robots.txt`: replace placeholder `https://example.com/sitemap.xml` with the actual `https://<domain>/sitemap.xml`.

### Step 8 — Update infrastructure config

- `package.json`: set `name` to `repoName`.
- `wrangler.toml`: set worker name to `repoName`. Keep `[assets] directory = "./out"`.
- `next.config.js`: `output: 'export'` is set; do not change.
- `.github/workflows/monthly-post.yml`: leave as-is (already monthly + Cloudflare deploy).

### Step 9 — Build sanity check

```
npm install
npm run build
```
If build fails, fix the errors. Common: missing translations causing JSX issues, unused imports, MDX frontmatter typos. Do NOT proceed to push if build fails.

### Step 10 — Push to GitHub

```
git init -b main
git remote add origin https://<token>@github.com/<owner>/<repo>.git
git add -A
git commit -m "feat: initial scaffold for <domain>"
git push -u origin main
```

The token comes from `GITHUB_TOKEN` env var. If unset, fall back to `gh auth token`. If neither — abort and tell the user to set `GITHUB_TOKEN`.

### Step 11 — Set GitHub secrets

```
gh secret set OPENAI_API_KEY -R <owner>/<repo> -b "<key>"
gh secret set CLOUDFLARE_API_TOKEN -R <owner>/<repo> -b "<token>"
gh secret set CLOUDFLARE_ACCOUNT_ID -R <owner>/<repo> -b "<id>"
```

Read these from env vars: `OPENAI_API_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. If any is missing, log a warning and skip that secret — the user can set it manually later. Do NOT abort.

### Step 12 — Initial Cloudflare deploy (if `target_deploy=cloudflare-workers`)

```
CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… npx wrangler deploy
```

If both env vars are present, deploy. Otherwise log "skipping initial deploy — set CF env vars and run wrangler deploy manually" and continue.

### Step 13 — Final report

Print a single block:
```
✓ Scaffold complete for <domain>
  - <N> articles generated (<count of money articles> with money links)
  - 3 featured home slots: <slug1>, <slug2>, <slug3>
  - Theme: <niche> palette, seed <seed>
  - Pushed to: <owner>/<repo> (commit <sha>)
  - Live: https://<worker-name>.<account>.workers.dev (if deployed)
  - Monthly cron: 1st of every month, 09:00 UTC
  - Custom domain: pending — point DNS to Cloudflare
```

## Hard rules — never break these

- **No interactive confirmations.** One `AskUserQuestion` call max, batched. After that, execute silently end-to-end.
- **No questions in the middle of execution.** If something is missing (e.g. `GITHUB_TOKEN`), log warn + skip + continue.
- **Do NOT create the GitHub repo.** It must exist already. If push fails because it doesn't, abort with a clear error telling the user to create it.
- **Do NOT skip the build.** A broken site is worse than a delayed one.
- **Do NOT bypass the visual reskin.** Every site must look different. Always run `randomize-theme.mjs`.
- **Do NOT leave the placeholder English `lib/categories.ts`** if the language is not English — translate it.
- **Always open `robots.txt` to AI bots.** Never disallow LLM crawlers.
- **5 money articles, exactly.** First 3 of them go to home featured slots 1/4/7. Don't make it 4 or 6.
- **Money link in first paragraph of money articles** — non-negotiable. The `processArticleBody` helper enforces this at render time, but write the lead naturally to mention the brand once (the linkifier does the rest).
- **Don't touch the WordPress emulation** in `app/layout.tsx`, `public/wp-login.php`, `public/wp-json/`, `public/xmlrpc.php`. SEO-useful camouflage.
- **Don't change `app/[slug]/page.tsx` URL structure to `/blog/<slug>/`.** It's flat by design.

## Failure recovery

If the article generation step (Step 6) crashes mid-batch (e.g. Claude session interruption), the corpus left on disk is still committable. On re-run, the skill should detect existing slugs in `content/posts/`, count them, and only generate the missing ones to reach N. Use:
```
const existing = fs.readdirSync('content/posts').filter(f => f.endsWith('.mdx')).length
const remaining = N - existing
```

## After scaffolding

- Delete `.claude/skills/scaffold-site/` from the new repo before commit (the skill belongs in the template, not in scaffolded sites). Optional — the repo will still work either way.
- The template repo's `e:\cod\wp-affiliate-template\` should be re-cloned for each new scaffold, OR the user works on a clean checkout each time.
