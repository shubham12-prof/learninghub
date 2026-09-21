# BOM (Browser Object Model)

Objects provided by the browser outside the document content — `window`, `navigator`, `location`, `history`, `screen`.

```js
window.innerWidth; // viewport width
window.alert("Hi");
navigator.userAgent; // browser info
location.href; // current URL
location.reload();
screen.width; // device screen width
```

`window` is the global object in browsers — all global variables/functions become properties of it (in non-module, non-strict contexts).
