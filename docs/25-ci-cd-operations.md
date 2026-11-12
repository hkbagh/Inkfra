# CI/CD Operations

This guide is the operational reference for building, validating, deploying, and releasing Inkfra. It covers the GitHub Actions workflows, the required repository configuration, and the exact commands for invoking builds and opening pull requests.

## Workflow map

| Workflow                     | File                                      | Triggers                             | Purpose                                                                  |
| ---------------------------- | ----------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| CI                           | `.github/workflows/ci.yml`                | push to `main`, pull request, manual | Lint, build, test, Terraform formatting, and Terraform validation        |
| Deploy to Cloudflare Workers | `.github/workflows/deploy-cloudflare.yml` | push to `main`, manual               | Build, validate Cloudflare access, deploy with Wrangler, verify the site |
| Release                      | `.github/workflows/release.yml`           | push to `main`                       | Open or update the version PR, or create the release tag after merging   |
| Release Desktop              | `.github/workflows/release-desktop.yml`   | `v*` tags, manual                    | Build Windows/Linux SEA bundles and create a GitHub Release              |
| Desktop Build (Node SEA)     | `.github/workflows/desktop.yml`           | manual                               | Build Windows/Linux SEA bundles for verification                         |

A normal push to `main` starts CI, Deploy, and Release in parallel. Release only creates a tag when there are no pending changesets; otherwise it opens or updates a version pull request.

## Repository setup

### Required repository secrets

Open **GitHub → hkbagh/Inkfra → Settings → Secrets and variables → Actions**.

| Secret                  | Required    | Used by                  | Value                                                                                                                     |
| ----------------------- | ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Yes         | Deploy                   | User API token with Workers Scripts Edit, Workers Routes Edit, Account Settings Read, User Details Read, Memberships Read |
| `CLOUDFLARE_ACCOUNT_ID` | Yes         | Deploy                   | The account ID from Cloudflare Workers & Pages, not the zone ID                                                           |
| `RELEASE_TOKEN`         | Recommended | Release, Release Desktop | Fine-grained PAT with Contents Read and write, Pull requests Read and write, Metadata Read                                |
| `NPM_TOKEN`             | Optional    | Release                  | Only needed if publishing to npm; `inkfra` is currently a private package                                                 |
| `GITHUB_TOKEN`          | Automatic   | All workflows            | Provided by GitHub; no setup required                                                                                     |

### Create `RELEASE_TOKEN`

`RELEASE_TOKEN` makes the release pipeline fully automatic. Without it, GitHub's default `GITHUB_TOKEN` cannot trigger the desktop release workflow from a tag push, and version PRs created by the bot require manual CI approval.

1. Open **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Set a name such as `Inkfra Release Automation`.
3. Set an expiration. Ninety days or one year is practical for CI; set a rotation reminder.
4. Under **Repository access**, choose **Only select repositories** and select `hkbagh/Inkfra`.
5. Under **Permissions → Repository permissions**, set:
   - **Contents:** Read and write
   - **Pull requests:** Read and write
   - **Metadata:** Read-only (required automatically)
6. Click **Generate token** and copy the value immediately.
7. In the repository, open **Settings → Secrets and variables → Actions → New repository secret**.
8. Name it `RELEASE_TOKEN`, paste the value, and save.

Do not commit the token or paste it into an issue or chat. If it is exposed, revoke it in GitHub and create a replacement.

### Repository settings

1. Open **GitHub → hkbagh/Inkfra → Settings → Actions → General**.
2. Under **Workflow permissions**, select **Read repository contents and packages permissions**.
3. Enable **Allow GitHub Actions to create and approve pull requests**.
4. Optionally, create a branch protection rule or ruleset for `main`:
   - Require a pull request before merging.
   - Require the `CI / build` status check.
   - Do not allow bypassing the rule if you want the checks enforced for everyone.

The workflows declare the permissions they need, so the repository default can remain read-only.

### GitHub CLI setup

The commands in this guide use the GitHub CLI. Install it and authenticate once:

```bash
gh auth login
gh auth status
```

Install with `winget install --id GitHub.cli` on Windows, `brew install gh` on macOS, or `sudo apt install gh` on Ubuntu. Every workflow can also be run from the GitHub web UI; the CLI commands are shortcuts.

## Feature pull request workflow

### 1. Create a branch

```bash
git switch main
git pull --ff-only
git switch -c feat/my-change
```

Use a descriptive prefix such as `feat/`, `fix/`, `docs/`, or `chore/`.

### 2. Make the change and add a changeset

Run the quality gates locally:

```bash
npm run lint
npm run build
npm run test
```

If the change affects users, add a changeset:

