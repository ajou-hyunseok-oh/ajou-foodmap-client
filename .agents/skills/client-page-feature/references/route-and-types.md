# Ajou FoodMap Client Routes, Types & Query Conventions

## 1. Shared Type Modules (`src/types/`)
- `src/types/index.ts`:
  - `EntityId = number | string`
  - `ApiResponse<T> = { data: T }` for JSON responses with a `data` payload.
  - `Restaurant`, `CreateRestaurantInput`, `UpdateRestaurantInput`, `SubmissionStatus`, `RestaurantFormValues`
- `src/types/auth.ts`:
  - `UserType = 'user' | 'admin'`
  - `SocialProvider = 'google' | 'custom:naver'`
  - `AppUser`, `Credentials`, `SignUpInput`, `AuthResult`, `ProviderState`
- `src/types/submission.ts`:
  - `CreateServerSubmissionInput`, `ServerSubmission`, `ServerSubmissionForm`
  - Submitter UUID/display fields and reviewer fields are always populated by the server, never sent by the client.

## 2. Routing & Guard Conventions (`src/App.tsx`)
- Public routes: `/`, `/list`, `/restaurant/:id`, `/popular`, `/login`, `/register`
- Signed-in routes (`<ProtectedRoute>`): `/submit`, `/dashboard`
- Admin routes (`<AdminRoute>`): `/admin`, `/submissions`
- OAuth return route: `/auth/callback` (intercepted via `window.location.pathname` before `<HashRouter>`).

## 3. Data Fetching, TypeScript & Error Handling
- Check the endpoint's response contract in `ajou-foodmap-server`. Restaurant and submission deletes return `204` with an empty body. Account deactivation returns `200` with `{ success: true, message: string }`.
- Use `@tanstack/react-query` (`staleTime: 5 min`, `retry: 1` configured in `src/App.tsx`) and invalidate affected query keys after mutations.
- Always use `import type` for type-only imports (`tsconfig.app.json` sets `verbatimModuleSyntax: true` and `eslint.config.ts` enforces `@typescript-eslint/consistent-type-imports: error`).
- Normalize thrown Axios/Supabase errors with `messageOf(error)` from `src/utils/errorMessage.ts` before displaying in UI or `react-toastify`.
- Keep user likes in `src/services/likes.ts` (browser `localStorage`); do not mix likes into Express restaurant write payloads.
