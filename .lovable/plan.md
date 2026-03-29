

## Plan: Fix Ecological Census Infinite Save Loop

### Root Cause
The auto-save creates an infinite loop:
1. Auto-save calls `handleSaveCensusData()`
2. After saving, it calls `loadData()` then `handleSelectHousehold()` (line 796)
3. `handleSelectHousehold` calls `setCensusData(...)` which updates the form state
4. The `censusData` change-detection `useEffect` (line 381) compares against `prevCensusDataRef` and detects differences (because loaded data may serialize slightly differently)
5. It marks sections as `'unsaved'`
6. The auto-save `useEffect` (line 402) sees `'unsaved'` sections and triggers another save
7. Repeat forever -- causing the "always loading" state

### Fix (single file: `src/components/staff/EcologicalProfileTab.tsx`)

**1. Add a flag to suppress change detection after data load**

Add a ref `isLoadingCensusRef = useRef(false)` that gets set to `true` before loading census data and `false` after. The change-detection `useEffect` (line 381) skips marking sections unsaved when this flag is true.

**2. Set the flag in `handleSelectHousehold`**

Before calling `setCensusData`, set `isLoadingCensusRef.current = true`. After the state is applied (in a `useEffect` or after the async work), set it back to `false` and update `prevCensusDataRef.current = censusData` so the diff check has the correct baseline.

**3. Skip reload after auto-save**

In `handleSaveCensusData`, the post-save reload (`loadData()` + `handleSelectHousehold()`, lines 744-797) is only needed for manual saves. Add a parameter `skipReload?: boolean` to `handleSaveCensusData`. The auto-save call passes `true`; the manual save button keeps the default (`false`).

**4. Reset `prevCensusDataRef` when household changes**

In the existing `useEffect` that resets `sectionSaveStatus` on household change (line 430-432), also reset `prevCensusDataRef.current = censusData` so no stale diff triggers false unsaved markers.

### Summary of Changes

| Location | Change |
|----------|--------|
| Line ~183 | Add `isLoadingCensusRef = useRef(false)` |
| Line 381-398 | Guard change-detection with `if (isLoadingCensusRef.current) return` |
| Line 430-432 | Also reset `prevCensusDataRef.current` on household change |
| Line 538-634 | Set `isLoadingCensusRef.current = true` before `setCensusData`, reset after with `setTimeout(() => { prevCensusDataRef.current = censusData; isLoadingCensusRef.current = false; }, 0)` |
| Line 638 | Change signature to `handleSaveCensusData(skipReload = false)` |
| Line 743-797 | Wrap reload block in `if (!skipReload) { ... }` |
| Line 413 | Call `await handleSaveCensusData(true)` in auto-save |

### Files Modified
| File | Change |
|------|--------|
| `src/components/staff/EcologicalProfileTab.tsx` | Fix infinite auto-save loop |

