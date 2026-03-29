

## Plan: Auto-Generate RBI Form C from Resident/Household Data

### Summary
Enhance the existing sync mechanism to support semester filtering, compute all derivable sector indicators from resident fields, and mark non-collectible sectors as "Not collected".

### Data Mapping: Resident Fields → RBI Form C Cells

```text
RBI Cell                          | Source Field(s)
----------------------------------|---------------------------------------------
Age Brackets (M/F)                | residents.birth_date + residents.gender
Total Inhabitants                 | COUNT(residents) where approved & not deleted
Total Households                  | COUNT(households)
Avg Household Size                | inhabitants / households
Labor Force                       | employment_status IN (Employed, Self-employed)
Unemployed                        | employment_status = Unemployed
Out of School Children (6-14)     | schooling_status = 'Out of School' AND age 6-14
Out of School Youth (15-24)       | schooling_status = 'Out of School' AND age 15-24
PWD                               | ecological_profile_submissions.pwd_count (household-level sum)
Solo Parents                      | ecological_profile_submissions.solo_parent_count (sum)
OFW                               | employment_category = 'OFW'
Civil Status Single (18+)         | civil_status = Single AND age >= 18
Civil Status Married (18+)        | civil_status = Married AND age >= 18
Indigenous Peoples                | ethnic_group IS NOT NULL AND != '' (approx)
Filipino / Foreigner              | Not collected → mark "N/A"
```

### Changes

#### 1. Edge Function (`supabase/functions/staff-auth/index.ts`) — Enhance `sync-monitoring-report-data`

- Accept optional `semester` and `calendar_year` params (not used for filtering residents yet — residents don't have a "census period" — but stored for context)
- Expand resident query to also fetch: `schooling_status`, `employment_category`, `ethnic_group`
- Compute new sector counters:
  - **OSC (6-14)**: `schooling_status = 'Out of School'` AND age 6-14
  - **OSY (15-24)**: `schooling_status = 'Out of School'` AND age 15-24
  - **OFW**: `employment_category = 'OFW'`
  - **IPs**: `ethnic_group` is not null/empty
- Fetch `ecological_profile_submissions` (approved) to sum `pwd_count` and `solo_parent_count` for PWD and Solo Parents sectors
- For sectors that cannot be derived (Filipino/Foreigner), return `{ male: -1, female: -1 }` to signal "Not collected"

#### 2. UI — `MonitoringReportForm.tsx`

- Add semester period selector at top: "1st Semester (Jan–Jun)" / "2nd Semester (Jul–Dec)" — already exists as a dropdown; ensure it defaults to current semester
- Pass `semester` and `calendar_year` to sync call (for future filtering support)
- When displaying sector rows, if male/female = -1, show "N/A" instead of 0 and disable the input
- Add a visual indicator (italic gray text) for "Not collected" sectors

#### 3. No DB migration needed
All required fields already exist in the `residents` and `ecological_profile_submissions` tables.

### Aggregation Pseudocode

```text
FOR EACH resident WHERE approved AND not deleted:
  age = calculate_age(birth_date)
  gender_key = 'male' | 'female'

  // Age brackets
  place into matching bracket by age

  // Sectors
  IF employment_status IN ('Employed','Self-employed'): labor_force[gender_key]++
  IF employment_status = 'Unemployed': unemployed[gender_key]++
  IF schooling_status = 'Out of School' AND age 6-14: osc[gender_key]++
  IF schooling_status = 'Out of School' AND age 15-24: osy[gender_key]++
  IF employment_category = 'OFW': ofw[gender_key]++
  IF age >= 18 AND civil_status = 'Single': single[gender_key]++
  IF age >= 18 AND civil_status = 'Married': married[gender_key]++
  IF ethnic_group NOT NULL/EMPTY: ips[gender_key]++

// From ecological_profile_submissions (approved):
pwd = SUM(pwd_count)  // no M/F breakdown available → total only
solo_parents = SUM(solo_parent_count)  // no M/F breakdown → total only
```

### Minimal Acceptance Tests
1. Click "Sync from Database" on a new report → age brackets populate with correct M/F counts
2. Sector rows for Labor Force, Unemployed, OSC, OSY, OFW, Single, Married compute correctly
3. PWD and Solo Parents show totals from ecological submissions
4. Filipino/Foreigner rows show "N/A" (not collected)
5. Select semester, save draft, reopen → semester value persists
6. Print preview shows all computed data correctly

### Files Modified
- `supabase/functions/staff-auth/index.ts` — expand sync query + sector computation
- `src/components/staff/MonitoringReportForm.tsx` — UI for N/A sectors, default semester

