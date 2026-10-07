import {
  UploadApiOptions,
  UploadApiResponse,
} from "cloudinary";

import configureCloudinary from "../config/cloudinary";

/* =========================================================
   UPLOAD IMAGE
========================================================= */

export const uploadImageBuffer =
  async (
    buffer: Buffer,
    folder: string,
    publicId?: string,
    details?: {
      name?: string;
      alt?: string;
    }
  ): Promise<UploadApiResponse> => {
    const cloudinary =
      configureCloudinary();

    return new Promise(
      (resolve, reject) => {
        const options:
          UploadApiOptions = {
          folder,
          resource_type: "image",
          overwrite: false,
        };

        const cleanName =
          typeof details?.name === "string"
            ? details.name.trim()
            : "";
        const cleanAlt =
          typeof details?.alt === "string"
            ? details.alt.trim()
            : "";

        if (cleanName || cleanAlt) {
          options.context = {
            caption: cleanName,
            alt: cleanAlt,
          };
        }

        if (publicId) {
          options.public_id =
            publicId;
          options.unique_filename =
            false;
          options.use_filename =
            false;
        } else {
          options.unique_filename =
            true;
        }

        const uploadStream =
          cloudinary.uploader.upload_stream(
            options,
            (
              error,
              result
            ) => {
              if (
                error ||
                !result
              ) {
                reject(
                  error ||
                    new Error(
                      "Cloudinary image upload failed."
                    )
                );
                return;
              }

              resolve(result);
            }
          );

        uploadStream.end(
          buffer
        );
      }
    );
  };

/* =========================================================
   UPLOAD VIDEO
========================================================= */

export const uploadVideoBuffer =
  async (
    buffer: Buffer,
    folder: string
  ): Promise<UploadApiResponse> => {
    const cloudinary =
      configureCloudinary();

    return new Promise(
      (resolve, reject) => {
        const options:
          UploadApiOptions = {
          folder,
          resource_type: "video",
          overwrite: false,
          unique_filename: true,
        };

        const uploadStream =
          cloudinary.uploader.upload_stream(
            options,
            (
              error,
              result
            ) => {
              if (
                error ||
                !result
              ) {
                reject(
                  error ||
                    new Error(
                      "Cloudinary video upload failed."
                    )
                );
                return;
              }

              resolve(result);
            }
          );

        uploadStream.end(
          buffer
        );
      }
    );
  };

/* =========================================================
   MOVE / RENAME IMAGE
========================================================= */

export const moveCloudinaryImage =
  async (
    fromPublicId: string,
    toPublicId: string
  ) => {
    if (
      !fromPublicId ||
      !toPublicId
    ) {
      throw new Error(
        "Cloudinary source and destination publicId are required."
      );
    }

    if (
      fromPublicId ===
      toPublicId
    ) {
      return null;
    }

    const cloudinary =
      configureCloudinary();

    return cloudinary.uploader.rename(
      fromPublicId,
      toPublicId,
      {
        resource_type: "image",
        overwrite: false,
        invalidate: true,
      }
    );
  };

/* =========================================================
   DELETE ONE IMAGE
========================================================= */

export const deleteCloudinaryImage =
  async (
    publicId: string
  ) => {
    if (!publicId) {
      return null;
    }

    const cloudinary =
      configureCloudinary();

    return cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
        invalidate: true,
      }
    );
  };

/* =========================================================
   DELETE MANY IMAGES
========================================================= */

export const deleteCloudinaryImages =
  async (
    publicIds: string[]
  ) => {
    const uniqueIds =
      Array.from(
        new Set(
          publicIds
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      );

    if (
      uniqueIds.length ===
      0
    ) {
      return [];
    }

    return Promise.all(
      uniqueIds.map(
        publicId =>
          deleteCloudinaryImage(
            publicId
          )
      )
    );
  };

/* =========================================================
   DELETE ONE VIDEO
========================================================= */

export const deleteCloudinaryVideo =
  async (
    publicId: string
  ) => {
    if (!publicId) {
      return null;
    }

    const cloudinary =
      configureCloudinary();

    return cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "video",
        invalidate: true,
      }
    );
  };

/* =========================================================
   DELETE MANY VIDEOS
========================================================= */

