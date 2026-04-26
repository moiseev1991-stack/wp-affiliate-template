---
name: scaffold-site
description: Bootstrap a new affiliate-blog site from this template. Asks the user for domain, language, niche, money-page details, target GitHub repo, and a starter money article, then reskins all template files locally and (optionally) pushes to a GitHub repo the user already prepared. Does NOT create a new GitHub repo or auto-deploy. Trigger when the user says "scaffold a new site", "/scaffold-site", "create new site from this template", or first opens this folder fresh.
---

# Scaffold-site skill

You turn a fresh checkout of `wp-affiliate-template` into a working affiliate site **locally** and (optionally) push it to a GitHub repo the user has already created. You do NOT create new GitHub repos or auto-deploy. The user controls when and where deploy happens.

## What the resulting site does

- Static Next.js site that **emulates WordPress** on the surface: `/wp-login.php`, `/xmlrpc.php`, `/wp-json/...` stub endpoints, WordPress-style HTML classes (`wordpress home blog`, `wp-block-post-content`, `entry-title`, etc.), `<meta name="generator" content="WordPress 6.5.2">`, neve-style.css link, wp-emoji-release.min.js bootstrap. **Do not remove this emulation** — it's intentional and useful for SEO.
- Money article (the affiliate target) is **always pinned first** on the homepage preview, regardless of date — driven by `siteConfig.featuredPostSlug` consumed in `app/page.tsx`.
- All other articles are sorted by date descending and shown right after the money article.
- Weekly auto-post GitHub Action writes a new SEO article using `gpt-4o`, generates an SVG illustration, and commits — once it's pushed and a secret is set.

## Step 0 — Sanity check

Before doing anything, confirm:
- `lib/config.ts` exists in cwd (this is the template).
- `.git` does NOT exist OR `git remote -v` is empty / points at `wp-affiliate-template`. If the user is running this on a repo that already has a real remote pointing somewhere else, **abort** and ask them to confirm — they may be running it in the wrong folder.

## Step 1 — Ask the user (5 questions in one AskUserQuestion call)

Use the **AskUserQuestion** tool. Ask all five in a single call. Do NOT proceed without answers.

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
5. **GitHub destination** — header `Where to push`, multiSelect `false`, options:
   - `Existing GitHub repo (free-text — paste full URL or owner/name)`
   - `Don't push — just prepare files locally`
   The user creates the repo themselves on github.com BEFORE this step. Do NOT create the repo for them. If they pick "Don't push", skip Steps 4 and 5 entirely.

After answers, also derive:
- `siteName` — short brand name, derive from domain (e.g. `gambling-pl.org` → `Gambling PL`).
- `tagline` — short tagline in the chosen language matching the niche. Generate it yourself.
- `description` — 1-2 sentence meta description in the chosen language.
- `repoName` — slugify the domain: `gambling-pl.org` → `gambling-pl`.
- `featuredPostSlug` — slug of the starter money article (Step 2.18), e.g. `najlepsze-kasyna-online-${repoName}` or `best-${niche}-${year}`. Just pick something descriptive matching the language.

