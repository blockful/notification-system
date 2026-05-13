# notification-system

## Changesets (versioning + changelogs)

Every PR to `dev` must include a changeset describing the change, OR an empty changeset if the PR cannot ship behavior. The `changeset-check` CI job in `.github/workflows/test.yaml` blocks merges otherwise. Path-filter auto-skips PRs that touch only `**/*.md`, `.github/**`, or `.changeset/config.json`.

### How to add a changeset

Run from the repo root:

```bash
pnpm changeset
```

The CLI asks you to:
1. Select the package(s) the PR affects (space to toggle, enter to confirm). Pick every package you modified; never bundle unrelated packages into one changeset.
2. Choose the bump type per package: `patch` (bugfix / internal change), `minor` (new feature, backwards-compatible), `major` (breaking change).
3. Write a one-line summary. It appears verbatim in `CHANGELOG.md` and gets auto-linked to the PR, commit, and author.

Commit the generated `.changeset/<random>.md` file alongside your code changes.

### When to use an empty changeset

For PRs that genuinely cannot affect a package's behavior (CI tweaks not caught by the path filter, comment-only edits, etc.):

```bash
pnpm changeset --empty
```

### Special case: GraphQL contract changes in anticapture-client

If your PR touches `packages/anticapture-client/**/*.graphql` or `packages/anticapture-client/codegen.yaml`, you must add changesets for **all five** of:

- `@notification-system/anticapture-client`
- `@notification-system/dispatcher`
- `@notification-system/logic-system`
- `@notification-system/consumer`
- `@notification-system/integrated-tests`

The `graphql-contract-updates.yaml` workflow enforces this. Every consumer of the generated client sees the schema change, so each gets a changelog entry.

### Workspace dep cascades (no action needed from you)

When you bump `@notification-system/messages`, `@notification-system/rabbitmq-client`, or `@notification-system/anticapture-client`, the consumer packages automatically get a `patch` bump and a changelog line referencing the new shared-library version. You don't need to write changesets for the consumers; the cascade is handled by `updateInternalDependencies: "patch"` in `.changeset/config.json`. The GraphQL coupling above is the one exception, where consumer changesets are required regardless.

### Release flow (informational)

- PRs land on `dev` with changesets attached.
- On every push to `dev`, the `version.yaml` workflow opens or updates a single rolling "Version Packages" PR against `dev`. It consumes all pending `.changeset/*.md` files, bumps versions, and writes `CHANGELOG.md` entries.
- Before opening the weekly `dev -> main` production-deploy PR, merge the "Version Packages" PR first. The `release-readiness.yaml` workflow blocks the `dev -> main` PR if any unconsumed changesets remain.
- On push to `main`, the `release.yaml` workflow creates git tags + GitHub Releases for every bumped package. Nothing publishes to npm; every package is private.

### Never do

- Hand-edit `version` fields in `package.json`. Changesets owns version numbers.
- Hand-edit `CHANGELOG.md` files. Changesets owns them.
- Delete `.changeset/*.md` files that aren't yours; they belong to other open PRs.
- Flip `"private": true` off any package without explicit approval. The whole release pipeline assumes nothing publishes.
