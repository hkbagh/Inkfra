# Plan: Deploy Inkfra as a Static Site

## Live deployment

Production: https://inkfra.bagh.co.in

## Recommendation

For a static SPA like Inkfra, the best options are:

1. **Cloudflare Pages (recommended)** — fastest global CDN, generous free tier, automatic HTTPS, preview deployments, and excellent performance.
2. **GitHub Pages** — simplest for an open-source project; free, integrated with the repository, and ideal for documentation/demo sites.
3. **Render / Railway** — better suited for full-stack apps with backends; overkill and costlier for a static site.

## Platform comparison

| Platform | Cost | CDN | Custom domain | Preview deploys | Best for |
| --- | --- | --- | --- | --- | --- |
| Cloudflare Pages | Free tier | Global, fastest | Yes (free) | Yes | Production static sites |
| GitHub Pages | Free | Good | Yes | Limited | Open-source demos/docs |
| Render | Free tier (limited) | Good | Yes | Yes | Full-stack apps |
| Railway | Paid after trial | Good | Yes | Yes | Backend services |

## Deployment plan

### Option A — Cloudflare Pages (recommended for production)

1. Connect the GitHub repository in Cloudflare Pages.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_BASE=/` (root domain) or your subpath.
5. Enable automatic deploys on push to `main`.
6. Add a custom domain in Cloudflare.

### Option B — GitHub Pages (recommended for open-source demo)

1. Set repository Pages source to GitHub Actions.
2. Use the provided workflow (`.github/workflows/deploy-pages.yml`).
3. Build with `VITE_BASE=/inkfra/` (or your repo name).
4. Site URL: `https://<user>.github.io/inkfra/`.

### Option C — Render / Railway

1. Create a static site service.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Not recommended unless a backend is added later.

## SPA considerations

- Inkfra has no client-side routing, so no SPA fallback is required.
- Set `VITE_BASE` correctly for subpath deployments.
- Keep `dist/` out of git (already ignored).

## Acceptance criteria

- Site loads at the target URL with correct assets.
- No 404s for JS/CSS bundles.
- Lighthouse performance score >= 90.
- Automatic redeploy on push to `main`.
