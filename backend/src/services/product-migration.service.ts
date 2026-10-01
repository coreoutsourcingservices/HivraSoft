import Product from "../models/Product.model";

/**
 * Older versions of the Product schema used a top-level `slug` field with a
 * unique MongoDB index named `slug_1`.
 *
 * The current schema stores SEO/product URLs in `colors[].slugProduct` and no
 * longer writes a top-level `slug`. If the old unique index is left in MongoDB,
 * every new document has `slug: null` from that index's point of view and the
 * second insert fails with:
 *
 * E11000 duplicate key error ... index: slug_1 dup key: { slug: null }
 *
 * Remove ONLY the obsolete top-level slug index. We intentionally do not call
 * syncIndexes(), because that could remove unrelated/custom database indexes.
 * Existing `colors[].slugProduct` values are not changed, so current product
 * URLs remain stable.
 */
export async function removeLegacyProductSlugIndex(): Promise<boolean> {
  try {
    const indexes = await Product.collection.indexes();

    const legacyIndex = indexes.find((index) => {
      const key = (index.key || {}) as Record<string, unknown>;
      const fields = Object.keys(key);

      return fields.length === 1 && fields[0] === "slug" && key.slug === 1;
    });

    if (!legacyIndex?.name) {
      return false;
    }

    await Product.collection.dropIndex(legacyIndex.name);
    return true;
  } catch (error: any) {
    // Fresh databases may not have a products collection yet.
    if (error?.code === 26 || error?.codeName === "NamespaceNotFound") {
      return false;
    }

    throw error;
  }
}

/**
 * Older product color subdocuments were stored without MongoDB _id values.
 * Cart and wishlist variants need a stable colorId, so persist generated IDs
 * only for documents that still have at least one color without an _id.
 */
export async function ensureProductColorIds() {
  const products = await Product.find({
    colors: { $elemMatch: { _id: { $exists: false } } },
  });

  if (!products.length) return 0;

  let updated = 0;
  for (const product of products) {
    product.markModified("colors");
    await product.save();
    updated += 1;
  }

  return updated;
}
