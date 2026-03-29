

## Plan: Inline Requests Module + Browser Back = Logout

### Summary
Two changes: (1) Move "My Requests" from a separate page into the resident dashboard as an inline tab, and (2) intercept the browser back button on all resident pages to trigger automatic logout and session destruction.

### 1. Inline "My Requests" Tab in Dashboard

**Current behavior**: Clicking "My Requests" navigates to `/resident/requests` (a separate page). The sidebar item has `href: "/resident/requests"` and `handleTabChange` calls `navigate("/resident/requests")`.

**New behavior**: Render the requests list inline as `activeTab === "requests"`, same as profile, messages, incidents, and settings tabs.

**Changes in `src/pages/resident/Dashboard.tsx`:**
- Remove the `navigate("/resident/requests")` branch from `handleTabChange` — treat `"requests"` like any other tab (`setActiveTab(tab)`)
- Remove the sidebar `href` for "My Requests"
- Add a new `{activeTab === "requests" && (...)}` block that renders the full requests list (import and use the content from `ResidentRequests` or inline it)
- Update the SuccessModal's `onViewRequests` callback to `setActiveTab("requests")` instead of `navigate("/resident/requests")`
- Update dashboard "View all requests →" link to `setActiveTab("requests")` instead of `navigate("/resident/requests")`

**Changes in `src/pages/resident/Requests.tsx`:**
- Extract the requests list content into a reusable component `RequestsContent` (similar to how `ProfileContent`, `MessagesContent` etc. work)
- Or inline the requests logic directly in Dashboard

**Create `src/components/resident/RequestsContent.tsx`:**
- Move the core requests UI (loading, list, details dialog, summary cards) from `ResidentRequests` into this component
- Accept no navigation props — it's fully self-contained within the dashboard

**Route cleanup in `src/App.tsx`:**
- Keep `/resident/requests` route but have it redirect to `/resident/dashboard?tab=requests` for backwards compatibility (or remove it entirely)

### 2. Browser Back Button = Auto-Logout

**Current behavior**: Back button triggers `popstate` which checks forced logout flags; if not set, it just navigates normally.

**New behavior**: Any browser back button press while on a resident protected page triggers immediate logout + session destruction.

**Changes in `src/pages/resident/Dashboard.tsx`:**
- Add a `useEffect` that listens for `popstate` events
- On `popstate`, immediately call `logout()`, mark forced logout, clear session tokens, and redirect to `/auth`
- Push an extra history entry on mount so the back button triggers `popstate` instead of leaving the page

**Implementation:**
```
useEffect(() => {
  // Push a duplicate entry so "back" fires popstate instead of leaving
  window.history.pushState(null, '', window.location.href);

  const handlePopState = async () => {
    // Trigger full logout
    markResidentForcedLogout();
    await logout();
    secureLogoutRedirect("/auth");
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);
```

This ensures:
- Pressing back triggers logout immediately
- Session tokens are cleared
- Forced logout flag prevents forward-button access
- `secureLogoutRedirect` overwrites history entries

### Files Modified
- `src/components/resident/RequestsContent.tsx` — new file, extracted from `ResidentRequests`
- `src/pages/resident/Dashboard.tsx` — inline requests tab + back-button logout
- `src/pages/resident/Requests.tsx` — simplified to redirect or kept for backwards compat
- `src/App.tsx` — optionally redirect `/resident/requests` to dashboard

### No database or backend changes needed.

