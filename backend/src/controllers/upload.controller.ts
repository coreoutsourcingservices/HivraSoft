import {
  Request,
  Response,
} from "express";

import GalleryMedia from "../models/GalleryMedia.model";
import { softDeleteEntity } from "../services/admin-trash.service";
import configureCloudinary from "../config/cloudinary";

import {
  uploadImageBuffer,
  deleteCloudinaryImage,
  listCloudinaryImages,
  updateCloudinaryImageDetails,
} from "../services/cloudinary.service";

/* =========================================================
   SAFE TEXT -> CLOUDINARY SEGMENT
========================================================= */

const createSafeSegment =
  (
    value: unknown,
    fallback: string
  ): string => {
    if (
      typeof value !==
      "string"
    ) {
      return fallback;
    }

    const safe =
      value
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-z0-9_-]+/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        )
        .replace(
          /^[-_]+|[-_]+$/g,
          ""
        );

    return safe ||
      fallback;
  };

/* =========================================================
   SAFE FOLDER

   Input:
   category-images/Women/Bra/Sports Bra

   Output:
   category-images/women/bra/sports-bra
========================================================= */

const createSafeFolder =
  (
    folderInput: unknown
  ): string => {
    const raw =
      typeof folderInput ===
      "string"
        ? folderInput
        : "products";

    const segments =
      raw
        .split("/")
        .map(
          (
            segment
          ) =>
            createSafeSegment(
              segment,
              ""
            )
        )
        .filter(
          Boolean
        );

    return (
      segments.join(
        "/"
      ) ||
      "products"
    );
  };

/* =========================================================
   SAFE IMAGE NAME

   Admin:
   "Front View"

   Cloudinary public_id filename:
   "front-view"
========================================================= */

const stripFileExtension =
  (value: string): string =>
    value.replace(
      /\.[a-z0-9]{2,8}$/i,
      ""
    );

const createSafeImageName =
  (
    imageNameInput: unknown
  ): string | undefined => {
    if (
      typeof imageNameInput !==
      "string" ||
      !imageNameInput.trim()
    ) {
      return undefined;
    }

    return createSafeSegment(
      stripFileExtension(
        imageNameInput.trim()
      ),
      "image"
    );
  };

/* =========================================================
   UPLOAD IMAGE
========================================================= */

export const uploadImageController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Image file is required.",
          });
      }

      const safeFolder =
        createSafeFolder(
          req.body.folder
        );

      const folder =
        `hivrasoft/${safeFolder}`;

      /*
        Product uploader may send imageName explicitly.
        Otherwise use the uploaded file's original filename.
        Example: "Black Bikini Front.jpg" -> public_id "black-bikini-front".
      */
      const requestedImageName =
        typeof req.body.imageName ===
          "string" &&
        req.body.imageName.trim()
          ? req.body.imageName
          : req.file.originalname;

      const imageName =
        createSafeImageName(
          requestedImageName
        );

      const result =
        await uploadImageBuffer(
          req.file.buffer,
          folder,
          imageName,
          {
            name: stripFileExtension(req.file.originalname),
            alt: stripFileExtension(req.file.originalname),
          }
        );

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            "Image uploaded successfully.",

          image: {
            url:
              result.secure_url,

            publicId:
              result.public_id,

            width:
              result.width,

            height:
              result.height,

            format:
              result.format,

            createdAt:
              String((result as any).created_at || new Date().toISOString()),

            /*
              Actual final Cloudinary filename.
              publicId ke last part ko return kar rahe hain.
            */
            cloudinaryName:
              result.public_id
                .split("/")
                .pop() ||
              "",

            /*
              name/alt are returned so admin can persist them with Product.
              Frontend should prefer image.alt and fall back to image.name.
            */
            name:
              stripFileExtension(
                req.file.originalname
              ),

            alt:
              stripFileExtension(
                req.file.originalname
              ),
          },
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to upload image.",
        });
    }
  };


/* =========================================================
   LIST MEDIA LIBRARY IMAGES
========================================================= */

export const listImagesController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const prefix =
        typeof req.query.prefix === "string" && req.query.prefix.trim()
          ? req.query.prefix.trim()
          : "hivrasoft";

      const limit = Math.max(
        1,
        Math.min(100, Number(req.query.limit || 60) || 60)
      );

      const nextCursor =
        typeof req.query.nextCursor === "string" && req.query.nextCursor.trim()
          ? req.query.nextCursor.trim()
          : undefined;

      const result = await listCloudinaryImages({
        prefix,
        maxResults: limit,
        nextCursor,
      });

      const publicIds = result.images.map((image) => image.publicId);
      const deleted = await GalleryMedia.find({ publicId: { $in: publicIds }, isDeleted: true }).select("publicId").lean();
      const hidden = new Set(deleted.map((image: any) => image.publicId));
      return res.status(200).json({
        success: true,
        ...result,
        images: result.images.filter((image) => !hidden.has(image.publicId)),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load media library.",
      });
    }
  };

/* =========================================================
   UPDATE MEDIA LIBRARY IMAGE DETAILS
========================================================= */

export const updateImageDetailsController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const publicId =
        typeof req.body?.publicId === "string"
          ? req.body.publicId.trim()
          : "";

      const name =
        typeof req.body?.name === "string"
          ? req.body.name.trim().slice(0, 200)
          : "";

      const alt =
        typeof req.body?.alt === "string"
          ? req.body.alt.trim().slice(0, 500)
          : "";

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: "publicId is required.",
        });
      }

      const image = await updateCloudinaryImageDetails(publicId, {
        name,
        alt,
      });

      return res.status(200).json({
        success: true,
        message: "Image details updated successfully.",
        image,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to update image details.",
      });
    }
  };

/* =========================================================
   DELETE IMAGE
========================================================= */

export const deleteImageController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        publicId,
      } =
        req.body;

      if (
        !publicId ||
        typeof publicId !==
          "string"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "publicId is required.",
          });
      }

      const result =
        await deleteCloudinaryImage(
          publicId
        );

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Image deleted successfully.",

          result:
            result.result,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to delete image.",
        });
    }
  };

/** Gallery soft delete: keep Cloudinary original until Trash expiry or explicit permanent delete. */
export const trashGalleryImageController = async (req: Request, res: Response) => {
  try {
    const publicId = typeof req.body?.publicId === "string" ? req.body.publicId.trim() : "";
    if (!publicId.startsWith("hivrasoft/") || publicId.length > 500) {
      return res.status(400).json({ success: false, message: "Valid HivraSoft image publicId required." });
    }
    const existing = await GalleryMedia.findOne({ publicId });
    if (existing?.isDeleted) return res.status(200).json({ success: true, message: "Image already in Trash." });
    // Do not trust an arbitrary URL from the browser; obtain the actual Cloudinary resource.
    const cloudinary = configureCloudinary();
    const resource = await cloudinary.api.resource(publicId, { resource_type: "image", type: "upload" });
    const url = String(resource.secure_url || "");
    if (!url) throw new Error("Cloudinary image not found.");
    const fallbackName = publicId.split("/").pop() || "Gallery image";
    const record = existing || await GalleryMedia.findOneAndUpdate(
      { publicId },
      { $setOnInsert: { publicId, title: fallbackName, image: { publicId, url }, isDeleted: false } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    if (!record) throw new Error("Unable to save gallery image.");
    const actorId = req.user?._id ? String(req.user._id) : null;
    const result = await softDeleteEntity("gallery_image", String(record._id), actorId);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    return res.status(error?.http_code === 404 ? 404 : 400).json({
      success: false, message: error instanceof Error ? error.message : "Unable to move image to Trash."
    });
  }
};
