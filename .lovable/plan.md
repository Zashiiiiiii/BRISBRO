

# Certificate Request Privacy Improvements

## Overview
Remove sensitive PII (contact number, email, birth date) from list/card views and move them into a collapsible "Sensitive Contact Details" accordion in the details modal. Mask contact numbers in list views. Ensure public tracking never exposes these fields.

## Changes

### 1. Staff List Card — `src/components/staff/CertificateRequestCard.tsx`
- **Remove** the contact number display (lines 133-138) from the card's meta row
- Card will show only: control number, resident name, date submitted, pickup date, status, priority, remarks
- No email, birth date, or phone visible in list view

### 2. Staff Details Dialog — `src/pages/StaffDashboard.tsx` (lines ~3005-3043)
- Wrap the "Resident Information" section's sensitive fields (contact number, email, birth date) in an Accordion component
- Keep "Full Name" and "Household Number" visible by default (non-sensitive operational data)
- Create a **"Sensitive Contact Details"** accordion item containing:
  - Contact Number
  - Email
  - Birth Date
- Add a small PII warning inside the accordion: *"Contains personal information. Handle per data privacy policy."*
- Import `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/components/ui/accordion`

### 3. Masking Utility
- Add a `maskPhone` helper function (inline or in `src/lib/utils.ts`):
  ```
  maskPhone("09171234567") → "09••-•••-4567"
  ```
- Not currently needed in list view (phone removed entirely), but available if future requirements re-add masked phone to cards

### 4. Public Tracking — `src/utils/api.ts` + `src/components/RequestStatusCard.tsx`
- **`trackRequest` function** (line 205-213): Remove `residentName` and `purpose` from the returned object — set them to empty/omit
- **`RequestStatusCard`**: Already shows only control number, certificate type, date, status, remarks — confirm no name/purpose leak. Remove `residentName` from the `RequestData` interface or stop displaying it
- The public tracker will show: control number, certificate type, date, status, and remarks only

### 5. Resident's Own Requests — `src/components/resident/RequestsContent.tsx`
- No changes needed — residents viewing their own data is appropriate. They already see their own requests with full details.

## Files Modified
| File | Change |
|------|--------|
| `src/components/staff/CertificateRequestCard.tsx` | Remove phone from card meta row |
| `src/pages/StaffDashboard.tsx` | Wrap birth date, contact, email in Sensitive accordion with PII warning |
| `src/lib/utils.ts` | Add `maskPhone` utility |
| `src/utils/api.ts` | Strip name/purpose from public tracking response |
| `src/components/RequestStatusCard.tsx` | Remove name/purpose fields from public display, update interface |

