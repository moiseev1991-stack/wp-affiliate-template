# wp-affiliate-template

Reusable template for an SEO affiliate blog with weekly auto-generated articles via OpenAI.

**Stack:** Next.js 14 · React 18 · TypeScript · Tailwind · MDX · GitHub Actions · GitHub Pages.

**What it ships with:**
- Static site (Next.js export) deployable to GitHub Pages with a custom domain.
- MDX article pipeline with emoji-themed cards.
- Pages: home, blog, blog post, about, contact, privacy, sitemap, RSS.
- Weekly GitHub Action that calls OpenAI `gpt-4o` to pick a topic, draw an SVG illustration, and write a 1600+ word article in your chosen language.
- A Claude Code skill (`/scaffold-site`) that reskins the template into a new site.

---

## How to use

### 1. Get the template

Click **Use this template → Create a new repository** on GitHub, OR:

```bash
git clone https://github.com/<your-user>/wp-affiliate-template my-new-site
cd my-new-site
rm -rf .git
```

### 2. Open Claude Code in the folder

```bash
claude
```

### 3. Run the scaffold skill

```
/scaffold-site
```

The skill asks 4 questions:

1. **Domain** — e.g. `gambling-pl.org`
2. **Language** — `pl` / `en` / `de` / ... (ISO 639-1)
3. **Niche** — e.g. online casino affiliate, sports betting, crypto, etc.
4. **Money page** — affiliate URL + brand name + bonus phrase

Then it:
- Rewrites `lib/config.ts`, the homepage, header, footer, money block, and all UI strings into your language.
- Updates the auto-post generator script (`scripts/generate-post.mjs`) for your niche and language.
- Sets the CNAME in the deploy workflow.
- Resets `content/posts/` and `public/illustrations/`.
- Runs `npm run build` to verify.
- Creates a new public GitHub repo, sets the `OPENAI_API_KEY` secret, pushes the initial commit, and enables Pages with your custom domain.

### 4. Point DNS

Add `A` records on your registrar for your apex domain pointing to:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Or a `CNAME` record `www` → `<your-gh-user>.github.io` for subdomain.

### 5. First post

The weekly GitHub Action runs every Monday at 10:00 UTC. To create the first post immediately, go to **Actions → Weekly Post Generation → Run workflow**.

---

## Manual scaffold (without Claude Code)

If you don't have Claude Code:

1. Edit `lib/config.ts` with your site details.
2. Translate hardcoded UI strings in `app/`, `components/` to your language.
3. Update prompts in `scripts/generate-post.mjs` for your niche.
4. Update the `cname:` field in `.github/workflows/deploy.yml`.
5. Run:

```bash
export REPO_NAME=my-site
export DOMAIN=mysite.com
export OPENAI_API_KEY=sk-...
npm install
npm run scaffold:github
```

---

## Local development

```bash
npm install
npm run dev
```

Site runs at `http://localhost:3000`.

To build static output:

```bash
npm run build
```

Output goes to `out/`.

---

## License

MIT.
