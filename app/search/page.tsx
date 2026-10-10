import Header from "@/src/components/Header/Header";
import SearchResults from "./SearchResults";

export default async function Page({ searchParams }: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim();
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  return <><Header /><SearchResults key={`${query}:${page}`} query={query} page={page} /></>;
}
