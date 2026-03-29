

## Plan: Remove Redundant "Head" Badge from Member Name Column

### Problem
In the Ecological Census household members table, the "Head" badge appears below the member's name, but the "Relation" column already shows "Head" beside it — making the badge redundant.

### Change

**File: `src/components/staff/EcologicalProfileTab.tsx`** (lines 2264-2266)

Remove the `Badge` element inside the name `TableCell`:
```tsx
// REMOVE these 3 lines:
{r.is_head_of_household && (
  <Badge variant="outline" className="ml-2">Head</Badge>
)}
```

The relation column on line 2268 already displays "Head" when applicable, so no information is lost.

### Files Modified
| File | Change |
|------|--------|
| `src/components/staff/EcologicalProfileTab.tsx` | Remove Head badge from name column (lines 2264-2266) |

