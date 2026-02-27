# Specification

## Summary
**Goal:** Add ocarina size/pitch presets, replace the separate Ocarinery page with an expandable sliding showcase panel on the main page, protect profile mutations with a creator password, and support bulk image upload.

**Planned changes:**
- Add four size/pitch preset options (Low Bass/C3, Bass/C4, Alto/C5, Soprano/C6) to the ocarina profile upload/edit form; display the selected label (e.g., "Alto – C5") as a footer on each profile card.
- Update the backend Motoko `OcarinaProfile` record to include a `sizePitch` variant field; update all CRUD endpoints to read/write this field; default existing profiles to Alto/C5.
- Remove the separate Ocarinery page/route and replace it with an expandable/collapsible panel anchored at the top of the main page that slides open vertically.
- Inside the expanded panel, show all public ocarina profile cards in a horizontally scrolling strip with left (◀) and right (▶) arrow buttons and continuous auto-scroll (pauses on hover).
- Each card displays the ocarina photo, name, size/pitch footer, and a "Play Ocarina" button that loads the profile into the main play view.
- Protect all profile create, edit, and delete operations behind a password prompt modal; verify the creator password on the backend without storing or transmitting it as plain text in the frontend.
- Support bulk image upload in the profile creation form: multiple selected images each create their own profile record sharing the same form settings, with a progress indicator during upload.

**User-visible outcome:** Users can browse all ocarina profiles in a collapsible sliding panel on the main page, see each ocarina's size/pitch label, bulk-upload multiple ocarina images at once, and all profile mutations are protected by a password prompt.
