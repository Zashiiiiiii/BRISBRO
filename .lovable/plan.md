

## Plan: Refactor Staff Portal Sidebar Navigation

### Summary
Reorganize the sidebar into 4 groups (Services, Census & Reporting, Registry, Communication) + Administration. Remove "Create Certificate" as a sidebar item; move it as a button inside the Certificates tab. Merge Ecological Census + Submissions into one tab with internal sub-tabs. Merge Residents + Households into one tab with internal sub-tabs.

### Final Sidebar Tree
```text
Dashboard (Home)

Services
  ├─ Certificates           (tab: certificate-requests)
  └─ Incident / Blotter     (tab: incidents)

Census & Reporting
  ├─ Ecological Census       (tab: ecological-census)  ← merged page with 2 internal tabs
  └─ RBI Form C Reports      (tab: monitoring-reports)

Registry
  └─ Residents & Households  (tab: registry)  ← merged page with 2 internal tabs

Communication
  ├─ Announcements           (tab: announcements)
  └─ Messages                (tab: messages)

Administration
  ├─ Resident Approval       (tab: resident-approval)
  ├─ Name Change Requests    (tab: name-change-requests)
  ├─ Analytics Reports       (tab: view-reports)
  └─ Settings                (tab: settings)

Logout
```

### Changes

#### 1. `src/pages/StaffDashboard.tsx` — Sidebar groups (~lines 297-329)

**Remove** "Create Certificate" from `servicesItems` (line 301).

**Replace** sidebar group definitions:
- `servicesItems`: Certificates + Incident/Blotter (no Create Certificate)
- `censusItems` → `censusReportingItems`: "Ecological Census" (new merged tab `ecological-census`) + "RBI Form C Reports"
- `residentsItems` → `registryItems`: single item "Residents & Households" (tab: `registry`)
- New `communicationItems`: Announcements + Messages (moved from adminItems)
- `reportsItems` → removed as a group; "Analytics Reports" stays in Administration
- `adminItems`: Resident Approval, Name Change Requests, Analytics Reports, Settings

**Update** sidebar rendering (~lines 348-353) to use new group names:
```
Services | Census & Reporting | Registry | Communication | Administration
```

#### 2. `src/pages/StaffDashboard.tsx` — Tab content area (~lines 2205-2226, 2228-2232, 2878-2892)

**Remove** the standalone `create-certificate` tab content block (lines 2205-2226).

**Add "New Certificate" button** inside the `certificate-requests` tab header (around line 2230-2232):
```tsx
<div className="flex justify-between items-center">
  <h2 className="text-2xl font-bold">Certificate Requests</h2>
  <Button onClick={() => setShowCreateCertificate(true)}>
    <Plus className="h-4 w-4 mr-2" />
    New Certificate
  </Button>
</div>
```
Add a Dialog/inline toggle that shows the `CertificateRequestForm` within the certificates tab (using a `showCreateCertificate` state boolean).

**Replace** `ecological-profile` and `ecological-submissions` tab content with a single `ecological-census` tab:
```tsx
{activeTab === "ecological-census" && (
  <div>
    <Tabs defaultValue="census-form">
      <TabsList>
        <TabsTrigger value="census-form">Census Form</TabsTrigger>
        <TabsTrigger value="submissions-queue">
          Submissions Queue {pendingEcologicalCount > 0 && <Badge>...</Badge>}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="census-form"><EcologicalProfileTab /></TabsContent>
      <TabsContent value="submissions-queue"><EcologicalSubmissionsTab /></TabsContent>
    </Tabs>
  </div>
)}
```

**Replace** `residents` and `households` tab content with a single `registry` tab:
```tsx
{activeTab === "registry" && (
  <div>
    <Tabs defaultValue="residents">
      <TabsList>
        <TabsTrigger value="residents">Residents</TabsTrigger>
        <TabsTrigger value="households">Households</TabsTrigger>
      </TabsList>
      <TabsContent value="residents"><ResidentsTab /></TabsContent>
      <TabsContent value="households"><HouseholdsTab /></TabsContent>
    </Tabs>
  </div>
)}
```

#### 3. `src/pages/StaffDashboard.tsx` — Quick Actions (~lines 2014-2043)

Update the "New Certificate Request" quick action to navigate to `certificate-requests` tab and auto-open the create form:
```tsx
<Button onClick={() => { setActiveTab("certificate-requests"); setShowCreateCertificate(true); }}>
```

Update "Manage Households / Census" quick action to use new tab name `registry`.

#### 4. `src/pages/StaffDashboard.tsx` — Imports

Add `Tabs, TabsList, TabsTrigger, TabsContent` import from `@/components/ui/tabs`.

#### 5. `src/pages/StaffDashboard.tsx` — State

Add `showCreateCertificate` state for the inline create form within the certificates tab.

#### 6. References in other files

- Quick check: `setActiveTab("ecological-profile")`, `setActiveTab("ecological-submissions")`, `setActiveTab("residents")`, `setActiveTab("households")`, `setActiveTab("create-certificate")` — update all occurrences within StaffDashboard.tsx to new tab names.
- No external routes change (staff sub-pages like `/staff/residents` etc. are separate page components, not affected).

### Files Modified
| File | Change |
|------|--------|
| `src/pages/StaffDashboard.tsx` | All sidebar, tab content, and state changes |

No new files needed. No route changes in `App.tsx`.

