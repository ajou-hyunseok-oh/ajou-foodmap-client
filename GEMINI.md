# Ajou FoodMap Client Guidelines for Gemini CLI

## Tech Stack & Workspace Map
- Runtime & toolchain: React 19, Vite 7, TypeScript 5.9, ESM (`"type": "module"`), Node 24.x.
- Package manager: `npm` only (`package-lock.json` is tracked; do not add `pnpm`/`yarn` lockfiles).
- Core directories:
  - `src/App.tsx`: top-level `/auth/callback` intercept, `QueryClientProvider` -> `AuthProvider` -> `HashRouter`.
  - `src/pages/`: route views (`HomePage`, `ListPage`, `DetailPage`, `PopularPage`, `SubmitPage`, `DashboardPage`, `AdminPage`, `SubmissionsPage`, `LoginPage`, `RegisterPage`).
  - `src/components/`: route guards (`ProtectedRoute`, `AdminRoute`), `AuthCallbackHandler`, UI panels and forms.
  - `src/config/supabase.ts`: browser Supabase Auth client (`flowType: 'pkce'`).
  - `src/contexts/AuthContext.tsx`: server-verified user state (`GET /api/auth/me`) and query cache lifecycle.
  - `src/services/`: Axios clients (`http.ts`), domain APIs (`api.ts`, `authApi.ts`, `submissionApi.ts`), browser likes (`likes.ts`).
  - `src/types/` & `src/utils/`: shared DTO types (`index.ts`, `auth.ts`, `submission.ts`), OAuth callback and error helpers.
  - `tests/`: Node test runner unit tests (`tests/oauthCallback.test.ts`).

## Verification Commands
Choose checks that cover the changed behavior and report the results.
- Use `npm run typecheck` for TypeScript changes that affect types, routes, components, or API contracts.
- Run `npm exec -- eslint <changed-files>` for lintable source changes. Use `npm run lint` for changes that affect linting across the project.
- Run `npm test` for OAuth callback changes or changes that affect the existing unit tests.
- Run `npm run build` for changes to Vite configuration, production bundling, or deployment routing. The build already runs `tsc -b`.
- For instruction-only changes, check the edited content, format, and references. When a skill script changes, verify its affected behavior directly.

## Non-Inferable Architecture & Contract Rules
- Routing & OAuth callback:
  - App navigation uses `HashRouter`, while external OAuth/email redirects return to hashless `/auth/callback`.
  - Keep `window.location.pathname === '/auth/callback'` handled before `HashRouter` in `src/App.tsx` and preserve the catch-all rewrite in `vercel.json`.
  - Keep `detectSessionInUrl: window.location.pathname !== '/auth/callback'` and `flowType: 'pkce'` in `src/config/supabase.ts`, plus the `useRef` single-exchange guard in `AuthCallbackHandler.tsx`.
- Auth state & API client separation:
  - Keep `QueryClientProvider` wrapping `AuthProvider` so account switches and logout can call `queryClient.clear()`.
  - Never treat browser SDK `session` alone as authorized app state; resolve `user` via `GET /api/auth/me` and keep the generation ticket race guard in `AuthContext.tsx`.
  - Schedule `applySession` with `setTimeout(..., 0)` from `onAuthStateChange` so the session check runs after the Supabase auth callback returns.
  - `ProtectedRoute` and `AdminRoute` are UX guards only; actual authorization stays enforced by `ajou-foodmap-server`.
  - `VITE_API_BASE_URL` must **not** include `/api` (see `.env.example`). Use `publicApi` for public reads and `authApi` (Bearer token interceptor) for authenticated endpoints; keep `withCredentials: false`.
  - Verify response shapes in `ajou-foodmap-server`. Payload-bearing JSON endpoints use `{ data: T }`. Restaurant and submission deletes return `204` with an empty body. `DELETE /api/users/account` returns `200` with `{ success: true, message: string }`.
- Data storage boundary:
  - Restaurants and submissions persist on the Express API (`src/services/api.ts`, `src/services/submissionApi.ts`).
  - Likes stay in browser `localStorage` (`src/services/likes.ts`) with rollback protection between `likedRestaurants` and `restaurantLikes`.

## Security Boundaries & Tool Enforcement
- Only public browser config (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) may use the `VITE_*` prefix.
- Never reference `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `NAVER_CLIENT_SECRET` in client code, tests, or `.env.example`.
- Map OAuth callback errors to safe Korean messages in `src/utils/oauthCallback.ts`. Keep raw OAuth tokens and provider error descriptions out of redirect URLs.
- Keep `.env.example` readable and use placeholder values.

## Gemini CLI File Filtering
- Keep local environment files and keys excluded through `.geminiignore` for tools that support file filtering. Keep the public `.env.example` visible. Use the active sandbox for filesystem restrictions that must apply to shell commands.
