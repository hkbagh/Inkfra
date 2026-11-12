# Deployment

## Deployment paths

Inkfra is a static SPA deployed as a Cloudflare Worker serving the Vite build through the `ASSETS` binding.

Choose one deployment path:

| Path                      | Trigger                | Use when                                              |
| ------------------------- | ---------------------- | ----------------------------------------------------- |
| GitHub Actions            | Push to `main`, manual | Recommended; full validation and live-site smoke test |
| Cloudflare Workers Builds | Push to `main`         | You prefer Cloudflare's dashboard-managed builds      |

Do not run both paths for the same Worker. See [CI/CD Operations](./25-ci-cd-operations.md) for the complete workflow.

## Build

```bash
npm run build
```

The output is written to `dist/`. The build runs `tsc -b` followed by `vite build`.

## Deploy with GitHub Actions

The workflow is `.github/workflows/deploy-cloudflare.yml`.

Every push to `main`:

1. Builds the app.
2. Validates `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
3. Confirms the token can access the `inkfra` Worker service.
4. Runs `npx wrangler deploy`.
5. Verifies <https://inkfra.bagh.co.in> responds with the Inkfra page.
6. Uploads Wrangler logs as an artifact.

Manual run from the GitHub UI:

1. Open **Actions → Deploy to Cloudflare Workers**.
2. Click **Run workflow**.
3. Select `main` and run it.

Manual run from the CLI:

```bash
gh workflow run deploy-cloudflare.yml --ref main
gh run list --workflow=deploy-cloudflare.yml --limit 5
gh run watch
```

Required secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

See [Deployment Troubleshooting](./24-deployment-troubleshooting.md) for token-scope and credential errors.

## Deploy locally

Authenticate Wrangler once:

```bash
npx wrangler login
```

Build and deploy:

```bash
npm run cf:deploy
```

`cf:deploy` runs `npm run build` and then `wrangler deploy`.

Deploy an existing `dist/` without rebuilding:

```bash
npx wrangler deploy
```

Only do this when `dist/` is known to be current.

Verify credentials:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
$env:CLOUDFLARE_ACCOUNT_ID = "<account-id>"
npm run verify:cloudflare
npx wrangler whoami
```

The verifier checks the token, lists Workers, and confirms access to `inkfra`. It never prints the token in full.

## Cloudflare Workers Builds

If you use Cloudflare Workers Builds instead of GitHub Actions:

1. Follow [Cloudflare Dashboard CI/CD](./23-cloudflare-dashboard-cicd.md).
2. Disable the GitHub Actions deploy workflow to avoid duplicate deployments.
3. Keep the build command set to `npm run build` and the deploy command to `npx wrangler deploy`.

If you use GitHub Actions, leave the Cloudflare Git integration disconnected or enable **Disable builds** under **Worker → Settings → Build**.

## Verify a deployment

```powershell
(Invoke-WebRequest https://inkfra.bagh.co.in -UseBasicParsing).Content
```

Confirm:

- The title is `Inkfra — Visual Infrastructure as Code`.
- The asset hash in the live `index.html` matches `dist/index.html`.
- The toolbar includes the Examples, Validate, and Generate .tf actions.
- The canvas empty state links to the example projects dialog.

## SPA routing

The app uses client-side routing only for the single root. The Worker uses `not_found_handling = "single-page-application"` so unknown paths fall back to `index.html`.

## Environment

No runtime environment variables are required. All processing occurs in the browser.

## Related documents

- [CI/CD Operations](./25-ci-cd-operations.md)
- [Cloudflare Workers Deployment](./22-cloudflare-workers-deployment.md)
- [Cloudflare Dashboard CI/CD](./23-cloudflare-dashboard-cicd.md)
- [Deployment Troubleshooting](./24-deployment-troubleshooting.md)
