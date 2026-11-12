# Changesets

This directory contains changeset files describing changes for the next release.

## Workflow

1. Add a changeset to the feature PR:

   ```bash
   npx changeset
   ```

2. Choose `patch`, `minor`, or `major` and write a concise summary.
3. Commit the generated `.changeset/*.md` file with the PR.
4. Merge the PR to `main`.
5. The Release workflow opens or updates the version PR (`chore: version packages (alpha)`).
6. Review and merge the version PR.
7. The Release workflow runs `npm run release` (`changeset publish`) and creates the `v*` tag.
8. The tag triggers `Release Desktop` when `RELEASE_TOKEN` is configured.

## Prerelease mode

The repository is in Changesets prerelease mode with the `alpha` tag, configured in `.changeset/pre.json`.

```bash
npx changeset pre enter alpha   # enter prerelease mode
npx changeset pre exit          # leave prerelease mode for a stable release
```

Consumed prerelease changesets are archived under `.changeset/pre/`.

## Commands

| Command             | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `npm run changeset` | Create a changeset interactively                           |
| `npm run version`   | Apply changesets locally; normally handled by the workflow |
| `npm run release`   | Publish and tag; normally handled by the workflow          |

Do not run `npm run version` or `npm run release` locally unless you are recovering a failed release.

See [CI/CD Operations](../docs/25-ci-cd-operations.md) for the full automation flow and [CONTRIBUTING.md](../CONTRIBUTING.md) for the pull request checklist.
