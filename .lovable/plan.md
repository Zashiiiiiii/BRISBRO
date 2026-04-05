

# Fix: Add `proof_document_url` Column to `name_change_requests`

**Chosen Option: A** — Keep the proof upload feature and add the missing database column.

## Why It's Failing
The `name_change_requests` table does not have a `proof_document_url` column, but the `NameChangeRequestForm` code and `get_name_change_requests_for_staff` RPC both reference it. The schema cache rejects the insert.

## Steps

### 1. Database Migration
Add the missing column and create the storage bucket with policies:

```sql
ALTER TABLE public.name_change_requests ADD COLUMN proof_document_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('name-change-proofs', 'name-change-proofs', true);

CREATE POLICY "Residents can upload name change proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'name-change-proofs');

CREATE POLICY "Anyone can view name change proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'name-change-proofs');
```

### 2. Code Change — `NameChangeRequestForm.tsx`
Add null-safe handling: only include `proof_document_url` in the insert payload when a file was uploaded and a URL was obtained. If no file, omit the field or set to `null`.

### 3. Schema Types Refresh
After migration, the generated types will auto-update to include the new column, resolving the schema cache error.

## Files to Modify
| File | Change |
|------|--------|
| New migration | Add column + storage bucket + policies |
| `src/components/resident/NameChangeRequestForm.tsx` | Null-safe `proof_document_url` in insert payload |

