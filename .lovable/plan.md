

## Plan: Improve "New RBI Form C Report" UX — Semester Gate, Coverage Period, Data Quality Warnings

### Summary
Three UI-only enhancements to `MonitoringReportForm.tsx` plus a small edge function update to return data quality counts.

### 1. Make Semester required before "Sync from Database"

**In `MonitoringReportForm.tsx`:**
- Disable the "Sync from Database" button when `semester` is empty/unset
- Show a helper message like "Please select a semester first" when hovering or below the button
- Remove the auto-sync `useEffect` (lines 261-265) — instead, only auto-sync if semester is already set on mount

### 2. Show "Coverage Period" summary near Sync button

**In `MonitoringReportForm.tsx`:**
- Add a computed string based on `semester` + `calendarYear`:
  - `"1st"` → "Jan – Jun {year}"
  - `"2nd"` → "Jul – Dec {year}"
- Display as a `Badge` or text span next to the Sync button area (inside the sync row, lines 456-475)

### 3. Data Quality summary after sync — edge function + frontend

**Edge function (`supabase/functions/staff-auth/index.ts`, sync-monitoring-report-data action):**
- After fetching residents (line 2389-2401), compute and include in the response:
  - `missing_birth_date`: count of residents where `birth_date` is null
  - `missing_gender`: count where `gender` is null or empty
  - `not_linked_to_household`: count where `household_id` is null
- Add `household_id` to the select query (line 2391)
- Add a `data_quality` object to the response alongside existing fields

**In `MonitoringReportForm.tsx`:**
- Add state: `dataQuality: { missingBirthDate: number; missingGender: number; notLinkedToHousehold: number } | null`
- In `handleSync`, extract `data.data_quality` from the response and set state
- After the sync button area, if `dataQuality` is set and any count > 0, render an `Alert` (warning variant) showing:
  - "⚠ X residents missing birth date"
  - "⚠ X residents missing gender"
  - "⚠ X residents not linked to a household"
- These are warnings only — do not block Save/Submit

### Files Modified
- `src/components/staff/MonitoringReportForm.tsx` — semester gate, coverage period, data quality UI
- `supabase/functions/staff-auth/index.ts` — add `data_quality` to sync response

