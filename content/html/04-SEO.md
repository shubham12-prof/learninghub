4. SEO (Search Engine Optimization)
   Q1: Which meta tags are most critical for SEO and social sharing?
   Answer:
   Inside the <head> tag, the most critical metadata elements are:

<title>: The main headline displayed in search engine results and browser tabs.

<meta name="description">: A short summary of the page displayed beneath the title in search engine results.

<meta name="robots" content="index, follow">: Tells search engine bots whether to crawl and index the page.

Open Graph (OG) Tags: (e.g., og:title, og:image) Control exactly how your page layout appears when shared on social media platforms.

HTML

<head>
  <title>Mastering HTML Interviews | TechPrep</title>
  <meta name="description" content="A comprehensive guide to cracking frontend interviews with HTML core concepts.">
  
  <!-- Open Graph -->
  <meta property="og:title" content="Mastering HTML Interviews">
  <meta property="og:image" content="[https://example.com/preview.jpg](https://example.com/preview.jpg)">
</head>
Q2: What is a canonical URL tag, and why is it used?
Answer:
A canonical link (<link rel="canonical" href="...">) tells search engines which URL is the master copy (authoritative version) of a page.

It is used to prevent duplicate content penalties. For example, if your site serves the exact same product page via example.com/products/shoes and example.com/offers/shoes?category=men, a canonical tag points search engine bots to the primary URL so SEO value isn't split between them.
