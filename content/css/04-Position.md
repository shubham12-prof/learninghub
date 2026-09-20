Q1: Explain the differences between static, relative, absolute, fixed, and sticky positions.
Answer:

static (Default): Elements follow the normal document flow. Properties like top, bottom, left, right, and z-index have no effect.

relative: Elements remain in the normal document flow, but you can offset them from their original position using top, left, etc., without disturbing surrounding elements.

absolute: The element is completely removed from the document flow. It positions itself relative to its nearest positioned ancestor (any ancestor element with a position other than static). If none exists, it anchors to the document body.

fixed: The element is removed from document flow and positions itself relative to the viewport (browser window). It stays locked in place when scrolling.

sticky: A hybrid model. The element behaves like relative position until the page scrolls past a specific threshold (e.g., top: 0), at which point it "sticks" like a fixed element within its parent container.
