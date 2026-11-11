# Cloudflare Dashboard CI/CD Setup

This guide connects Inkfra to Cloudflare Workers Builds through the Cloudflare dashboard. No GitHub Actions secrets are required.

Use this path **or** the GitHub Actions workflow in `.github/workflows/deploy-cloudflare.yml`, not both.

## Prerequisites

- A Cloudflare account with Workers enabled.
- The GitHub repository connected to Cloudflare.

## Connect the Worker

1. Open **Cloudflare Dashboard -> Workers & Pages**.
2. Select **Create application -> Connect to Git**.
3. Authorize Cloudflare's GitHub integration and select `hkbagh/Inkfra`.
4. Select the `main` branch.
5. Configure the build:

   | Setting        | Value                 |
   | -------------- | --------------------- |
   | Build command  | `npm run build`       |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/`                   |
   | Node version   | `24`                  |

6. Add environment variables:

   | Variable       | Value |
   | -------------- | ----- |
   | `VITE_BASE`    | `/`   |
   | `NODE_VERSION` | `24`  |

7. Save and deploy.

Cloudflare builds and deploys on every push to `main`.

## Build token

Workers Builds uses an API token stored in **Settings -> Build -> Build Configuration**. If that token is deleted or rotated, builds fail before `npm run build` starts:

```text
Failed: The build token selected for this build has been deleted or rolled and cannot be used for this build.
```

Create a new token and select it in the build configuration. See [Deployment Troubleshooting](./24-deployment-troubleshooting.md) for the required permissions and step-by-step recovery.

## Custom domain

Attach `inkfra.bagh.co.in` in **Worker -> Settings -> Domains & Routes**. The `wrangler.toml` file intentionally does not pin the route so the same repository can deploy to preview environments.

## Alternative: Cloudflare Pages

1. Open **Workers & Pages -> Create application -> Pages -> Connect to Git**.
2. Select the repository and branch.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy.

## Rollback

Open **Worker -> Deployments**, select a previous deployment, and choose **Rollback**. Build history is retained for 90 days.
