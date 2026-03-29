

## Plan: Ecological Census UX Improvements

### Current State
`EcologicalProfileTab.tsx` (2983 lines) uses a 7-tab layout (`Tabs` component) with the household selector embedded inside the "Basic Info" tab. The selected household is shown as an `Alert` banner that scrolls away. Each tab's render function checks for `selectedHousehold` and shows a warning if none is selected.

### Changes — All in `src/components/staff/EcologicalProfileTab.tsx`

#### 1. Sticky "Selected Household" Bar
- Move the existing `Alert` banner (lines 2848-2857) outside the accordion/tabs area, right after the summary stats cards.
- Make it `sticky top-0 z-10 bg-background` so it stays visible during scrolling.
- Add a "Change Household" button that scrolls to / opens the "Basic Info" accordion section (which contains the household table).
- Show household number, address, member count, and head of household name.
- When no household is selected, show a muted prompt: "No household selected — expand Basic Info to choose one."

#### 2. Replace Tabs with Accordion Layout
- Remove the `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` wrapping (lines 2860-2896).
- Import `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/components/ui/accordion`.
- Render all 7 sections as `AccordionItem` elements using `type="multiple"` so multiple can be open.
- Default open: `["basic-info"]` (first section).
- Each `AccordionTrigger` shows the section icon + label from `CENSUS_TABS`.
- Track open sections via state `openSections` (string array) to control the accordion value.
- The "Change Household" button in the sticky bar sets `openSections` to include `"basic-info"` and scrolls to it via `scrollIntoView`.

#### 3. Auto-Save Per Section with Status Indicator
- Add state: `sectionSaveStatus: Record<string, 'saved' | 'unsaved' | 'saving'>` initialized to all `'saved'`.
- When any field in `censusData` changes, mark the corresponding section as `'unsaved'`.
- Map fields to sections:
  - `basic-info`: interviewDate, interviewerName, respondentName, respondentRelation
  - `education-health`: educationData, familyPlanning
  - `household-members`: (read-only from residents, but includes special category counts)
  - `environmental`: foodProduction, animals
  - `health-info`: healthData, immunizationData, pregnantData, disabilityData, deathData, seniorData, soloParentCount, pwdCount, is4PsBeneficiary, additionalNotes
- Auto-save: use a `useEffect` with a 2-second debounce. When any section is `'unsaved'` and a household is selected, call `handleSaveCensusData` (mark as `'saving'`, then `'saved'` on success).
- Show a small indicator next to each `AccordionTrigger`: a green dot + "Saved" or orange dot + "Unsaved" or spinner + "Saving...".
- Keep the manual "Save Census Data" button in the report section as a fallback.

#### 4. Next / Previous Section Buttons
- At the bottom of each accordion section's content, render navigation buttons:
  - "Previous: [Section Name]" (disabled on first section)
  - "Next: [Section Name]" (disabled on last section)
- Clicking opens the target section in the accordion and closes the current one (update `openSections`), then scrolls to the new section.
- Use `CENSUS_TABS` array index to determine prev/next.

### Technical Details

**State additions:**
```ts
const [openSections, setOpenSections] = useState<string[]>(["basic-info"]);
const [sectionSaveStatus, setSectionSaveStatus] = useState<Record<string, 'saved' | 'unsaved' | 'saving'>>({});
```

**Debounced auto-save:**
```ts
useEffect(() => {
  if (!selectedHousehold) return;
  const unsaved = Object.values(sectionSaveStatus).some(s => s === 'unsaved');
  if (!unsaved) return;
  const timer = setTimeout(async () => {
    setSectionSaveStatus(prev => Object.fromEntries(
      Object.entries(prev).map(([k, v]) => [k, v === 'unsaved' ? 'saving' : v])
    ));
    await handleSaveCensusData(); // existing save function
    setSectionSaveStatus(prev => Object.fromEntries(
      Object.entries(prev).map(([k, v]) => [k, v === 'saving' ? 'saved' : v])
    ));
  }, 2000);
  return () => clearTimeout(timer);
}, [sectionSaveStatus, selectedHousehold]);
```

**Section navigation helper:**
```ts
const navigateSection = (targetId: string) => {
  setOpenSections(prev => [...prev.filter(s => s !== activeSection), targetId]);
  document.getElementById(`section-${targetId}`)?.scrollIntoView({ behavior: 'smooth' });
};
```

### Imports to Add
- `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/components/ui/accordion`
- `ChevronLeft, ChevronRight` from `lucide-react`

### Imports to Remove
- `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs` (only from this component; still used elsewhere)

### Files Modified
| File | Change |
|------|--------|
| `src/components/staff/EcologicalProfileTab.tsx` | All changes: sticky bar, accordion, auto-save, nav buttons |

### Acceptance Tests
- a) Select a household → sticky bar stays visible while scrolling through sections
- b) Click "Change Household" → Basic Info section opens and scrolls into view
- c) Edit a field → indicator shows "Unsaved" → after 2s, auto-saves and shows "Saved"
- d) Click "Next" on Basic Info → Housing section opens, Basic Info collapses, view scrolls
- e) Click "Previous" on Housing → returns to Basic Info
- f) Multiple sections can be open simultaneously
- g) Print/Preview/Save buttons still work correctly

