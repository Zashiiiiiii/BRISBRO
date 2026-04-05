

# Fix Incident Details Modal — Privacy & Clarity

## Context
"Respondent" in barangay blotter context means the **accused/complained-against person** — this is correct terminology. No rename needed. The staff details modal already has a basic `<details>` element for sensitive data, but it needs refinement.

## Changes

### 1. Staff Details Modal — `src/components/staff/IncidentsTab.tsx` (lines 669-717)
- **Keep "Respondent" label** (correct barangay blotter term for accused party)
- Replace the native `<details>` element with the proper `Accordion` component (matching the certificate privacy pattern)
- Move into the Sensitive accordion:
  - Complainant Contact
  - Complainant Address
  - Respondent Address
- Keep visible (non-sensitive, operational): Complainant Name, Respondent Name, Type, Date, Location
- Add Shield icon + PII warning text inside accordion

### 2. Staff List Table — `src/components/staff/IncidentsTab.tsx` (lines 414-507)
- Already clean: shows only Incident No., Date, Type, Complainant name, Status/Source — no contact/address exposed
- No changes needed

### 3. Resident Details Modal — `src/components/resident/IncidentsContent.tsx` (lines 193-237)
- Currently shows: respondent name, location, description, photo — no contact/address fields shown
- The resident form collects `respondentName` but `respondentAddress` is not mapped into the resident view
- No changes needed (resident sees only their own data)

### 4. Resident List Table — `src/components/resident/IncidentsContent.tsx`
- Already clean: shows Report No., Date, Type, Approval, Status
- No changes needed

## Files Modified
| File | Change |
|------|--------|
| `src/components/staff/IncidentsTab.tsx` | Replace native `<details>` with Accordion component for sensitive fields; add Shield icon + PII warning |

## Field Visibility Rules

| Field | Staff List | Staff Detail (visible) | Staff Detail (accordion) | Resident List | Resident Detail |
|-------|-----------|----------------------|------------------------|--------------|----------------|
| Incident No. | Yes | Yes | — | Yes | Yes |
| Date | Yes | Yes | — | Yes | Yes |
| Type | Yes | Yes | — | Yes | Yes |
| Complainant Name | Yes | Yes | — | — | — |
| Respondent Name | — | Yes | — | — | Yes |
| Location | — | Yes | — | — | Yes |
| Complainant Contact | — | — | Yes | — | — |
| Complainant Address | — | — | Yes | — | — |
| Respondent Address | — | — | Yes | — | — |
| Description | — | Yes | — | — | Yes |
| Photo Evidence | — | Yes | — | — | Yes |

