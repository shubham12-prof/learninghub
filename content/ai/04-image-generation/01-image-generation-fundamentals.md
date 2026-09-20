# Image Generation — Fundamentals

## What "image generation" means

Image generation is the task of producing a novel image from some
conditioning signal — usually text, but also an image, a sketch, a mask, or a
combination of these. Modern systems are almost all built on **diffusion
models**, though GANs, VAEs, and autoregressive/transformer-based models
(e.g. token-based image generation) are still relevant background.

## Core model families

| Family                               | Idea                                                                            | Examples                                         |
| ------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| GAN (Generative Adversarial Network) | Generator vs. discriminator trained adversarially                               | StyleGAN                                         |
| VAE (Variational Autoencoder)        | Encode to a latent distribution, decode back                                    | Used as a component inside diffusion pipelines   |
| Diffusion models                     | Learn to reverse a gradual noising process                                      | Stable Diffusion, DALL·E 2/3, Imagen, Midjourney |
| Autoregressive / token-based         | Predict image tokens sequentially, like language modeling                       | Parti, early DALL·E                              |
| Latent diffusion                     | Diffusion run in a compressed latent space instead of pixel space (much faster) | Stable Diffusion family                          |

## How diffusion models work (high level)

1. **Forward process (training only):** Gradually add Gaussian noise to a
   real image over many steps until it becomes pure noise.
2. **Reverse process (generation):** Train a neural network (usually a U-Net
   or a diffusion transformer / DiT) to predict and remove noise step by
   step, starting from random noise and ending at a coherent image.
3. **Conditioning:** At each denoising step, the model is also given a
   conditioning signal (e.g., a text embedding from CLIP or a T5 encoder),
   so the denoising is steered toward the description.
4. **Latent space:** Many production models (Stable Diffusion) diffuse in a
   compressed latent space produced by a VAE encoder, then decode the final
   latent back to pixels — this is far cheaper than pixel-space diffusion.

## Key vocabulary you should be fluent in

- **Prompt / negative prompt** — what to include / exclude.
- **Seed** — the random noise initialization; fixing it gives reproducibility.
- **Sampler / scheduler** (e.g. DDIM, Euler, DPM++) — the algorithm used to
  step through the denoising process; affects speed and style of output.
- **Steps** — number of denoising iterations; more steps ≈ more refinement,
  with diminishing returns.
- **CFG / guidance scale** (classifier-free guidance) — how strongly the
  output is pulled toward the prompt vs. free generation. Higher = more
  literal/prompt-adherent but can look over-saturated or artifact-prone.
- **Denoising strength** — for image-to-image tasks, how much of the
  original image's structure is preserved vs. overwritten.
- **Latent space** — the compressed representation diffusion operates in.
- **ControlNet / conditioning adapters** — auxiliary networks that let you
  condition generation on structure (pose, depth, edges, segmentation) in
  addition to text.
- **LoRA / fine-tuning** — lightweight adapters trained to bias a base model
  toward a style, subject, or character.
- **Mask** — a binary or soft map indicating which pixels should be
  regenerated (used in inpainting/outpainting).

## Why this matters for an interview

Interviewers use fundamentals questions to check that you're not just a
"prompt typist" — that you understand _why_ prompts, masks, and parameters
behave the way they do. Being able to explain guidance scale or denoising
strength in one or two sentences is a strong signal.
