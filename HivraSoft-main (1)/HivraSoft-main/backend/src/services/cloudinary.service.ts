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
    publicId?: string
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
