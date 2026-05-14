# Changesets

`@vibe-cms/core` is published to GitHub Packages via [changesets](https://github.com/changesets/changesets).

## Workflow

1. Make changes in `packages/core` (add a block, fix a bug, …)
2. Run `npx changeset` and describe what changed; pick the bump level (patch / minor / major)
3. Commit the generated `.changeset/<random>.md` along with your code
4. When the PR merges to `main`, the release workflow:
   - Opens a "Version Packages" PR that bumps `package.json` and updates `CHANGELOG.md`
   - On merge of that PR, publishes the new version to GitHub Packages
5. Renovate picks up the new version in every landingpage repo within ~hours

Major bumps need manual review in each landingpage (Renovate won't automerge them).
