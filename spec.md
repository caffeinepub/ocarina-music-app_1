# Specification

## Summary
**Goal:** Allow users to replace the ocarina SVG illustration with a custom uploaded image, and independently drag and resize the 4 tone holes overlaid on top of it.

**Planned changes:**
- Add an image upload control to the OcarinaVisual panel so users can upload a custom PNG or JPEG to replace the SVG ocarina illustration.
- When a custom image is active, hide the SVG layer and render the uploaded image as the ocarina body background.
- Add a "Remove custom image" button that restores the original SVG illustration.
- When a custom image is active, render all 4 tone holes as absolutely-positioned overlay circles on top of the image.
- Make each tone hole independently draggable within the image container bounds.
- Add a visible resize handle to each tone hole allowing independent resizing (min 6px, max 60px radius).
- Persist each hole's position and size in component state independently.
- When a new custom image is uploaded, initialize holes at default centered positions; when the SVG is restored, holes revert to their default grid positions.
- Open/closed fingering state continues to update in real time in both SVG and custom-image modes.

**User-visible outcome:** Users can upload their own ocarina image and freely reposition and resize each of the 4 tone holes on top of it, while fingering indicators continue to reflect the selected notes in real time.
