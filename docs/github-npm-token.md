# Configure `NPM_TOKEN` in GitHub Actions

The release workflow uses **Changesets** to publish `@step-nc/*` packages to the public npm registry. Authentication is handled with an **npm token** stored as a GitHub secret and exposed to Actions through **`NPM_TOKEN`**.

At the repository root, **`.npmrc`** contains:

```text
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

`pnpm` and `npm publish` read that line, and CI injects the value. Never commit the token in plain text.

For the full versioning and PR flow, see [Publishing versions](./publishing-versions.md).

---

## 1. Create a token on npmjs.com

1. Sign in to [https://www.npmjs.com/](https://www.npmjs.com/).
2. Open your avatar menu -> **Access Tokens** (or go directly to [https://www.npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens)).
3. Click **Generate New Token** and choose **Automation** (recommended for CI to publish packages without interactive 2FA prompts, according to current npm policy).
4. Give the token a recognizable name (for example, `step-nc-github-actions`).
5. Copy the token once. npm will not show it again.

Requirements:

- The account (or npm organization) must have **publish permissions** for the **`@step-nc`** scope. If this is the first publish, you may need to create or configure the organization/scope and ensure your user has **owner** or **maintainer** permissions.

---

## 2. Add the secret in GitHub

1. Open the repository on GitHub.
2. Go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Click **New repository secret**.
4. **Name:** `NPM_TOKEN` (exactly; the workflow expects `secrets.NPM_TOKEN`).
5. **Secret:** paste the npm Automation token.
6. Save.

Optional:

- In organizations, you can use **Organization secrets** and restrict access to selected repositories, as long as the secret name remains `NPM_TOKEN` for this repo.

---

## 3. How the workflow uses it

In the release job (for example, `.github/workflows/release.yml`), the Changesets step typically includes:

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- **`GITHUB_TOKEN`**: provided by GitHub; used to create/update the "chore: version packages" PR and make commits (requires `permissions: contents: write` and `pull-requests: write` on the job).
- **`NPM_TOKEN`**: your secret; consumed by `.npmrc` during `pnpm install` / `changeset publish`.

---

## 4. Verify it works

1. Ensure the release workflow exists on **`master`** (or the branch configured in `on.push`).
2. Create a changeset and follow [Publishing versions](./publishing-versions.md).
3. If publishing fails with **401** or **OTP** errors, check:
   - the secret name is exactly **`NPM_TOKEN`**;
   - the token is still valid (not expired/revoked);
   - the account has publish permissions for `@step-nc/*`;
   - the token type is **Automation** (not read-only).

---

## 5. Local development and pnpm warnings

On local machines, if `NPM_TOKEN` is not defined, pnpm may show warnings while reading `.npmrc` variable substitution. For local publishing (not the recommended default flow), you could export the token in your shell session; in practice, publishing should go through GitHub Actions.

---

## Useful links

- [npm access tokens](https://docs.npmjs.com/about-access-tokens)
- [GitHub Actions secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [changesets/action](https://github.com/changesets/action)