export const deleteCloudinaryVideos =
  async (
    publicIds: string[]
  ) => {
    const uniqueIds =
      Array.from(
        new Set(
          publicIds
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      );

    if (
      uniqueIds.length ===
      0
    ) {
      return [];
    }

    return Promise.all(
      uniqueIds.map(
        publicId =>
          deleteCloudinaryVideo(
            publicId
          )
      )
    );
  };

/* =========================================================
   FOLDER FROM PUBLIC ID
========================================================= */

export const getCloudinaryFolderFromPublicId =
  (
    publicId: string
  ): string => {
    const parts =
      publicId
        .split("/")
        .filter(Boolean);

    parts.pop();

    return parts.join("/");
  };

/* =========================================================
   DELETE EMPTY CLOUDINARY FOLDER
========================================================= */

export const deleteCloudinaryFolderIfEmpty =
  async (
    folder: string
  ) => {
    if (!folder) {
      return;
    }

    try {
      const cloudinary =
        configureCloudinary();

      await cloudinary.api.delete_folder(
        folder
      );
    } catch {
      /* best effort only */
    }
  };

/* =========================================================
   MEDIA LIBRARY - LIST IMAGES
========================================================= */

export type CloudinaryLibraryImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: string;
  folder: string;
  name: string;
  alt: string;
};

const getCloudinaryContextValue = (resource: any, key: "caption" | "alt") => {
  const context = resource?.context;
  const direct = context?.[key];
  const custom = context?.custom?.[key];
  const value = typeof custom === "string" ? custom : typeof direct === "string" ? direct : "";
  return value.trim();
};

export const updateCloudinaryImageDetails = async (
  publicId: string,
  details: { name?: string; alt?: string }
) => {
  if (!publicId?.trim()) {
    throw new Error("Cloudinary publicId is required.");
  }

  const cloudinary = configureCloudinary();
  const name = typeof details.name === "string" ? details.name.trim() : "";
  const alt = typeof details.alt === "string" ? details.alt.trim() : "";

  const result = await cloudinary.uploader.explicit(publicId.trim(), {
    resource_type: "image",
    type: "upload",
    context: {
      caption: name,
      alt,
    },
  });

  return {
    publicId: String(result?.public_id || publicId),
    url: String(result?.secure_url || result?.url || ""),
    width: Number(result?.width || 0),
    height: Number(result?.height || 0),
    format: String(result?.format || ""),
    bytes: Number(result?.bytes || 0),
    createdAt: String(result?.created_at || ""),
    folder: String(result?.folder || publicId.split("/").slice(0, -1).join("/")),
    name,
    alt,
  };
};

export const listCloudinaryImages = async (
  options: {
    prefix?: string;
    maxResults?: number;
    nextCursor?: string;
  } = {}
) => {
  const cloudinary = configureCloudinary();
  const maxResults = Math.max(1, Math.min(100, Number(options.maxResults || 60)));

  const result = await cloudinary.api.resources({
    resource_type: "image",
    type: "upload",
    prefix: options.prefix || "hivrasoft",
    max_results: maxResults,
    next_cursor: options.nextCursor || undefined,
    context: true,
  } as any);

  const resources = Array.isArray(result?.resources) ? result.resources : [];

  return {
    images: resources.map((resource: any): CloudinaryLibraryImage => {
      const publicId = String(resource?.public_id || "");
      const parts = publicId.split("/").filter(Boolean);
      const rawName = parts.pop() || "image";

      const contextName = getCloudinaryContextValue(resource, "caption");
      const contextAlt = getCloudinaryContextValue(resource, "alt");

      return {
        publicId,
        url: String(resource?.secure_url || resource?.url || ""),
        width: Number(resource?.width || 0),
        height: Number(resource?.height || 0),
        format: String(resource?.format || ""),
        bytes: Number(resource?.bytes || 0),
        createdAt: String(resource?.created_at || ""),
        folder: parts.join("/"),
        name: contextName || rawName.replace(/[-_]+/g, " "),
        alt: contextAlt || contextName || rawName.replace(/[-_]+/g, " "),
      };
    }).filter((image: CloudinaryLibraryImage) => image.publicId && image.url),
    nextCursor: typeof result?.next_cursor === "string" ? result.next_cursor : null,
  };
};
