---
name: client-auth-api-verify
description: >
  Verifies Ajou FoodMap authentication, PKCE callbacks, server-verified sessions,
  Axios client separation, and public Vite configuration. Use for changes to
  auth routes or guards, Supabase auth setup, API service clients, OAuth callback
  tests, .env.example, or the Vercel rewrite for /auth/callback.
compatibility: Requires Node.js 24.x and npm
---

# Client Auth & API Verification

## Workflow
1. Use the relevant sections of the [auth and API checklist](references/auth-api-checklist.md) to review the changed behavior.
2. For changes to auth or API code, `.env.example`, or the callback rewrite, run the [static checker](scripts/verify-client-invariants.mjs) from the repository root with `node .claude/skills/client-auth-api-verify/scripts/verify-client-invariants.mjs`.

## Verification

- Run `npm run typecheck` for TypeScript changes and `npm exec -- eslint <changed-files>` for lintable edits. Use `npm run lint` when the lint configuration changes.
- Run `npm test` for changes to OAuth callback logic or its tests. Run `npm run build` for deployment routing or production build changes. The build includes the type check.
- Use the checklist to verify affected runtime behavior. Report the checks you ran and any affected behavior that still needs verification.
