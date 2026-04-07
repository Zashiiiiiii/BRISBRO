

# Final Polished Sidebar Behavior — BRISPRO

## What's changing

The current sidebar implementation is close but has two issues: (1) the Staff Portal structure doesn't match the requested grouping (Settings is standalone, admin items are under Registry), and (2) collapsed mode still leaks partial text from `SubCollapsibleGroup` labels in some edge cases. This plan finalizes both.

## A) Staff Portal — Final Sidebar Tree

```text
EXPANDED                              COLLAPSED
┌──────────────────────────┐          ┌────┐
│ Staff Portal             │          │    │
│                          │          │ 🏠 │  Home
│ 🏠 Home                  │          │────│
│                          │          │ 📄 │  Certificates (badge)
│ ▾ SERVICES               │          │ ⚠  │  Incident / Blotter (badge)
│   📄 Certificates    3   │          │────│
│   ⚠  Incident / Blotter │          │ 📋 │  Ecological Census (badge)
│                          │          │ 📄 │  RBI Form C Reports
│ ▾ CENSUS & REPORTS       │          │ 📊 │  Analytics Reports
│   📋 Ecological Census   │          │────│
│   📄 RBI Form C Reports  │          │ 👥 │  Residents & Households
│   📊 Analytics Reports   │          │────│
│                          │          │ 🔔 │  Announcements
│ ▾ REGISTRY               │          │ 💬 │  Messages (badge)
│   👥 Residents & H'holds │          │────│
│                          │          │ ✓  │  Resident Approval (badge)
│ ▾ COMMUNICATION          │          │ 👤 │  Name Change Requests (badge)
│   🔔 Announcements       │          │ ⚙  │  Settings
│   💬 Messages         2  │          │────│
│                          │          │ 🚪 │  Logout
│ ▾ ADMINISTRATION         │          │────│
│   ✓  Resident Approval 5 │          │ ◀▶ │  Toggle
│   👤 Name Change Req.  1 │          └────┘
│   ⚙  Settings            │
│                          │
│ 🚪 Logout                │
│──────────────────────────│
│ ◀▶ Collapse/Expand       │
└──────────────────────────┘
```

**Key structural change:** Move Settings from standalone into a new "Administration" group alongside Resident Approval and Name Change Requests. Remove "Resident Requests" sub-collapsible from Registry — those items move to Administration. Remove the "Reports" sub-collapsible from Census & Reports — flatten all three items directly under the group.

## B) Resident Portal — Final Sidebar Tree (no changes needed)

Already correct:
```text
Home · Profile · Services · Messages · Settings · Logout
```
Services landing shows cards for Certificate Requests, Incident Reports, Ecological Profile.

## C) Expanded Mode Behavior

- Section groups expand/collapse via chevron (already working via `CollapsibleGroup`)
- "Services" and "Administration" default open; others default closed
- Active item gets `bg-accent text-accent-foreground` highlight (built-in `isActive`)
- Role-based visibility preserved via `hasPermission()` checks
- Badges show inline count next to item title

## D) Collapsed Mode Behavior

- Icons only — all text hidden, all group labels hidden
- Thin visual separators (1px border or small gap) between groups replace label text
- Tooltip on hover shows full item name (already working via `tooltip` prop)
- Badge dots positioned on `SidebarMenuItem` (absolute `-top-1 -right-1`), outside button overflow
- Active item highlight preserved (built-in `isActive` still applies background)
- **No submenus in collapsed mode** — all items render flat as individual icons. This is the cleaner option because: (a) popout submenus add complexity and feel jarring on a barangay portal, (b) the flat icon list is short enough to scan, (c) expanding the sidebar is one click away via the footer toggle

## E) Visual Cues

| State | Treatment |
|-------|-----------|
| Active item | `bg-accent text-accent-foreground` (SidebarMenuButton `isActive`) |
| Hover | `bg-muted/50` subtle background |
| Tooltip | Standard Radix tooltip, appears on collapsed icons after short delay |
| Badge (expanded) | Red `Badge` pill with count, right-aligned in button |
| Badge (collapsed) | Red dot with count, absolute-positioned top-right of icon |
| Group separator (collapsed) | Small `my-1` gap between groups — no text, no lines |
| Destructive logout | Red text + red hover background in both modes |

## F) Files to Update

| File | Changes |
|------|---------|
| `src/pages/StaffDashboard.tsx` | 1. Remove `SubCollapsibleGroup` usage entirely — flatten Reports items directly into Census & Reports group, move Resident Approval + Name Change + Settings into new "Administration" `CollapsibleGroup`. 2. Add `my-1` separator class between collapsed groups for visual spacing. 3. Delete `SubCollapsibleGroup` component (no longer needed). |
| `src/pages/resident/Dashboard.tsx` | Minor: add `my-1` gap between groups in collapsed mode for consistent spacing. No structural changes needed. |

No changes to `sidebar.tsx`, `badge.tsx`, `tooltip.tsx`, or any other UI primitives.

## Implementation Notes

- The `SubCollapsibleGroup` component is fully removed — it was the source of clipped labels in collapsed mode. All nesting is now single-level `CollapsibleGroup` only.
- Default sidebar state remains expanded (`SidebarProvider` default). Users opt in to collapse via the footer toggle.
- Mobile behavior unchanged: Sheet overlay, full-width, no collapse toggle visible.

