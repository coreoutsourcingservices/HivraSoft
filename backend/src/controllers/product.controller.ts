import {
  Request,
  Response,
} from "express";

import {
  createProduct,
  getAllProducts,
  getActiveProducts,
  getFeaturedProducts,
  getNewLaunchProducts,
  getRelatedProducts,
  getProductById,
  getProductBySlug,
  getProductCatalog,
  getCatalogProductBySlug,
  updateProduct,
  deleteProduct,

  uploadProductColorImages,
  deleteProductColorImage,
  setDefaultProductColorImage,
  setDefaultProductColor,

  addProductSize,
  updateProductSize,
  deleteProductSize,
} from "../services/product.service";

/* =========================================================
   ROUTE PARAM HELPER
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
   ERROR MESSAGE
========================================================= */

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  return error instanceof Error
    ? error.message
    : fallback;
};

/* =========================================================
   CREATE PRODUCT
   ADMIN
========================================================= */

export const createProductController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        categories,
        isColor,
        colors,
        isActive,
        isFeatured,
        isNewLaunch,
      } = req.body;

      if (
        !Array.isArray(
          categories
        ) ||
        categories.length === 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "At least one category is required.",
          });
      }

      const product =
        await createProduct({
          categories,

          isColor,

          colors,

          isActive,

          isFeatured,

          isNewLaunch,
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Product created successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to create product."
            ),
        });
    }
  };

/* =========================================================
   GET ALL PRODUCTS
   ADMIN
========================================================= */

export const getAllProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await getAllProducts();

      return res
        .status(200)
        .json({
          success: true,

          count:
            products.length,

          products,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to load products."
            ),
        });
    }
  };

/* =========================================================
   GET ACTIVE PRODUCTS
   PUBLIC
========================================================= */

export const getActiveProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await getActiveProducts();

      return res
        .status(200)
        .json({
          success: true,

          count:
            products.length,

          products,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to load active products."
            ),
        });
    }
  };

/* =========================================================
   FEATURED PRODUCTS
   PUBLIC
========================================================= */

export const getFeaturedProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await getFeaturedProducts();

      return res
        .status(200)
        .json({
          success: true,

          count:
            products.length,

          products,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to load featured products."
            ),
        });
    }
  };

/* =========================================================
   NEW LAUNCH PRODUCTS
   PUBLIC
========================================================= */

export const getNewLaunchProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await getNewLaunchProducts();

      return res
        .status(200)
        .json({
          success: true,

          count:
            products.length,

          products,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to load new launch products."
            ),
        });
    }
  };

/* =========================================================
   RELATED PRODUCTS
   PUBLIC

   GET /api/products/:id/related?limit=4
   GET /api/products/:id/related?limit=5
========================================================= */

export const getRelatedProductsController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const productId =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const requestedLimit =
        Number(
          req.query.limit || 5
        );

      const limit =
        requestedLimit === 4
          ? 4
          : 5;

      const products =
        await getRelatedProducts(
          productId,
          limit
        );

      return res
        .status(200)
        .json({
          success: true,
          count:
            products.length,
          limit,
          products,
        });
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          "Unable to load related products."
        );

      return res
        .status(
          message ===
            "Product not found."
            ? 404
            : 400
        )
        .json({
          success: false,
          message,
        });
    }
  };

/* =========================================================
   CLEAN PRODUCT CATALOG
   PUBLIC / FRONTEND
========================================================= */

export const getCatalogProductsController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const products =
        await getProductCatalog();

      return res
        .status(200)
        .json({
          success: true,

          count:
            products.length,

          products,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to load product catalog."
            ),
        });
    }
  };

/* =========================================================
   CATALOG PRODUCT BY SLUG
   PUBLIC / FRONTEND
========================================================= */

export const getCatalogProductBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Product slug"
        );

      const product =
        await getCatalogProductBySlug(
          slug
        );

      return res
        .status(200)
        .json({
          success: true,

          product,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Product not found."
            ),
        });
    }
  };

/* =========================================================
   GET PRODUCT BY ID
   ADMIN
========================================================= */

export const getProductByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const product =
        await getProductById(
          id
        );

      return res
        .status(200)
        .json({
          success: true,

          product,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Product not found."
            ),
        });
    }
  };

/* =========================================================
   GET PRODUCT BY SLUG
   PUBLIC
========================================================= */

export const getProductBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Product slug"
        );

      const product =
        await getProductBySlug(
          slug
        );

      return res
        .status(200)
        .json({
          success: true,

          product,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Product not found."
            ),
        });
    }
  };

/* =========================================================
   UPDATE PRODUCT
   ADMIN
========================================================= */