```bash
npx changeset
```

Choose `patch`, `minor`, or `major`, then write a one-line summary. This creates a file under `.changeset/`. Commit it with the change.

Documentation-only and CI-only changes can still include a changeset if you want them in the changelog. If no changeset is present, the Release workflow will not open a new version PR for that change.

### 3. Commit and push

```bash
git add -A
git commit -m "feat: describe the change"
git push -u origin feat/my-change
```

### 4. Open the pull request

Using the GitHub CLI:

```bash
gh pr create --fill
```

Or open the compare URL in a browser:

```text
https://github.com/hkbagh/Inkfra/compare/main...feat/my-change?expand=1
```

Use the pull request template checklist: lint, build, tests, documentation, and changeset.

### 5. Watch CI

```bash
gh pr checks --watch
```

Or open the PR's **Checks** tab. The CI check is `CI / build`. CI runs on the PR and again after merge to `main`.

### 6. Merge the PR

```bash
gh pr merge --squash --delete-branch
```

After merge, CI, Deploy, and Release run on `main`. If the PR included a changeset, Release opens or updates a version PR.

## Invoking CI manually

CI supports manual runs through `workflow_dispatch`.

From the GitHub UI:

1. Open **Actions → CI**.
2. Click **Run workflow**.
3. Select the branch and run it.

From the CLI:

```bash
gh workflow run ci.yml --ref main
gh run list --workflow=ci.yml --limit 5
gh run watch
```

To re-run a failed run:

```bash
gh run rerun <run-id> --failed
```

## Deploying the site

### Automatic deployment

Every push to `main` triggers **Deploy to Cloudflare Workers**. The workflow:

1. Builds the app with `npm run build`.
2. Verifies `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
3. Confirms the token can see the `inkfra` Worker service.
4. Runs `npx wrangler deploy`.
5. Fetches `https://inkfra.bagh.co.in` and checks for the Inkfra page.
6. Uploads Wrangler logs as an artifact.

The target site is <https://inkfra.bagh.co.in>.

### Manual GitHub Actions deployment

From the UI:

1. Open **Actions → Deploy to Cloudflare Workers**.
2. Click **Run workflow**.
3. Select `main` and run it.

From the CLI:

```bash
gh workflow run deploy-cloudflare.yml --ref main
gh run list --workflow=deploy-cloudflare.yml --limit 5
gh run watch
```

### Local deployment

Authenticate Wrangler once:

```bash
npx wrangler login
```

Then build and deploy:

```bash
npm run cf:deploy
```

`cf:deploy` runs `npm run build` followed by `wrangler deploy`.

To deploy an existing `dist/` without rebuilding:

```bash
npx wrangler deploy
```

