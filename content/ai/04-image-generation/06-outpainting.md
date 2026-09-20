# Outpainting

## What outpainting means

Extending an image **beyond its original borders** — generating new content
that plausibly continues the scene outward (left, right, up, down, or all
directions), rather than modifying anything inside the original frame. Also
called "uncropping" or "canvas extension."

## How it works

1. **Canvas expansion:** The original image is placed onto a larger blank
   (or noise-initialized) canvas, offset so there's empty space on the
   side(s) to be extended.
2. **Masking:** The new empty region is treated exactly like an inpainting
   mask — it's the "editable" area — while the original image content is the
   fixed context.
3. **Context conditioning:** The model conditions on the edge pixels of the
   original image (color, texture, perspective lines, lighting direction) to
   extrapolate a continuation that feels seamless at the boundary.
4. **Prompt:** Should describe what plausibly exists beyond the frame — e.g.
   if the original is a portrait cropped at the shoulders, the prompt for
   outpainting downward might be "same person's torso and arms, matching
   lighting and clothing."
5. **Iterative/tiled outpainting:** For large extensions, tools often
   outpaint in overlapping tiles/steps rather than one huge jump, since a
   single very large blank region is harder for the model to fill
   coherently (less nearby context to anchor to per unit of new area).

## Key parameters/concepts

- **Overlap margin** — how much of the original image is included as
  context alongside the new region; more overlap = better boundary
  consistency, less new area generated per pass.
- **Aspect ratio / canvas size changes** — outpainting is the standard way
  to convert an image's aspect ratio (e.g. square → widescreen) without
  simply stretching or cropping it.
- **Direction control** — extending in one direction only vs. all sides
  (for going from portrait to landscape, typically left+right).
- Same masking/denoising mechanics as inpainting — outpainting is really
  "inpainting where the mask lies entirely outside the original content
  boundary."

## Common use cases

- Changing aspect ratio for a different platform/format (e.g., square photo
  → 16:9 banner).
- "Zooming out" to reveal more of a scene.
- Extending backgrounds for design/marketing assets so there's room for
  text overlays.
- Creating panoramas from a single image.

## Interview-relevant talking points

- Be ready to explain outpainting as a special case of inpainting (mask
  outside the frame vs. inside it) — interviewers often ask you to compare
  the two directly.
- Discuss why boundary consistency (lighting, perspective, texture
  continuity) is the central technical challenge, and how overlap/context
  padding addresses it.
- Discuss the practical failure mode: outpainting large empty areas in one
  shot tends to produce repetitive or low-detail content because there's
  little nearby context — tiling/iterating is the standard fix.
