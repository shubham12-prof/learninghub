# Prompt Writing

## Goal of a good prompt

Give the model enough specific, unambiguous, visually-groundable information
to converge on the image you want — without over-constraining it into
contradictions or dilution.

## Anatomy of a strong prompt

A useful mental template:

```
[Subject] + [Action/Pose] + [Setting/Environment] + [Style/Medium]
+ [Lighting/Mood] + [Composition/Camera] + [Quality/Detail modifiers]
```

Example:

> "A weathered lighthouse keeper checking a brass telescope, standing on a
> cliffside lighthouse balcony at dusk, oil painting style, warm golden-hour
> lighting, wide-angle composition, highly detailed, dramatic sky"

## Principles

1. **Be concrete, not abstract.** "A sad old man" is weaker than "an elderly
   man with downcast eyes, slumped shoulders, sitting alone on a park bench
   in the rain." Diffusion models respond to visually groundable detail, not
   emotional adjectives alone.
2. **Order matters (model-dependent).** Many models weight earlier tokens
   more heavily. Put the most important subject/action first.
3. **Specify style and medium explicitly** — "photograph," "3D render,"
   "watercolor," "anime," "isometric illustration" — otherwise the model
   guesses, often defaulting to a generic photoreal or digital-art look.
4. **Use negative prompts** to exclude common failure modes: "blurry, low
   quality, extra limbs, watermark, text, distorted hands, cropped."
5. **Control emphasis with weighting syntax** (implementation-specific):
   - `(word)` or `(word:1.3)` in Stable Diffusion-style UIs to up-weight.
   - `[word]` or `(word:0.7)` to down-weight.
   - Use sparingly — heavy weighting can distort composition.
6. **Balance specificity and length.** Extremely long prompts can dilute
   attention across too many attributes; extremely short prompts under-
   specify and increase randomness. Aim for the smallest prompt that removes
   ambiguity.
7. **Iterate, don't front-load everything.** Get composition/subject right
   first at low step count, then refine style/lighting/detail in follow-up
   passes.
8. **Know your model's quirks.** Some models (e.g. Midjourney, DALL·E 3) do
   better with natural-language sentences; others (classic Stable Diffusion
   1.5) respond better to comma-separated tag lists. Adapt your style to the
   tool.

## Common failure modes and fixes

| Symptom                           | Likely cause                                       | Fix                                                                      |
| --------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| Wrong subject count / extra limbs | Ambiguous or conflicting descriptors               | Simplify subject description, add negative prompt terms                  |
| Style not applied                 | Style term too weak or contradicted by other terms | Move style term earlier, increase weight, remove conflicting style words |
| Text/watermark artifacts          | Common in training data for certain phrases        | Add to negative prompt                                                   |
| Output ignores part of the prompt | Prompt too long / attention diluted                | Shorten, prioritize, or split into two generation passes                 |
| Overly literal/plastic look       | CFG/guidance scale too high                        | Lower guidance scale                                                     |

## Prompting for editing/variation/inpainting/outpainting (preview)

These downstream tasks reuse everything above, but the prompt now describes
only _what should appear in the changed region_ — it should still be
consistent with the untouched context (lighting, perspective, style) or you
get visible seams. More detail in the later files.

## Quick checklist before submitting a prompt

- [ ] Is the subject unambiguous?
- [ ] Is the style/medium stated?
- [ ] Is lighting/mood specified if it matters?
- [ ] Have I excluded known failure modes via negative prompt?
- [ ] Is the prompt as short as possible while still unambiguous?
