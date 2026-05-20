# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Monorepo notes

- `packages/core` ist eine **library** (kein Next-App). Es darf weder `next` noch `react` runtime-bundlen — beide stehen als `peerDependencies`.
- Komponenten mit Hooks / Browser-APIs benötigen `"use client"` als erste Zeile. `tsup` ist so konfiguriert, dass diese Direktive ins Bundle übernommen wird.
- `apps/studio` konsumiert `@vibe-cms/core` über die `exports`-Map. Während der Entwicklung wird via npm-workspaces direkt aufs Source-Bundle gezeigt (`./dist`), daher: nach Änderungen in `packages/core` `npm run build:core` (oder im Watch-Modus).
- Pro Landingpage-Repo gilt: **keine DB, nur `messages/*.json`**. Der `save-content`-Endpoint schreibt direkt ins Filesystem; Cloudflare Pages commited das beim Build über die GitHub-Source.

# Browser Support Policy

**Target:** Baseline Newly Available (alle aktuellen Chrome/Edge/Firefox/Safari Versionen).

- **Baseline Widely Available** Features: ohne Fallback nutzen.
- **Baseline Newly Available** Features: nutzen, wenn sie strikt per Feature-Detection abgesichert sind und ohne sie sinnvoll degradieren (Progressive Enhancement).
- **Keine Polyfills** und keine externen Compat-Libraries einbauen. Wenn ein Feature für Kernfunktionalität zwingend nötig ist und nicht Baseline-tauglich: lieber lightweight Custom-Fallback (<= 20 Zeilen, keine Dependency) oder Ansatz neu denken.
- Kein IE/Legacy-Edge-Support.

Gilt für `modern-web-guidance` Skill: Empfehlungen entsprechend interpretieren — Fallback-Hinweise für Baseline-Widely-Features ignorieren, für Newly-Available-Features nur Feature-Detection (kein Polyfill).
