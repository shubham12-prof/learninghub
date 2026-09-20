# Image Editing

## What "editing" means in this context

Taking an existing image and modifying some aspect of it — an object, color,
style, background, pose — while preserving everything else the user didn't
ask to change. This is distinct from generating a brand-new image from
scratch.

## Main approaches

### 1. Instruction-based editing

The user gives a natural-language instruction ("make the sky sunset-colored,"
"remove the person on the left," "turn this into a pencil sketch") and the
model applies it directly, without the user drawing a mask.

- Examples: InstructPix2Pix-style models, GPT-Image/DALL·E "edit" endpoints,
  Gemini/Nano-Banana-style conversational image editing.
- Under the hood these are often trained on (original image, instruction,
  edited image) triplets so the model learns to localize the edit itself.

### 2. Mask-based editing

The user (or an automatic segmentation step) supplies a mask specifying
exactly which pixels can change; the model regenerates only inside the mask
while conditioning on the surrounding context so it blends seamlessly.

- This overlaps heavily with **inpainting** (see that file) — mask-based
  editing is essentially inpainting used for targeted edits rather than
  "fixing" or "removing" something.

### 3. Structure-conditioned editing

Uses auxiliary conditioning signals — depth maps, edge maps (Canny), pose
skeletons, segmentation maps — via adapters like **ControlNet** to constrain
an edit or full regeneration to follow the original image's structure while
changing style/content.

### 4. Attention/latent manipulation techniques (research-level)

Techniques like prompt-to-prompt editing, null-text inversion, or SDEdit
manipulate the model's cross-attention maps or start the denoising process
partway from the original image's latent (rather than pure noise) to make
targeted edits without retraining.

## Key parameters/concepts to know

- **Denoising strength** — how far from the original image the edit is
  allowed to drift. Low strength = subtle edit, preserves most structure;
  high strength = closer to a full regeneration.
- **Mask feathering/blur** — softening mask edges to avoid a hard seam
  between edited and untouched regions.
- **Region-of-interest conditioning** — ensuring edits respect the local
  context (lighting, perspective, shadows) so the composite looks native
  rather than pasted-on.

## Interview-relevant talking points

- Be able to contrast instruction-based vs. mask-based editing and when
  you'd choose each (mask-based gives precise control; instruction-based is
  faster/more accessible but less predictable).
- Understand why naive "generate a new image with a modified prompt" usually
  fails as an editing strategy — it regenerates the whole image and loses
  consistency (identity, pose, background) unless you specifically preserve
  the latent/structure.
- Know the tradeoff between edit fidelity (stays close to original) and edit
  strength (fully realizes the instruction).
