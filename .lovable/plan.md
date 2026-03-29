

## Plan: Shared AuthGuard for All Authenticated Areas

### Problem
Back/forward security logic is scattered across `Auth.tsx`, `ProtectedRoute.tsx`, `useResidentAuth.ts`, and `authNavigationGuard.ts`. Staff login (`StaffLoginModal`) lacks the back/forward sign-out behavior that resident auth has.

### Design

Create a single `useAuthGuard` hook and a thin `<AuthGuard>` wrapper component that both staff and resident protected routes use.

### New File: `src/hooks/useAuthGuard.ts`

A hook that:
1. **On mount + `pageshow`** (bfcache): checks for a valid session. If none, calls `onUnauthenticated()`.
2. **On `popstate`**: same revalidation check.
3. Accepts config:
   - `type: 'resident' | 'staff'` — determines which session check to run (Supabase `getSession()` for resident, `validateSession()` for staff).
   - `onUnauthenticated: () => void` — callback to redirect (using `window.location.replace` or `Navigate`).

### Changes to Existing Files

**`src/components/ProtectedRoute.tsx`**
- In both `StaffProtectedRoute` and `ResidentProtectedRoute`, replace the inline `pageshow`/`visibilitychange`/`popstate` listeners with a call to `useAuthGuard(...)`.
- Keep existing approval-status logic and role checks unchanged — the guard only handles session revalidation and redirect.

**`src/pages/Auth.tsx`** (resident login page)
- Extract the back/forward sign-out logic (lines 124-143 and 175-192) into the shared hook, configured as `type: 'resident'` with `isLoginPage: true`.
- When `isLoginPage: true` and navigation is back/forward, the hook signs out any active session.

**`src/components/StaffLoginModal.tsx`** (staff login)
- After successful login, use `window.location.replace("/staff-dashboard")` instead of `navigate(..., { replace: true })` to remove the login entry from history.

**`src/pages/Index.tsx`** (homepage with staff login modal)
- Add a `useAuthGuard({ type: 'staff', isLoginPage: true, ... })` effect so that if the user back/forwards to the homepage with an active staff session, it signs them out.

### Where to Wrap Routes

No new wrapper component around routes in `App.tsx` — the hook is called inside the existing `StaffProtectedRoute` and `ResidentProtectedRoute` components, keeping the architecture unchanged.

### Files Modified
| File | Change |
|------|--------|
| `src/hooks/useAuthGuard.ts` | **New** — shared hook |
| `src/components/ProtectedRoute.tsx` | Use `useAuthGuard` in both route guards |
| `src/pages/Auth.tsx` | Replace inline back/forward logic with hook |
| `src/components/StaffLoginModal.tsx` | Use `window.location.replace` for post-login redirect |
| `src/utils/authNavigationGuard.ts` | No changes (still used for forced-logout flags) |

### Acceptance Tests
- a) Login resident → back → forward → must NOT show dashboard; must require login
- b) Logout resident → back/forward → must NOT show protected pages
- c) Login staff → back → forward → must NOT show staff dashboard; must require login
- d) Normal in-app navigation for both portals still works

