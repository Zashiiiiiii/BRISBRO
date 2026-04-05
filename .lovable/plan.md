

# Remove Proof Upload from Name Change Requests

## Changes

### 1. Resident Form — `src/components/resident/NameChangeRequestForm.tsx`
- Remove `proofFile` state, `uploadProof` function
- Remove `Upload`, `X` from lucide imports
- Remove proof file upload UI block (the entire "Proof Document (Optional)" section)
- Remove `proof_document_url` from insert payload
- Remove `setProofFile(null)` from reset logic
- Final insert payload: `resident_id`, `current_*` fields, `requested_*` fields, `reason`

### 2. Staff View — `src/components/staff/NameChangeRequestsTab.tsx`
- Remove the `proof_document_url` conditional block (lines 390-414) that renders image/link
- Remove `proof_document_url` from the `NameChangeRequest` interface (line 63)
- Keep all Approve/Reject workflow untouched

### 3. No database migration needed
- The `proof_document_url` column can stay nullable in the DB — it simply won't be populated anymore. No schema change required.

## Updated Request Payload
```
{
  resident_id, 
  current_first_name, current_middle_name, current_last_name, current_suffix,
  requested_first_name, requested_middle_name, requested_last_name, requested_suffix,
  reason
}
```
`status` and `created_at` are set by DB defaults.

## Files to Edit
| File | Change |
|------|--------|
| `src/components/resident/NameChangeRequestForm.tsx` | Remove proof state, upload function, upload UI, payload field |
| `src/components/staff/NameChangeRequestsTab.tsx` | Remove proof display block and interface field |

## Acceptance Tests
1. Open Name Change Request modal — no file upload input visible
2. Submit a request with changed name + reason — succeeds without errors
3. Modal closes on success, does not navigate away or refresh page
4. Re-open modal — form fields pre-filled with current name, reason empty (no stale state)
5. Staff view — review dialog shows current/requested name + reason, no proof section
6. Approve/Reject workflow still works end-to-end

