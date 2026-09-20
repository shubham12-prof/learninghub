# Variations

## What "variations" means

Producing new images that are similar in spirit — same subject, composition,
or style — to a reference image, but not identical. Useful for giving a user
"more like this one" without them re-writing a prompt.

## How variations are typically generated

### 1. Image-to-image (img2img) with noise re-injection

- Encode the reference image into latent space.
- Add a controlled amount of noise back into the latent (not all the way to
  pure noise).
- Run the reverse diffusion process from that partially-noised latent,
  optionally with the same or a lightly modified prompt.
- The amount of noise added is controlled by **denoising strength** (or
  "creativity" in some UIs):
  - Low strength (e.g. 0.2–0.4): subtle variation, structure/composition
    stays close to original.
  - High strength (e.g. 0.6–0.9): looser variation, more creative
    divergence, can lose the original composition entirely.

### 2. Seed manipulation

- Keep the prompt fixed, change the random seed → different variation each
  time, same general concept.
- Keep the seed fixed, make small prompt edits → useful for testing how a
  single word affects the image while holding randomness constant.
- Some tools support "seed interpolation" — blending between two seeds'
  noise for smooth transitions.

### 3. Embedding-based variation (e.g. DALL·E "Variations" endpoint, Midjourney's "vary")

- Encode the reference image into a semantic embedding (e.g. via CLIP image
  encoder), then generate new images conditioned on that embedding rather
  than the raw pixels. Produces stylistically/semantically similar but
  structurally freer results than img2img.
- Midjourney's "Vary (Subtle)" vs. "Vary (Strong)" buttons are a user-facing
  analogue of low vs. high denoising strength.

## Key parameters to know

- **Denoising strength / creativity** — main lever for how far a variation
  drifts from the source.
- **Seed** — controls the specific random draw; same seed + same everything
  else = deterministic reproduction.
- **CFG/guidance scale** — still applies; affects how strongly variations
  adhere to any accompanying prompt.
- **Batch generation** — generating N variations in parallel from the same
  prompt/seed-range for the user to pick from — a common product pattern.

## Interview-relevant talking points

- Explain the difference between "variations" and "editing": variations
  intentionally allow broad drift and don't target a specific region or
  attribute; editing targets a specific, controlled change.
- Explain why a fixed seed alone isn't enough for reproducibility — sampler,
  steps, CFG, model version, and prompt all need to match too.
- Be ready to discuss product tradeoffs: how much variation strength should
  a "give me more like this" button default to, and why (too subtle feels
  broken/duplicated; too strong feels unrelated).
