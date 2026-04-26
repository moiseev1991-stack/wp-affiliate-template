#!/usr/bin/env node
// Pushes a freshly scaffolded site to a GitHub repo the user has ALREADY CREATED.
// Does NOT create the repo. The user creates it on github.com first.
//
// Required env: REPO_URL (full https URL or owner/name), OPENAI_API_KEY
// Optional env: DOMAIN, SET_PAGES ("true" to also enable Pages + CNAME)

import fs from 'node:fs'
import { execSync, spawnSync } from 'node:child_process'
import process from 'node:process'

const { REPO_URL, OPENAI_API_KEY, DOMAIN, SET_PAGES } = process.env
if (!REPO_URL || !OPENAI_API_KEY) {
  console.error('Missing env: REPO_URL, OPENAI_API_KEY')
  process.exit(1)
}

function parseRepo(input) {
  let s = input.trim().replace(/\.git$/, '')
  const m = s.match(/github\.com[:/]+([^/]+)\/([^/]+)/i)
  if (m) return { owner: m[1], name: m[2] }
  const slash = s.match(/^([^/]+)\/([^/]+)$/)
  if (slash) return { owner: slash[1], name: slash[2] }
  throw new Error(`Cannot parse repo: ${input}`)
}
const { owner, name: repoName } = parseRepo(REPO_URL)

function getGithubToken() {
  try {
    const r = spawnSync('git', ['credential-manager', 'get'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8',
    })
    if (r.stdout) {
      const m = r.stdout.match(/^password=(.+)$/m)
      if (m) return m[1].trim()
    }
  } catch {}
  try {
    const r = spawnSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8',
    })
    if (r.stdout) {
      const m = r.stdout.match(/^password=(.+)$/m)
      if (m) return m[1].trim()
    }
  } catch {}
  try {
    const out = execSync('gh auth token', { encoding: 'utf-8' }).trim()
    if (out) return out
  } catch {}
  return null
}

const token = process.env.GH_TOKEN || getGithubToken()
if (!token) {
  console.error('Could not capture GitHub token. Run `gh auth login` or set GH_TOKEN env var.')
  process.exit(1)
}

const ghHeaders = {
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'scaffold-site',
}

async function gh(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch {}
  return { ok: res.ok, status: res.status, data, text }
}

console.log(`→ Verifying repo ${owner}/${repoName} exists`)
const repoRes = await gh('GET', `/repos/${owner}/${repoName}`)
if (repoRes.status === 404) {
  console.error(`Repo ${owner}/${repoName} not found. Create it on github.com first, then re-run.`)
  process.exit(1)
}
if (!repoRes.ok) {
  console.error('Repo lookup failed:', repoRes.status, repoRes.text)
  process.exit(1)
}
const defaultBranch = repoRes.data.default_branch || 'master'
console.log(`  exists, default branch: ${defaultBranch}`)

console.log('→ Setting OPENAI_API_KEY secret')
const sodium = (await import('libsodium-wrappers')).default
await sodium.ready
const keyRes = await gh('GET', `/repos/${owner}/${repoName}/actions/secrets/public-key`)
if (!keyRes.ok) {
  console.error('public-key fetch failed:', keyRes.status, keyRes.text)
  process.exit(1)
}
const pkBytes = sodium.from_base64(keyRes.data.key, sodium.base64_variants.ORIGINAL)
const valBytes = sodium.from_string(OPENAI_API_KEY)
const enc = sodium.crypto_box_seal(valBytes, pkBytes)
const encB64 = sodium.to_base64(enc, sodium.base64_variants.ORIGINAL)
const putRes = await gh('PUT', `/repos/${owner}/${repoName}/actions/secrets/OPENAI_API_KEY`, {
  encrypted_value: encB64,
  key_id: keyRes.data.key_id,
})
if (!putRes.ok) {
  console.error('secret PUT failed:', putRes.status, putRes.text)
  process.exit(1)
}
console.log('  secret set')

console.log('→ Initializing local git')
function git(args) {
  return execSync(`git ${args}`, { stdio: 'inherit' })
}
if (!fs.existsSync('.git')) {
  git(`init -b ${defaultBranch}`)
}
try { execSync('git remote remove origin', { stdio: 'ignore' }) } catch {}
git(`remote add origin https://${owner}:${token}@github.com/${owner}/${repoName}.git`)

console.log('→ Committing and pushing')
git('add -A')
try {
  git('commit -m "chore: initial scaffold from wp-affiliate-template"')
} catch {
  console.log('  nothing to commit')
}
git(`push -u origin ${defaultBranch}`)

if (SET_PAGES === 'true') {
  console.log('→ Enabling GitHub Pages (deploy branch)')
  // wait for deploy branch
  let exists = false
  for (let i = 0; i < 24; i++) {
    const r = await gh('GET', `/repos/${owner}/${repoName}/branches/deploy`)
    if (r.ok) { exists = true; break }
    await new Promise(r => setTimeout(r, 5000))
  }
  if (!exists) {
    console.warn('  deploy branch did not appear within 2 minutes — enable Pages manually later')
  } else {
    let r = await gh('POST', `/repos/${owner}/${repoName}/pages`, { source: { branch: 'deploy', path: '/' } })
    if (r.ok || r.status === 409) {
      if (DOMAIN) {
        await gh('PUT', `/repos/${owner}/${repoName}/pages`, { cname: DOMAIN, https_enforced: true })
      }
      console.log(`  Pages enabled${DOMAIN ? ` with CNAME ${DOMAIN}` : ''}`)
    } else {
      console.warn('  Pages enable returned', r.status, r.text)
    }
  }
}

console.log('')
console.log('==========================================')
console.log(`✓ Repo: https://github.com/${owner}/${repoName}`)
console.log(`✓ Pushed: ${defaultBranch}`)
console.log(`✓ Secret OPENAI_API_KEY: set`)
if (SET_PAGES === 'true') {
  console.log(`⏳ Point DNS A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153`)
} else {
  console.log(`⏳ Enable GitHub Pages manually: Settings → Pages → Source: deploy branch / "/"`)
  if (DOMAIN) console.log(`⏳ Set CNAME to ${DOMAIN} and point DNS A records to GitHub Pages IPs`)
}
console.log(`⏳ First weekly auto-post: Monday 10:00 UTC (or run manually via Actions tab)`)
console.log('==========================================')
