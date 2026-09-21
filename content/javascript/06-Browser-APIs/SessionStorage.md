# SessionStorage

Same API as localStorage, but data is cleared when the **tab/window is closed** (survives reloads, not new tabs).

```js
sessionStorage.setItem("formDraft", "some text");
sessionStorage.getItem("formDraft");
```

| Feature        | localStorage   | sessionStorage | cookies            |
| -------------- | -------------- | -------------- | ------------------ |
| Expiry         | never (manual) | tab close      | configurable       |
| Size           | ~5-10MB        | ~5-10MB        | ~4KB               |
| Sent to server | No             | No             | Yes, every request |
| Scope          | origin         | tab + origin   | domain + path      |
