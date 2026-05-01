---
name: scaffold-site
description: Run the autonomous scaffold pipeline. NEVER asks the user questions — reads scaffold.config.json (or SCAFFOLD_* env vars) and executes node scripts/scaffold.mjs end-to-end. Trigger when the user says "scaffold a new site", "/scaffold-site", or first opens this folder fresh on a server.
---

# Scaffold-site skill (zero-question edition)

You are running on a remote server. There is no human ready to click "next/next/next" between steps. **You MUST NOT ask any questions.**

The full pipeline lives in `scripts/scaffold.mjs`. Your job in this skill is exactly two steps:

## Step 1 — Verify inputs are already present

Check, in order:

1. `scaffold.config.json` exists in cwd → use it.
2. Else `SCAFFOLD_DOMAIN`, `SCAFFOLD_LANGUAGE`, `SCAFFOLD_NICHE`, `SCAFFOLD_MONEY_URL`, `SCAFFOLD_MONEY_ANCHOR`, `SCAFFOLD_MONEY_BONUS`, `SCAFFOLD_REPO` env vars set → use them.
3. Else **abort** with this exact message:

```
ERROR: scaffold-site cannot run autonomously without inputs.

Provide either:
  (a) scaffold.config.json in the current directory (cp scaffold.config.example.json scaffold.config.json and edit), or
  (b) SCAFFOLD_* env vars: SCAFFOLD_DOMAIN, SCAFFOLD_LANGUAGE, SCAFFOLD_NICHE, SCAFFOLD_MONEY_URL, SCAFFOLD_MONEY_ANCHOR, SCAFFOLD_MONEY_BONUS, SCAFFOLD_REPO.

Required env (always): OPENAI_API_KEY.
Optional env: GITHUB_TOKEN, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, ANTHROPIC_API_KEY.

Then re-run /scaffold-site.
```

Do NOT call `AskUserQuestion`. Do NOT prompt the user for any value. The whole point of this skill is to be unattended.

## Step 2 — Execute the orchestrator

Run:

```
node scripts/scaffold.mjs
```

Stream stdout/stderr to the user. The orchestrator handles everything:

- donor probe
- per-site theme randomization
- `lib/config.ts` write
- `scripts/generation.config.json` write
- 5 money articles + N-5 topical articles via OpenAI gpt-4o-mini
- `npm install && npm run build`
- `git push` to user's repo
- `gh secret set` for OPENAI_API_KEY / CLOUDFLARE_* / ANTHROPIC_API_KEY
- `wrangler deploy`
- final report

## Money-link policy (enforced at render time by `lib/internal-links.ts`)

Every site produced by this skill ships with the same hard-capped outbound link policy:

| Surface                                | Money links | Notes                                              |
| -------------------------------------- | ----------- | -------------------------------------------------- |
| Home page (1 page, 10 cards)           | **3**       | Anchors in card excerpts on slots 1, 4, 7          |
| 5 money articles (1 link each)         | **5**       | Each has exactly one link in the FIRST paragraph   |
| All other articles + categories + about/contact/privacy | **0** | Zero outbound money links. Brand reads as plain text — no bold-without-link, no underline. |
| **Total per site**                     | **8 links across 6 pages** | |

The 5 money articles are listed in `siteConfig.moneyArticleSlugs` (set by the orchestrator at scaffold time). The first 3 of those 5 also appear in `siteConfig.featuredPostSlugs` and become home-grid cards. The remaining 2 carry only the body link without a home placement.

The render-time helper `enforceMoneyLinkPolicy` in `lib/internal-links.ts`:
1. Strips every existing markdown link to `siteConfig.moneyPageUrl` from the body of every article (kills any extra links auto-generated content may have inserted, e.g. in editor's-pick sections).
2. On a money article: places exactly one link in the first paragraph (links the first **Brand** bold mention, falls back to first plain mention, falls back to appending a localized lead-out sentence).
3. On any non-money article: also strips bold formatting on every brand mention so it reads as plain prose.
4. Internal cross-linking between articles still works via `pickInternalTargets` — those links go to other site pages, never to the money URL.

Do NOT change this policy from the skill. If a future site needs a different ratio (e.g. 3 money articles instead of 5, or 0 home links), edit `lib/money.ts` and `lib/config.ts.moneyArticleSlugs` after scaffolding — but only if the user explicitly asks.

If the orchestrator exits non-zero, surface the error verbatim and stop. Do NOT try to recover by asking questions. The user fixes the env/config and reruns.

## Hard rules — never break

- **Zero `AskUserQuestion` calls in this skill.** If you find yourself wanting to ask, abort instead.
- **Zero "are you sure?" confirmations.** The config IS the consent.
- **Zero serial-step prompts.** Run the orchestrator once and surface its output.
- **No fallback to interactive mode.** If config is missing, abort with the message above. Don't try to be helpful by asking.
- **No edits to scaffold.mjs from the skill.** Bug fixes go through normal code review, not in-skill patches.
- **Do not delete the user's content/posts/ directory** if it has files (the orchestrator handles this safely — only removes the placeholder `welcome.mdx`).

## What the user does to use you

```bash
git clone https://github.com/moiseev1991-stack/wp-affiliate-template my-new-site
cd my-new-site
cp scaffold.config.example.json scaffold.config.json
# edit scaffold.config.json with: domain, language, niche, money URL/anchor/bonus, donor URL, target repo
export OPENAI_API_KEY=…
export GITHUB_TOKEN=…
export CLOUDFLARE_API_TOKEN=…   # optional
export CLOUDFLARE_ACCOUNT_ID=…  # optional

# Either:
node scripts/scaffold.mjs            # direct, no Claude needed
# Or:
claude /scaffold-site                # via this skill, headless-friendly
```

Both paths produce the same result. The skill exists only as a thin Claude-Code-friendly wrapper; the heavy lifting is in `scripts/scaffold.mjs`.

## What the orchestrator does NOT do

- Does not create the GitHub repo. The user creates it on github.com first; the orchestrator just pushes to it.
- Does not configure DNS. The user points DNS to Cloudflare manually after `wrangler deploy` succeeds.
- Does not enable Cloudflare custom domain binding. The user does that in the Cloudflare dashboard once after first deploy.

These three are intentionally out of scope — they're either user-account-bound (DNS at the registrar) or one-shot dashboard ops that don't fit a CLI flow well.
