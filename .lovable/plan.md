

# Formalize Name Change Requests Workflow

## What Already Exists
- `name_change_requests` table with status, reason, review fields
- `NameChangeRequestForm` component (resident side) with name fields + reason
- `NameChangeRequestsTab` (staff side) with approve/reject flow
- `staff_approve_name_change` and `staff_reject_name_change` RPCs
- Name fields already read-only in ProfileContent
- "Request Name Change" button already present in profile

## What's Missing

### 1. Proof Upload (Optional)
- Add `proof_document_url TEXT` column to `name_change_requests`
- Use Supabase Storage bucket `name-change-proofs` for file uploads
- Update `NameChangeRequestForm` to include optional file upload field
- Update staff view dialog to show/download proof document

### 2. Prevent Multiple Pending Requests
- Before submitting in `NameChangeRequestForm`, query for existing pending request
- If found, show error toast and block submission
- Add a DB constraint or check in the insert logic

### 3. Pending Banner in Profile
- In `ProfileContent`, query `name_change_requests` for any pending request
- If found, show an alert banner above the name fields: "You have a pending name change request"
- Disable the "Request Name Change" button when pending

### 4. Staff: View Proof in Dialog
- In the view dialog in `NameChangeRequestsTab`, render proof image/link if `proof_document_url` exists
- Update `get_name_change_requests_for_staff` RPC to return `proof_document_url`

---

## Database Changes (Migration)

```sql
-- Add proof column
ALTER TABLE name_change_requests ADD COLUMN proof_document_url TEXT;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('name-change-proofs', 'name-change-proofs', true);

-- Storage policies for residents to upload
CREATE POLICY "Residents can upload proofs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'name-change-proofs');

CREATE POLICY "Anyone can view proofs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'name-change-proofs');
```

Update `get_name_change_requests_for_staff` to include the new column.

---

## Files to Modify

| File | Change |
|------|--------|
| Migration SQL | Add `proof_document_url`, storage bucket + policies |
| `get_name_change_requests_for_staff` | Return `proof_document_url` |
| `NameChangeRequestForm.tsx` | Add file upload field, check for existing pending request before submit |
| `ProfileContent.tsx` | Query pending requests, show banner, disable button when pending |
| `NameChangeRequestsTab.tsx` | Display proof document in view dialog |

## Status Values (unchanged)
- `pending` → `approved` (updates resident record) or `rejected` (stores reason)

