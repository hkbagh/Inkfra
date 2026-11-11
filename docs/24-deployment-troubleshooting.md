# Deployment Troubleshooting

Inkfra has two possible deployment paths:

1. **Cloudflare Workers Builds** - Cloudflare builds and deploys on every push.
2. **GitHub Actions** - `.github/workflows/deploy-cloudflare.yml` builds and deploys with Wrangler.

Use one path per Worker. Running both causes duplicate deployments and makes failures harder to diagnose.

## Cloudflare Workers Builds

### Symptom: stale build token

```text
Failed: The build token selected for this build has been deleted or rolled and cannot be used for this build.
Please update your build token in the Worker Builds settings and retry the build.
```

This is a Cloudflare credential problem, not a source-code problem. The build cannot start because the API token stored in the Worker's build settings was deleted, rotated, or replaced.

### Fix

1. Open **Cloudflare Dashboard -> Workers & Pages**.
2. Select the `inkfra` Worker.
3. Open **Settings -> Build -> Build Configuration**.
4. In the **API token** dropdown, create or select a valid user API token.
5. Save the build configuration.
6. Open **Deployments -> View Build History**, select the failed build, and choose **Retry build**.

If the dropdown still shows only stale tokens:

1. Open **My Profile -> API Tokens -> Create Token**.
2. Create a token with:
   - **Account:** Account Settings (read), Workers Scripts (edit), Workers KV Storage (edit), Workers R2 Storage (edit)
   - **Zone:** Workers Routes (edit) for all zones on the account
   - **User:** User Details (read), Memberships (read)
3. Copy the token immediately.
4. Return to the Worker's **Build Configuration** and select the new token.

Cloudflare documents this failure in [Troubleshooting builds](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/#stale-api-token).

If selecting a new token does not clear the error, reinstall the GitHub integration:

1. Open <https://github.com/settings/installations>.
2. Select **Configure** next to **Cloudflare Workers and Pages**.
3. Uninstall the app.
4. Return to **Cloudflare Dashboard -> Workers & Pages -> Create application -> Connect to Git**.
5. Select **Add account**, install and authorize the app, and reconnect the repository.

See Cloudflare's [GitHub integration guide](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/#reinstall-the-cloudflare-github-app) for the full flow.

### Symptom: Worker name mismatch

```text
The name in your Wrangler configuration file (<name>) must match the name of your Worker.
```

The `name` in `wrangler.toml` must match the Worker name in the Cloudflare dashboard. This repository uses `name = "inkfra"`.

### Required build settings

| Setting        | Value                       |
| -------------- | --------------------------- |
| Build command  | `npm run build`             |
| Deploy command | `npx wrangler deploy`       |
| Root directory | `/`                         |
| Node version   | `24` (from `.node-version`) |

Cloudflare Workers Builds ignores Wrangler `[build]` commands. The build command above is the one that runs.

## GitHub Actions

### Symptom: deploy fails at the Wrangler step

The workflow now validates credentials before deploying and reports a readable annotation when validation fails.

Check the failed step annotations in **Actions -> Deploy to Cloudflare Workers**. The validation step distinguishes:

- `CLOUDFLARE_API_TOKEN` is missing or empty.
- The token is invalid or expired.
- `CLOUDFLARE_ACCOUNT_ID` is missing or wrong.
- The token cannot access the selected account.

To test the same credentials locally:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
$env:CLOUDFLARE_ACCOUNT_ID = "<account-id>"
npx wrangler whoami
npx wrangler deploy
```

Do not commit the token. Do not paste it into an issue or chat.

### Required repository secrets

Add both secrets in **GitHub -> Settings -> Secrets and variables -> Actions**:

| Secret                  | Where to find it                                                  |
| ----------------------- | ----------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare **My Profile -> API Tokens**                           |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare **Workers & Pages -> Account ID** in the right sidebar |

The token needs **Workers Scripts: Edit**. If you use a custom domain, add **Workers Routes: Edit** for the zone.

### Symptom: workflow runs stay queued with no jobs

A run that stays in `queued`, has `updated_at == created_at`, and reports zero jobs is a GitHub Actions platform issue, not a workflow error.

Check:

1. [GitHub Status](https://www.githubstatus.com/) for Actions incidents.
2. Open the run. If the UI cannot cancel it, the run is stuck on GitHub's side.
3. Trigger a fresh run with **Run workflow** or a new commit.
4. If fresh runs are also stuck, contact GitHub Support with the run IDs. Only GitHub can clear the stuck queue.

While GitHub Actions is unavailable, use Cloudflare Workers Builds as the deployment path after fixing the build token.

## Verify a deployment

1. Check the latest build in **Cloudflare -> Workers & Pages -> inkfra -> Deployments**.
2. Open <https://inkfra.bagh.co.in>.
3. Confirm the page title is `Inkfra — Visual Infrastructure as Code`.
4. Confirm the theme switcher is present in the toolbar.

You can also inspect the deployed HTML:

```powershell
(Invoke-WebRequest https://inkfra.bagh.co.in -UseBasicParsing).Content
```

The asset hash in `index.html` changes after each successful build.
