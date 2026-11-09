# Deployment

## Static hosting

Inkfra is a static SPA. Deploy the `dist/` directory to any static host:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

## Build

```bash
npm run build
```

## SPA routing

The app uses client-side routing only for the single root. No additional rewrite rules are required beyond serving `index.html` for unknown paths.

## Environment

No runtime environment variables are required. All processing occurs in the browser.
