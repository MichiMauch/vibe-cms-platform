# vibe-cms-platform

Monorepo für das Vibe-CMS und die Landingpage-Plattform.

## Struktur

- `packages/core` — `@vibe-cms/core`: Blocks, Editor-UI, Block-Manager, Renderer, Lib-Helpers, JSON-Templates. Wird zu GitHub Packages publiziert und von jeder Landingpage konsumiert.
- `apps/studio` — Master-Webapp (Next.js 16). Enthält die Demo-Landingpage *und* die Admin-UI zum Anlegen neuer Pages (`/admin/new-page`).
- `landingpage-template` — GitHub-Template-Repo-Source. Wird zu einem eigenen Template-Repo auf GitHub gepusht und vom Studio per "Generate"-Endpoint geklont, sobald eine neue Page entsteht.

## Setup

```bash
npm install
npm run dev          # startet apps/studio
npm run build:core   # baut das @vibe-cms/core Bundle
```

## Workflow: Neue Landingpage

1. `npm run dev` → `http://localhost:3000/admin/new-page`
2. Slug + Brief eingeben → Studio orchestriert GitHub + Cloudflare + OpenAI
3. In ~25s ist die Page auf `https://<slug>.deine-domain.ch` live

## Workflow: Block-/Template-Update überall

1. Block in `packages/core/src/blocks/` ändern oder neu anlegen
2. `npx changeset` → bump erfassen
3. Merge auf `main` → GitHub Action published `@vibe-cms/core` zu GitHub Packages
4. Renovate öffnet PR in jedem Landingpage-Repo → automerge → CF Pages deployt
