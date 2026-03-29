

## Plan: Regroup Reports in Staff Sidebar

### Summary
Move "Monitoring Reports" out of Administration, create a new "Reports" collapsible group containing both reporting items with updated labels.

### Changes

#### 1. `src/pages/StaffDashboard.tsx` — Sidebar restructure

**In `StaffSidebar` component (~lines 296-348):**

- Extract a new `reportsItems` array:
  ```
  const reportsItems = [
    hasPermission(userRole, "view_reports") && { title: "Analytics Reports", icon: BarChart3, tab: "view-reports" },
    hasPermission(userRole, "monitoring_reports") && { title: "RBI Form C Reports", icon: BarChart3, tab: "monitoring-reports" },
  ]
  ```

- Remove "Monitoring Reports" and "Reports" entries from `adminItems`

- Add a new `CollapsibleGroup` for "Reports" between Residents and Administration:
  ```
  <CollapsibleGroup label="Reports" items={reportsItems} ... />
  ```

**In the main content area (~line where `activeTab === "monitoring-reports"` renders):**
- Update the heading from "Monitoring Reports" to "RBI Form C Reports (Semi-Annual)"

**In the main content area where `activeTab === "view-reports"` renders:**
- Update the heading from "Reports" to "Analytics Reports" (if there is one)

#### 2. `src/components/staff/MonitoringReportsTab.tsx`

- Update the list page card title from "Monitoring Reports" to "RBI Form C Reports (Semi-Annual)"
- Update the "New Report" form page title to "New RBI Form C Report (Revised 2024)"

#### 3. `src/components/staff/MonitoringReportForm.tsx`

- Update any header/title references from "Monitoring Report" to "RBI Form C Report (Revised 2024)"

### Files Modified
- `src/pages/StaffDashboard.tsx` — sidebar groups + content headings
- `src/components/staff/MonitoringReportsTab.tsx` — list page title
- `src/components/staff/MonitoringReportForm.tsx` — form page title

### No route, permission, or database changes needed.

