---
name: scaffold-site
description: Bootstrap a new affiliate-blog site from this template. Asks the user for domain, language, niche, and money-page details, then reskins all template files, creates a new GitHub repo, sets the OPENAI_API_KEY secret, configures GitHub Pages with a custom domain, and pushes the initial commit. Trigger when the user says "scaffold a new site", "/scaffold-site", "create new site from this template", or first opens this folder fresh.
---

# Scaffold-site skill

You are turning a fresh checkout of `wp-affiliate-template` into a new working affiliate site. The template is a Next.js 14 / Tailwind / MDX site with a weekly auto-post GitHub Action that uses OpenAI to write Polish (or any language) SEO articles.

## Step 0 — Sanity check

Before doing anything, confirm:
- `lib/config.ts` exists in cwd (this is the template).
- `.git` does NOT exist OR `git remote -v` is empty / points at `wp-affiliate-template`. If the user is running this on a repo that already has a real remote, **abort** and ask them to confirm — they may be running it in the wrong folder.

## Step 1 — Ask the user 4 questions

Use the **AskUserQuestion** tool. Ask all four in a single call (one questions array). Do NOT proceed without answers.

1. **Domain** — header `Custom domain`, multiSelect `false`, free-text via "Other". Example: `gambling-pl.org`. No `https://`, no trailing slash.
2. **Language** — header `Content language`, multiSelect `false`, options:
   - `pl — Polish`
   - `en — English`
   - `de — German`
   - `cs — Czech`
   - `sk — Slovak`
   - `Other (free-text)`
   Use the ISO 639-1 two-letter code in config.
3. **Niche** — header `Niche / topic`, multiSelect `false`, options:
   - `Online casino affiliate`
   - `Sports betting affiliate`
   - `Crypto / trading affiliate`
   - `Interior design + casino crossover (like wp-design)`
   - `Health / supplements affiliate`
   - `Other (free-text — describe the niche in 1-2 sentences)`
4. **Money page** — header `Affiliate target`, multiSelect `false`, free-text via "Other". Ask for: URL + brand anchor + short bonus phrase, e.g. `https://example.com | BrandName | bonus 100% up to $500`. Parse the three parts on `|`.

After answers, also derive:
- `siteName` — short brand name, derive from domain (e.g. `gambling-pl.org` → `Gambling PL`).
- `tagline` — short tagline in the chosen language matching the niche. Generate it yourself.
- `description` — 1-2 sentence meta description in the chosen language.
- `repoName` — slugify the domain: `gambling-pl.org` → `gambling-pl`.

