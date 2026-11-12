# Deployment Troubleshooting

Inkfra has two possible deployment paths:

1. **Cloudflare Workers Builds** - Cloudflare builds and deploys on every push.
2. **GitHub Actions** - `.github/workflows/deploy-cloudflare.yml` builds and deploys with Wrangler.

Use one path per Worker. Running both causes duplicate deployments and makes failures harder to diagnose.

For the normal build, pull request, deploy, and release sequence, see [CI/CD Operations](./25-ci-cd-operations.md).

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

### Symptom: project is disconnected from your Git account

Cloudflare shows this banner under **Settings -> Build**:

```text
This project is disconnected from your Git account. This may cause deployments to fail.
```

The Worker still lists `hkbagh/Inkfra`, but Cloudflare no longer has an authorized GitHub installation that can read the repository. Builds fail before they reach the build token check.

### Fix

1. Open **Cloudflare Dashboard -> Workers & Pages -> inkfra -> Settings -> Build**.
2. Next to **Git repository**, select **Manage**.
3. Reconnect the GitHub account and grant access to `hkbagh/Inkfra`.
4. If **Manage** does not offer a reconnect, select **Disconnect**, then reconnect the repository with **Connect to Git**.
5. If the GitHub app is missing or revoked, open <https://github.com/settings/installations>, select **Configure** next to **Cloudflare Workers and Pages**, and grant access to the repository. Reinstall the app if it is not listed.
6. Save the configuration and retry the failed build from **Deployments -> View Build History**.

The disconnected-account banner must be gone before a Workers Builds deployment can succeed. This is separate from the build API token, so replacing the token alone does not fix it.

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
- The token can list Workers but cannot access the `inkfra` Worker service.

To test the same credentials locally:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
$env:CLOUDFLARE_ACCOUNT_ID = "<account-id>"
npm run verify:cloudflare
npx wrangler whoami
npx wrangler deploy
```

`verify:cloudflare` checks the token with Cloudflare's `/user/tokens/verify` endpoint, confirms the token can list Workers scripts in the account, and confirms it can access the `inkfra` Worker service from `wrangler.toml`. It never prints the token or account ID in full.

Do not commit the token. Do not paste it into an issue or chat.

### Symptom: No access to the specified service

```text
A request to the Cloudflare API (/accounts/<account-id>/workers/services/inkfra) failed.
No access to the specified service.
```

This is a token scope problem, not a deployment problem. The token is valid and may be able to list Workers, but its **Workers Scripts** permission is restricted to specific Workers and does not include `inkfra`. Wrangler needs access to the individual service to deploy it.

The preflight log shows the telltale pair:

```text
Workers access: {"success":true,"errors":[],"scripts":0}
Worker service access: {"success":false,"errors":[{"message":"No access to the specified service."}]}
```

`scripts: 0` means the token's Workers Scripts resource scope is empty or excludes `inkfra`, even though the token itself is active.

### Fix

1. Open **Cloudflare Dashboard -> My Profile -> API Tokens**.
2. Edit the token used by the `CLOUDFLARE_API_TOKEN` repository secret.
3. Under **Permissions**, set **Account -> Workers Scripts -> Edit**.
4. Under **Resources**, choose **All Workers**, or add `inkfra` to the selected Workers.
5. Save the token. Updating permissions does not change the token value, so the existing secret remains valid.
6. Run `npm run verify:cloudflare` locally, then rerun the workflow.

If the token was created from the Workers Builds screen, it may be a build token rather than a deploy token. Create a separate user API token with the permissions above and update the GitHub secret.

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

## Re-run or trigger workflows

List recent runs:

```bash
gh run list --limit 10
gh run list --workflow=deploy-cloudflare.yml --limit 5
```

View a failed run and its failed logs:

```bash
gh run view <run-id>
gh run view <run-id> --log-failed
```

Re-run a failed workflow:

```bash
gh run rerun <run-id> --failed
```

Trigger a fresh deploy without a new commit:

```bash
gh workflow run deploy-cloudflare.yml --ref main
gh run watch
```

Trigger a desktop build or a desktop release for an existing tag:

```bash
gh workflow run desktop.yml --ref main
gh workflow run release-desktop.yml -f tag=v0.2.0-alpha.N
```

CI also supports manual dispatch:

```bash
gh workflow run ci.yml --ref main
```

## Verify a deployment

1. Check the latest build in **Cloudflare -> Workers & Pages -> inkfra -> Deployments**.
2. Open <https://inkfra.bagh.co.in>.
3. Confirm the page title is `Inkfra — Visual Infrastructure as Code`.
4. Confirm the Examples button is present in the toolbar and opens the example projects dialog.

You can also inspect the deployed HTML:

```powershell
(Invoke-WebRequest https://inkfra.bagh.co.in -UseBasicParsing).Content
```

The asset hash in `index.html` changes after each successful build.
