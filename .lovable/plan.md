

# Resident/Tenant Verification Workflow

## Overview
Enhance the registration and approval pipeline with resident type classification, household linking during approval, duplicate detection, and restricted access for unverified users.

---

## Database Changes (Migration)

### 1. Add columns to `residents` table
- `resident_type TEXT DEFAULT NULL` — values: `owner`, `tenant`, `boarder`, `relative`
- `verification_method TEXT DEFAULT NULL` — values: `matched_household`, `proof_upload`, `manual_review`

### 2. Add column to `ecological_profile_submissions` (no change needed — household linking already exists)

No new tables required. The existing `residents` table and `households` table already support the linking workflow.

---

## Backend Changes (Edge Function: `staff-auth`)

### 1. Update `approve-resident` action
- Accept new parameters: `householdId` (optional existing household UUID), `newHousehold` (optional object to create new household), `verificationMethod`
- If `householdId` provided: set `residents.household_id = householdId`
- If `newHousehold` provided: call `staff_create_household` RPC, then link
- Store `verification_method` on the resident record

### 2. New action: `get-duplicate-hints`
- Accept `firstName`, `lastName`, `birthDate`, `address`
- Query residents table for matches using ILIKE on name + exact birthdate + fuzzy address
- Return top 5 possible matches with household info

### 3. Update `get-pending-registrations` action
- Include `resident_type` in the returned fields

---

## Frontend Changes

### A. Signup Form (`ResidentLoginModal.tsx`)
- Add optional "Resident Type" select field with options: Owner, Tenant, Boarder, Relative
- Pass `resident_type` to the `register_new_resident` RPC

### B. Database Function Update (`register_new_resident`)
- Add `p_resident_type TEXT DEFAULT NULL` parameter
- Store in `resident_type` column

### C. Resident Dashboard (`Dashboard.tsx`)
- Check `approval_status` on load
- If pending: show read-only view with announcements + status card only
- Hide/disable sidebar items: Requests, Incidents, Ecological Profile, Messages
- Show a banner: "Your account is pending verification"

### D. Staff Approval Page (`ResidentApproval.tsx`)
Major enhancements:

**Duplicate Detection Panel:**
- When viewing a pending resident, auto-query for duplicates by name + birthdate
- Show matches in a collapsible alert with resident name, household number, and match confidence

**Approve Dialog (new):**
- Replace direct approve button with a dialog containing:
  - Household linking: search/select existing household OR create new one (household number + address fields)
  - Verification method dropdown: Matched Household / Proof Upload / Manual Review
  - Confirm button

**Display resident_type** badge on each pending card

### E. Restrict Feature Access
- In `ResidentCertificateRequestForm.tsx`: check `approval_status === 'approved'` before allowing submission
- In `IncidentRequestForm.tsx`: same check
- In `EcologicalProfileForm.tsx`: same check
- These components already live inside the authenticated resident dashboard, so add a guard at the component level that shows a "pending verification" message instead of the form

---

## Validation Rules & Edge Cases

1. **Duplicate signup**: Already handled — email uniqueness check exists
2. **Approve without household**: Allow it (household linking is optional during approval, can be done later via ecological profile)
3. **Re-registration after rejection**: Existing flow already supports re-checking status
4. **Pending user accessing protected routes**: Dashboard loads but features are disabled with clear messaging
5. **Staff "Request More Info"**: Use existing messaging system — staff can send a message to the resident's user_id from the approval page

---

## Summary of Files to Modify

| File | Change |
|------|--------|
| Migration SQL | Add `resident_type`, `verification_method` columns to `residents` |
| `register_new_resident` DB function | Add `p_resident_type` param |
| `supabase/functions/staff-auth/index.ts` | Update `approve-resident`, add `get-duplicate-hints` |
| `src/utils/staffApi.ts` | Add `getDuplicateHints`, update `approveResident` params |
| `src/components/ResidentLoginModal.tsx` | Add resident type select in signup |
| `src/pages/admin/ResidentApproval.tsx` | Add approve dialog with household linking, duplicate hints |
| `src/pages/resident/Dashboard.tsx` | Restrict sidebar items for pending users |
| `src/components/resident/RequestsContent.tsx` | Pending user guard |
| `src/components/resident/IncidentsContent.tsx` | Pending user guard |
| `src/components/resident/EcologicalProfileContent.tsx` | Pending user guard |

