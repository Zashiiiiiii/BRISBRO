

## Plan: Enhance Ecological Profile Form for House-to-House Collection

### Summary
Add interview metadata fields, consent tracking, and stricter validation to the ecological profile submission form to support proper house-to-house census workflow.

### 1. Database Migration
Add 2 new columns to `ecological_profile_submissions`:
- `interviewer_name TEXT` — name of the staff/interviewer conducting the profiling
- `consent_datetime TIMESTAMPTZ` — timestamp when the respondent gave consent

The table already has `interview_date`, `respondent_name`, `respondent_relation`, `household_number`, `house_number`, `street_purok`, and `additional_notes`.

### 2. UI Changes to EcologicalProfileForm.tsx

**Add to SubmissionData interface and defaultFormData:**
- `interview_date: string` (currently auto-set to today on submit; make it a visible, editable date field)
- `interviewer_name: string`
- `consent_given: boolean` (local state, not persisted as boolean — triggers `consent_datetime`)

**Basic Info tab — add new fields at the top:**
1. **Date of Interview** — date input, defaults to today, editable
2. **Interviewer Name** — text input (free-text, the person conducting the interview)

**Review/Submit tab (or bottom of form) — add:**
3. **Consent Checkbox** — "The respondent has given informed consent for this data collection" with a required check
4. **Notes** — already exists as `additional_notes`, just ensure it's visible and labeled "Notes (optional)"

**Household Number field** — already exists; no change needed.

### 3. Validation Changes in handleSubmit

Add these checks before submission:
- `consent_given` must be `true` → error: "Respondent consent is required before submission"
- `street_purok` must not be empty → error: "Purok/Street is required"
- `house_number` must not be empty → error: "House number is required"
- `interview_date` must not be empty

On submit, set `consent_datetime` to `new Date().toISOString()` and include `interviewer_name` and `interview_date` in the payload.

### 4. Staff Dashboard (EcologicalProfileTab.tsx)

Display `interviewer_name` and `interview_date` when viewing submission details (minor addition to the existing detail view).

### 5. Acceptance Tests (manual)

1. Try submitting without checking consent → blocked with error toast
2. Try submitting with empty house number or purok → blocked with error toast
3. Fill all required fields + consent → submits successfully with `consent_datetime` and `interviewer_name` saved
4. Staff can see interviewer name and interview date on the submission detail

### Technical Details
- **Migration**: `ALTER TABLE ecological_profile_submissions ADD COLUMN interviewer_name TEXT, ADD COLUMN consent_datetime TIMESTAMPTZ;`
- **Files modified**: `src/components/resident/EcologicalProfileForm.tsx`, `src/components/staff/EcologicalProfileTab.tsx`
- No new tables or RLS changes needed (existing policies cover these columns)

