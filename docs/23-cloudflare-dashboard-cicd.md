# Cloudflare Dashboard CI/CD Setup

This guide connects Inkfra to Cloudflare via the dashboard (no GitHub Actions required).

## Prerequisites
- Cloudflare account
- GitHub repository connected to Cloudflare

## Steps (Workers)
1. Go to Cloudflare Dashboard → Workers & Pages → Create application.
2. Select **Connect to Git**.
3. Choose the Inkfra repository and branch `main`.
4. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/`
5. Environment variables:
   - `VITE_BASE` = `/`
6. Save and Deploy.

Cloudflare will build and deploy on every push to `main`.

## Alternative: Pages
If you prefer Cloudflare Pages:
1. Create → Pages → Connect to Git.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy.

## Secrets
No repository secrets are required when using the dashboard; Cloudflare manages authentication.

## Rollback
Use the Cloudflare dashboard to roll back to a previous deployment.
