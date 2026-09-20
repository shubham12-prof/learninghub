# Inpainting

## What inpainting means

Regenerating a **masked region inside** an existing image while keeping the
rest of the image untouched — e.g., removing an unwanted object, replacing a
face, changing an item of clothing, or fixing a defect. The model must
generate content that blends seamlessly with the surrounding, unmasked
pixels.

## How it works

1. **Mask input:** A binary (or soft/feathered) mask marks which pixels are
   editable (white/1) vs. fixed (black/0).
2. **Context conditioning:** The unmasked region is fed to the model as
   conditioning (directly, or via its latent encoding) so the generation
   inside the mask is consistent with surrounding color, lighting, texture,
   and perspective.
3. **Denoising only in the masked region:** In pixel-space or latent-space
   diffusion, at each step the model predicts the full image but the
   unmasked pixels are continually re-composited back in from the original
   (or blended with a feather), forcing the untouched area to stay fixed
   while the masked area is iteratively refined.
4. **Prompt:** Describes what should appear in the masked region — it should
   be written as if describing only that region's content, but stylistically
   consistent with the rest of the image (e.g., "a red ceramic vase" not "a
   photo of a vase in a photo of a room").

## Key parameters/concepts

- **Mask feathering** — blurring the mask edge so the transition between
  generated and original pixels isn't a hard line.
- **Mask precision** — tight masks give more control but risk visible seams
  if the model can't match style/lighting exactly; looser masks give the
  model more room to blend naturally but touch more of the original image.
- **"Inpaint whole image" vs. "inpaint masked area only"** — some tools
  downscale/crop to just the masked region + a padding margin for higher
  effective resolution on the edit; others process the full image for
  better global context. Tradeoff: resolution/detail vs. contextual
  coherence.
- **Denoising strength** applies within the mask too — full strength (1.0)
  ignores the _original_ content of the masked region entirely (better for
  "replace this object"); lower strength blends with what was there (better
  for "fix" or "touch up").

## Common use cases

- Object removal (mask the object, prompt describes the background that
  should fill in — "empty grass field").
- Object replacement (mask the object, prompt describes the new object).
- Defect/artifact repair (e.g., fixing a distorted hand).
- Face/detail restoration in upscaling pipelines.

## Interview-relevant talking points

- Explain why inpainting prompts should describe _only the masked content_,
  and what goes wrong if you re-describe the whole scene (the model may
  regenerate style/lighting inconsistent with the rest of the image, or
  ignore the mask boundary conceptually even though it respects it
  pixel-wise).
- Discuss the seam/blending problem and mitigations (feathering, context
  padding, color-matching post-process, multiple inpainting passes).
- Know that inpainting and "editing" are closely related; inpainting is the
  mechanism, editing is often the product-level use case built on top of it.
