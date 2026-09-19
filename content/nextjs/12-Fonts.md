# Fonts

`next/font` automatically self-hosts and optimizes fonts (including Google Fonts) at build time — no external network requests to Google's font CDN at runtime, eliminating layout shift and improving privacy/performance.

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // controls font-display behavior — avoids invisible text during load
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

**Using a local/custom font file:**

```tsx
import localFont from "next/font/local";

const myFont = localFont({
  src: "./my-font.woff2",
  variable: "--font-my-font",
});
```

**Multiple weights/styles:**

```tsx
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
```

**Why this matters — the problem it solves:**

- **No extra network round-trip** to Google's servers at runtime — the font files are downloaded once at build time and served from your own domain.
- **Automatic self-hosting** — better privacy (no third-party font CDN requests leaking user IPs to Google) and typically faster load.
- **Prevents Cumulative Layout Shift (CLS)** — Next.js automatically calculates and applies fallback font metrics so text doesn't visibly "jump" when the real font finishes loading.

**Interview note:** the core value proposition of `next/font` compared to a traditional `<link>` to Google Fonts is eliminating the extra external network request AND automatically preventing layout shift via size-adjusted fallback fonts — both meaningfully improve Core Web Vitals scores (specifically CLS and load performance).
