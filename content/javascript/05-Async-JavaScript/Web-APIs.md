# Web APIs

Browser-provided capabilities outside the JS engine: `setTimeout`, `fetch`, DOM events, `geolocation`, etc. When you call `setTimeout`, the timer runs in the Web API environment, not on the JS call stack — freeing the stack to keep executing other code.
