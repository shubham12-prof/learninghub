# Q1: What is the purpose of CSS Custom Properties (Variables), and how do they differ from preprocessor variables (Sass)?

Answer:

CSS Custom Properties: Run natively inside the browser. They are written using a double dash format (--main-color: #3490dc;) and accessed via var(--main-color). Because they live in the browser, they can be dynamically updated in real-time using JavaScript or changed on-the-fly inside media queries.

Sass Variables: Written using a dollar sign format ($main-color: #3490dc;). They are processed on your build machine before reaching the browser, meaning they turn into static CSS values and cannot change dynamically at runtime.

# Q2: How do you center a div horizontally and vertically?

Answer:
There are two modern, rock-solid ways to handle this. Apply either of these approaches directly to the parent container:

CSS
/_ Method 1: Using Flexbox _/
.parent {
display: flex;
justify-content: center; /_ Horizontal centering _/
align-items: center; /_ Vertical centering _/
height: 100vh; /_ Give parent container explicit height _/
}

/_ Method 2: Using CSS Grid _/
.parent {
display: grid;
place-items: center; /_ Centers along both axes simultaneously _/
height: 100vh;
}
