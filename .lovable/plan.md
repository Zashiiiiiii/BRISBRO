

# Improve Staff & Resident Portal Sidebars

## Current State
- Both sidebars already use `collapsible="icon"` and `SidebarTrigger`, so icon-only mode works mechanically.
- **Missing**: No `tooltip` props on menu buttons, so collapsed state shows icons with no labels. No dedicated collapse toggle in the sidebar footer. Staff sidebar's `SubCollapsibleGroup` items are hidden when collapsed instead of shown as flat icons. Resident sidebar has no collapsible groups (flat list).

## Changes

### 1. Staff Sidebar (`src/pages/StaffDashboard.tsx`)

**MenuItem component** — add `tooltip={title}` to every `SidebarMenuButton` and use `isActive` prop instead of manual className for active state:
```tsx
<SidebarMenuButton
  tooltip={title}
  isActive={activeTab === tab}
  onClick={...}
>
```

**Sidebar footer** — add a `SidebarTrigger` button at the bottom of the sidebar (inside `SidebarContent`) as a collapse/expand toggle with a `PanelLeft` / `ChevronLeft` icon. This ensures the user can toggle from within the sidebar itself.

**SubCollapsibleGroup fix** — remove the duplicated `{isCollapsed && <SidebarMenu>...}` blocks in Census & Reports and Registry sections. The `CollapsibleGroup` already renders children flat when collapsed; the sub-items just need to always render (the parent `CollapsibleGroup` handles collapsed display).

### 2. Resident Sidebar (`src/pages/resident/Dashboard.tsx`)

**Add `tooltip` prop** to every `SidebarMenuButton` (Home, Profile, Services, Messages, Settings, Logout).

**Add sidebar footer toggle** — same `SidebarTrigger` at the bottom of the sidebar for collapse/expand.

### 3. Files to Update

| File | What changes |
|------|-------------|
| `src/pages/StaffDashboard.tsx` | `MenuItem`: add `tooltip` + `isActive` props. Remove duplicated collapsed icon blocks in Registry/Census sections. Add `SidebarTrigger` footer. |
| `src/pages/resident/Dashboard.tsx` | Add `tooltip` to all `SidebarMenuButton`s. Add `SidebarTrigger` footer. Add `tooltip` to Logout button. |

### 4. Sidebar Footer Toggle (both portals)

```tsx
{/* Collapse/Expand toggle at bottom */}
<div className="mt-auto border-t border-border p-2">
  <SidebarTrigger className="w-full" />
</div>
```

Placed after the Logout group, before closing `</SidebarContent>`.

### 5. Mobile Behavior
No changes needed — the existing `SidebarProvider` already handles mobile via a Sheet overlay. The `SidebarTrigger` in the main content area opens/closes it on mobile. The footer toggle will be hidden on mobile since the sidebar is offcanvas.

## Acceptance Tests
1. **Staff Portal**: Hover any icon in collapsed mode → tooltip shows the item name.
2. **Staff Portal**: Click footer toggle → sidebar collapses to icons; click again → expands back.
3. **Staff Portal**: Collapsible groups (Services, Census, Registry, Communication) expand/collapse with chevron. Sub-groups (Reports, Resident Requests) also expand/collapse.
4. **Staff Portal**: Active tab remains highlighted in both expanded and collapsed states.
5. **Resident Portal**: Same tooltip, toggle, and highlight behavior.
6. **Mobile**: Sidebar opens as overlay sheet; no layout breakage; footer toggle hidden.

