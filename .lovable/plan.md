

## Plan: Update Staff Dashboard Quick Actions

### Summary
Add three new quick-action buttons to the Staff Dashboard home tab for RBI Form C, Ecological Submissions, and Households/Census. Keep existing buttons.

### Changes

**File: `src/pages/StaffDashboard.tsx` (~lines 2012-2025)**

Add three buttons after the existing ones inside the Quick Actions `flex` container:

```tsx
{/* Existing buttons stay */}

{hasPermission(userRole, "monitoring_reports") && (
  <Button variant="outline" onClick={() => setActiveTab("monitoring-reports")}>
    <FileText className="h-4 w-4 mr-2" />
    New RBI Form C Report
  </Button>
)}
{hasPermission(userRole, "ecological_submissions") && (
  <Button variant="outline" onClick={() => setActiveTab("ecological-submissions")}>
    <ClipboardList className="h-4 w-4 mr-2" /> {/* or appropriate icon */}
    Review Ecological Submissions
  </Button>
)}
{hasPermission(userRole, "manage_households") && (
  <Button variant="outline" onClick={() => setActiveTab("households")}>
    <Home className="h-4 w-4 mr-2" />
    Manage Households / Census
  </Button>
)}
```

- All three features are permitted for both Admin and Secretary per `rolePermissions.ts`, so they'll be visible to both roles.
- Icons: reuse `FileText` (already imported), add `ClipboardList` and `Home` from lucide-react if not already imported.
- Each button navigates to the corresponding existing tab — no new routes needed.

### Files Modified
- `src/pages/StaffDashboard.tsx` — add 3 buttons + any missing icon imports

