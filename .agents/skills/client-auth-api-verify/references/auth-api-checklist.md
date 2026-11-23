# Ajou FoodMap Client Auth & API Checklist

## 1. Route Access Matrix (`src/App.tsx`)
| Path | Router / Guard | Purpose |
| :--- | :--- | :--- |
| `/auth/callback` | Handled **before** `HashRouter` (`AuthCallbackHandler`) | Single-use PKCE code exchange + redirect to `/#...` |
| `/`, `/list`, `/restaurant/:id`, `/popular`, `/login`, `/register` | Public (`HashRouter`) | Public views and authentication forms |
| `/submit`, `/dashboard` | `ProtectedRoute` | Signed-in user pages (UX guard only; server enforces 401) |
| `/admin`, `/submissions` | `AdminRoute` (wraps `ProtectedRoute`) | Admin pages (UX guard only; server enforces 401/403) |

## 2. Axios Client Separation (`src/services/`)
| Client | Endpoints | Rules |
| :--- | :--- | :--- |
| `publicApi` | `GET /api/restaurants`, `GET /api/restaurants/popular`, `GET /api/restaurants/:id`, `GET /api/auth/providers` | `withCredentials: false`, no Bearer header required |
| `authApi` | `GET /api/auth/me`, `GET /api/users/all`, `PUT /api/users/:id/type`, `PUT /api/users/profile`, `DELETE /api/users/account`, `POST/PUT/DELETE /api/restaurants*`, `POST/GET/PUT/DELETE /api/submissions*`, `POST /api/submissions/:id/approve` | Attaches `Authorization: Bearer <access_token>` from `supabase.auth.getSession()`; `withCredentials: false` |

- Restaurant and submission deletes return `204` with an empty body. Account deactivation returns `200` with `{ success: true, message: string }`.

## 3. Critical Invariants
- `VITE_API_BASE_URL` must **not** end with `/api`.
- `src/config/supabase.ts` keeps `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, and `detectSessionInUrl: window.location.pathname !== '/auth/callback'`.
- `src/components/AuthCallbackHandler.tsx` keeps the `useRef` single-flight guard so React StrictMode never exchanges a code twice.
- `src/utils/oauthCallback.ts` never copies raw provider error descriptions or tokens into `/login?error=...`.
- `src/contexts/AuthContext.tsx` keeps `QueryClientProvider` above `AuthProvider`, resolves `user` via `GET /api/auth/me`, runs `applySession` via `setTimeout(..., 0)` outside Supabase auth locks, guards async races with `generation`, and calls `queryClient.clear()` on user change/logout.
- `vercel.json` preserves `"source": "/(.*)", "destination": "/index.html"` so `/auth/callback` works on static deployments.
- Client code never references `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `NAVER_CLIENT_SECRET`.

## 4. Verification by Changed Behavior

- The static checker looks for known configuration and code patterns. Review touched API methods against the Express contract, including reads that require auth and indirect calls that the checker does not inspect.
- For callback changes, `npm test` covers the callback helper. If the React handler or rewrite changes, verify that the callback URL reaches the handler and that Strict Mode effect replay reuses one exchange promise for a code.
- For session changes, verify that account switches and logout clear the previous user's query cache and that a delayed `/api/auth/me` response cannot restore a stale user after a session change.
