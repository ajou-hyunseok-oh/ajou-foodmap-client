---
name: client-page-feature
description: >
  Guides adding or updating React pages, HashRouter routes, React Query hooks,
  and Axios API service methods in ajou-foodmap-client. Use when adding pages,
  forms, or Express API integrations. Do not use for standalone CSS styling or
  static copy edits.
compatibility: Requires Node.js 24.x and npm
---

# Client Page & API Feature Workflow

## Workflow
1. Read the relevant sections of the [routes and types reference](references/route-and-types.md) for DTOs, API response shapes, and route guards.
2. For new API domain modules, adapt the [service example](assets/service-template.ts) to the Express endpoint's response contract and authentication requirements.
3. Register new routes inside `<HashRouter>` in `src/App.tsx` and keep the pre-router `/auth/callback` check in place.
4. Keep browser likes strictly in `src/services/likes.ts` (`localStorage`); persist restaurants and submissions only through the Express API.

## Verification

- Run `npm run typecheck` for TypeScript changes to pages, routes, forms, or API modules. Run `npm exec -- eslint <changed-files>` for lintable edits. Use `npm run lint` when the lint configuration changes.
- Run `npm test` if the change affects the OAuth callback or its tests. Run `npm run build` for deployment routing or production build changes. The build includes the type check.
- The optional [runner](scripts/check-client-quality.mjs) accepts explicit repository-wide check names. Run `node .claude/skills/client-page-feature/scripts/check-client-quality.mjs --help` from the repository root to see the options. Report the checks you ran.
