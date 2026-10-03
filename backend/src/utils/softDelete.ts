import { Schema } from "mongoose";

/**
 * Adds a consistent soft-delete envelope to a schema and automatically hides
 * deleted records from normal find/findOne/count queries.
 *
 * Trash/restore code can opt in to deleted records with:
 *   query.setOptions({ withDeleted: true })
 */
export function applySoftDeletePlugin(schema: Schema<any>): void {
  if (!schema.path("isDeleted")) {
    schema.add({
      isDeleted: { type: Boolean, default: false, index: true },
    } as any);
  }

  if (!schema.path("deletedAt")) {
    schema.add({
      deletedAt: { type: Date, default: null, index: true },
    } as any);
  }

  if (!schema.path("deletedBy")) {
    schema.add({
      deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    } as any);
  }

  const excludeDeleted = function (this: any) {
    const options = typeof this.getOptions === "function" ? this.getOptions() : {};
    const query = typeof this.getQuery === "function" ? this.getQuery() : {};

    if (!options?.withDeleted && query?.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
  };

  schema.pre(/^find/, excludeDeleted as any);
  schema.pre("countDocuments", excludeDeleted as any);
}
