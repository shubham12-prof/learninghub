Q1: What are utility-first CSS frameworks, and what are the advantages of using Tailwind CSS?
Answer:
A utility-first framework provides low-level, atomic styling classes (like flex, pt-4, text-center, bg-blue-500) that allow you to style elements completely inside your HTML markup instead of writing custom CSS stylesheets.

Advantages:

No context switching: You don't have to keep switching back and forth between your HTML file and external CSS styles.

Consistent design systems: Tailwind forces you to build with pre-configured spacing scales, color palettes, and breakpoints, avoiding messy design fragmentation.

Dead-code elimination: Tailwind's engine parses your code templates and purges unused utility classes, creating incredibly small, production-ready stylesheets.

Q2: How do you handle responsiveness and interactive states (like hover) in Tailwind CSS?
Answer:
Tailwind uses simple class prefixes to apply styles conditionally based on media queries or interactive states:

Responsive: Prefix utility classes with media breakpoints like md: or lg:.

Interactive states: Prefix utility classes with states like hover:, focus:, or active:.

HTML

<!-- Text color is gray on mobile, red on desktop, and turns black when hovered -->
<button class="text-gray-500 md:text-red-500 hover:text-black">
  Click Me
</button>
