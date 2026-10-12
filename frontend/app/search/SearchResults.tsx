"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type SearchResponse = {
  success: boolean;
  products: Array<{
    _id: string;
    slug: string;
    name: string;
    colorName: string;
    image: { url: string } | null;
    showPrice: number;
    originalPrice: number;
  }>;
  pagination: { total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
};

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(value);

export default function SearchResults({ query, page }: { query: string; page: number }) {
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setResult(null);
    const params = new URLSearchParams({ q: query, page: String(page), limit: "24" });
    apiFetch<SearchResponse>(`/api/search?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.success || !Array.isArray(response.products) || !response.pagination) {
          throw new Error("Search unavailable");
        }
        if (!controller.signal.aborted) setResult(response);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, page, attempt]);

  const pageHref = (nextPage: number) => `/search?${new URLSearchParams({ q: query, page: String(nextPage) })}`;

  return (
    <main className="min-h-[60vh] bg-[#EDE4DD] px-4 py-8 text-[#211A18] sm:px-8">
      <div className="mx-auto max-w-[1450px]">
        <h1 className="mb-5 text-2xl font-semibold">{query ? `Search results for “${query}”` : "Search products"}</h1>
        <form action="/search" className="mb-6 flex max-w-xl gap-2">
          <input name="q" defaultValue={query} aria-label="Search products" placeholder="Search products, colours or categories" required className="min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-4 py-3" />
          <button type="submit" className="rounded-lg bg-[#EC477C] px-5 font-semibold text-white">Search</button>
        </form>
        <div aria-live="polite" role="status">
          {!query && <p>Enter a product name, colour or category to start searching.</p>}
          {loading && <p>Searching products…</p>}
          {error && <p>Search is temporarily unavailable. <button type="button" onClick={() => setAttempt((value) => value + 1)} className="font-semibold underline">Try again</button></p>}
          {result && <p className="mb-5">{result.pagination.total} products found</p>}
          {result && result.products.length === 0 && <p>No products found on this page. Try another search or <Link href={pageHref(1)} className="underline">return to the first page</Link>.</p>}
        </div>
        {result && <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {result.products.map((product) => (
              <article key={`${product._id}:${product.slug}`} className="overflow-hidden rounded-[20px] bg-white">
                <Link href={`/product/${encodeURIComponent(product.slug)}`} className="block">
                  {product.image?.url ? <img src={product.image.url} alt={product.name} loading="lazy" className="aspect-[3/4] w-full object-cover" /> : <div className="flex aspect-[3/4] items-center justify-center bg-stone-100 text-sm">Image unavailable</div>}
                  <div className="p-4">
                    <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">{product.colorName}</p>
                    <h2 className="mb-3 line-clamp-2 text-sm font-medium">{product.name}</h2>
                    <div className="flex flex-wrap items-center gap-2"><strong>{money(product.showPrice)}</strong>{product.originalPrice > product.showPrice && <span className="text-xs text-stone-400 line-through">{money(product.originalPrice)}</span>}</div>
                    <span className="mt-4 block rounded-lg bg-[#EC477C] px-3 py-3 text-center text-xs font-bold uppercase text-white">View product</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          {result.pagination.totalPages > 1 && <nav aria-label="Search pagination" className="mt-8 flex items-center justify-center gap-5">
            {result.pagination.hasPreviousPage && <Link href={pageHref(page - 1)} className="underline">Previous</Link>}
            <span>Page {page} of {result.pagination.totalPages}</span>
            {result.pagination.hasNextPage && <Link href={pageHref(page + 1)} className="underline">Next</Link>}
          </nav>}
        </>}
      </div>
    </main>
  );
}