Verify the credentials locally:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
$env:CLOUDFLARE_ACCOUNT_ID = "<account-id>"
npm run verify:cloudflare
npx wrangler whoami
```

`verify:cloudflare` checks the token, lists Workers, and confirms access to the `inkfra` service. It never prints the token in full.

### Cloudflare Workers Builds

Cloudflare Workers Builds is an alternative deployment path. Use it **or** GitHub Actions, never both, to avoid duplicate deployments.

If you use GitHub Actions, leave the Cloudflare Git integration disconnected or enable **Disable builds** under **Worker → Settings → Build**.

If you use Workers Builds, follow [Cloudflare Dashboard CI/CD](./23-cloudflare-dashboard-cicd.md) and disable the GitHub Actions deploy workflow.

## Release workflow

The repository uses [Changesets](https://github.com/changesets/changesets). A release has two stages: a feature PR with a changeset, then a version PR generated by the Release workflow.

### Alpha releases (current mode)

The repository is in Changesets prerelease mode with the `alpha` tag, configured in `.changeset/pre.json`.

1. Merge one or more feature PRs containing changesets into `main`.
2. The Release workflow opens or updates a PR titled `chore: version packages (alpha)`.
3. If `RELEASE_TOKEN` is configured, CI runs on the version PR automatically. Otherwise approve the waiting CI run in **Actions**.
4. Review the version PR: it updates `package.json`, `CHANGELOG.md`, and moves the consumed changesets under `.changeset/pre/`.
5. Merge the version PR.
6. The Release workflow runs `npm run release` (`changeset publish`), which creates the tag `v0.2.0-alpha.N`.
7. If `RELEASE_TOKEN` is configured, **Release Desktop** starts automatically. Otherwise dispatch it manually:

```bash
gh workflow run release-desktop.yml -f tag=v0.2.0-alpha.N
```

8. Verify the release:

```bash
gh release list
gh release view v0.2.0-alpha.N
gh release download v0.2.0-alpha.N -p "inkfra-*.zip"
```

Each release contains:

- `inkfra-windows.zip` — `inkfra.exe` and `dist/`
- `inkfra-linux.zip` — `inkfra` and `dist/`

### Stable releases

To leave prerelease mode:

```bash
npx changeset pre exit
git add .changeset/pre.json
git commit -m "chore(release): exit alpha prerelease mode"
git push
```

Before merging the next version PR, review the archived changesets in `.changeset/pre/` and keep only the ones that should appear in the stable changelog.

The next version PR will contain a stable version instead of an alpha version. Merge it, then verify the `vX.Y.Z` tag and GitHub Release the same way as an alpha release.

To re-enter prerelease mode later:

```bash
npx changeset pre enter alpha
git add .changeset/pre.json
git commit -m "chore(release): enter alpha prerelease mode"
git push
```

### Manual desktop build

Use this to verify packaging without creating a release:

```bash
gh workflow run desktop.yml --ref main
gh run list --workflow=desktop.yml --limit 5
gh run download <run-id>
```

The workflow uploads `inkfra-windows-latest` and `inkfra-ubuntu-latest` artifacts. Each artifact contains a zip with the executable and the full `dist/` directory.

### Manual desktop release for an existing tag

If a tag exists but the desktop release did not run, dispatch it manually:

```bash
gh workflow run release-desktop.yml -f tag=v0.2.0-alpha.N
```

In the UI, open **Actions → Release Desktop → Run workflow** and enter the tag.

The workflow checks out the tag, builds both platforms, and creates or updates the GitHub Release. Tags containing `-alpha` are marked as prereleases.

## Verifying a deployment or release

### Live site

```powershell
(Invoke-WebRequest https://inkfra.bagh.co.in -UseBasicParsing).Content
```

Confirm the page title is `Inkfra — Visual Infrastructure as Code` and the asset hash in `index.html` matches the build output in `dist/index.html`.

### Workflow logs

```bash
gh run list --limit 10
gh run view <run-id> --log
gh run view <run-id> --log-failed
```

The Deploy workflow also uploads a `wrangler-logs` artifact containing `wrangler-whoami.log` and `wrangler-deploy.log`.

### Release assets

```bash
gh release view v0.2.0-alpha.N
gh release download v0.2.0-alpha.N -p "inkfra-windows.zip"
```

## Troubleshooting

| Symptom                                               | Fix                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Deploy fails at **Validate Cloudflare credentials**   | Check `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; run `npm run verify:cloudflare` locally             |
| `No access to the specified service`                  | Set the token's Workers Scripts resources to **All Workers**, or include `inkfra`                             |
| Version PR CI is waiting for approval                 | Configure `RELEASE_TOKEN`, or approve the run in Actions                                                      |
| Tag exists but no desktop release                     | Configure `RELEASE_TOKEN`, or run `gh workflow run release-desktop.yml -f tag=<tag>`                          |
| Desktop executable returns 404                        | Keep the `dist/` directory next to the executable; use the release zip instead of downloading the bare binary |
| Release PR is stale                                   | The Release workflow updates it on the next push to `main`; merge `main` into the PR if needed                |
| Cloudflare Workers Builds and GitHub Actions conflict | Use one path. Disable Cloudflare builds or disable the GitHub Actions deploy workflow                         |
| GitHub Actions runs stay queued with no jobs          | Check [GitHub Status](https://www.githubstatus.com/); re-run or push a new commit once the platform recovers  |

## Quick command reference

```bash
# Local quality gates
npm run lint
npm run build
npm run test

# CI
gh workflow run ci.yml --ref main
gh run list --workflow=ci.yml --limit 5

# Deploy
gh workflow run deploy-cloudflare.yml --ref main
npm run cf:deploy

# Feature PR
git switch -c feat/my-change
npx changeset
git push -u origin feat/my-change
gh pr create --fill
gh pr checks --watch
gh pr merge --squash --delete-branch

# Alpha release verification
gh release list
gh workflow run release-desktop.yml -f tag=v0.2.0-alpha.N

# Prerelease mode
npx changeset pre enter alpha   # only when re-entering prerelease mode
npx changeset pre exit          # prepare a stable release
```

## Related documents

- [Deployment](./14-deployment.md)
- [Testing & Quality](./13-testing-and-quality.md)
- [Desktop Release Plan](./20-desktop-release-plan.md)
- [Cloudflare Workers Deployment](./22-cloudflare-workers-deployment.md)
- [Cloudflare Dashboard CI/CD](./23-cloudflare-dashboard-cicd.md)
- [Deployment Troubleshooting](./24-deployment-troubleshooting.md)
