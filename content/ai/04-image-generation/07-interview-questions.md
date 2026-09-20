# Interview Questions — Image Generation

A mix of conceptual, technical, and scenario-based questions with model
answers. Use these to self-test; try answering out loud before reading the
model answer.

---

## Conceptual

**Q1. How does a diffusion model generate an image from noise?**
A: It starts from random Gaussian noise and iteratively removes a predicted
amount of noise at each step, guided by a conditioning signal (like a text
embedding). The network is trained to reverse a forward process that
gradually added noise to real images, so running it backward from pure
noise converges on a plausible image consistent with the conditioning.

**Q2. What's the difference between latent diffusion and pixel-space
diffusion?**
A: Pixel-space diffusion denoises directly in image pixel space, which is
computationally expensive at high resolution. Latent diffusion (e.g. Stable
Diffusion) first compresses the image into a lower-dimensional latent space
via a VAE encoder, runs the diffusion process there, and decodes back to
pixels at the end — much faster and cheaper with comparable quality.

**Q3. What does the guidance scale (CFG) parameter control, and what
happens at extreme values?**
A: It controls how strongly generation is pulled toward the prompt. Low
values produce more varied, sometimes less prompt-accurate images; very high
values produce images that adhere closely to the prompt but can look
oversaturated, artifact-heavy, or "burned in."

**Q4. Explain the difference between inpainting and outpainting.**
A: Both regenerate a masked region while keeping the rest of the image
fixed — the mechanism is the same. The difference is where the mask is:
inpainting's mask lies inside the existing image content (e.g., replacing an
object), while outpainting's mask lies outside the original frame, extending
the canvas outward.

**Q5. What's the difference between "variations" and "editing"?**
A: Variations intentionally allow broad, undirected drift from a reference
image — same general subject/style but different in ways the user didn't
specify. Editing targets a specific, user-directed change (an instruction or
a mask) while keeping everything else as close to identical as possible.

**Q6. Why can't you just re-prompt with a slightly modified description to
"edit" an image?**
A: A fresh generation re-samples the entire image from scratch (or from a
mostly-noised latent), so identity, pose, background, and composition are
not preserved — you get a different image that happens to share some prompt
terms, not a modified version of the original. True editing needs to start
from the original image's latent/content and constrain most of it to stay
fixed.

---

## Technical

**Q7. What is denoising strength and how does it affect img2img, variations,
inpainting, and outpainting?**
A: It controls how much noise is re-injected into (or how far the process
starts from) the original image's latent before denoising. Low strength
keeps output close to the source (subtle edits/variations); high strength
allows the result to diverge more (bigger stylistic/structural changes, or
full replacement inside a mask).

**Q8. Why is mask feathering used in inpainting/outpainting?**
A: A hard-edged mask can produce a visible seam where generated pixels meet
original pixels. Feathering (blurring the mask edge) creates a gradual
blend zone so the transition is smooth and less detectable.

**Q9. What is ControlNet (or conditioning adapters generally) used for?**
A: It lets you condition generation on structural information beyond text —
e.g., a depth map, edge map, or pose skeleton — so the output follows a
specific composition or pose while still varying in style/content according
to the prompt. Commonly used for editing where you want to preserve
structure but change appearance.

**Q10. Why do large single-pass outpaints often look repetitive or
low-detail?**
A: The model has proportionally little nearby original-image context to
anchor a large new region, so it tends to fall back on generic or repeating
patterns. The standard fix is tiled/iterative outpainting — extending in
smaller steps so each new region always has substantial adjacent context.

**Q11. What's the role of the seed, and why isn't a fixed seed alone
enough for reproducibility?**
A: The seed initializes the random noise the generation starts from.
Reproducing an exact image requires also matching the model version,
sampler/scheduler, number of steps, guidance scale, and prompt — the seed
only fixes the randomness, not the rest of the pipeline configuration.

**Q12. Compare instruction-based editing to mask-based editing. When would
you use each?**
A: Instruction-based editing (natural language, no mask) is faster and more
accessible for end users, and works well for global or loosely localized
changes ("make it nighttime"). Mask-based editing gives precise, predictable
control over exactly which pixels change, and is preferable for surgical
edits (remove this object, replace only this region) where accidental
changes elsewhere are unacceptable.

---

## Scenario / Applied

**Q13. A user uploads a photo and asks to "remove the person in the
background." Walk through how you'd implement this.**
A: Segment or have the user mask the person (automatic segmentation model
or manual brush). Use that as an inpainting mask. Prompt describes what
should fill the space instead (e.g., matching background — "empty
sidewalk, same lighting"). Use a moderate-to-high denoising strength inside
the mask so the person is fully replaced, with feathering at the mask edge
for a seamless blend. Optionally run a color-matching post-process to
correct any tone mismatch at the boundary.

**Q14. A product wants a "convert this square product photo to a
widescreen banner" feature. What technique would you use and what are the
key considerations?**
A: Outpainting left and right to extend the canvas to the target aspect
ratio. Key considerations: use enough overlap/context margin so the
extension matches lighting/perspective; consider tiling if the extension is
large; keep the product itself untouched (it should sit entirely within the
original, unmasked region); leave room in the extended area for text
overlays if that's the downstream use case.

**Q15. A user complains that "variations" of their image look completely
unrelated to the original. What would you check?**
A: Most likely the denoising strength (or equivalent "creativity" setting)
is too high, causing the process to start from too little of the original
image's information. I'd check/lower that first; secondarily check whether
the correct reference image/embedding is actually being passed in, and
whether the seed range being sampled is appropriate.

**Q16. How would you evaluate/compare the quality of two prompt-writing
strategies for a text-to-image product feature?**
A: Define concrete evaluation axes: prompt adherence (does the image match
the described subject/attributes), aesthetic quality, consistency across
repeated generations, and failure rate (anatomy errors, artifacts, ignored
constraints). Run both strategies across a fixed benchmark set of diverse
prompts, and use a mix of automated metrics (e.g. CLIP-similarity for
adherence) and human/rater evaluation for aesthetics, since aesthetic
judgment doesn't reduce well to a single automated score.

**Q17. Design a mental checklist you'd give a non-technical user for
writing better prompts.**
A: (1) Name the subject and its key visible attributes concretely. (2) Say
what style/medium you want. (3) Mention lighting or mood if it matters. (4)
Say what to avoid (negative prompt) if the tool supports it. (5) Keep it as
short as possible while still unambiguous — don't over-stuff with
adjectives that don't map to something visual.
