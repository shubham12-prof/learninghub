Q1: When should you use Flexbox, and when should you use CSS Grid?
Answer:

Flexbox (1-Dimensional Layout): Best for aligning items in a single row or a single column. It is content-driven, meaning components expand or shrink to fit their content naturally. Perfect for navigation bars, header rows, or custom button alignments.

Grid (2-Dimensional Layout): Best for complex layouts that align items along rows and columns simultaneously. It is layout-driven, meaning you define the structural grid system first, then place elements inside it. Perfect for entire page layouts, photo galleries, or complex dashboards.

Q2: What is the difference between justify-content and align-items in Flexbox?
Answer:

justify-content: Aligns items along the Main Axis (defined by flex-direction). If the direction is row (default), it controls horizontal alignment (flex-start, center, space-between).

align-items: Aligns items along the Cross Axis (perpendicular to the main axis). If the direction is row, it controls vertical alignment (stretch, center, flex-end).