export const updateProductController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const product =
        await updateProduct(
          id,
          {
            categories:
              req.body.categories,

            isColor:
              req.body.isColor,

            colors:
              req.body.colors,

            isActive:
              req.body.isActive,

            isFeatured:
              req.body.isFeatured,

            isNewLaunch:
              req.body.isNewLaunch,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Product updated successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to update product."
            ),
        });
    }
  };

/* =========================================================
   UPLOAD COLOR IMAGES
   ADMIN
========================================================= */

export const uploadProductColorImagesController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const colorSlug =
        getRouteParam(
          req.params.colorSlug,
          "Color slug"
        );

      const files =
        req.files as
          | Express.Multer.File[]
          | undefined;

      if (
        !files ||
        files.length === 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "At least one image is required.",
          });
      }

      const result =
        await uploadProductColorImages(
          id,
          colorSlug,
          files.map(
            (file) => ({
              buffer:
                file.buffer,

              originalname:
                file.originalname,
            })
          )
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Product images uploaded successfully.",

          ...result,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to upload product images."
            ),
        });
    }
  };

/* =========================================================
   DELETE COLOR IMAGE
   ADMIN

   BODY:
   {
     "publicId": "hivrasoft/products/.../image-01"
   }
========================================================= */

export const deleteProductColorImageController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const colorSlug =
        getRouteParam(
          req.params.colorSlug,
          "Color slug"
        );

      const publicId =
        String(
          req.body.publicId ||
            ""
        ).trim();

      if (!publicId) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Image publicId is required.",
          });
      }

      const product =
        await deleteProductColorImage(
          id,
          colorSlug,
          publicId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Product image deleted successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to delete product image."
            ),
        });
    }
  };

/* =========================================================
   SET DEFAULT IMAGE
   ADMIN

   BODY:
   {
     "publicId": "..."
   }
========================================================= */

export const setDefaultProductColorImageController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const colorSlug =
        getRouteParam(
          req.params.colorSlug,
          "Color slug"
        );

      const publicId =
        String(
          req.body.publicId ||
            ""
        ).trim();

      if (!publicId) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Image publicId is required.",
          });
      }

      const product =
        await setDefaultProductColorImage(
          id,
          colorSlug,
          publicId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Default image updated successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to update default image."
            ),
        });
    }
  };

/* =========================================================
   SET DEFAULT COLOR
   ADMIN
========================================================= */

export const setDefaultProductColorController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const colorSlug =
        getRouteParam(
          req.params.colorSlug,
          "Color slug"
        );

      const product =
        await setDefaultProductColor(
          id,
          colorSlug
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Default color updated successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to update default color."
            ),
        });
    }
  };

/* =========================================================
   ADD SIZE
   ADMIN
========================================================= */

export const addProductSizeController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const colorSlug =
        getRouteParam(
          req.params.colorSlug,
          "Color slug"
        );

      const {
        size,
        stock,
        originalPrice,
        showPrice,
        discountPrice,
        isActive,
      } = req.body;

      const product =
        await addProductSize(
          id,
          colorSlug,
          {
            size,
            stock,
            originalPrice,
            showPrice,
            discountPrice,
            isActive,
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Product size added successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to add product size."
            ),
        });
    }
  };

/* =========================================================
   UPDATE SIZE
   ADMIN
========================================================= */

export const updateProductSizeController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const colorSlug =
        getRouteParam(
          req.params.colorSlug,
          "Color slug"
        );

      const sizeId =
        getRouteParam(
          req.params.sizeId,
          "Size ID"
        );

      const product =
        await updateProductSize(
          id,
          colorSlug,
          sizeId,
          {
            size:
              req.body.size,

            stock:
              req.body.stock,

            originalPrice:
              req.body.originalPrice,

            showPrice:
              req.body.showPrice,

            discountPrice:
              req.body.discountPrice,

            isActive:
              req.body.isActive,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Product size updated successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to update product size."
            ),
        });
    }
  };

/* =========================================================
   DELETE SIZE
   ADMIN
========================================================= */

export const deleteProductSizeController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const colorSlug =
        getRouteParam(
          req.params.colorSlug,
          "Color slug"
        );

      const sizeId =
        getRouteParam(
          req.params.sizeId,
          "Size ID"
        );

      const product =
        await deleteProductSize(
          id,
          colorSlug,
          sizeId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Product size deleted successfully.",

          product,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to delete product size."
            ),
        });
    }
  };

/* =========================================================
   DELETE PRODUCT
   ADMIN
========================================================= */

export const deleteProductController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Product ID"
        );

      const result =
        await deleteProduct(
          id,
          req.user?._id ? String(req.user._id) : null
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            getErrorMessage(
              error,
              "Unable to delete product."
            ),
        });
    }
  };