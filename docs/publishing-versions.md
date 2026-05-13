# Publishing versions (`@step-nc/*`)

This repository uses **[Changesets](https://github.com/changesets/changesets)** to version and publish monorepo packages to npm. The default integration branch is **`master`** (configured in `.changeset/config.json` as `baseBranch`).

For automated publishing in GitHub Actions, you must provide the **`NPM_TOKEN`** secret. See [Configure `NPM_TOKEN` in GitHub](./github-npm-token.md).

---

## Key ideas

| Concept | What it is |
|---------|------------|
| **Changeset** | A file in `.changeset/` that declares affected packages and bump type (major / minor / patch). |
| **"Version Packages" PR** | A pull request that applies version bumps, updates `package.json`, changelogs, and internal dependency versions. |
| **npm publish** | Happens once that PR is merged into `master` and no pending changesets remain: the workflow runs `changeset publish`. |

`@step-nc/examples` is listed in Changesets `ignore`: it is neither versioned nor published.

---

## How the flow works (summary)

1. **Regular development:** implement changes in feature branches and open PRs to `master` (CI validates typecheck, lint, tests, etc., once workflows are in place).
2. **Record release intent:** in your branch (or in `master` after merge), add one or more changesets with `pnpm changeset`. Commit and push `.changeset/*.md` files.
3. **Push to `master`:** release workflow (`.github/workflows/release.yml`, when present) runs.
   - If there **are** pending changesets, [changesets/action](https://github.com/changesets/action) creates or updates a PR titled **"chore: version packages"**.
   - If there are **no** pending changesets (because that PR was merged), the action runs **`pnpm run release`** (`changeset publish`) and publishes to npm.
4. Before publishing, the workflow runs **`pnpm run prerelease`** (typecheck, `lint:check`, tests). If it fails, publishing is blocked.

npm authentication in CI uses root **`.npmrc`**:

```text
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

GitHub Actions injects the real value from repository secrets.

---

## Create a new release (step by step)

### 1. Create a changeset

From monorepo root:

```bash
pnpm changeset
```

Interactive prompts ask for:

- affected package(s);
- bump type per package (**major**, **minor**, **patch**);
- short user-facing changelog message.

This creates file(s) in **`.changeset/`** (for example `brave-foxes-jump.md`). Commit those files with related code changes, or as a dedicated pre-release commit.

For changes that should not trigger a release:

```bash
pnpm changeset --empty
```

### 2. Merge into `master`

Open a PR to **`master`**, pass CI, and merge. If you work directly on `master`, push after committing the changeset.

### 3. "chore: version packages" PR

After pushing changesets to `master`, the workflow should create or update the **"chore: version packages"** PR. Review version bumps/changelogs and merge when ready.

### 4. Publish

When that PR is merged, the next `master` run sees no open changesets and runs **`pnpm run release`**.

### 5. Verify on npm

For example:

```bash
npm view @step-nc/express-parser version
npm view @step-nc/step-factory version
```

Publishable workspace packages: `express-parser`, `express-dictionary`, `p21-parser`, `p21-reader`, `p21-writer`, `step-factory`.

---

## Useful commands (reference)

| Command | Usage |
|---------|-------|
| `pnpm changeset` | Create new changesets. |
| `pnpm changeset status` | Show status against base branch (`master`). |
| `pnpm version-packages` | Apply versions/changelog locally (`changeset version`). Usually done in CI via version PR. |
| `pnpm release` | Publish to npm (`changeset publish`). In normal flow, CI runs this after merging the version PR. |

Do not publish manually unless there is an emergency and explicit team agreement. The intended process is CI-driven for consistency and reproducibility.

---

## Internal dependency bump behavior

In `.changeset/config.json`, `updateInternalDependencies` is set to **`patch`**. When one package version changes, internal references are coordinated with patch bumps in the version PR.

---

## More help

- [Configure `NPM_TOKEN` in GitHub](./github-npm-token.md)
- [Changesets docs](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
