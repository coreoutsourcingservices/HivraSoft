import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   CATEGORY IMAGE

   alt:
   - Admin ka "Photo Name / ALT Text"
   - Frontend <img alt=""> me use hoga
   - Upload ke time isi text ka slug Cloudinary image name banta hai

   Example:
   alt: "Front View"
   publicId:
   hivrasoft/category-images/women/sports-bra/front-view
========================================================= */

export interface ICategoryImage {
  url: string;
  publicId: string;
  alt: string;
}

/* =========================================================
   CATEGORY
========================================================= */

export interface ICategory extends Document {
  name: string;

  slug: string;

  description?: string;

  parent: Types.ObjectId | null;

  ancestors: Types.ObjectId[];

  level: number;

  images: ICategoryImage[];

  isActive: boolean;

  sortOrder: number;

  createdAt: Date;

  updatedAt: Date;
}

/* =========================================================
   IMAGE SCHEMA
========================================================= */

const categoryImageSchema =
  new Schema<ICategoryImage>(
    {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      publicId: {
        type: String,
        required: true,
        trim: true,
      },

      alt: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160,
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   CATEGORY SCHEMA
========================================================= */

const categorySchema =
  new Schema<ICategory>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      /*
        null = root category

        Women
        └── Bra
            └── Sports Bra
      */
      parent: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null,
        index: true,
      },

      /*
        Sports Bra example:
        [
          Women._id,
          Bra._id
        ]
      */
      ancestors: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],

      level: {
        type: Number,
        default: 0,
        min: 0,
        index: true,
      },

      /*
        All root / sub / sub-sub categories
        use the SAME images[] field.

        [
          {
            url: "https://res.cloudinary.com/...",
            publicId:
              "hivrasoft/category-images/women/bra/front-view",
            alt: "Front View"
          }
        ]
      */
      images: {
        type: [
          categoryImageSchema,
        ],
        default: [],
      },

      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },

      sortOrder: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   INDEXES
========================================================= */

categorySchema.index({
  parent: 1,
  sortOrder: 1,
});

categorySchema.index({
  ancestors: 1,
});

categorySchema.index({
  level: 1,
  sortOrder: 1,
  name: 1,
});

/* =========================================================
   MODEL
========================================================= */

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>(
    "Category",
    categorySchema
  );

export default Category;
