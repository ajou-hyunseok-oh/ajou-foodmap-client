---
paths:
  - "src/App.tsx"
  - "src/config/supabase.ts"
  - "src/contexts/AuthContext.tsx"
  - "src/components/AuthCallbackHandler.tsx"
  - "src/components/ProtectedRoute.tsx"
  - "src/components/AdminRoute.tsx"
  - "src/services/**"
  - "src/utils/oauthCallback.ts"
  - "tests/oauthCallback.test.ts"
  - "vercel.json"
  - ".env.example"
---

# Client Auth, OAuth Callback & API Rules

- Keep `/auth/callback` intercepted in `src/App.tsx` before `HashRouter` mounts, and do not remove the catch-all rewrite in `vercel.json`.
- Keep `flowType: 'pkce'` and `detectSessionInUrl: window.location.pathname !== '/auth/callback'` in `src/config/supabase.ts`.
- Keep the `useRef` single-flight promise guard in `AuthCallbackHandler.tsx` so React StrictMode never exchanges a one-time PKCE code twice.
- In `src/utils/oauthCallback.ts`, never forward raw OAuth error descriptions or tokens into `/login?error=...`; always map to safe user-facing Korean messages and re-run `npm test`.
- In `src/contexts/AuthContext.tsx`, keep `setTimeout(..., 0)` outside Supabase's `onAuthStateChange` callback lock, keep the `generation` ticket race guard, and clear `queryClient` whenever user identity changes or logs out.
- In `src/services/http.ts`, keep `withCredentials: false` and attach `Authorization: Bearer <access_token>` only on `authApi`. Never switch authenticated write endpoints to `publicApi`.
- Keep `VITE_API_BASE_URL` free of trailing `/api`; every service path starts with `/api/...`.
