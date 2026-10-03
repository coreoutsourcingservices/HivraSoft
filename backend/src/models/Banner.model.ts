import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

import { applySoftDeletePlugin } from "../utils/softDelete";

/* =========================================================
   TYPES
========================================================= */

export type BannerMediaType =
  | "image"
  | "video";

export type BannerLinkType =
  | "none"
  | "custom"
  | "category"
  | "product";

export type BannerDevice =
  | "all"
  | "desktop"
  | "mobile";

export type BannerPosition =
  | "home_hero"
  | "home_top"
  | "home_middle"
  | "home_bottom"
  | "category_top"
  | "category_middle";

/* =========================================================
   COMMON MEDIA CONTENT + LINK

   IMPORTANT:
   Har image / har video ka apna content + apna link hai.
========================================================= */

export interface IBannerMediaContent {
  title: string;
  subtitle: string;
  description: string;

  buttonText: string;

  linkType: BannerLinkType;
  customLink: string;

  category: Types.ObjectId | null;
  product: Types.ObjectId | null;

  openInNewTab: boolean;
}

/* =========================================================
   IMAGE
========================================================= */

export interface IBannerImage
  extends IBannerMediaContent {
  url: string;
  publicId: string;
  alt: string;
}

/* =========================================================
   VIDEO POSTER
========================================================= */

export interface IBannerVideoPoster {
  url: string;
  publicId: string;
}

/* =========================================================
   VIDEO
========================================================= */

export interface IBannerVideo
  extends IBannerMediaContent {
  url: string;
  publicId: string;

  poster?: IBannerVideoPoster;

  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
}

/* =========================================================
   BANNER
========================================================= */

export interface IBanner
  extends Document {
  /* ADMIN / GROUP DETAILS */

  title: string;
  slug: string;
  description: string;

  /* MEDIA */

  mediaType: BannerMediaType;
  images: IBannerImage[];
  videos: IBannerVideo[];

  /* PLACEMENT */

  position: BannerPosition;
  device: BannerDevice;
  sortOrder: number;

  /* STATUS */

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   COMMON MEDIA FIELDS
========================================================= */

const commonMediaFields: Record<string, unknown> = {
  title: {
    type: String,
    default: "",
    trim: true,
    maxlength: 200,
  },

  subtitle: {
    type: String,
    default: "",
    trim: true,
    maxlength: 300,
  },

  description: {
    type: String,
    default: "",
    trim: true,
    maxlength: 2000,
  },

  buttonText: {
    type: String,
    default: "Shop Now",
    trim: true,
    maxlength: 100,
  },

  linkType: {
    type: String,
    enum: [
      "none",
      "custom",
      "category",
      "product",
    ],
    default: "none",
  },

  customLink: {
    type: String,
    default: "",
    trim: true,
  },

  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },

  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    default: null,
  },

  openInNewTab: {
    type: Boolean,
    default: false,
  },
};

/* =========================================================
   IMAGE SCHEMA
========================================================= */

const bannerImageSchema =
  new Schema<IBannerImage>(
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
        default: "",
        trim: true,
        maxlength: 200,
      },

      ...(commonMediaFields as any),
    },
    {
      _id: false,
    }
  );

/* =========================================================
   VIDEO POSTER SCHEMA
========================================================= */

const bannerVideoPosterSchema =
  new Schema<IBannerVideoPoster>(
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
    },
    {
      _id: false,
    }
  );

/* =========================================================
   VIDEO SCHEMA
========================================================= */

const bannerVideoSchema =
  new Schema<IBannerVideo>(
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

      poster: {
        type: bannerVideoPosterSchema,
        default: undefined,
      },

      autoplay: {
        type: Boolean,
        default: true,
      },

      muted: {
        type: Boolean,
        default: true,
      },

      loop: {
        type: Boolean,
        default: true,
      },

      controls: {
        type: Boolean,
        default: false,
      },

      ...(commonMediaFields as any),
    },
    {
      _id: false,
    }
  );

/* =========================================================
   NORMALIZE / VALIDATE MEDIA LINK
========================================================= */

const normalizeMediaLink = (
  item: IBannerImage | IBannerVideo
) => {
  if (item.linkType === "custom") {
    if (!item.customLink?.trim()) {
      throw new Error(
        "Custom link is required for every media item using custom link."
      );
    }

    item.category = null;
    item.product = null;
    return;
  }

  if (item.linkType === "category") {
    if (!item.category) {
      throw new Error(
        "Category is required for every media item using category link."
      );
    }

    item.customLink = "";
    item.product = null;
    return;
  }

  if (item.linkType === "product") {
    if (!item.product) {
      throw new Error(
        "Product is required for every media item using product link."
      );
    }

    item.customLink = "";
    item.category = null;
    return;
  }

  item.customLink = "";
  item.category = null;
  item.product = null;
};

/* =========================================================
   BANNER SCHEMA
========================================================= */

const bannerSchema =
  new Schema<IBanner>(
    {
      /* =====================================================
         ADMIN / GROUP DETAILS
      ===================================================== */

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 250,
        match: [
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Banner slug must contain only lowercase letters, numbers and hyphens.",
        ],
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
      },

      /* =====================================================
         MEDIA
      ===================================================== */

      mediaType: {
        type: String,
        enum: [
          "image",
          "video",
        ],
        required: true,
        default: "image",
      },

      images: {
        type: [bannerImageSchema],
        default: [],
      },

      videos: {
        type: [bannerVideoSchema],
        default: [],
      },

      /* =====================================================
         PLACEMENT
      ===================================================== */

      position: {
        type: String,
        enum: [
          "home_hero",
          "home_top",
          "home_middle",
          "home_bottom",
          "category_top",
          "category_middle",
        ],
        default: "home_hero",
      },

      device: {
        type: String,
        enum: [
          "all",
          "desktop",
          "mobile",
        ],
        default: "all",
      },

      sortOrder: {
        type: Number,
        default: 0,
        min: 0,
      },

      /* =====================================================
         STATUS
      ===================================================== */

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   VALIDATION
========================================================= */

bannerSchema.pre(
  "validate",
  function () {
    if (this.mediaType === "image") {
      if (
        !Array.isArray(this.images) ||
        this.images.length === 0
      ) {
        throw new Error(
          "Image banner requires at least one image."
        );
      }

      this.videos = [];

      this.images.forEach(
        normalizeMediaLink
      );
    }

    if (this.mediaType === "video") {
      if (
        !Array.isArray(this.videos) ||
        this.videos.length === 0
      ) {
        throw new Error(
          "Video banner requires at least one video."
        );
      }

      this.images = [];

      this.videos.forEach(
        normalizeMediaLink
      );
    }
  }
);

/* =========================================================
   INDEXES
========================================================= */

bannerSchema.index({
  isActive: 1,
});

bannerSchema.index({
  position: 1,
  device: 1,
  isActive: 1,
  sortOrder: 1,
});

bannerSchema.index({
  "images.category": 1,
});

bannerSchema.index({
  "images.product": 1,
});

bannerSchema.index({
  "videos.category": 1,
});

bannerSchema.index({
  "videos.product": 1,
});

applySoftDeletePlugin(bannerSchema);

/* =========================================================
   MODEL
========================================================= */

const Banner =
  (
    mongoose.models.Banner as
      Model<IBanner>
  ) ||
  mongoose.model<IBanner>(
    "Banner",
    bannerSchema
  );

export default Banner;
