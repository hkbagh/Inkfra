# Contributing

Thanks for contributing to Inkfra!

## Development setup

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Before submitting

Run the local quality gates:

```bash
npm run lint
npm run build
npm run test
```

For changes that affect generated Terraform or the example projects:

```bash
terraform fmt -check -recursive examples
```

Then validate each example:

```bash
cd examples/aws-basic
terraform init -backend=false
terraform validate
```

Repeat for `examples/three-tier-webapp`.

## Pull request workflow

1. Create a branch from `main`:

   ```bash
   git switch main
   git pull --ff-only
   git switch -c feat/my-change
   ```

2. Make the change and add a changeset for user-facing changes:

   ```bash
   npx changeset
   ```

   Choose `patch`, `minor`, or `major`, and write a concise summary. Commit the generated `.changeset/*.md` file with the change.

3. Commit and push:

   ```bash
   git add -A
   git commit -m "feat: describe the change"
   git push -u origin feat/my-change
   ```

4. Open the pull request:

   ```bash
   gh pr create --fill
   ```

   Or use the browser:

   ```text
   https://github.com/hkbagh/Inkfra/compare/main...feat/my-change?expand=1
   ```

5. Wait for CI:

   ```bash
   gh pr checks --watch
   ```

   The required job is `CI / build`. It runs lint, build, tests, Terraform formatting, and Terraform validation.

6. Merge the pull request:

   ```bash
   gh pr merge --squash --delete-branch
   ```

## Changesets and releases

- Every user-facing change should include a changeset.
- Documentation-only and CI-only changes may skip a changeset; add one if you want the change in the changelog.
- Do not run `npm run version` or `npm run release` locally unless recovering from a failed release. The Release workflow handles versioning and tagging.
- The repository currently uses Changesets prerelease mode with the `alpha` tag. The release workflow opens `chore: version packages (alpha)` pull requests.
- Stable releases require `npx changeset pre exit` before the version PR is generated.

See [CI/CD Operations](./docs/25-ci-cd-operations.md) for the full release process, including alpha and stable releases.

## CI, deployment, and desktop builds

- CI runs automatically on pull requests and pushes to `main`.
- Deploy runs automatically on every push to `main` and publishes <https://inkfra.bagh.co.in>.
- Manual CI: `gh workflow run ci.yml --ref main`
- Manual deploy: `gh workflow run deploy-cloudflare.yml --ref main`, or `npm run cf:deploy` locally.
- Manual desktop build: `gh workflow run desktop.yml --ref main`
- Manual desktop release for an existing tag: `gh workflow run release-desktop.yml -f tag=v0.2.0-alpha.N`

Maintainers should configure `RELEASE_TOKEN` so version pull requests trigger CI automatically and tag pushes trigger the desktop release workflow. See [CI/CD Operations](./docs/25-ci-cd-operations.md#create-release_token).

## Pull request checklist

The pull request template tracks the essentials:

- Lint passes.
- Build passes.
- Tests pass.
- Documentation is updated.
- A changeset is included when the change is user-facing.

Keep changes focused and well-described, include tests for new logic, and follow the existing code style.
