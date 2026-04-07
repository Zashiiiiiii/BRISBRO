

# Polish Collapsed Sidebar Behavior

## Problem
When collapsed to icon-only mode, both sidebars show clipped/partial text from:
1. `SubCollapsibleGroup` labels ("Reports", "Resident Requests") still render as visible text
2. The portal title div ("Staff Portal" / "Resident Portal") still takes vertical space even when hidden
3. Badge counts inside the `<span>` wrapper get clipped alongside text

## Root Cause
- `SidebarMenuButton` correctly constrains to 32x32px via `group-data-[collapsible=icon]:!size-8`, hiding overflow text -- this works fine for menu items
- `SubCollapsibleGroup` has no awareness of collapsed state -- its trigger label and border-left container render regardless
- The `CollapsibleGroup` correctly strips its label when collapsed but `SubCollapsibleGroup` children are nested inside and still show their own labels

## Solution

### File: `src/pages/StaffDashboard.tsx`

**1. `SubCollapsibleGroup` -- hide in collapsed mode**
Pass `isCollapsed` prop. When collapsed, skip the collapsible wrapper entirely and render children flat (just the `SidebarMenu` items, no label, no border-left indent). This matches what `CollapsibleGroup` already does.

```tsx
const SubCollapsibleGroup = ({ label, children, defaultOpen = false, isCollapsed = false }: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isCollapsed?: boolean;
}) => {
  if (isCollapsed) {
    return <>{children}</>;
  }
  // ... existing collapsible render
};
```

Update all `SubCollapsibleGroup` usages to pass `isCollapsed={isCollapsed}`.

**2. Portal title -- collapse cleanly**
Replace the title div with a version that fully collapses (no padding/spacing) in icon mode:

```tsx
<div className={cn("p-4", isCollapsed && "p-2")}>
  {!isCollapsed && (
    <h2 className="font-bold text-lg text-primary">Staff Portal</h2>
  )}
</div>
```

**3. Badge positioning in collapsed mode**
The collapsed badge dot is already rendered but may be clipped by the 32x32 button overflow. Move the badge outside the `SidebarMenuButton` or use `overflow-visible` on the button wrapper. Update `MenuItem`:

```tsx
<SidebarMenuItem className="relative">
  <SidebarMenuButton tooltip={title} isActive={activeTab === tab} onClick={...}>
    <Icon className="h-4 w-4" />
    <span>{title}</span>
    {!isCollapsed && badge > 0 && (
      <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] px-1.5 text-xs">
        {badge}
      </Badge>
    )}
  </SidebarMenuButton>
  {isCollapsed && badge > 0 && (
    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center z-10">
      {badge}
    </span>
  )}
</SidebarMenuItem>
```

This moves the collapsed badge dot to the `SidebarMenuItem` (parent `li`) so it's not clipped by the button's overflow.

### File: `src/pages/resident/Dashboard.tsx`

**1. Same portal title fix** -- collapse padding and hide text cleanly.

**2. Same badge fix** -- move collapsed badge dot to the `SidebarMenuItem` parent, outside the button.

### Files to Update

| File | Changes |
|------|---------|
| `src/pages/StaffDashboard.tsx` | `SubCollapsibleGroup`: add `isCollapsed` prop, render flat when collapsed. Portal title: collapse cleanly. `MenuItem`: move badge dot outside button. |
| `src/pages/resident/Dashboard.tsx` | Portal title: collapse cleanly. Badge: move dot outside button. |

No changes needed to `sidebar.tsx` -- the built-in `SidebarGroupLabel` already hides via `-mt-8` and `opacity-0` in icon mode, and `SidebarMenuButton` already constrains to icon size. The fixes are all in the custom wrapper components.

## Collapsed vs Expanded Behavior

```text
EXPANDED                          COLLAPSED (icon-only)
┌─────────────────────┐           ┌────┐
│ Staff Portal        │           │    │
│                     │           │ 🏠 │  ← tooltip: "Home"
│ ▾ Services          │           │ 📄 │  ← tooltip: "Certificates" + badge dot
│   📄 Certificates 3 │           │ ⚠  │  ← tooltip: "Incident / Blotter"
│   ⚠  Incident       │           │ 📋 │  ← tooltip: "Ecological Census"
│                     │           │ 📄 │  ← tooltip: "RBI Form C Reports"
│ ▾ Census & Reports  │           │ 📊 │  ← tooltip: "Analytics Reports"
│   📋 Eco Census     │           │ 👥 │
│   ▾ Reports         │           │ ✓  │  ← badge dot
│     📄 RBI Form C   │           │ 👤 │
│     📊 Analytics    │           │ ...│
│                     │           │ ⚙  │
│ ▾ Registry          │           │ 🚪 │
│   👥 Residents      │           │────│
│   ▾ Resident Req.   │           │ ◀▶ │  ← toggle
│     ✓ Approval  2   │           └────┘
│     👤 Name Change  │
│ ...                 │
│ ⚙ Settings          │
│ 🚪 Logout           │
│─────────────────────│
│ ◀▶ Collapse toggle  │
└─────────────────────┘
```

## Acceptance Tests
1. Collapsed mode shows only icons -- no text labels, no group titles, no clipped text
2. Hovering any icon shows tooltip with full item name
3. Active item remains highlighted with accent background in both modes
4. Badge dots visible on collapsed icons for items with counts
5. Expanding sidebar restores full layout with group labels and sub-groups
6. Mobile sidebar unchanged (Sheet overlay, full width)

