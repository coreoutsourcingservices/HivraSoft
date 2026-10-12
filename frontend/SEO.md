# Storefront SEO

Only the public frontend is changed. Set NEXT_PUBLIC_SITE_URL=https://www.hivrasoft.com in deployment, then rebuild.

Server metadata covers public pages, product/color slugs, category paths, offers and published blogs. Existing product seoTitle/seoDescription and blog seo fields take priority; otherwise page content provides a fallback. Descriptions are capped at 160 characters; short editorial descriptions are not padded with unrelated text.

/sitemap.xml reads active products/categories/offers and all pages of the public blog API, excludes private/noindex content and canonical duplicates, and uses actual API modification dates. Source failures are surfaced instead of caching an incomplete sitemap. /robots.txt links the sitemap. Account, checkout, cart, wishlist and search pages have noindex metadata; they are deliberately crawlable so bots can read noindex.

After deploying, verify /robots.txt and /sitemap.xml, inspect representative URLs in Google Search Console, and submit https://www.hivrasoft.com/sitemap.xml there. Search Console submission, actual Google indexing, backlinks and production Core Web Vitals cannot be completed by source changes alone.

No hreflang is emitted because translated URL variants are not implemented. Next Image supports AVIF/WebP; existing plain img assets are not automatically converted. Test real production LCP/INP/CLS and mobile flows before claiming a page-speed score.
