import type { Request, Response } from "express";
import mongoose from "mongoose";
import Offer, {
  type OfferHistoryAction,
  type OfferType,
} from "../models/Offer.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";

const roundMoney = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const normalizeSlug = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);

const normalizeType = (value: unknown): OfferType | null => {
  const normalized = String(value || "").trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "buy_get") return "buy_get";
  if (normalized === "fixed_price_bundle") return "fixed_price_bundle";
  return null;
};

const ids = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter((item) => mongoose.Types.ObjectId.isValid(item))
    )
  );
};

const wholeNumber = (value: unknown, field: string, min = 1) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > 999) {
    throw new Error(`${field} must be a whole number between ${min} and 999.`);
  }
  return number;
};

const money = (value: unknown, field: string) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} must be 0 or greater.`);
  }
  return roundMoney(number);
};

const adminObjectId = (req: Request) =>
  req.user?._id && mongoose.Types.ObjectId.isValid(String(req.user._id))
    ? new mongoose.Types.ObjectId(String(req.user._id))
    : null;

type OfferValues = {
  name: string;
  slug: string;
  offerType: OfferType;
  buyQuantity: number;
  getQuantity: number;
  fixedPrice: number;
  appliesToAllProducts: boolean;
  productIds: string[];
  categoryIds: string[];
  isActive: boolean;
};

function defaultName(values: Pick<OfferValues, "offerType" | "buyQuantity" | "getQuantity" | "fixedPrice">) {
  if (values.offerType === "buy_get") {
    return `Buy ${values.buyQuantity} Get ${values.getQuantity} Free`;
  }
  return `Buy ${values.buyQuantity} @ ₹${values.fixedPrice.toLocaleString("en-IN")} Each`;
}

function offerValues(body: any, expectedType: OfferType, current?: any): OfferValues {
  const bodyType = body?.offerType !== undefined ? normalizeType(body.offerType) : null;
  if (bodyType && bodyType !== expectedType) {
    throw new Error("Offer type cannot be changed.");
  }

  const buyQuantity = body?.buyQuantity !== undefined
    ? wholeNumber(body.buyQuantity, "Buy quantity")
    : wholeNumber(current?.buyQuantity ?? 1, "Buy quantity");

  const getQuantity = expectedType === "buy_get"
    ? body?.getQuantity !== undefined
      ? wholeNumber(body.getQuantity, "Free quantity")
      : wholeNumber(current?.getQuantity ?? 1, "Free quantity")
    : 0;

  const fixedPrice = expectedType === "fixed_price_bundle"
    ? body?.fixedPrice !== undefined
      ? money(body.fixedPrice, "Fixed price")
      : money(current?.fixedPrice ?? 0, "Fixed price")
    : 0;

  if (expectedType === "fixed_price_bundle" && fixedPrice <= 0) {
    throw new Error("Fixed price must be greater than 0.");
  }

  const appliesToAllProducts = body?.appliesToAllProducts !== undefined
    ? Boolean(body.appliesToAllProducts)
    : Boolean(current?.appliesToAllProducts);

  const productIds = appliesToAllProducts
    ? []
    : body?.productIds !== undefined
      ? ids(body.productIds)
      : (current?.productIds || []).map((item: any) => String(item));

  const categoryIds = appliesToAllProducts
    ? []
    : body?.categoryIds !== undefined
      ? ids(body.categoryIds)
      : (current?.categoryIds || []).map((item: any) => String(item));

  if (!appliesToAllProducts && productIds.length === 0 && categoryIds.length === 0) {
    throw new Error("Choose at least one product or category, or enable All Products.");
  }

  const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : current?.isActive !== false;

  const provisional: OfferValues = {
    name: "",
    slug: "",
    offerType: expectedType,
    buyQuantity,
    getQuantity,
    fixedPrice,
    appliesToAllProducts,
    productIds,
    categoryIds,
    isActive,
  };

  const enteredName = String(body?.name ?? current?.name ?? "").trim().slice(0, 140);
  provisional.name = enteredName || defaultName(provisional);

  const requestedSlug =
    body?.slug !== undefined ? String(body.slug || "") : String(current?.slug || "");
  provisional.slug = normalizeSlug(requestedSlug || provisional.name);

  if (!provisional.slug) {
    throw new Error("Slug is required. Use letters, numbers and hyphens.");
  }

  return provisional;
}

async function validateTargets(values: OfferValues) {
  if (values.appliesToAllProducts) return;
  const [productCount, categoryCount] = await Promise.all([
    values.productIds.length
      ? Product.countDocuments({ _id: { $in: values.productIds } })
      : Promise.resolve(0),
    values.categoryIds.length
      ? Category.countDocuments({ _id: { $in: values.categoryIds } })
      : Promise.resolve(0),
  ]);

  if (productCount !== values.productIds.length) {
    throw new Error("One or more selected products no longer exist.");
  }
  if (categoryCount !== values.categoryIds.length) {
    throw new Error("One or more selected categories no longer exist.");
  }
}

async function validateSlug(slug: string, currentOfferId?: string) {
  const query: Record<string, any> = {
    slug,
    isDeleted: { $ne: true },
  };

  if (currentOfferId && mongoose.Types.ObjectId.isValid(currentOfferId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(currentOfferId) };
  }

  const existing = await Offer.findOne(query).select("_id").lean();
  if (existing) {
    throw new Error("This slug is already in use. Please choose another slug.");
  }
}

function historyEntry(action: OfferHistoryAction, values: OfferValues, req: Request) {
  return {
    action,
    name: values.name,
    slug: values.slug,
    offerType: values.offerType,
    buyQuantity: values.buyQuantity,
    getQuantity: values.getQuantity,
    fixedPrice: values.fixedPrice,
    appliesToAllProducts: values.appliesToAllProducts,
    productCount: values.productIds.length,
    categoryCount: values.categoryIds.length,
    isActive: values.isActive,
    changedAt: new Date(),
    changedBy: adminObjectId(req),
  };
}

async function responseForType(offerType: OfferType) {
  const all = await Offer.find({ offerType }).sort({ createdAt: -1 }).lean();
  const offers = all.filter((item: any) => item.isDeleted !== true);
  const history = all
    .flatMap((offer: any) =>
      (Array.isArray(offer.history) ? offer.history : []).map((entry: any) => ({
        ...entry,
        offerId: String(offer._id),
      }))
    )
    .sort((a: any, b: any) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime())
    .slice(0, 100);

  return { offers, history };
}

export function listAdminOffers(offerType: OfferType) {
  return async (_req: Request, res: Response) => {
    try {
      return res.json({ success: true, ...(await responseForType(offerType)) });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to load offers.",
      });
    }
  };
}

export function createAdminOffer(offerType: OfferType) {
  return async (req: Request, res: Response) => {
    try {
      const values = offerValues(req.body, offerType);
      await validateTargets(values);
      await validateSlug(values.slug);

      const offer = await Offer.create({
        ...values,
        productIds: values.productIds.map((id) => new mongoose.Types.ObjectId(id)),
        categoryIds: values.categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
        history: [historyEntry("created", values, req)],
      });

      return res.status(201).json({ success: true, message: "Offer created.", offer });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to create offer.",
      });
    }
  };
}

export function updateAdminOffer(offerType: OfferType) {
  return async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid offer ID." });
      }

      const offer = await Offer.findOne({ _id: id, offerType, isDeleted: { $ne: true } });
      if (!offer) return res.status(404).json({ success: false, message: "Offer not found." });

      const values = offerValues(req.body, offerType, offer);
      await validateTargets(values);
      await validateSlug(values.slug, String(offer._id));

      const statusOnly =
        Object.keys(req.body || {}).every((key) => ["isActive"].includes(key)) &&
        req.body?.isActive !== undefined;

      offer.name = values.name;
      offer.slug = values.slug;
      offer.buyQuantity = values.buyQuantity;
      offer.getQuantity = values.getQuantity;
      offer.fixedPrice = values.fixedPrice;
      offer.appliesToAllProducts = values.appliesToAllProducts;
      offer.productIds = values.productIds.map((id) => new mongoose.Types.ObjectId(id));
      offer.categoryIds = values.categoryIds.map((id) => new mongoose.Types.ObjectId(id));
      offer.isActive = values.isActive;
      offer.history.push(historyEntry(statusOnly ? "status_changed" : "updated", values, req) as any);
      await offer.save();

      return res.json({ success: true, message: "Offer updated.", offer });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to update offer.",
      });
    }
  };
}

export function deleteAdminOffer(offerType: OfferType) {
  return async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid offer ID." });
      }

      const offer = await Offer.findOne({ _id: id, offerType, isDeleted: { $ne: true } });
      if (!offer) return res.status(404).json({ success: false, message: "Offer not found." });

      const values = offerValues({}, offerType, offer);
      values.isActive = false;
      offer.isActive = false;
      offer.isDeleted = true;
      offer.history.push(historyEntry("deleted", values, req) as any);
      await offer.save();

      return res.json({ success: true, message: "Offer deleted." });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to delete offer.",
      });
    }
  };
}

export async function listActiveOffers(_req: Request, res: Response) {
  try {
    const offers = await Offer.find({ isDeleted: { $ne: true }, isActive: true })
      .select("name slug offerType buyQuantity getQuantity fixedPrice appliesToAllProducts productIds categoryIds updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ success: true, offers });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load active offers.",
    });
  }
}

/* =========================================================
   STOREFRONT PRODUCT RESOLVER
========================================================= */

async function getOfferStorefrontProducts(
  offer: any
) {
  const baseQuery: Record<
    string,
    any
  > = {
    isActive: {
      $ne: false,
    },
  };

  /* =======================================================
     ALL PRODUCTS
  ======================================================= */

  if (
    offer.appliesToAllProducts
  ) {
    return Product.find(
      baseQuery
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }

  const productIds =
    Array.isArray(
      offer.productIds
    )
      ? offer.productIds.map(
          (id: any) =>
            String(id)
        )
      : [];

  const selectedCategoryIds =
    Array.isArray(
      offer.categoryIds
    )
      ? offer.categoryIds.map(
          (id: any) =>
            String(id)
        )
      : [];

  /* =======================================================
     CATEGORY + CHILD CATEGORIES
  ======================================================= */

  let categoryIds:
    string[] = [];

  if (
    selectedCategoryIds.length >
    0
  ) {
    const categories =
      await Category.find({
        $or: [
          {
            _id: {
              $in:
                selectedCategoryIds,
            },
          },

          {
            ancestors: {
              $in:
                selectedCategoryIds,
            },
          },
        ],
      })
        .select("_id")
        .lean();

    categoryIds =
      categories.map(
        (category: any) =>
          String(
            category._id
          )
      );
  }

  /* =======================================================
     PRODUCT QUERY
  ======================================================= */

  const targets: any[] = [];

  if (
    productIds.length > 0
  ) {
    targets.push({
      _id: {
        $in: productIds,
      },
    });
  }

  if (
    categoryIds.length > 0
  ) {
    targets.push({
      categories: {
        $in: categoryIds,
      },
    });
  }

  if (
    targets.length === 0
  ) {
    return [];
  }

  return Product.find({
    ...baseQuery,

    $or: targets,
  })
    .sort({
      createdAt: -1,
    })
    .lean();
}

/* =========================================================
   FEATURED ACTIVE BUY & GET OFFER

   Header isi endpoint ko use karega.

   Multiple active offers ho to latest updated wala.
========================================================= */

export async function getFeaturedBuyGetOffer(
  _req: Request,
  res: Response
) {
  try {
    const offer =
      await Offer.findOne({
        offerType:
          "buy_get",

        isActive: true,

        isDeleted: {
          $ne: true,
        },
      })
        .sort({
          updatedAt: -1,
          createdAt: -1,
        })
        .lean();

    if (!offer) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "No active Buy & Get offer found.",
        });
    }

    return res.json({
      success: true,

      offer: {
        _id:
          String(
            offer._id
          ),

        name:
          offer.name,

        slug:
          offer.slug,

        offerType:
          offer.offerType,

        buyQuantity:
          offer.buyQuantity,

        getQuantity:
          offer.getQuantity,

        fixedPrice:
          offer.fixedPrice,

        appliesToAllProducts:
          offer.appliesToAllProducts,

        productIds:
          offer.productIds.map(
            (id: any) =>
              String(id)
          ),

        categoryIds:
          offer.categoryIds.map(
            (id: any) =>
              String(id)
          ),

        isActive:
          offer.isActive,
      },
    });
  } catch (error) {
    console.error(
      "GET FEATURED BUY GET OFFER ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load offer.",
      });
  }
}

/* =========================================================
   STOREFRONT OFFER BY SLUG

   /api/offers/buy-3-get-1-free
   /api/offers/buy-4-get-1-free
========================================================= */

export async function getStorefrontOfferBySlug(
  req: Request,
  res: Response
) {
  try {
    const slug =
      String(
        req.params.slug ||
          ""
      )
        .trim()
        .toLowerCase();

    if (!slug) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Offer slug is required.",
        });
    }

    const offer =
      await Offer.findOne({
        slug,

        isActive: true,

        isDeleted: {
          $ne: true,
        },
      }).lean();

    if (!offer) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            "Offer not found.",
        });
    }

    const products =
      await getOfferStorefrontProducts(
        offer
      );

    return res.json({
      success: true,

      offer: {
        _id:
          String(
            offer._id
          ),

        name:
          offer.name,

        slug:
          offer.slug,

        offerType:
          offer.offerType,

        buyQuantity:
          offer.buyQuantity,

        getQuantity:
          offer.getQuantity,

        fixedPrice:
          offer.fixedPrice,

        appliesToAllProducts:
          offer.appliesToAllProducts,

        productIds:
          offer.productIds.map(
            (id: any) =>
              String(id)
          ),

        categoryIds:
          offer.categoryIds.map(
            (id: any) =>
              String(id)
          ),

        isActive:
          offer.isActive,

        products,
      },
    });
  } catch (error) {
    console.error(
      "GET STOREFRONT OFFER ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to load offer.",
      });
  }
}
