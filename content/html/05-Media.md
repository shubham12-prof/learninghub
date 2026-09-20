5. Media
   Q1: How does the <picture> tag differ from the standard <img> tag?
   Answer:
   The standard <img> tag displays a single image source (though it can use srcset for responsive scaling).

The <picture> tag is a wrapper that contains one or more <source> tags and a fallback <img>. It is used for art direction and advanced responsiveness. It allows you to:

Serve completely different image formats based on browser support (e.g., modern .webp or .avif, falling back to .jpg).

Serve completely cropped or redesigned images depending on the user's viewport width or device orientation.

HTML
<picture>

  <!-- Serve AVIF if browser supports it AND width is min 800px -->
  <source srcset="large-hero.avif" media="(min-width: 800px)" type="image/avif">
  <!-- Fallback JPG for mobile viewports -->
  <source srcset="small-hero.jpg" media="(max-width: 799px)">
  <!-- Absolute fallback if <picture> isn't supported -->
  <img src="fallback-default.jpg" alt="Company hero banner">
</picture>
Q2: What are the benefits of using the loading="lazy" attribute on images and iframes?
Answer:
The loading="lazy" attribute defers the loading of off-screen images or iframes until the user scrolls down near them.

Benefits:

Performance: Boosts page load speeds significantly by prioritizing critical, above-the-fold content.

Bandwidth savings: Saves data for users, which is especially vital on limited mobile connections, by not downloading images they may never scroll down to see.
