# Specification

## Summary
**Goal:** Persist the ocarina fingering map to the backend and extend the Fingering Settings panel with global save controls.

**Planned changes:**
- Add a backend `saveFingeringMap` update method that stores the full 8-note fingering map (C5–C6) in stable storage.
- Add a backend `loadFingeringMap` query method that returns the stored map, or defaults if none is saved.
- Extend `useFingeringMap` hook to load the persisted map from the backend on app startup and expose a `saveToBackend` function.
- Add a "Global Controls" section at the top of `FingeringSettingsPanel.tsx` containing a "Save Fingering Map" button and a status indicator (Saved / Unsaved changes).
- Existing per-note hole toggle grid and Reset to Defaults button remain unchanged below the new global controls section.

**User-visible outcome:** Users can save their custom fingering map for all 8 notes to the backend via a button in the Fingering Settings panel. The saved configuration persists across sessions and canister upgrades, and the panel shows whether there are unsaved changes.
