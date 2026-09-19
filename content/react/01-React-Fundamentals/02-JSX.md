# JSX

JSX (JavaScript XML) is a syntax extension that lets you write HTML-like markup inside JavaScript. It's not understood by browsers directly — it's compiled (via Babel) into `React.createElement()` calls.

```jsx
const element = <h1 className="title">Hello, {name}!</h1>;

// Compiles roughly to:
const element = React.createElement(
  "h1",
  { className: "title" },
  "Hello, ",
  name,
  "!",
);
```

**Key JSX rules:**

```jsx
// 1. Must return a single root element (or a Fragment)
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);

// 2. Use camelCase for attributes (className, not class; onClick, not onclick)
<div className="box" onClick={handleClick}></div>

// 3. Embed any JS expression with curly braces
<p>{2 + 2}</p>
<p>{isLoggedIn ? "Welcome back" : "Please log in"}</p>

// 4. Self-close tags without children
<img src="pic.jpg" />
<br />

// 5. Comments use JS-style curly braces
{/* This is a JSX comment */}
```

**Interview note:** because JSX compiles down to function calls that produce plain JS objects, you can store JSX in variables, pass it as props, and use full JS logic (loops, conditionals) around it — it's not a template language with restricted syntax.
