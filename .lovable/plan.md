

# Fix: File input closing the modal

## Problem
When selecting a proof file via the native file picker, the dialog closes because Radix Dialog interprets the file picker interaction as an "outside" click.

## Solution
Add `onInteractOutside` handler to `DialogContent` to prevent the dialog from closing when the user interacts with the file picker overlay.

## File Change

**`src/components/resident/NameChangeRequestForm.tsx`** (line 177):
- Change `<DialogContent className="max-w-md">` to:
```tsx
<DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
```

This single prop prevents the Radix dialog from closing on outside interactions (which includes the native OS file picker dialog), while still allowing the X button and Cancel button to close the modal normally.

