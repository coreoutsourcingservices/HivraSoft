import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DOMPurify from "isomorphic-dompurify";
import { categoryForPath, categorySeoFromTree } from "../lib/category-metadata";
import { pageMetadata } from "../lib/seo";
import { normalizeContentHref, normalizeContentAnchors, contentAnchorAttributes } from "../lib/content-links";
import CategoryDescription from "../src/components/Storefront/CategoryDescription";
import type { StorefrontCategoryNode } from "../src/services/categories";

function node(id: string, slug: string, children: StorefrontCategoryNode[] = []): StorefrontCategoryNode {
  return { id, slug, name: slug, description: "", images: [], children, parent: null, ancestors: [], level: 0, isActive: true, sortOrder: 0 };
}
const child = { ...node("child", "bra"), metaTitle: "A saved subcategory title with no automatic brand suffix", metaDescription: "This manually saved subcategory description is intentionally longer than the automatic summary limit and must be rendered exactly as entered in the admin." };
const root = { ...node("root", "women", [child]), metaTitle: "Women's Innerwear: Bras, Panties & Lingerie | HivraSoft", metaDescription: "A saved category meta description." };
const tree = [root, { ...node("new", "new-innerwear-online"), metaTitle: "API New Launch Title", metaDescription: "API New Launch Description" }];
for (const [path, expected] of [["/women", root], ["/women/bra", child], ["/new-launch", tree[1]], ["/new-innerwear-online", tree[1]]] as const) {
  const input = categorySeoFromTree(tree, path);
  const metadata = pageMetadata(input);
  assert.equal(metadata.title && typeof metadata.title === "object" && "absolute" in metadata.title ? metadata.title.absolute : undefined, expected.metaTitle);
  assert.equal(metadata.description, expected.metaDescription);
  assert.equal(metadata.openGraph?.description, expected.metaDescription);
  assert.equal(metadata.twitter?.description, expected.metaDescription);
}
assert.equal(categoryForPath(tree, "/women/missing"), undefined);
assert.ok(categorySeoFromTree([node("fallback", "men")], "/men").title);
assert.ok(pageMetadata(categorySeoFromTree([node("fallback", "men")], "/men")).description);
const renamed = { ...node("renamed", "women"), name: "Updated collection" };
assert.match(categorySeoFromTree([renamed], "/women").title, /Updated collection/);

// Each missing field uses the category's own name, including nested categories.
for (const fields of [
  {},
  { metaTitle: "Saved title" },
  { metaDescription: "Saved description" },
  { metaTitle: "   ", metaDescription: "   " },
]) {
  const category = { ...node("fallback", "women"), name: "Women's collection", description: "<p>Rich category description</p>", ...fields };
  const nested = { ...category, id: "nested", slug: "bra", name: "Bra collection" };
  const cases: [string, StorefrontCategoryNode[], StorefrontCategoryNode][] = [
    ["/women", [category], category],
    ["/women/bra", [{ ...category, children: [nested] }], nested],
  ];
  for (const [path, categoryTree, expected] of cases) {
    const metadata = pageMetadata(categorySeoFromTree(categoryTree, path));
    const title = fields.metaTitle?.trim() || expected.name;
    const description = fields.metaDescription?.trim() || expected.name;
    assert.deepEqual(metadata.title, { absolute: title });
    assert.equal(metadata.description, description);
    assert.equal(metadata.openGraph?.title, title);
    assert.equal(metadata.openGraph?.description, description);
    assert.equal(metadata.twitter?.title, title);
    assert.equal(metadata.twitter?.description, description);
  }
}

assert.equal(normalizeContentHref("https://www.hivrasoft.com/women/bra/?sort=latest#details"), "/women/bra?sort=latest#details");
assert.equal(normalizeContentHref("http://hivrasoft.com/women/"), "/women");
assert.equal(normalizeContentHref("../women/", "/product/item"), "/women");
assert.equal(normalizeContentHref("https://hivrasoft.com/men/briefs/?sort=latest#sizes"), "/men/brief?sort=latest#sizes");
assert.equal(normalizeContentHref("/women/g-string"), "/women/panty/g-string");
assert.equal(normalizeContentHref("https://example.com/men/briefs/"), "https://example.com/men/briefs/");
assert.equal(normalizeContentHref("#details", "/women"), "#details");
assert.equal(normalizeContentHref("https://example.com/a/"), "https://example.com/a/");
assert.equal(normalizeContentHref("https://hivrasoft.com.example.com/a/"), "https://hivrasoft.com.example.com/a/");
assert.equal(normalizeContentHref("mailto:support@hivrasoft.com"), "mailto:support@hivrasoft.com");
assert.equal(normalizeContentHref("javascript:alert(1)"), undefined);
assert.match(contentAnchorAttributes({ href: "/women", target: "_blank", rel: "nofollow" }).rel, /nofollow/);
const dom = DOMPurify.sanitize('<a href="https://hivrasoft.com/women/" target="_blank">Women</a><a href="https://example.com/">Other</a>', { RETURN_DOM: true, ADD_ATTR: ["target"] }) as HTMLElement;
normalizeContentAnchors(dom, "/product/item");
assert.equal(dom.querySelector("a")?.getAttribute("href"), "/women");
assert.equal(dom.querySelectorAll("a")[1].getAttribute("href"), "https://example.com/");
assert.match(dom.querySelector("a")?.getAttribute("rel") || "", /noopener/);
const html = renderToStaticMarkup(<CategoryDescription title="Category" pagePath="/women" html={'<p><a href="https://www.hivrasoft.com/men/">Men</a></p><a href="javascript:alert(1)">Unsafe</a><script>alert(1)</script>'} />);
assert.match(html, /href="\/men"/);
assert.doesNotMatch(html, /javascript:|<script|nofollow/);
for (const empty of ["", "   ", "<p><br></p>", "<p>&nbsp;</p>", "<script>alert(1)</script>"]) {
  assert.equal(renderToStaticMarkup(<CategoryDescription title="Category" html={empty} />), "");
}
assert.match(renderToStaticMarkup(<CategoryDescription title="Category" html={'<p><img src="https://example.com/image.jpg" /></p>'} />), /<img/);
assert.match(html, /<h2/);
console.log("PASS: category/subcategory API metadata, aliases, fallback, exact title/description, HTML anchors and unsafe URL handling.");