Confirm the derived values back to the user in one message and let them correct before proceeding. (One round of confirmation only — don't loop.)

## Step 2 — Rewrite project files

Use Edit / Write to update these files. Match the chosen language for ALL user-facing strings.

### 2.1 `lib/config.ts`

Replace the whole file. Fields: `name`, `tagline`, `url`, `description`, `language`, `moneyPageUrl`, `moneyPageAnchor`, `moneyPageAnchorAlt`, `moneyPageBonus`, `featuredPostSlug` (set to the starter money-article slug from Step 1), `author` (e.g. "Editorial team" in chosen language), `wpVersion: "6.5.2"`, `wpTheme: "neve"`. Keep the existing shape — only swap values.

### 2.2 `app/layout.tsx`

- The `<html lang="...">` already reads from `siteConfig.language`. Verify nothing else needs touching.
- **Do not remove the WordPress emulation** in `<head>` (wp-emoji-release script, dashicons.min.css, neve style.css link, generator meta, xmlrpc/wp-json link rels, wordpress body classes). These give the WP look in view-source.

### 2.3 `app/page.tsx`

- Update `homeTitle` and `homeDescription` to be on-niche in the chosen language. Mirror the Vegas-style tone of the template if the niche is gambling. Otherwise generic.
- Translate the headings ("Najnowsze", "Artykuły i inspiracje", "Wszystkie artykuły", "Stwórz wnętrze swoich marzeń", "Odkryj nasze poradniki...", "Odkryj wszystkie artykuły") to the chosen language.
- Update the bottom decorative card emoji (🛋️) and copy to suit the niche.
- Update the featured-post excerpt block (the `customExcerpt` on the featured `PostCard`) to use the new money-page anchor + bonus phrase.
- **Do not change the article-ordering logic** — the existing `[featuredPost, ...otherPosts]` pattern is exactly what the user wants: money article first regardless of date, others sorted by date desc.

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
  - `o-nas` → language-appropriate slug (`about`, `ueber-uns`, `o-nas`, ...)
  - `kontakt` → language-appropriate slug
  - `polityka-prywatnosci` → language-appropriate slug (`privacy-policy`, `datenschutz`, `ochrana-osobnich-udaju`, ...)
- Translate the body content of each page.
- Update any links that referenced the old folder names (Header.tsx navLinks, Footer.tsx links, sitemap.xml, etc.).

### 2.11 `app/sitemap.xml/route.ts`

- Update the static URL list to match the renamed pages.

### 2.12 `scripts/generate-post.mjs`

- Update `MONEY_PAGE_URL`, `MONEY_PAGE_ANCHOR`, `MONEY_PAGE_BONUS` constants.
- Rewrite `TOPIC_CATEGORIES` array to fit the new niche (8–12 categories in the chosen language or English-described).
- Rewrite the `pickTopic` system + user prompts so they describe the new niche and target language.
- Rewrite the `generateOutline` and `generateBody` prompts so they instruct the model to write in the chosen language.
- Update the `moneyBlock` insert text inside `generateBody` to match the new money page.
- Update the disclaimer instruction at the end of the body prompt for the new niche.
- Keep `ALLOWED_EMOJIS` — the existing emoji-themed PostCard works for any niche.
- Verify the SVG fallback at the bottom of `generateSvg` still triggers if the API returns invalid SVG (it writes a minimal placeholder so the post still renders).

### 2.13 `.github/workflows/deploy.yml`

- Update `cname:` to the new domain.

### 2.14 `.github/workflows/weekly-post.yml`

- Leave the cron at `0 10 * * 1` unless the user asked otherwise.

### 2.15 `wrangler.toml`, `next.config.js`, `package.json`

- `package.json`: update `"name"` to `repoName`.
- `wrangler.toml`: update worker name to `repoName`.
- `next.config.js`: no change needed unless the user wants a basePath.

### 2.16 Reset content + illustrations

- Delete the `welcome.mdx` placeholder in `content/posts/` (keep `.gitkeep`).
- Delete any leftover SVG files in `public/illustrations/` (keep `.gitkeep`).

### 2.17 Generate the starter money article

The site needs ONE article from day one (the money article that's always pinned first on the homepage). Write it manually with these fields in the frontmatter:
- `title` — the chosen-language equivalent of "Best [niche brands] for [country] players — Guide [year]"
- `slug` — same as `featuredPostSlug` from Step 1
- `date` — today's ISO date
- `description` — 140–155 chars, mentions the brand and the bonus
- `emoji` — `🎰` for gambling, otherwise pick the closest emoji from the ALLOWED_EMOJIS set
- `featured: true`
- `image` — `/illustrations/<slug>.svg`

Body: ~1200–1600 words in the chosen language. Mention the brand by name with a link to `moneyPageUrl`. Include sections on: how to choose, bonuses, payment methods, mobile experience, license/security, FAQ. Wrap up with a sponsored disclaimer line.

Then generate an SVG illustration for it (320×180, dark gradient, central badge) and save to `public/illustrations/<slug>.svg`. If you don't want to call OpenAI from inside the skill, write the SVG by hand — a simple gradient + circle + corner accents is fine.

### 2.18 `README.md`

- Replace the template README with a short README describing the new site (1 paragraph + how to run dev + how to add `OPENAI_API_KEY` secret + reminder that Pages CNAME and DNS are still pending).

## Step 3 — Sanity build

Run `npm install` (if not already) then `npm run build`. If the build fails, fix the errors before continuing — typical issues: missing translations causing broken JSX, unused imports, MDX frontmatter typos.

## Step 4 — Push to GitHub (only if user picked "Existing GitHub repo")

If user picked "Don't push", **skip this step** and Step 5. Tell them they're done locally and can `git init && git remote add origin <url> && git push` whenever they're ready.

If user provided a repo URL:
1. Run `node scripts/bootstrap-github.mjs` with env:
   - `REPO_URL` — full URL or `owner/name` form (the user-provided value)
   - `DOMAIN` — full domain (used only for the optional CNAME / Pages enable; can be skipped if user didn't ask)
   - `OPENAI_API_KEY` — read from local `.env` if present, otherwise prompt the user once via AskUserQuestion (header "OpenAI API key", free-text). The user's existing key for wp-design works fine.
   - `SET_PAGES` — `"true"` only if user wants you to also enable Pages + CNAME. Default `"false"` (just push code, leave Pages config to user).

The script:
1. Captures the user's GitHub token from `git credential-manager` (Windows GCM, macOS keychain) or `gh auth token`.
2. Verifies the repo exists (does NOT create it).
3. Sets the `OPENAI_API_KEY` secret on the repo (sealed-box encrypted with libsodium).
4. Initializes git in cwd if needed, sets the remote to the user-provided repo, commits everything, pushes the default branch.
5. Optionally enables GitHub Pages from the `deploy` branch with the CNAME (only if `SET_PAGES=true`).

If the repo doesn't exist, abort and tell the user to create it on github.com first, then re-run.

## Step 5 — Final report

Print:
- ✅ Files reskinned (count)
- ✅ Build green
- ✅ Pushed to `<repo>` (if pushed)
- ✅ `OPENAI_API_KEY` secret set (if pushed)
- ⏳ User TODO: enable GitHub Pages manually (Settings → Pages → Source: deploy branch / `/`)
- ⏳ User TODO: point DNS A records to GitHub Pages IPs (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)
- ⏳ Next weekly auto-post: Monday 10:00 UTC (or run manually via Actions tab)

## What NOT to do

- **Do NOT create a new GitHub repo.** The user creates it themselves and pastes the URL.
- **Do NOT enable Pages or auto-deploy unless explicitly asked.** Default behavior is push-only.
- **Do NOT remove the WordPress emulation** in `app/layout.tsx` head, body classes, or in `public/wp-login.php` / `public/xmlrpc.php` / `public/wp-json/`.
- Don't translate code identifiers, only user-facing strings.
- Don't change the Tailwind theme or color tokens unless the user asks.
- Don't push if `npm run build` failed — fix first.
- Don't forget to remove the `.claude/skills/scaffold-site/` folder from the new project after successful scaffolding (it's only useful in the template). Ask the user before deleting.
