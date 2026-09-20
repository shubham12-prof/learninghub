# OpenAI APIs — Image Generation

> Note: Check current docs for the latest image model name(s), parameters, and pricing, as these are updated periodically.

## 1. What is the Images API?

The Images API lets you generate images from text prompts, edit existing images, and create variations of an image — powered by OpenAI's image generation models (the DALL·E family and successors).

```
POST https://api.openai.com/v1/images/generations   -> text-to-image
POST https://api.openai.com/v1/images/edits          -> edit part of an image (with a mask)
POST https://api.openai.com/v1/images/variations      -> generate variations of an existing image
```

## 2. Generating an Image from Text

```python
from openai import OpenAI
client = OpenAI()

response = client.images.generate(
    model="gpt-image-1",  # or the current image model per docs
    prompt="A serene mountain lake at sunrise, photorealistic, golden light",
    size="1024x1024",
    n=1,
)

image_url = response.data[0].url
print(image_url)
```

```python
# Some models return base64-encoded image data instead of/in addition to a URL
import base64

image_b64 = response.data[0].b64_json
with open("output.png", "wb") as f:
    f.write(base64.b64decode(image_b64))
```

## 3. Key Parameters

| Parameter         | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `prompt`          | Text description of the desired image                              |
| `model`           | Which image model to use                                           |
| `size`            | Output resolution (e.g., `1024x1024`, `1792x1024`, `1024x1792`)    |
| `quality`         | Rendering quality tier (e.g., `standard` vs `hd`, model-dependent) |
| `n`               | Number of images to generate (some models only support `n=1`)      |
| `style`           | Style hint (e.g., `vivid` vs `natural`, model-dependent)           |
| `response_format` | `url` or `b64_json`                                                |

```python
response = client.images.generate(
    model="gpt-image-1",
    prompt="A minimalist logo for a coffee shop called 'Beanstalk', flat design, vector style",
    size="1024x1024",
    quality="high",
    n=2,
)
```

## 4. Writing Effective Prompts

```
Vague prompt:   "A dog"
Better prompt:  "A golden retriever puppy sitting in a field of wildflowers,
                 soft morning light, shallow depth of field, photorealistic"
```

Effective prompts typically specify: subject, setting, style/medium (photo, illustration, 3D render), lighting, composition/framing, and mood.

## 5. Image Editing (Inpainting with a Mask)

```python
response = client.images.edit(
    model="gpt-image-1",
    image=open("original_room.png", "rb"),
    mask=open("mask.png", "rb"),  # transparent areas indicate what to regenerate
    prompt="Add a large potted plant in the corner of the room",
    size="1024x1024",
)
```

The mask's transparent (alpha=0) regions indicate which parts of the image should be regenerated; opaque regions are preserved from the original.

## 6. Image Variations

```python
response = client.images.create_variation(
    model="dall-e-2",  # variations endpoint historically tied to DALL-E 2; check current support
    image=open("original.png", "rb"),
    n=3,
    size="1024x1024",
)
for item in response.data:
    print(item.url)
```

## 7. Using Image Generation in an Agentic Workflow (Responses API)

```python
response = client.responses.create(
    model="gpt-4o",
    input="Generate an image of a futuristic city skyline at night, then describe its key architectural features.",
    tools=[{"type": "image_generation"}],
)

for item in response.output:
    if item.type == "image_generation_call":
        # image data available in item.result (base64) per current docs
        pass
    elif item.type == "message":
        print(item.content)
```

This lets a single conversational turn both generate an image and produce accompanying text, useful for design/creative assistant applications.

## 8. Content Policy & Moderation

Image generation requests are subject to OpenAI's usage policies — prompts requesting content involving real public figures in a misleading way, graphic violence, sexual content involving minors, or other prohibited categories will be rejected or filtered. Always handle rejection responses gracefully in your application.

```python
try:
    response = client.images.generate(model="gpt-image-1", prompt=user_prompt)
except Exception as e:
    # Handle content policy violations, invalid prompts, etc.
    print(f"Image generation failed: {e}")
```

## 9. Practical Application Example (Flask/FastAPI endpoint)

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ImageRequest(BaseModel):
    prompt: str
    size: str = "1024x1024"

@app.post("/generate-image")
async def generate_image(req: ImageRequest):
    response = client.images.generate(
        model="gpt-image-1",
        prompt=req.prompt,
        size=req.size,
    )
    return {"url": response.data[0].url}
```

## 10. Cost & Rate Limit Considerations

- Image generation is typically priced per image (varying by resolution/quality tier), separate from text token-based pricing.
- Higher resolution/quality settings cost more and take longer to generate.
- Apply rate limiting on your own API layer if exposing image generation to end users, since costs can scale quickly with high-volume, low-friction access.

## 11. Best Practices

1. Write detailed, specific prompts (subject, style, lighting, composition) for more predictable results.
2. Use masks precisely for inpainting — only the transparent mask area gets regenerated.
3. Cache/store generated images (e.g., in your own storage/CDN) rather than relying on temporary URLs long-term, since generated image URLs may expire.
4. Handle content policy rejections gracefully with clear user-facing messaging.
5. Consider cost implications of resolution/quality settings, especially at scale — default to the lowest setting that meets your quality bar.
6. Moderate user-supplied prompts on your end too if building a public-facing tool, as an extra safety layer beyond OpenAI's own filtering.
