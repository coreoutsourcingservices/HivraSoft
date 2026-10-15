type CategoryNode = {
  _id: unknown;
  name?: string;
  slug?: string;
  parent?: unknown;
  ancestors?: unknown[];
};

/** Match a department through its category tree, including leaf-only assignments. */
export function relatedCategoryScope(sourceIds: unknown[], categories: CategoryNode[]) {
  const nodes = new Map(categories.map(category => [String(category._id), category]));
  const rootOf = (id: string): string | null => {
    const seen = new Set<string>();
    let current = nodes.get(id);
    if (!current) return null;
    const ancestor = current.ancestors?.[0];
    while (current.parent) {
      const parentId = String(current.parent);
      if (seen.has(parentId)) return null;
      seen.add(parentId);
      const parent = nodes.get(parentId);
      if (!parent) return ancestor ? String(ancestor) : parentId;
      current = parent;
    }
    return String(current._id);
  };
  const sourceRoots = new Set(sourceIds.map(id => rootOf(String(id))).filter((id): id is string => Boolean(id)));
  const gender = (id: string) => {
    const root = nodes.get(id);
    const values = [root?.slug, root?.name].map(value => String(value || "").trim().toLowerCase());
    if (values.some(value => ["men", "mens", "man", "male"].includes(value))) return "men";
    if (values.some(value => ["women", "womens", "woman", "female", "ladies"].includes(value))) return "women";
    return null;
  };
  const departments = new Set([...sourceRoots].map(gender).filter(Boolean));
  // Ambiguous/unclassified products must not be filled with arbitrary products.
  if (!sourceRoots.size || departments.size > 1) return null;
  const department = [...departments][0];
  const selectedRoots = new Set([...sourceRoots].filter(id => !department || gender(id) === department));
  const allowedIds: string[] = [], excludedIds: string[] = [];
  for (const category of categories) {
    const id = String(category._id), root = rootOf(id);
    if (root && selectedRoots.has(root)) allowedIds.push(id);
    else if (root && department && gender(root) && gender(root) !== department) excludedIds.push(id);
  }
  return allowedIds.length ? { allowedIds, excludedIds } : null;
}
