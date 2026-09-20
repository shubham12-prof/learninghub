Q1: What are ARIA attributes, and when should you use them?
Answer:
ARIA stands for Accessible Rich Internet Applications. They are special HTML attributes (like aria-label, aria-hidden, role) that provide additional descriptive context to assistive technologies when standard HTML tags fall short.

The Golden Rule of ARIA: No ARIA is better than bad ARIA. You should always prefer native semantic HTML elements (<button>, <nav>, <dialog>) over adding ARIA attributes to non-semantic elements (<div role="button">). Only use ARIA when custom complex widgets (like an advanced dropdown or modal) cannot be built using native tags alone.

Q2: Why is the alt attribute mandatory for the <img> tag, and how do you handle decorative images?
Answer:
The alt (alternative text) attribute describes the visual content of an image for screen-reader users and acts as fallback text if the image fails to load.

Informational images: Should have a descriptive, concise text value.

Decorative images: (e.g., background flourishes or icons next to text that already says the same thing) must still include the alt attribute, but it should be left completely empty (alt=""). This tells screen readers to intentionally skip over the image rather than reading out the messy file name.

HTML

<!-- Informational -->
<img src="chart.png" alt="Bar chart showing a 20% increase in Q1 sales.">

<!-- Decorative -->
<img src="decorative-line.png" alt="">
