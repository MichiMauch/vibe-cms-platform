# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Monorepo notes

- `packages/core` ist eine **library** (kein Next-App). Es darf weder `next` noch `react` runtime-bundlen — beide stehen als `peerDependencies`.
- Komponenten mit Hooks / Browser-APIs benötigen `"use client"` als erste Zeile. `tsup` ist so konfiguriert, dass diese Direktive ins Bundle übernommen wird.
- `apps/studio` konsumiert `@vibe-cms/core` über die `exports`-Map. Während der Entwicklung wird via npm-workspaces direkt aufs Source-Bundle gezeigt (`./dist`), daher: nach Änderungen in `packages/core` `npm run build:core` (oder im Watch-Modus).
- Pro Landingpage-Repo gilt: **keine DB, nur `messages/*.json`**. Der `save-content`-Endpoint schreibt direkt ins Filesystem; Cloudflare Pages commited das beim Build über die GitHub-Source.
