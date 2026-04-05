

# Refactor Ecological Census Sections — Remove Duplication

## Problem
The census form has two overlapping sections:
- **"Education & Health"** — contains: Education table, Family Planning, Special Categories (senior, solo parent, PWD, pregnant, 4Ps)
- **"Health Info"** — contains: Malnutrition, Immunization, Disability, Death Records, Additional Notes

Family planning, special categories (pregnant women, seniors), and 4Ps are health-related but live in the "Education & Health" section.

## New Section Structure

| # | Section ID | Label | Icon | Contents |
|---|-----------|-------|------|----------|
| 1 | basic-info | Basic Info | FileText | *(unchanged)* |
| 2 | housing | Housing | Home | *(unchanged)* |
| 3 | services | Services | Zap | *(unchanged)* |
| 4 | **education** | **Education** | GraduationCap | Education table only |
| 5 | household-members / members | Household Members | Users | *(unchanged)* |
| 6 | environmental | Environmental | Leaf | *(unchanged)* |
| 7 | **health** | **Health** | Stethoscope | Family Planning, Special Categories (senior/solo parent/PWD/pregnant/4Ps), Malnutrition, Immunization, Disability, Death Records, Additional Notes |

Key changes:
- `education-health` renamed to `education`, stripped of family planning + special categories cards
- `health-info` renamed to `health`, absorbs family planning + special categories from old education-health
- Navigation order stays the same (education before members, health at end)

## Files to Change

### 1. Staff Form — `src/components/staff/EcologicalProfileTab.tsx`

**CENSUS_TABS** (line 126-134):
- Change `{ id: "education-health", label: "Education & Health", icon: GraduationCap }` → `{ id: "education", label: "Education", icon: GraduationCap }`
- Change `{ id: "health-info", label: "Health Info", icon: Stethoscope }` → `{ id: "health", label: "Health", icon: Stethoscope }`

**fieldToSection mapping** (lines 361-379):
- `educationData` → `"education"`
- `familyPlanning` → `"health"` (was `"education-health"`)
- All existing health-info keys → `"health"` (was `"health-info"`)

**renderEducationHealthTab** (lines 2069-2259):
- Rename to `renderEducationTab`
- Remove the Family Planning card (lines 2147-2189)
- Remove the Special Categories card (lines 2191-2257)
- Keep only the Education Background table

**renderHealthInfoTab** (lines 2568-2924):
- Rename to `renderHealthTab`
- Add Family Planning card at the top (moved from education tab)
- Add Special Categories card after Family Planning (moved from education tab)
- Existing content (malnutrition, immunization, disability, notes, generate report) follows after

**Switch statement** (lines 3046-3052):
- `case "education"` → `renderEducationTab()`
- `case "health"` → `renderHealthTab()`

### 2. Resident Form — `src/components/resident/EcologicalProfileForm.tsx`

**tabs array** (lines 823-831):
- Change `{ id: "education-health", label: "Education & Health" }` → `{ id: "education", label: "Education" }`
- Change `{ id: "health-info", label: "Health Info" }` → `{ id: "health", label: "Health" }`

**TabsContent for education-health** (lines 1423-1571):
- Change `value="education-health"` → `value="education"`
- Update card title to "Education"
- Remove Family Planning section (lines 1468-1506)
- Remove Special Categories section (lines 1509-1568) including senior, solo parent, PWD, pregnant, 4Ps

**TabsContent for health-info** (lines 1631-1751):
- Change `value="health-info"` → `value="health"`
- Add Family Planning fields at the top (moved from education tab)
- Add Special Categories fields after Family Planning (moved from education tab)
- Existing malnutrition, disability, death records, additional notes remain

### 3. Data Mapping — No Changes Needed
- The save logic in `EcologicalProfileForm.tsx` (lines 527-540) maps by field name (`education_data`, `health_data`, `family_planning`, etc.) to database columns — these are independent of section IDs
- The staff form's `censusData` state keys are also field-based, not section-based
- The `fieldToSection` mapping in the staff form just needs key updates (covered above)
- CSV export (`ecologicalCsv.ts`) maps by database column names, unaffected
- Report generation (`MonitoringReportPrint.tsx`, `MonitoringReportsTab.tsx`) reads from database columns, unaffected

