# Cookies

Small key-value pairs sent with **every HTTP request** to the matching domain — useful for sessions/auth, but adds overhead.

```js
document.cookie = "username=Alice; max-age=3600; path=/";
document.cookie; // "username=Alice; theme=dark" (all cookies as one string)

// Helper to read a specific cookie
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}
```

Important flags: `HttpOnly` (inaccessible to JS, prevents XSS theft — set server-side only), `Secure` (HTTPS only), `SameSite` (CSRF protection).
