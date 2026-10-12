"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

export type CategoryImage = {
  url: string;
  publicId: string;
  alt: string;
};

type Props = {
  /*
    Example:
    category-images/sports-bra
  */
  folder: string;

  categoryName: string;

  value: CategoryImage[];

  maxImages?: number;

  disabled?: boolean;

  onUploaded: (
    image: CategoryImage
  ) => void;

  onRemove: (
    image: CategoryImage
  ) => void | Promise<void>;
};

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function CategoryImagesUploader({
  folder,
  categoryName,
  value,
  maxImages = 6,
  disabled = false,
  onUploaded,
  onRemove,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    photoName,
    setPhotoName,
  ] =
    useState(
      ""
    );

  const [
    uploading,
    setUploading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const canUpload =
    Boolean(
      categoryName.trim() &&
        photoName.trim() &&
        value.length <
          maxImages &&
        !disabled &&
        !uploading
    );

  /* =========================================================
     SELECT + UPLOAD
  ========================================================= */

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      event.target.value =
        "";

      if (
        !file
      ) {
        return;
      }

      const cleanPhotoName =
        photoName.trim();

      if (
        !categoryName.trim()
      ) {
        setError(
          "Pehle category name likho."
        );

        return;
      }

      if (
        !cleanPhotoName
      ) {
        setError(
          "Photo Name / ALT Text required hai."
        );

        return;
      }

      if (
        value.length >=
        maxImages
      ) {
        setError(
          `Maximum ${maxImages} images allowed.`
        );

        return;
      }

      const duplicateAlt =
        value.some(
          (
            image
          ) =>
            image.alt
              .trim()
              .toLowerCase() ===
            cleanPhotoName.toLowerCase()
        );

      if (
        duplicateAlt
      ) {
        setError(
          "Same Photo Name / ALT already exists. Dusra name use karo."
        );

        return;
      }

      const allowedTypes =
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/avif",
        ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setError(
          "Only JPG, PNG, WEBP and AVIF images are allowed."
        );

        return;
      }

      if (
        file.size >
        10 *
          1024 *
          1024
      ) {
        setError(
          "Image must be smaller than 10MB."
        );

        return;
      }

      try {
        setUploading(
          true
        );

        setError(
          ""
        );

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );

        /*
          Folder:
          category-images/sports-bra
        */
        formData.append(
          "folder",
          folder
        );

        /*
          Admin:
          Front View

          Backend safe slug:
          front-view

          Final Cloudinary:
          hivrasoft/category-images/sports-bra/front-view
        */
        formData.append(
          "imageName",
          cleanPhotoName
        );

        const response =
          await fetch(
            `${API_URL}/api/uploads/image`,
            {
              method:
                "POST",

              credentials:
                "include",

              body:
                formData,
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Image upload failed."
          );
        }

        onUploaded({
          url:
            data.image.url,

          publicId:
            data.image.publicId,

          /*
            Admin ka Photo Name hi frontend ALT text.
          */
          alt:
            cleanPhotoName,
        });

        setPhotoName(
          ""
        );
      } catch (
        error
      ) {
        setError(
          error instanceof
            Error
            ? error.message
            : "Image upload failed."
        );
      } finally {
        setUploading(
          false
        );
      }
    };

  return (
    <div
      className="
        rounded-[16px]
        border
        border-[#211A18]/10
        bg-[#FAF8F6]
        p-4
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-end
        "
      >
        {/* PHOTO NAME / ALT */}

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <label
            className="
              mb-2
              block
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-[#211A18]/55
            "
          >
            Photo Name / ALT Text
          </label>

          <input
            value={
              photoName
            }
            onChange={(
              event
            ) => {
              setPhotoName(
                event.target.value
              );

              setError(
                ""
              );
            }}
            placeholder="e.g. Front View"
            disabled={
              disabled ||
              uploading
            }
            className="
              h-[46px]
              w-full
              rounded-[11px]
              border
              border-[#211A18]/12
              bg-white
              px-4
              text-[11px]
              text-[#211A18]
              outline-none
              focus:border-[#8C1839]
              disabled:opacity-50
            "
          />

          <p
            className="
              mt-2
              text-[8px]
              leading-4
              text-[#211A18]/40
            "
          >
            Isi name ka slug Cloudinary
            photo name banega aur isi text
            ko website image ALT me use
            karna hai.
          </p>
        </div>

        {/* CHOOSE FILE */}

        <div
          className="
            lg:w-[220px]
          "
        >
          <input
            ref={
              inputRef
            }
            type="file"
            accept="
              image/jpeg,
              image/png,
              image/webp,
              image/avif
            "
            onChange={
              handleFileChange
            }
            className="hidden"
          />

          <button
            type="button"
            disabled={
              !canUpload
            }
            onClick={() =>
              inputRef.current?.click()
            }
            className="
              flex
              h-[46px]
              w-full
              items-center
              justify-center
              rounded-[11px]
              bg-[#8C1839]
              px-4
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.1em]
              text-white
              transition
              hover:bg-[#211A18]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {uploading
              ? "Uploading..."
              : "+ Choose & Upload"}
          </button>
        </div>
      </div>

      {/* FOLDER PREVIEW */}

      <div
        className="
          mt-4
          rounded-[10px]
          border
          border-[#211A18]/8
          bg-white
          px-3
          py-2
        "
      >
        <p
          className="
            text-[8px]
            font-semibold
            uppercase
            tracking-[0.1em]
            text-[#211A18]/35
          "
        >
          Cloudinary folder
        </p>

        <p
          className="
            mt-1
            break-all
            text-[9px]
            text-[#8C1839]
          "
        >
          hivrasoft/
          {folder}
          /
          {photoName.trim()
            ? toPreviewSlug(
                photoName
              )
            : "photo-name"}
        </p>
      </div>

      {error && (
        <p
          className="
            mt-3
            text-[9px]
            leading-4
            text-red-500
          "
        >
          {error}
        </p>
      )}

      {/* IMAGES */}

      {value.length >
        0 && (
        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            xl:grid-cols-6
          "
        >
          {value.map(
            (
              image,
              index
            ) => (
              <div
                key={
                  image.publicId
                }
                className="
                  overflow-hidden
                  rounded-[12px]
                  border
                  border-[#211A18]/10
                  bg-white
                "
              >
                <div
                  className="
                    relative
                    aspect-square
                    overflow-hidden
                    bg-[#F3EEE8]
                  "
                >
                  <img
                    src={
                      image.url
                    }
                    alt={
                      image.alt
                    }
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />

                  {index ===
                    0 && (
                    <span
                      className="
                        absolute
                        bottom-2
                        left-2
                        rounded-full
                        bg-[#211A18]
                        px-2
                        py-1
                        text-[7px]
                        font-semibold
                        uppercase
                        text-white
                      "
                    >
                      Main
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    onClick={() =>
                      void onRemove(
                        image
                      )
                    }
                    className="
                      absolute
                      right-2
                      top-2
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      text-[13px]
                      font-bold
                      text-red-500
                      shadow
                      disabled:opacity-50
                    "
                    aria-label={`Remove ${image.alt}`}
                  >
                    ×
                  </button>
                </div>

                <div
                  className="
                    p-2.5
                  "
                >
                  <p
                    className="
                      truncate
                      text-[9px]
                      font-semibold
                      text-[#211A18]
                    "
                    title={
                      image.alt
                    }
                  >
                    {
                      image.alt
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      truncate
                      text-[7px]
                      text-[#211A18]/35
                    "
                    title={
                      image.publicId
                    }
                  >
                    {
                      image.publicId
                        .split("/")
                        .pop()
                    }
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <p
        className="
          mt-3
          text-[8px]
          text-[#211A18]/35
        "
      >
        {value.length}/
        {maxImages} images • JPG,
        PNG, WEBP, AVIF • max 10MB
        each
      </p>
    </div>
  );
}

function toPreviewSlug(
  value: string
) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    "photo-name"
  );
}
