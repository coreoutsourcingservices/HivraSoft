import {
  Request,
  Response,
} from "express";

import {
  BannerFiles,
  BannerItemMeta,
  CreateBannerData,
  UpdateBannerData,
  createBanner,
  deleteBanner,
  getActiveBanners,
  getAllBanners,
  getBannerById,
  getBannerBySlug,
  updateBanner,
} from "../services/banner.service";

import {
  BannerDevice,
  BannerMediaType,
  BannerPosition,
} from "../models/Banner.model";

/* =========================================================
   ROUTE PARAM
========================================================= */

const getRouteParam = (
  value:
    | string
    | string[]
    | undefined,
  paramName: string
): string => {
  if (!value) {
    throw new Error(
      `${paramName} is required.`
    );
  }

  if (
    Array.isArray(value)
  ) {
    if (!value[0]) {
      throw new Error(
        `${paramName} is required.`
      );
    }

    return value[0];
  }

  return value;
};

/* =========================================================
   PARSERS
========================================================= */

const parseBoolean = (
  value: unknown,
  defaultValue: boolean
): boolean => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  return (
    String(value).toLowerCase() ===
    "true"
  );
};

const parseOptionalBoolean = (
  value: unknown
): boolean | undefined => {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return parseBoolean(
    value,
    false
  );
};

const parseNumber = (
  value: unknown,
  defaultValue = 0
): number => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  const result =
    Number(value);

  if (
    Number.isNaN(result)
  ) {
    return defaultValue;
  }

  return result;
};

const parseOptionalNumber = (
  value: unknown
): number | undefined => {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return parseNumber(value);
};

const parseJsonArray = <T>(
  value: unknown,
  fieldName: string
): T[] => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return [];
  }

  if (
    Array.isArray(value)
  ) {
    return value as T[];
  }

  try {
    const parsed =
      JSON.parse(
        String(value)
      );

    if (
      !Array.isArray(parsed)
    ) {
      throw new Error();
    }

    return parsed as T[];
  } catch {
    throw new Error(
      `${fieldName} must be a valid JSON array.`
    );
  }
};

const parseOptionalJsonArray = <T>(
  value: unknown,
  fieldName: string
): T[] | undefined => {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return parseJsonArray<T>(
    value,
    fieldName
  );
};

/* =========================================================
   FILES
========================================================= */

const getBannerFiles = (
  req: Request
): BannerFiles => {
  const files =
    (req.files || {}) as {
      [fieldname: string]:
        Express.Multer.File[];
    };

  return {
    images:
      files.images || [],
    videos:
      files.videos || [],
    posters:
      files.posters || [],
  };
};

/* =========================================================
   CREATE BODY
========================================================= */

const getCreateData = (
  req: Request
): CreateBannerData => {
  return {
    title:
      String(
        req.body.title || ""
      ),

    slug:
      String(
        req.body.slug || ""
      ),

    description:
      String(
        req.body.description || ""
      ),

    mediaType:
      (req.body.mediaType ===
      "video"
        ? "video"
        : "image") as BannerMediaType,

    position:
      (req.body.position ||
        "home_hero") as BannerPosition,

    device:
      (req.body.device ||
        "all") as BannerDevice,

    sortOrder:
      parseNumber(
        req.body.sortOrder,
        0
      ),

    isActive:
      parseBoolean(
        req.body.isActive,
        true
      ),

    itemsMeta:
      parseJsonArray<BannerItemMeta>(
        req.body.itemsMeta,
        "itemsMeta"
      ),
  };
};

/* =========================================================
   UPDATE BODY
========================================================= */

const getUpdateData = (
  req: Request
): UpdateBannerData => {
  const data:
    UpdateBannerData = {};

  if (
    req.body.title !==
    undefined
  ) {
    data.title =
      String(req.body.title);
  }

  if (
    req.body.slug !==
    undefined
  ) {
    data.slug =
      String(req.body.slug);
  }

  if (
    req.body.description !==
    undefined
  ) {
    data.description =
      String(
        req.body.description
      );
  }

  if (
    req.body.mediaType !==
    undefined
  ) {
    data.mediaType =
      req.body.mediaType as
        BannerMediaType;
  }

  if (
    req.body.position !==
    undefined
  ) {
    data.position =
      req.body.position as
        BannerPosition;
  }

  if (
    req.body.device !==
    undefined
  ) {
    data.device =
      req.body.device as
        BannerDevice;
  }

  if (
    req.body.sortOrder !==
    undefined
  ) {
    data.sortOrder =
      parseOptionalNumber(
        req.body.sortOrder
      );
  }

  if (
    req.body.isActive !==
    undefined
  ) {
    data.isActive =
      parseOptionalBoolean(
        req.body.isActive
      );
  }

  if (
    req.body.itemsMeta !==
    undefined
  ) {
    data.itemsMeta =
      parseJsonArray<BannerItemMeta>(
        req.body.itemsMeta,
        "itemsMeta"
      );
  }

  data.existingItemsMeta =
    parseOptionalJsonArray<BannerItemMeta>(
      req.body.existingItemsMeta,
      "existingItemsMeta"
    );

  return data;
};

/* =========================================================
   CREATE
========================================================= */

export const createBannerController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const banner =
        await createBanner(
          getCreateData(req),
          getBannerFiles(req)
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Banner created successfully.",
          data: banner,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to create banner.",
        });
    }
  };

/* =========================================================
   GET ALL
========================================================= */

export const getAllBannersController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const banners =
        await getAllBanners();

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Banners fetched successfully.",
          count:
            banners.length,
          data: banners,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch banners.",
        });
    }
  };

/* =========================================================
   GET ACTIVE
========================================================= */

export const getActiveBannersController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const position =
        typeof req.query.position ===
        "string"
          ? req.query.position
          : undefined;

      const device =
        typeof req.query.device ===
        "string"
          ? req.query.device
          : undefined;

      const banners =
        await getActiveBanners(
          position,
          device
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Active banners fetched successfully.",
          count:
            banners.length,
          data: banners,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch active banners.",
        });
    }
  };

/* =========================================================
   GET ONE BY ID
========================================================= */

export const getBannerByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const bannerId =
        getRouteParam(
          req.params.id,
          "Banner ID"
        );

      const banner =
        await getBannerById(
          bannerId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Banner fetched successfully.",
          data: banner,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Banner not found.",
        });
    }
  };

/* =========================================================
   GET BY SLUG
========================================================= */

export const getBannerBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Banner slug"
        );

      const banner =
        await getBannerBySlug(
          slug
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Banner fetched successfully.",
          data: banner,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Banner not found.",
        });
    }
  };

/* =========================================================
   UPDATE
========================================================= */

export const updateBannerController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const bannerId =
        getRouteParam(
          req.params.id,
          "Banner ID"
        );

      const banner =
        await updateBanner(
          bannerId,
          getUpdateData(req),
          getBannerFiles(req)
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Banner updated successfully.",
          data: banner,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to update banner.",
        });
    }
  };

/* =========================================================
   DELETE
========================================================= */

export const deleteBannerController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const bannerId =
        getRouteParam(
          req.params.id,
          "Banner ID"
        );

      const result =
        await deleteBanner(
          bannerId
        );

      return res
        .status(200)
        .json({
          success: true,
          ...result,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete banner.";

      return res
        .status(
          message ===
          "Banner not found."
            ? 404
            : 400
        )
        .json({
          success: false,
          message,
        });
    }
  };
