# Image Generation — Interview Prep Overview

This set of notes covers the core areas of AI image generation that commonly
come up in interviews for roles touching generative AI, prompt engineering,
creative tooling, or applied ML product work.

## Contents

1. `01-image-generation-fundamentals.md` — how text-to-image models work, the
   major model families, and key vocabulary.
2. `02-prompt-writing.md` — how to write effective prompts, structure,
   weighting, negative prompts, and common pitfalls.
3. `03-editing.md` — instruction-based and mask-based image editing.
4. `04-variations.md` — generating variations of an existing image (img2img,
   seed control, strength/denoise parameters).
5. `05-inpainting.md` — filling in or replacing masked regions of an image.
6. `06-outpainting.md` — extending an image beyond its original borders.
7. `07-interview-questions.md` — a bank of interview questions (conceptual,
   technical, and scenario-based) with model answers.

## How to use this

- Read fundamentals first if you're rusty on diffusion models.
- Skim prompt writing even if you're technical — interviewers love asking
  candidates to write or critique a prompt live.
- Treat editing / variations / inpainting / outpainting as four points on the
  same spectrum: all are "conditioned generation," differing in what part of
  the image is held fixed vs. regenerated, and how the condition is supplied.
- Use the question bank at the end to self-test.
