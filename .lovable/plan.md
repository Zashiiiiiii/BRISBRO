

## Plan: Fix Resident Auth Navigation — Back/Forward Cache Bypass

### Root Cause
The current implementation has extensive protection but two gaps allow cached state to leak through:

1. **`ResidentProtectedRoute` uses async session checks** — when the browser restores a page from bfcache or history, the component renders children briefly while the async `getSession()` call is in-flight (the loading state may not trigger if `useResidentAuth` returns stale cached state from its React state before the `pageshow`/`popstate` revalidation completes).

2. **`pageshow` handler in `App.tsx` only calls `window.location.reload()`** for bfcache, but the forced logout flags are checked *after* React re-renders, creating a brief window where protected content is visible.

### Changes

#### 1. `src/components/ProtectedRoute.tsx` — ResidentProtectedRoute

Add a `pageshow` + `visibilitychange` listener that does a **synchronous hard redirect** (not React Navigate) when no session exists:

- On `pageshow` (especially `event.persisted === true`): immediately call `supabase.auth.getSession()`. If no session OR forced logout flag is set, call `window.location.replace("/auth")` — this is a hard redirect that replaces the history entry, preventing forward navigation.
- On `visibilitychange` (tab refocus): same check.
- These listeners go directly in `ResidentProtectedRoute`, not relying on the hook's async state updates.

#### 2. `src/hooks/useResidentAuth.ts` — logout function

Change `logout()` to end with `window.location.replace("/auth")` instead of relying on the caller to redirect. This ensures every logout path uses `replace` semantics. But since the Dashboard's `handleLogout` already calls `secureLogoutRedirect`, we'll keep the hook's `logout` as a session-clearing function and ensure all callers use `window.location.replace`.

#### 3. `src/pages/resident/Dashboard.tsx` — handlePopState

Change `secureLogoutRedirect("/auth")` to `window.location.replace("/auth")` — simpler and more reliable than the pushState+replace approach since `replace` already prevents back-navigation to the current entry.

#### 4. `src/pages/Auth.tsx` — Login page guard

Already correct: only redirects to dashboard if a valid approved session exists, and checks forced logout flag. No changes needed.

### Specific Code Changes

**`src/components/ProtectedRoute.tsx`** (ResidentProtectedRoute):
- Add `useEffect` with `pageshow` and `visibilitychange` handlers that do:
  ```
  if forced_logout_flag OR no session → window.location.replace("/auth")
  ```
- This catches bfcache restoration and tab-switching scenarios with a hard redirect.

**`src/pages/resident/Dashboard.tsx`**:
- In the popstate handler, replace `secureLogoutRedirect("/auth")` with `window.location.replace("/auth")`.

**`src/utils/authNavigationGuard.ts`**:
- Update `secureLogoutRedirect` to use `window.location.replace(targetUrl)` only (remove the pushState calls — they're unnecessary when using `replace`).

### Files Modified
- `src/components/ProtectedRoute.tsx`
- `src/pages/resident/Dashboard.tsx`  
- `src/utils/authNavigationGuard.ts`

### Acceptance Tests
1. Log in as resident → navigate to dashboard
2. Click Logout → lands on `/auth`
3. Press browser Back → stays on `/auth` (not dashboard)
4. Press browser Forward → stays on `/auth`
5. Manually type `/resident/dashboard` in URL bar → redirected to `/auth`
6. Log in → navigate around dashboard tabs → close tab → reopen → navigating to `/resident/dashboard` redirects to `/auth`

