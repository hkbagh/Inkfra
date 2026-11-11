# Plan: Deploy to Cloudflare Workers

Inkfra is deployed as a Cloudflare Worker serving static assets.

## Architecture
- `src/worker.ts` fetches assets from the `ASSETS` binding.
- `wrangler.toml` points to `./dist` and enables SPA fallback.
- CI builds and deploys on push to `main`.

## Local development
```bash
npm run build
npm run cf:dev
```

## Deploy
```bash
npm run cf:deploy
```

## CI/CD
- Workflow: `.github/workflows/deploy-cloudflare.yml`
- Required secrets:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Deploys automatically on push to `main`.

## Open-source notes
- No secrets in repo.
- Wrangler config is committed.
- Build output (`dist/`) is gitignored.
