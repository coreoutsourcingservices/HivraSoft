# HivraSoft indexing review — 16 November 2026

The screenshots show a report last updated 13 November 2026: 316 indexed URLs and approximately 1.1K not indexed. These totals include historical URLs; they are not a list of current sitemap failures.

## Verified public website

- `https://hivrasoft.com/robots.txt`: HTTP 200. Admin, account, cart, wishlist, search and API paths are deliberately restricted.
- `https://hivrasoft.com/sitemap.xml`: HTTP 200, 191 URLs.
- All 191 sitemap URLs returned HTTP 200 during this audit; no HTML robots noindex was found. Canonicals matched, treating the origin with and without its root slash as equivalent.
- `/about` and `/my-account`: HTTP 404, deliberately implemented with `notFound()`. Neither is in the sitemap. Keep absent pages absent unless real content or an equivalent destination is supplied.
- These checks do not prove Google's rendering, bot access, chosen canonical or index inclusion. The private Search Console URL examples and Crawl Stats were not accessible in this task.

## Code changes prepared locally

1. Blog API outages/timeouts no longer turn valid articles into false 404s. Retry transient server/network errors once, preserve actual 404s, and expose persistent upstream failures as errors. A 403 remains a failure; no crawler or access restriction is bypassed.
2. Blog pagination beyond the last page returns not found instead of an empty HTTP 200 listing.
3. Identical legacy legal pages redirect permanently: `/privacy-policy` → `/privacy`; `/terms-condition` → `/terms`. The existing content-link normalizer also uses these canonical destinations.
4. A legacy product slug resolving to an active default colour redirects to that colour's canonical product URL. Active colour URLs remain distinct. Canonical metadata and Product schema use the same destination.

No deployment, Search Console validation, database rewrite, or robots policy change was performed. The existing unrelated admin changes are retained.

## What each screenshot issue needs

| Report reason | Count shown | Correct action |
| --- | ---: | --- |
| Not found (404) | 455 | Export affected URLs. Redirect each moved page to its actual equivalent, restore genuinely missing intended pages, and remove broken internal links. Removed pages without a replacement should keep 404/410. Do not redirect all missing URLs to the homepage. |
| Page with redirect | 179 | Usually expected. Google should index the final canonical page, not the old redirect URL. Link internally and in sitemaps to the final URL. |
| Excluded by noindex | 44 | Check example URLs. Keep intentional private/utility exclusions. Remove noindex only from pages intended for Search. |
| Alternate page with proper canonical | 17 | Normally expected for genuine duplicates. Check that the target is correct and indexable. |
| Duplicate without user-selected canonical | 13 | Inspect examples and choose one correct URL. Product legacy redirects and legal redirects address confirmed duplicate patterns; they are not proof that these 13 exact URLs are fixed. |
| Blocked by robots.txt | 13 | Inspect paths. Keep intentional blocks. Change a public-page rule only if that exact page should be crawlable. |
| Other 4xx | 2 | Need exact URLs/statuses; check authentication, rate limits and application/hosting logs. |
| Server error (5xx) | 1 | Need exact URL, crawl timestamp and hosting/backend logs. Fix the crash, timeout or resource limit, then retest. Current sitemap requests did not reproduce a 5xx. |
| Forbidden (403) | 1 | Check the specific URL and hosting/CDN/WAF logs. Restore intended public access or work with hosting support. Keep private endpoints protected. Do not disable site-wide security blindly. |
| Crawled, currently not indexed | 352 | Inspect Google-rendered content and chosen canonicals. Improve weak/duplicated content, meaningful internal links and page usefulness where demonstrated. Indexing remains Google's decision; technical changes cannot guarantee inclusion. |
| Discovered, currently not indexed | 17 | Check server availability, discovery/internal links and sitemap quality. Request indexing of important pages and allow recrawling. |
| Google chose a different canonical | 10 | Compare user and Google canonical in URL Inspection. Align redirects, canonical metadata, sitemap and internal links to the preferred equivalent. Google can still choose another canonical. |
| Indexed though blocked by robots.txt | 1 | Identify the URL and intended outcome. If it must be removed from Search, use an accessible noindex response where appropriate or authentication for private content; Google cannot read noindex on a robots-blocked response. No robots rule was loosened without the exact URL. |
| Redirect error / Soft 404 | 0 / 0 | No issue reported in this screenshot. |

## After deployment

1. Verify production redirects, product canonicals, representative blog pages and a missing pagination page.
2. In Search Console, open each reason and export its example URL list. This is needed to map the historical errors accurately.
3. Inspect affected important URLs with **Test live URL**. Check response, rendered content, robots and canonical.
4. Confirm/resubmit `https://hivrasoft.com/sitemap.xml` in Sitemaps. Use **Request indexing** for important corrected canonical pages.
5. Start **Validate fix** for actual corrected error groups. Do not try to validate away intentional redirects, exclusions or deleted pages. Recheck after Google recrawls; counters do not update immediately.

Sources: [Google Page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en), [canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
