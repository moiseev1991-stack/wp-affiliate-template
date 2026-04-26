#!/usr/bin/env node
// Bootstraps a new GitHub repo for a freshly scaffolded site:
//   1. captures user's GitHub token (git credential-manager on Windows, gh CLI fallback)
//   2. creates public repo
//   3. sets OPENAI_API_KEY secret (libsodium sealed box)
//   4. initializes git, sets remote, commits, pushes master
//   5. enables GitHub Pages with custom CNAME on deploy branch
//
// Required env: REPO_NAME, DOMAIN, OPENAI_API_KEY

import fs from 'node:fs'
import { execSync, spawnSync } from 'node:child_process'
import process from 'node:process'

const { REPO_NAME, DOMAIN, OPENAI_API_KEY } = process.env
if (!REPO_NAME || !DOMAIN || !OPENAI_API_KEY) {
  console.error('Missing env: REPO_NAME, DOMAIN, OPENAI_API_KEY')
  process.exit(1)
}

function getGithubToken() {
  // 1. try git credential-manager (Windows GCM, macOS osxkeychain helper, etc.)
  try {
    const result = spawnSync('git', ['credential-manager', 'get'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8',
    })
    if (result.stdout) {
      const m = result.stdout.match(/^password=(.+)$/m)
      if (m) return m[1].trim()
    }
  } catch {}
  // 2. try generic git credential helper
  try {
    const result = spawnSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8',
    })
    if (result.stdout) {
      const m = result.stdout.match(/^password=(.+)$/m)
      if (m) return m[1].trim()
    }
  } catch {}
  // 3. try gh CLI
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

console.log('→ Identifying GitHub user')
const userRes = await gh('GET', '/user')
if (!userRes.ok) {
  console.error('Failed to identify user:', userRes.status, userRes.text)
  process.exit(1)
}
const ghUser = userRes.data.login
console.log(`  user: ${ghUser}`)

console.log(`→ Creating repo ${ghUser}/${REPO_NAME}`)
const createRes = await gh('POST', '/user/repos', {
  name: REPO_NAME,
  description: `Affiliate blog for ${DOMAIN}`,
  private: false,
  has_issues: false,
  has_projects: false,
  has_wiki: false,
  auto_init: false,
})
if (createRes.status === 422 && /already exists/i.test(createRes.text)) {
  console.log('  repo already exists — continuing')
} else if (!createRes.ok) {
  console.error('Repo create failed:', createRes.status, createRes.text)
  process.exit(1)
} else {
  console.log(`  created: ${createRes.data.html_url}`)
}

console.log('→ Setting OPENAI_API_KEY secret')
const sodium = (await import('libsodium-wrappers')).default
await sodium.ready
const keyRes = await gh('GET', `/repos/${ghUser}/${REPO_NAME}/actions/secrets/public-key`)
if (!keyRes.ok) {
  console.error('public-key fetch failed:', keyRes.status, keyRes.text)
  process.exit(1)
}
const pkBytes = sodium.from_base64(keyRes.data.key, sodium.base64_variants.ORIGINAL)
const valBytes = sodium.from_string(OPENAI_API_KEY)
const enc = sodium.crypto_box_seal(valBytes, pkBytes)
const encB64 = sodium.to_base64(enc, sodium.base64_variants.ORIGINAL)
const putRes = await gh('PUT', `/repos/${ghUser}/${REPO_NAME}/actions/secrets/OPENAI_API_KEY`, {
  encrypted_value: encB64,
  key_id: keyRes.data.key_id,
})
if (!putRes.ok) {
  console.error('secret PUT failed:', putRes.status, putRes.text)
  process.exit(1)
}
console.log('  secret set')

console.log('→ Initializing local git')
function git(args, opts = {}) {
  return execSync(`git ${args}`, { stdio: 'inherit', ...opts })
}
if (!fs.existsSync('.git')) {
  git('init -b master')
}
// Reset remote
try { execSync('git remote remove origin', { stdio: 'ignore' }) } catch {}
git(`remote add origin https://${ghUser}:${token}@github.com/${ghUser}/${REPO_NAME}.git`)

console.log('→ Committing and pushing')
git('add -A')
try {
  git('commit -m "chore: initial scaffold from wp-affiliate-template"')
} catch {
  console.log('  nothing to commit (or already committed)')
}
git('push -u origin master')

console.log('→ Waiting for first Build & Deploy run to publish deploy branch')
// Pages cannot be enabled until the deploy branch exists. Poll for it.
let deployBranchExists = false
for (let i = 0; i < 24; i++) {
  const r = await gh('GET', `/repos/${ghUser}/${REPO_NAME}/branches/deploy`)
  if (r.ok) { deployBranchExists = true; break }
  await new Promise(r => setTimeout(r, 5000))
}
if (!deployBranchExists) {
  console.warn('  deploy branch not created within 2 minutes — check GitHub Action logs')
} else {
  console.log('  deploy branch exists')
  console.log('→ Enabling GitHub Pages')
  let pagesRes = await gh('POST', `/repos/${ghUser}/${REPO_NAME}/pages`, {
    source: { branch: 'deploy', path: '/' },
  })
  if (pagesRes.status === 409) {
    pagesRes = await gh('PUT', `/repos/${ghUser}/${REPO_NAME}/pages`, {
      source: { branch: 'deploy', path: '/' },
      cname: DOMAIN,
      https_enforced: true,
    })
  } else if (pagesRes.ok) {
    await gh('PUT', `/repos/${ghUser}/${REPO_NAME}/pages`, {
      cname: DOMAIN,
      https_enforced: true,
    })
  }
  console.log(`  Pages: https://${DOMAIN}`)
}

console.log('')
console.log('==========================================')
console.log(`✓ Repo: https://github.com/${ghUser}/${REPO_NAME}`)
console.log(`✓ Domain (CNAME): ${DOMAIN}`)
console.log(`✓ Secret OPENAI_API_KEY: set`)
console.log(`⏳ Point DNS A records to GitHub Pages: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153`)
console.log(`⏳ First auto-post: next Monday 10:00 UTC`)
console.log('==========================================')
