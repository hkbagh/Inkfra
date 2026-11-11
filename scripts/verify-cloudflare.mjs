const token = process.env.CLOUDFLARE_API_TOKEN
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID

function fail(message) {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

function mask(value) {
  if (!value) return '(not set)'
  if (value.length <= 8) return `${value.slice(0, 2)}…${value.slice(-2)}`
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

async function cloudflare(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  const body = await response.json().catch(() => ({}))
  return { response, body }
}

if (!token) {
  fail('CLOUDFLARE_API_TOKEN is not set. Create a token in Cloudflare → My Profile → API Tokens.')
}

if (!accountId) {
  fail('CLOUDFLARE_ACCOUNT_ID is not set. Find it in Cloudflare → Workers & Pages → Account ID.')
}

console.log(`Token:     ${mask(token)}`)
console.log(`Account:   ${mask(accountId)}`)

const verify = await cloudflare('/user/tokens/verify')
if (!verify.body.success) {
  const errors = JSON.stringify(verify.body.errors ?? [])
  fail(`Cloudflare rejected the token (HTTP ${verify.response.status}): ${errors}`)
}
console.log(`Token status: ${verify.body.result?.status ?? 'unknown'}`)

const workers = await cloudflare(`/accounts/${accountId}/workers/scripts`)
if (!workers.body.success) {
  const errors = JSON.stringify(workers.body.errors ?? [])
  fail(`The token cannot access Workers in account ${mask(accountId)} (HTTP ${workers.response.status}): ${errors}`)
}

console.log(`Workers:   ${workers.body.result?.length ?? 0} script(s) visible`)
console.log('\n✔ Cloudflare credentials are valid for Workers deploys.\n')
