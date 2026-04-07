

# Simplify Resident Portal Sidebar

## Current State
The sidebar has 8 individual items: Dashboard, My Profile, My Requests, Request Certificate, Messages, Incident Reports, Ecological Profile, Settings, plus Logout. The "Services" tabs (Request Certificate, My Requests, Incidents, Ecological Profile) are all separate top-level items.

## Target Sidebar Structure

```text
Home
Profile
Services          ← click to go to services page with card/tab layout
Messages          ← with unread badge
Settings
Logout
```

## New "Services" Tab Content
When `activeTab === "services"`, render a card-based landing with three service cards:
- **Certificate Requests** → switches to existing `request` / `requests` tabs (combined view)
- **Incident Reports** → switches to existing `incidents` tab
- **Ecological Profile** → switches to existing `ecological-profile` tab

Each card shows an icon, title, description, and a chevron. The "Back to Home" button on sub-tabs (`request`, `requests`, `incidents`, `ecological-profile`) changes to "Back to Services" and returns to the `services` tab.

## Changes

### File: `src/pages/resident/Dashboard.tsx`

**1. Sidebar (`ResidentSidebar`)**
- Reduce `allMenuItems` to 5 items: `home` (was "dashboard"), `profile`, `services`, `messages`, `settings`
- Rename tab value `"dashboard"` → `"home"` throughout
- Remove individual entries for `requests`, `request`, `incidents`, `ecological-profile`
- Keep `isPending` restriction on `services` and `messages`

**2. New Services landing (inline)**
- Add `activeTab === "services"` block rendering three clickable cards:
  - "Certificate Requests" → `setActiveTab("requests")` (shows RequestsContent with a "New Request" button that goes to `request` tab)
  - "Incident Reports" → `setActiveTab("incidents")`
  - "Ecological Profile" → `setActiveTab("ecological-profile")`

**3. Back navigation**
- Sub-tabs `request`, `requests`, `incidents`, `ecological-profile` → "Back to Services" button returns to `services` tab
- Tabs `profile`, `messages`, `settings` → "Back to Home" button returns to `home` tab

**4. Home tab**
- Rename heading from "Welcome" greeting stays, but quick action cards now say "Go to Services" as a single card instead of separate certificate/incident cards
- Keep announcements, latest request status, ecological status cards

**5. Mobile bottom nav**
- Update to: Home, Services, Messages, Profile (4 items instead of 5)
- `Services` opens the services landing

**6. `MOBILE_TAB_ORDER`** 
- Update for swipe: `["home", "services", "messages", "profile"]`

**7. Default tab / URL param**
- Change default from `"dashboard"` to `"home"`
- Update `searchParams` references

### File: `src/App.tsx`
- Update any `?tab=dashboard` redirect to `?tab=home`

## What stays the same
- All content components (`RequestsContent`, `IncidentsContent`, `EcologicalProfileContent`, etc.) remain unchanged
- All routes and permissions preserved
- Sidebar collapse/expand behavior unchanged

## Acceptance Tests
1. Sidebar shows exactly: Home, Profile, Services, Messages, Settings, Logout
2. Clicking "Services" shows three service cards
3. Clicking a service card loads the correct content with "Back to Services" navigation
4. Home tab shows welcome message, status cards, and announcements
5. Mobile bottom nav shows 4 items: Home, Services, Messages, Profile
6. Unread message badge still visible on Messages
7. Pending verification still restricts Services and Messages

