import CategoryDescriptionDisclosure from "./CategoryDescriptionDisclosure";
import { cleanCategoryDescriptionHtml } from "@/lib/category-description-html";

export default function CategoryDescription({ title, html, pagePath = "/" }: { title: string; html: string; pagePath?: string }) {
  const safe = cleanCategoryDescriptionHtml(html, title, pagePath);
  const text = safe.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#0*160;|&#x0*a0;/gi, " ").trim();
  if (!text && !/<(?:img|hr)\b/i.test(safe)) return null;

  return <CategoryDescriptionDisclosure>
    <div dangerouslySetInnerHTML={{ __html: safe }} />
  </CategoryDescriptionDisclosure>;
}
