

## Plan: Sync Head of Household from Ecological Profile to Households/Residents

### Problem
When a resident submits an ecological profile, the member with `relationship_to_head: "Head"` is not getting `is_head_of_household = true` set in the `residents` table after approval. This is because:
1. The ecological form stores the head as `relationship_to_head: "Head"` but doesn't include `is_head_of_household: true` in the JSON
2. The `apply_ecological_submission_to_household` DB function only sets `is_head_of_household` from `(v_member->>'is_head_of_household')::BOOLEAN`, which is `NULL`

### Changes

**1. EcologicalProfileForm.tsx — Add `is_head_of_household` flag to member data on submission**
- Before saving `household_members` to the database, enrich each member with `is_head_of_household: true/false` based on whether `relationship_to_head === "Head"`
- This ensures the DB function can correctly pick up the head flag

**2. `apply_ecological_submission_to_household` DB function (migration) — Fallback logic**
- Add a fallback: if `is_head_of_household` is not set, check `relationship_to_head` or `relation_to_head` for value `"Head"` and treat that member as head
- This handles both old and new submissions correctly

### Files to modify
- `src/components/resident/EcologicalProfileForm.tsx` — enrich members with `is_head_of_household` before submit
- New migration — update `apply_ecological_submission_to_household` to fallback-check `relationship_to_head`