Confirm the derived values back to the user in one message and let them correct before proceeding. (One round of confirmation only — don't loop.)

## Step 2 — Rewrite project files

Use Edit / Write to update these files. Match the chosen language for ALL user-facing strings.

### 2.1 `lib/config.ts`

Replace the whole file. Fields: `name`, `tagline`, `url`, `description`, `language`, `moneyPageUrl`, `moneyPageAnchor`, `moneyPageAnchorAlt`, `moneyPageBonus`, `featuredPostSlug` (set to empty string `""` for now), `author` (e.g. "Editorial team" in chosen language), `wpVersion`, `wpTheme`. Keep the existing shape — only swap values.

### 2.2 `app/layout.tsx`

- The `<html lang="...">` already reads from `siteConfig.language`. Verify nothing else needs touching.

### 2.3 `app/page.tsx`

- Update `homeTitle` and `homeDescription` to be on-niche in the chosen language. Mirror the Vegas-style tone of the template if the niche is gambling. Otherwise generic.
- Translate the headings ("Najnowsze", "Artykuły i inspiracje", "Wszystkie artykuły", "Stwórz wnętrze swoich marzeń", "Odkryj nasze poradniki...", "Odkryj wszystkie artykuły") to the chosen language.
- Update the bottom decorative card emoji (🛋️) and copy to suit the niche.
- Update the featured-post excerpt block (the `customExcerpt` on the featured `PostCard`) to use the new money-page anchor + bonus phrase.

### 2.4 `components/Header.tsx`

- Translate `navLinks` labels.
- Update logo text to derive from new `siteName`.

### 2.5 `components/Footer.tsx`

- Translate brand description, "Nawigacja", "Tematy", and the legal/disclaimer line.
- Update topic tags to fit the new niche (~6 tags, generated from niche).
- Update the gambling disclaimer line — keep it for gambling niches, replace with niche-appropriate disclaimer for others (or remove).

### 2.6 `components/MoneyBlock.tsx`

- Translate "Polecane Kasyno", "Zagraj teraz →", the bullet features (`Licencja MGA`, `Płatności BLIK`, `Wypłaty 24h`) — adapt to actual money-page features for the niche.
- Translate the gambling-disclaimer line; replace with niche-appropriate one (or remove for non-gambling).

### 2.7 `components/PostCard.tsx`

- Translate "Czytaj więcej", "min czytania" (minutes-of-reading label).
- Translate the THEMES `label` strings to the new language.
- Update `formatDate` locale (`pl-PL` → matching ISO locale: `en-US`, `de-DE`, `cs-CZ`, ...).

### 2.8 `components/Sidebar.tsx`, `components/Breadcrumbs.tsx`, `components/FeaturedCard.tsx`

- Open each, translate any user-facing Polish strings to the new language.

### 2.9 `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`

- Translate the page title, "Czytaj również", "Zostaw komentarz", form labels (Imię, E-mail, Komentarz, etc.), category labels, "min czytania", "Kategoria", and any other Polish strings.
- Update the `formatDate` locale.
- Update `EMOJI_TO_CATEGORY` and `EMOJI_TO_LABEL` if the niche uses different categories than design + gambling.

### 2.10 `app/o-nas/page.tsx`, `app/kontakt/page.tsx`, `app/polityka-prywatnosci/page.tsx`

- Rename folders if the chosen language is not Polish:
  - `o-nas` → `about` / `o-nas` / `ueber-uns` / `o-nas` (use the language's standard slug)
  - `kontakt` → stays in most languages, but use language-appropriate slug
  - `polityka-prywatnosci` → `privacy-policy` / `datenschutz` / `ochrana-osobnich-udaju` / etc.
- Translate the body content of each page.
- Update any links that referenced the old folder names (Header.tsx navLinks, Footer.tsx links, sitemap.xml, etc.).

### 2.11 `app/sitemap.xml/route.ts`

- Update the static URL list to match the renamed pages.

### 2.12 `scripts/generate-post.mjs`

- Update `MONEY_PAGE_URL`, `MONEY_PAGE_ANCHOR`, `MONEY_PAGE_BONUS` constants.
- Rewrite `TOPIC_CATEGORIES` array to fit the new niche (8–12 categories in the chosen language or English-described).
- Rewrite the `pickTopic` system + user prompts so they describe the new niche and target language.
- Rewrite the `generateOutline` and `generateBody` prompts so they instruct the model to write in the chosen language.
- Update the `moneyBlock` insert text inside `generateBody` to match the new money page (it currently mentions "Polecane kasyno", Vulkan Vegas, MGA license — change to fit).
- Update the disclaimer instruction at the end of the body prompt for the new niche.
- Keep `ALLOWED_EMOJIS` — the existing emoji-themed PostCard works for any niche (icons are abstract enough). Optionally trim/add emojis if the niche is very different.

### 2.13 `.github/workflows/deploy.yml`

- Update `cname:` to the new domain.

### 2.14 `.github/workflows/weekly-post.yml`

- Leave the cron at `0 10 * * 1` unless the user asked otherwise.

### 2.15 `wrangler.toml`, `next.config.js`, `package.json`

- `package.json`: update `"name"` to `repoName`.
- `wrangler.toml`: update worker name to `repoName`.
- `next.config.js`: no change needed unless the user wants a basePath.

### 2.16 Reset content + illustrations

- Delete any `.mdx` files in `content/posts/` (keep `.gitkeep`).
- Delete any `.svg` files in `public/illustrations/` (keep `.gitkeep`).
- Don't generate a starter post — the first weekly run will create one. (If the user wants a starter, run `node scripts/generate-post.mjs` locally with `OPENAI_API_KEY` exported — but only if they ask.)

### 2.17 `README.md`

- Replace the template README with a short README describing the new site (1 paragraph + how to run dev + how to add OPENAI_API_KEY secret).

## Step 3 — Sanity build

Run `npm install` then `npm run build`. If the build fails, fix the errors before continuing — typical issues: missing translations causing broken JSX, unused imports, `siteConfig.featuredPostSlug` referenced when empty (the home page handles empty correctly because `getPostBySlug("")` returns null and the code falls back).

## Step 4 — Bootstrap GitHub

Run `node scripts/bootstrap-github.mjs` with these env vars set:
- `REPO_NAME` — `repoName` from above
- `DOMAIN` — full domain
- `OPENAI_API_KEY` — read from local `.env` if present, otherwise prompt the user once via AskUserQuestion (header "OpenAI API key", free-text). The user's existing key for wp-design works fine.

The script:
1. Captures the user's GitHub token from `git credential-manager` (works on Windows; on macOS/Linux it falls back to `gh auth token`).
2. Creates a public repo `<gh-user>/<repoName>` via the GitHub API.
3. Sets the `OPENAI_API_KEY` secret on the repo (sealed-box encrypted with libsodium).
4. Initializes git in cwd if not already, sets the remote, commits everything, pushes `master`.
5. Enables GitHub Pages from the `deploy` branch with the custom CNAME.

If the repo already exists, ask the user whether to (a) abort, (b) push to it anyway, or (c) pick a new name.

## Step 5 — Trigger first deploy

After push, GitHub Action `Build & Deploy` runs automatically. Tell the user:
- where the source repo is (`https://github.com/<user>/<repoName>`)
- where the deployed site will be (`https://<domain>` once DNS is pointed and Pages is built — usually 1–2 minutes for Pages, separately for DNS)
- when the first auto-post will fire (next Monday 10:00 UTC) — and that they can run it manually via Actions → Weekly Post Generation → Run workflow.

## Step 6 — DNS reminder

Print a one-paragraph DNS reminder: the user must add an `A` / `CNAME` record on their domain registrar pointing to GitHub Pages:
- `A`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Or `CNAME` (for subdomains): `<gh-user>.github.io`

## What NOT to do

- Don't generate full article content during scaffolding. The auto-post action does that.
- Don't translate code identifiers, only user-facing strings.
- Don't change the Tailwind theme or color tokens unless the user asks.
- Don't push if `npm run build` failed — fix first.
- Don't forget to remove the `.claude/skills/scaffold-site/` folder from the new project after successful scaffolding (it's only useful in the template, not in the live site). Ask the user before deleting in case they want to re-run.

## Style of the user-facing report

When done, end with a short report:
- ✅ Reskinned X files
- ✅ Created repo `https://github.com/.../...`
- ✅ Set OPENAI_API_KEY secret
- ✅ Enabled Pages with CNAME `domain.tld`
- ⏳ Pending: point DNS to GitHub Pages IPs
- ⏳ Pending: first weekly auto-post fires Monday 10:00 UTC
