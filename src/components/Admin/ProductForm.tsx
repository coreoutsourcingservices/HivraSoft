"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   TYPES
========================================================= */

type Category = {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  level?: number;
  children?: Category[];
};

type ImageValue = {
  url: string;
  publicId: string;
  isDefault?: boolean;

  /*
   * These two fields require backend model/service support
   * if you want them to persist after save.
   */
  name?: string;
  alt?: string;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  alt: string;
  isDefault: boolean;
};

type SizeValue = {
  _id?: string;
  size: string;
  stock: number | string;
  originalPrice: number | string;
  showPrice: number | string;
  discountPrice: number | string;
  isActive?: boolean;
};

type ColorValue = {
  nameProduct: string;
  slugProduct: string;

  // Frontend-only: keeps URLs stable on edit.
  // false = slug follows the name automatically.
  // true = admin explicitly controls the slug.
  productSlugManuallyEdited: boolean;

  nameColor: string;
  slugColor: string;

  // Same behavior for the color URL segment.
  colorSlugManuallyEdited: boolean;

  hex: string;
  isDefault: boolean;

  originalPrice: number | string;
  showPrice: number | string;
  discountPrice: number | string;

  // Frontend-only control. Not sent to backend.
  // true = every size uses this color/product pricing.
  // false = every size can have its own pricing.
  samePriceForAllSizes: boolean;

  shortDescription: string;
  description: string;

  tags: string;

  seoTitle: string;
  seoDescription: string;

  images: ImageValue[];
  pendingImages: PendingImage[];

  sizes: SizeValue[];
};

type Props = {
  mode: "create" | "edit";
  productId?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function slugify(
  value: string
) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(
      /[^\p{L}\p{N}]+/gu,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function imageNameFromFile(
  fileName: string
) {
  return fileName
    .replace(
      /\.[^/.]+$/,
      ""
    )
    .trim();
}

function imageNameFromPublicId(
  publicId: string
) {
  return (
    publicId
      .split("/")
      .pop()
      ?.replace(
        /[-_]+/g,
        " "
      )
      .trim() ||
    "Product image"
  );
}

function emptyColor(
  index = 0
): ColorValue {
  return {
    nameProduct: "",
    slugProduct: "",
    productSlugManuallyEdited: false,

    nameColor: "",
    slugColor: "",
    colorSlugManuallyEdited: false,

    hex: "#000000",
    isDefault:
      index === 0,

    originalPrice: 0,
    showPrice: 0,
    discountPrice: 0,

    samePriceForAllSizes: true,

    shortDescription: "",
    description: "",

    tags: "",

    seoTitle: "",
    seoDescription: "",

    images: [],
    pendingImages: [],

    sizes: [
      {
        size: "",
        stock: "",
        originalPrice: "",
        showPrice: "",
        discountPrice: "",
        isActive: true,
      },
    ],
  };
}

function flattenCategories(
  items: Category[],
  depth = 0
): Category[] {
  return items.flatMap(
    (item) => [
      {
        ...item,
        level:
          item.level ??
          depth,
      },

      ...flattenCategories(
        Array.isArray(
          item.children
        )
          ? item.children
          : [],
        depth + 1
      ),
    ]
  );
}

async function readJson(
  response: Response
) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function createPendingImages(
  files: File[],
  productName: string,
  alreadyHasImages: boolean
): PendingImage[] {
  return files.map(
    (
      file,
      index
    ) => {
      const name =
        imageNameFromFile(
          file.name
        );

      const altBase =
        productName.trim() ||
        name;

      return {
        id:
          `${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2)}`,

        file,

        previewUrl:
          URL.createObjectURL(
            file
          ),

        name,

        alt:
          `${altBase} - ${name}`
            .replace(
              /\s+/g,
              " "
            )
            .trim(),

        isDefault:
          !alreadyHasImages &&
          index === 0,
      };
    }
  );
}

/* =========================================================
   PRODUCT FORM
========================================================= */

export default function ProductForm({
  mode,
  productId,
}: Props) {
  const router =
    useRouter();

  const isEdit =
    mode === "edit";

  const [
    categories,
    setCategories,
  ] = useState<
    Category[]
  >([]);

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState<
    string[]
  >([]);

  /* =======================================================
     CATEGORY DROPDOWN
  ======================================================= */

  const [
    categoryDropdownOpen,
    setCategoryDropdownOpen,
  ] = useState(false);

  const [
    categorySearch,
    setCategorySearch,
  ] = useState("");

  const [
    colors,
    setColors,
  ] = useState<
    ColorValue[]
  >([
    emptyColor(0),
  ]);

  const [
    expandedColorIndexes,
    setExpandedColorIndexes,
  ] = useState<number[]>([]);

  /*
   * true  = Color product
   * false = No Color product
   *
   * No Color still uses one internal "default" color document
   * because product name, SEO, images and sizes live inside colors[].
   * The storefront hides the color selector when isColor=false.
   */
  const [
    isColor,
    setIsColor,
  ] = useState(true);

  const [
    isActive,
    setIsActive,
  ] = useState(true);

  const [
    isFeatured,
    setIsFeatured,
  ] = useState(false);

  const [
    isNewLaunch,
    setIsNewLaunch,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(
    isEdit
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    uploadMessage,
    setUploadMessage,
  ] = useState("");

  const colorsRef =
    useRef(colors);

  useEffect(() => {
    colorsRef.current =
      colors;
  }, [colors]);

  /*
   * Revoke local preview URLs when page unmounts.
   */
  useEffect(() => {
    return () => {
      for (
        const color
        of colorsRef.current
      ) {
        for (
          const image
          of color.pendingImages
        ) {
          URL.revokeObjectURL(
            image.previewUrl
          );
        }
      }
    };
  }, []);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const load =
      async () => {
        try {
          const response =
            await fetch(
              `${API_URL}/api/categories/tree`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await readJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              data?.message ||
                "Unable to load categories."
            );
          }

          if (
            !cancelled
          ) {
            setCategories(
              flattenCategories(
                Array.isArray(
                  data?.categories
                )
                  ? data.categories
                  : []
              )
            );
          }
        } catch (
          loadError
        ) {
          if (
            !cancelled
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load categories."
            );
          }
        }
      };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     LOAD PRODUCT FOR EDIT
  ======================================================= */

  useEffect(() => {
    if (
      !isEdit
    ) {
      setLoading(
        false
      );

      return;
    }

    if (
      !productId
    ) {
      setError(
        "Product ID is missing."
      );

      setLoading(
        false
      );

      return;
    }

    let cancelled =
      false;

    const load =
      async () => {
        try {
          setLoading(
            true
          );

          const response =
            await fetch(
              `${API_URL}/api/products/${productId}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await readJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              data?.message ||
                "Unable to load product."
            );
          }

          const product =
            data?.product ||
            data;

          if (
            cancelled
          ) {
            return;
          }

          setSelectedCategories(
            (
              product?.categories ||
              []
            )
              .map(
                (
                  item: any
                ) =>
                  String(
                    typeof item ===
                      "string"
                      ? item
                      : item?._id ||
                          item?.id ||
                          ""
                  )
              )
              .filter(
                Boolean
              )
          );

          const nextColors =
            Array.isArray(
              product?.colors
            )
              ? product.colors.map(
                  (
                    color: any,
                    index: number
                  ) => ({
                    nameProduct:
                      color?.nameProduct ||
                      "",

                    slugProduct:
                      color?.slugProduct ||
                      "",

                    // Existing product URLs must not change just because
                    // the admin edits the product name.
                    productSlugManuallyEdited: true,

                    nameColor:
                      color?.nameColor ||
                      "",

                    slugColor:
                      color?.slugColor ||
                      "",

                    // Existing color URLs stay stable until manually edited.
                    colorSlugManuallyEdited: true,

                    hex:
                      color?.hex ||
                      "#000000",

                    isDefault:
                      color?.isDefault ??
                      index === 0,

                    originalPrice:
                      Number(color?.originalPrice ?? 0),

                    showPrice:
                      Number(color?.showPrice ?? 0),

                    discountPrice:
                      Number(color?.discountPrice ?? 0),

                    samePriceForAllSizes:
                      !Array.isArray(color?.sizes) ||
                      color.sizes.length === 0 ||
                      color.sizes.every(
                        (size: any) =>
                          Number(size?.originalPrice ?? 0) ===
                            Number(color?.originalPrice ?? 0) &&
                          Number(size?.showPrice ?? 0) ===
                            Number(color?.showPrice ?? 0)
                      ),

                    shortDescription:
                      color?.shortDescription ||
                      "",

                    description:
                      color?.description ||
                      "",

                    tags:
                      Array.isArray(
                        color?.tags
                      )
                        ? color.tags.join(
                            ", "
                          )
                        : "",

                    seoTitle:
                      color?.seoTitle ||
                      "",

                    seoDescription:
                      color?.seoDescription ||
                      "",

                    images:
                      Array.isArray(
                        color?.images
                      )
                        ? color.images.map(
                            (
                              image: any
                            ) => ({
                              url:
                                image?.url ||
                                "",

                              publicId:
                                image?.publicId ||
                                "",

                              isDefault:
                                image?.isDefault ===
                                true,

                              name:
                                image?.name ||
                                imageNameFromPublicId(
                                  image?.publicId ||
                                    ""
                                ),

                              alt:
                                image?.alt ||
                                `${color?.nameProduct || "Product"} ${color?.nameColor || ""}`
                                  .trim(),
                            })
                          )
                        : [],

                    pendingImages:
                      [],

                    sizes:
                      Array.isArray(
                        color?.sizes
                      ) &&
                      color.sizes
                        .length
                        ? color.sizes.map(
                            (
                              size: any
                            ) => ({
                              _id:
                                size?._id,

                              size:
                                size?.size ||
                                "",

                              stock:
                                Number(
                                  size?.stock ||
                                    0
                                ),

                              originalPrice:
                                Number(size?.originalPrice ?? 0),

                              showPrice:
                                Number(size?.showPrice ?? 0),

                              discountPrice:
                                Number(size?.discountPrice ?? 0),

                              isActive:
                                size?.isActive !==
                                false,
                            })
                          )
                        : [
                            {
                              size:
                                "",

                              stock:
                                "",

                              originalPrice:
                                "",

                              showPrice:
                                "",

                              discountPrice:
                                "",

                              isActive:
                                true,
                            },
                          ],
                  })
                )
              : [];

          setColors(
            nextColors.length
              ? nextColors
              : [
                  emptyColor(
                    0
                  ),
                ]
          );

          setIsColor(
            product?.isColor !==
              false
          );

          setIsActive(
            product?.isActive ===
              true
          );

          setIsFeatured(
            product?.isFeatured ===
              true
          );

          setIsNewLaunch(
            product?.isNewLaunch ===
              true
          );
        } catch (
          loadError
        ) {
          if (
            !cancelled
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load product."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    isEdit,
    productId,
  ]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const filteredCategories =
    useMemo(
      () => {
        const search =
          categorySearch
            .trim()
            .toLowerCase();

        if (!search) {
          return categories;
        }

        return categories.filter(
          (
            category
          ) =>
            category.name
              .toLowerCase()
              .includes(
                search
              ) ||
            String(
              category.slug ||
                ""
            )
              .toLowerCase()
              .includes(
                search
              )
        );
      },
      [
        categories,
        categorySearch,
      ]
    );

  const selectedCategoryObjects =
    useMemo(
      () =>
        categories.filter(
          (
            category
          ) => {
            const id =
              String(
                category._id ||
                  category.id ||
                  ""
              );

            return selectedCategories.includes(
              id
            );
          }
        ),
      [
        categories,
        selectedCategories,
      ]
    );

  const toggleCategory = (
    id: string
  ) => {
    if (!id) {
      return;
    }

    setSelectedCategories(
      (
        current
      ) =>
        current.includes(
          id
        )
          ? current.filter(
              (
                value
              ) =>
                value !==
                id
            )
          : [
              ...current,
              id,
            ]
    );
  };

  const visibleColors =
    useMemo(
      () =>
        isColor
          ? colors
          : colors.slice(
              0,
              1
            ),
      [
        colors,
        isColor,
      ]
    );

  const totalStock =
    useMemo(
      () =>
        visibleColors.reduce(
          (
            total,
            color
          ) =>
            total +
            color.sizes.reduce(
              (
                sum,
                size
              ) =>
                sum +
                Math.max(
                  0,
                  Number(
                    size.stock ||
                      0
                  )
                ),
              0
            ),
          0
        ),
      [visibleColors]
    );

  const totalImages =
    useMemo(
      () =>
        visibleColors.reduce(
          (
            total,
            color
          ) =>
            total +
            color.images
              .length +
            color
              .pendingImages
              .length,
          0
        ),
      [visibleColors]
    );

  /* =======================================================
     STATE HELPERS
  ======================================================= */

  const toggleColorExpanded = (
    index: number
  ) => {
    setExpandedColorIndexes(
      (current) =>
        current.includes(
          index
        )
          ? current.filter(
              (item) =>
                item !==
                index
            )
          : [
              ...current,
              index,
            ]
    );
  };

  const changeColorMode = (
    nextValue: boolean
  ) => {
    setIsColor(
      nextValue
    );

    /*
     * Keep at least one details block.
     * If user switches back to Color mode, previous color data
     * remains available instead of being destroyed.
     */
    setColors(
      (
        current
      ) =>
        current.length
          ? current
          : [
              emptyColor(
                0
              ),
            ]
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );
  };

  const updateColor = (
    index: number,
    patch:
      Partial<ColorValue>
  ) => {
    setColors(
      (
        current
      ) =>
        current.map(
          (
            color,
            i
          ) =>
            i === index
              ? {
                  ...color,
                  ...patch,
                }
              : color
        )
    );
  };

  const addColor =
    () => {
      const nextIndex =
        colors.length;

      setColors(
        (
          current
        ) => [
          ...current,
          emptyColor(
            current.length
          ),
        ]
      );

      setExpandedColorIndexes(
        (current) =>
          current.includes(
            nextIndex
          )
            ? current
            : [
                ...current,
                nextIndex,
              ]
      );
    };

  const removeColor = (
    index: number
  ) => {
    setExpandedColorIndexes(
      (current) =>
        current
          .filter(
            (item) =>
              item !==
              index
          )
          .map(
            (item) =>
              item > index
                ? item - 1
                : item
          )
    );

    setColors(
      (
        current
      ) => {
        const removed =
          current[
            index
          ];

        for (
          const image
          of removed
            ?.pendingImages ||
          []
        ) {
          URL.revokeObjectURL(
            image.previewUrl
          );
        }

        const next =
          current.filter(
            (
              _,
              i
            ) =>
              i !==
              index
          );

        if (
          next.length >
            0 &&
          !next.some(
            (
              color
            ) =>
              color.isDefault
          )
        ) {
          next[0] = {
            ...next[0],
            isDefault:
              true,
          };
        }

        return next;
      }
    );
  };

  const makeDefaultColor = (
    index: number
  ) => {
    setColors(
      (
        current
      ) =>
        current.map(
          (
            color,
            i
          ) => ({
            ...color,

            isDefault:
              i ===
              index,
          })
        )
    );
  };

  const setSamePriceForAllSizes = (
    colorIndex: number,
    enabled: boolean
  ) => {
    setColors(
      (current) =>
        current.map(
          (color, i) => {
            if (i !== colorIndex) {
              return color;
            }

            if (!enabled) {
              return {
                ...color,
                samePriceForAllSizes: false,
              };
            }

            const originalPrice =
              color.originalPrice;
            const showPrice =
              color.showPrice;
            const discountPrice =
              Math.max(
                0,
                Number(originalPrice || 0) -
                  Number(showPrice || 0)
              );

            return {
              ...color,
              samePriceForAllSizes: true,
              sizes: color.sizes.map(
                (size) => ({
                  ...size,
                  originalPrice,
                  showPrice,
                  discountPrice,
                })
              ),
            };
          }
        )
    );
  };

  const addSize = (
    colorIndex: number
  ) => {
    setColors(
      (
        current
      ) =>
        current.map(
          (
            color,
            i
          ) =>
            i ===
            colorIndex
              ? {
                  ...color,

                  sizes: [
                    ...color.sizes,

                    {
                      size:
                        "",

                      stock:
                        "",

                      originalPrice:
                        color.samePriceForAllSizes
                          ? color.originalPrice
                          : "",

                      showPrice:
                        color.samePriceForAllSizes
                          ? color.showPrice
                          : "",

                      discountPrice:
                        color.samePriceForAllSizes
                          ? Math.max(
                              0,
                              Number(color.originalPrice || 0) -
                                Number(color.showPrice || 0)
                            )
                          : "",

                      isActive:
                        true,
                    },
                  ],
                }
              : color
        )
    );
  };

  const updateSize = (
    colorIndex: number,
    sizeIndex: number,
    patch:
      Partial<SizeValue>
  ) => {
    setColors(
      (
        current
      ) =>
        current.map(
          (
            color,
            i
          ) =>
            i ===
            colorIndex
              ? {
                  ...color,

                  sizes:
                    color.sizes.map(
                      (
                        size,
                        j
                      ) =>
                        j ===
                        sizeIndex
                          ? {
                              ...size,
                              ...patch,
                            }
                          : size
                    ),
                }
              : color
        )
    );
  };

  const removeSize = (
    colorIndex: number,
    sizeIndex: number
  ) => {
    setColors(
      (
        current
      ) =>
        current.map(
          (
            color,
            i
          ) =>
            i ===
            colorIndex
              ? {
                  ...color,

                  sizes:
                    color.sizes.filter(
                      (
                        _,
                        j
                      ) =>
                        j !==
                        sizeIndex
                    ),
                }
              : color
        )
    );
  };

  /* =======================================================
     PENDING IMAGE HELPERS
  ======================================================= */

  const addPendingImages = (
    colorIndex: number,
    fileList:
      FileList | null
  ) => {
    if (
      !fileList
    ) {
      return;
    }

    const files =
      Array.from(
        fileList
      );

    if (
      files.length ===
      0
    ) {
      return;
    }

    const color =
      colors[
        colorIndex
      ];

    const existingCount =
      color.images.length +
      color
        .pendingImages
        .length;

    const newImages =
      createPendingImages(
        files,
        color.nameProduct,
        existingCount > 0
      );

    updateColor(
      colorIndex,
      {
        pendingImages: [
          ...color.pendingImages,
          ...newImages,
        ],
      }
    );
  };

  const updatePendingImage = (
    colorIndex: number,
    imageId: string,
    patch:
      Partial<PendingImage>
  ) => {
    const color =
      colors[
        colorIndex
      ];

    updateColor(
      colorIndex,
      {
        pendingImages:
          color.pendingImages.map(
            (
              image
            ) =>
              image.id ===
              imageId
                ? {
                    ...image,
                    ...patch,
                  }
                : image
          ),
      }
    );
  };

<<<<<<< HEAD
  const movePendingImageToPosition = (
    colorIndex: number,
    imageId: string,
    requestedPosition: number
  ) => {
    const color =
      colors[
        colorIndex
      ];

    const currentIndex =
      color.pendingImages.findIndex(
        (image) =>
          image.id ===
          imageId
      );

    if (
      currentIndex < 0 ||
      color.pendingImages.length < 2
    ) {
      return;
    }

    const targetIndex =
      Math.max(
        0,
        Math.min(
          color.pendingImages.length - 1,
          Math.trunc(
            Number(
              requestedPosition
            ) || 1
          ) - 1
        )
      );

    if (
      targetIndex ===
      currentIndex
    ) {
      return;
    }

    const nextImages =
      [...color.pendingImages];

    const [movedImage] =
      nextImages.splice(
        currentIndex,
        1
      );

    nextImages.splice(
      targetIndex,
      0,
      movedImage
    );

    updateColor(
      colorIndex,
      {
        pendingImages:
          nextImages,
      }
    );
  };

=======
>>>>>>> aman
  const removePendingImage = (
    colorIndex: number,
    imageId: string
  ) => {
    const color =
      colors[
        colorIndex
      ];

    const image =
      color.pendingImages.find(
        (
          item
        ) =>
          item.id ===
          imageId
      );

    if (image) {
      URL.revokeObjectURL(
        image.previewUrl
      );
    }

    const nextImages =
      color.pendingImages.filter(
        (
          item
        ) =>
          item.id !==
          imageId
      );

    const hadDefault =
      image?.isDefault ===
      true;

    if (
      hadDefault &&
      color.images
        .length ===
        0 &&
      nextImages.length >
        0
    ) {
      nextImages[0] = {
        ...nextImages[0],
        isDefault:
          true,
      };
    }

    updateColor(
      colorIndex,
      {
        pendingImages:
          nextImages,
      }
    );
  };

  const setDefaultPendingImage = (
    colorIndex: number,
    imageId: string
  ) => {
    const color =
      colors[
        colorIndex
      ];

    updateColor(
      colorIndex,
      {
        /*
         * Existing images lose local default selection.
         * Backend default is finalized after upload.
         */
        images:
          color.images.map(
            (
              image
            ) => ({
              ...image,
              isDefault:
                false,
            })
          ),

        pendingImages:
          color.pendingImages.map(
            (
              image
            ) => ({
              ...image,
              isDefault:
                image.id ===
                imageId,
            })
          ),
      }
    );
  };

  const updateExistingImageMeta = (
    colorIndex: number,
    publicId: string,
    patch:
      Partial<ImageValue>
  ) => {
    const color =
      colors[
        colorIndex
      ];

    updateColor(
      colorIndex,
      {
        images:
          color.images.map(
            (
              image
            ) =>
              image.publicId ===
              publicId
                ? {
                    ...image,
                    ...patch,
                  }
                : image
          ),
      }
    );
  };

  /* =======================================================
     DELETE EXISTING IMAGE
  ======================================================= */

  const deleteExistingImage =
    async (
      colorIndex: number,
      image:
        ImageValue
    ) => {
      const color =
        colors[
          colorIndex
        ];

      if (
        !isEdit ||
        !productId
      ) {
        updateColor(
          colorIndex,
          {
            images:
              color.images.filter(
                (
                  item
                ) =>
                  item.publicId !==
                  image.publicId
              ),
          }
        );

        return;
      }

      try {
        setError("");

        const response =
          await fetch(
            `${API_URL}/api/products/${productId}/colors/${encodeURIComponent(
              color.slugColor
            )}/images`,
            {
              method:
                "DELETE",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    publicId:
                      image.publicId,
                  }
                ),
            }
          );

        const data =
          await readJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to delete image."
          );
        }

        updateColor(
          colorIndex,
          {
            images:
              color.images.filter(
                (
                  item
                ) =>
                  item.publicId !==
                  image.publicId
              ),
          }
        );

        setSuccess(
          "Image deleted successfully."
        );
      } catch (
        deleteError
      ) {
        setError(
          deleteError instanceof
            Error
            ? deleteError.message
            : "Unable to delete image."
        );
      }
    };

  /* =======================================================
     DEFAULT EXISTING IMAGE
  ======================================================= */

  const setDefaultImage =
    async (
      colorIndex: number,
      image:
        ImageValue
    ) => {
      const color =
        colors[
          colorIndex
        ];

      updateColor(
        colorIndex,
        {
          images:
            color.images.map(
              (
                item
              ) => ({
                ...item,

                isDefault:
                  item.publicId ===
                  image.publicId,
              })
            ),

          pendingImages:
            color.pendingImages.map(
              (
                item
              ) => ({
                ...item,

                isDefault:
                  false,
              })
            ),
        }
      );

      if (
        !isEdit ||
        !productId
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/products/${productId}/colors/${encodeURIComponent(
              color.slugColor
            )}/images/default`,
            {
              method:
                "PATCH",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    publicId:
                      image.publicId,
                  }
                ),
            }
          );

        const data =
          await readJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to set default image."
          );
        }
      } catch (
        defaultError
      ) {
        setError(
          defaultError instanceof
            Error
            ? defaultError.message
            : "Unable to set default image."
        );
      }
    };

  /* =======================================================
     UPLOAD PENDING IMAGES

     Sends:
     - images[] = files
     - imageMeta = JSON containing name/alt/isDefault

     Backend must read req.body.imageMeta if you want name/alt
     persisted in MongoDB.
  ======================================================= */

  const uploadPendingImages =
    async (
      id: string
    ) => {
      const uploadColors =
        isColor
          ? colors
          : colors.slice(
              0,
              1
            );

      for (
        let colorIndex =
          0;
        colorIndex <
        uploadColors.length;
        colorIndex++
      ) {
        const color =
          uploadColors[
            colorIndex
          ];

        if (
          !color
            .pendingImages
            .length
        ) {
          continue;
        }

        setUploadMessage(
          `Uploading ${
            isColor
              ? color.nameColor ||
                `color ${colorIndex + 1}`
              : color.nameProduct ||
                "product"
          } images...`
        );

        const formData =
          new FormData();

        for (
          const image
          of color.pendingImages
        ) {
          formData.append(
            "images",
            image.file
          );
        }

        formData.append(
          "imageMeta",
          JSON.stringify(
            color.pendingImages.map(
              (
                image
              ) => ({
                name:
                  image.name.trim(),

                alt:
                  image.alt.trim(),

                isDefault:
                  image.isDefault,
              })
            )
          )
        );

        const response =
          await fetch(
            `${API_URL}/api/products/${id}/colors/${encodeURIComponent(
              isColor
                ? color.slugColor
                : "default"
            )}/images`,
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
          await readJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              `Unable to upload ${color.nameColor} images.`
          );
        }
      }

      setUploadMessage(
        ""
      );
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const submit =
    async (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      if (
        saving
      ) {
        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        if (
          !selectedCategories.length
        ) {
          throw new Error(
            "Select at least one category."
          );
        }

        if (
          !colors.length
        ) {
          throw new Error(
            "Product details are required."
          );
        }

        const submitColors =
          isColor
            ? colors
            : colors.slice(
                0,
                1
              );

        const normalizedColors =
          submitColors.map(
            (
              color,
              index
            ) => {
              const nameProduct =
                color.nameProduct.trim();

              const nameColor =
                isColor
                  ? color.nameColor.trim()
                  : "Default";

              if (
                !nameProduct
              ) {
                throw new Error(
                  `${isColor ? `Color ${index + 1}` : "Product"}: product name is required.`
                );
              }

              if (
                isColor &&
                !nameColor
              ) {
                throw new Error(
                  `Color ${index + 1}: color name is required.`
                );
              }

              const slugProduct =
                slugify(
                  color.slugProduct ||
                    nameProduct
                );

              const slugColor =
                isColor
                  ? slugify(
                      color.slugColor ||
                        nameColor
                    )
                  : "default";

              if (
                !slugProduct ||
                !slugColor
              ) {
                throw new Error(
                  `${isColor ? `Color ${index + 1}` : "Product"}: valid slug is required.`
                );
              }

              const sizes =
                color.sizes.map(
                  (
                    size,
                    sizeIndex
                  ) => {
                    const sizeName =
                      String(
                        size.size ||
                          ""
                      )
                        .trim()
                        .toUpperCase();

                    const stock =
                      Number(
                        size.stock
                      );

                    if (
                      !sizeName
                    ) {
                      throw new Error(
                        `${nameColor}: size ${sizeIndex + 1} name is required.`
                      );
                    }

                    if (
                      !Number.isInteger(
                        stock
                      ) ||
                      stock < 0
                    ) {
                      throw new Error(
                        `${isColor ? nameColor : nameProduct} / ${sizeName}: stock must be 0 or greater.`
                      );
                    }

                    const originalPrice =
                      Number(
                        color.samePriceForAllSizes
                          ? color.originalPrice
                          : size.originalPrice
                      );

                    const showPrice =
                      Number(
                        color.samePriceForAllSizes
                          ? color.showPrice
                          : size.showPrice
                      );

                    if (!Number.isFinite(originalPrice) || originalPrice < 0) {
                      throw new Error(
                        `${isColor ? nameColor : nameProduct} / ${sizeName}: original price must be 0 or greater.`
                      );
                    }

                    if (!Number.isFinite(showPrice) || showPrice < 0) {
                      throw new Error(
                        `${isColor ? nameColor : nameProduct} / ${sizeName}: show price must be 0 or greater.`
                      );
                    }

                    if (showPrice > originalPrice) {
                      throw new Error(
                        `${isColor ? nameColor : nameProduct} / ${sizeName}: show price cannot be greater than original price.`
                      );
                    }

                    const discountPrice =
                      Number((originalPrice - showPrice).toFixed(2));

                    return {
                      size:
                        sizeName,

                      stock,

                      originalPrice,

                      showPrice,

                      discountPrice,

                      isActive:
                        size.isActive !==
                        false,
                    };
                  }
                );

              const originalPrice =
                Number(color.originalPrice);

              const showPrice =
                Number(color.showPrice);

              if (!Number.isFinite(originalPrice) || originalPrice < 0) {
                throw new Error(
                  `${isColor ? nameColor : nameProduct}: original price must be 0 or greater.`
                );
              }

              if (!Number.isFinite(showPrice) || showPrice < 0) {
                throw new Error(
                  `${isColor ? nameColor : nameProduct}: show price must be 0 or greater.`
                );
              }

              if (showPrice > originalPrice) {
                throw new Error(
                  `${isColor ? nameColor : nameProduct}: show price cannot be greater than original price.`
                );
              }

              const discountPrice =
                Number((originalPrice - showPrice).toFixed(2));

              return {
                nameProduct,

                slugProduct,

                nameColor,

                slugColor,

                hex:
                  isColor
                    ? color.hex.trim()
                    : "",

                isDefault:
                  isColor
                    ? color.isDefault
                    : true,

                originalPrice,

                showPrice,

                discountPrice,

                shortDescription:
                  color.shortDescription.trim(),

                description:
                  color.description,

                tags:
                  color.tags
                    .split(
                      ","
                    )
                    .map(
                      (
                        tag
                      ) =>
                        tag
                          .trim()
                          .toLowerCase()
                    )
                    .filter(
                      Boolean
                    ),

                seoTitle:
                  color.seoTitle.trim(),

                seoDescription:
                  color.seoDescription.trim(),

                /*
                 * Existing Cloudinary images stay in update payload.
                 * name/alt require backend schema support.
                 */
                images:
                  color.images.map(
                    (
                      image
                    ) => ({
                      url:
                        image.url,

                      publicId:
                        image.publicId,

                      isDefault:
                        image.isDefault ===
                        true,

                      name:
                        image.name?.trim(),

                      alt:
                        image.alt?.trim(),
                    })
                  ),

                sizes,
              };
            }
          );

        const payload =
          {
            categories:
              selectedCategories,

            isColor,

            colors:
              normalizedColors,

            isActive,

            isFeatured,

            isNewLaunch,
          };

        const endpoint =
          isEdit
            ? `${API_URL}/api/products/${productId}`
            : `${API_URL}/api/products`;

        const response =
          await fetch(
            endpoint,
            {
              method:
                isEdit
                  ? "PATCH"
                  : "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const data =
          await readJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to save product."
          );
        }

        const id =
          String(
            data?.product?._id ||
              productId ||
              ""
          );

        if (!id) {
          throw new Error(
            "Product saved but product ID was not returned."
          );
        }

        await uploadPendingImages(
          id
        );

        /*
         * Revoke preview URLs after successful upload.
         */
        for (
          const color
          of colors
        ) {
          for (
            const image
            of color.pendingImages
          ) {
            URL.revokeObjectURL(
              image.previewUrl
            );
          }
        }

        setSuccess(
          isEdit
            ? "Product updated successfully."
            : "Product created successfully."
        );

        if (
          !isEdit
        ) {
          router.push(
            `/admin/products/${id}/edit`
          );

          return;
        }

        router.refresh();
      } catch (
        submitError
      ) {
        setUploadMessage(
          ""
        );

        setError(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to save product."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <div className="min-h-[70vh] bg-[#F6F3EF] px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_24px_70px_rgba(49,31,24,0.08)]">
            <div className="h-3 w-28 rounded-full bg-black/10" />
            <div className="mt-4 h-10 w-72 max-w-full rounded-xl bg-black/10" />
            <div className="mt-3 h-4 w-96 max-w-full rounded-full bg-black/5" />

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                1,
                2,
                3,
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="h-32 rounded-2xl bg-black/[0.04]"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      onSubmit={
        submit
      }
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(140,24,57,0.09),_transparent_28%),linear-gradient(180deg,#F9F7F4_0%,#F4F0EC_100%)] px-4 py-7 md:px-8 md:py-10"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        {/* =================================================
            PREMIUM HEADER
        ================================================= */}

        <div className="overflow-hidden rounded-[30px] border border-white/70 bg-[#201816] text-white shadow-[0_30px_90px_rgba(43,27,22,0.20)]">
          <div className="relative px-6 py-7 md:px-9 md:py-9">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#8C1839]/35 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-72 rounded-full bg-[#C89B6D]/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E6C7D0]">
                  Product Studio
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
                  {isEdit
                    ? "Edit Product"
                    : "Create Product"}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
                  {isColor
                    ? "Build each color as its own storefront-ready product with SEO, premium image gallery, sizes and inventory."
                    : "Build a single no-color product with SEO, premium image gallery, sizes and inventory."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <MiniStat
                  label="Mode"
                  value={
                    isColor
                      ? `${colors.length} Color${colors.length === 1 ? "" : "s"}`
                      : "No Color"
                  }
                />

                <MiniStat
                  label="Images"
                  value={
                    totalImages
                  }
                />

                <MiniStat
                  label="Stock"
                  value={
                    totalStock
                  }
                />

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="ml-0 h-12 rounded-2xl bg-[#F4DCE3] px-6 text-sm font-bold text-[#64142D] shadow-lg transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 lg:ml-2"
                >
                  {saving
                    ? uploadMessage ||
                      "Saving..."
                    : isEdit
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            TOAST ALERTS
        ================================================= */}

        {(error ||
          success ||
          uploadMessage) && (
          <div
            role={
              error
                ? "alert"
                : "status"
            }
            aria-live={
              error
                ? "assertive"
                : "polite"
            }
<<<<<<< HEAD
            className={`fixed right-5 top-7 z-[100] w-[calc(100%-40px)] max-w-sm overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
=======
            className={`fixed right-5 top-7 z-[100] w-[calc(100%-40px)] max-w-sm rounded-2xl border px-5 py-4 text-sm font-semibold shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm ${
>>>>>>> aman
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : uploadMessage
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
<<<<<<< HEAD
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="min-w-0 flex-1 text-sm font-semibold leading-5">
                {error ||
                  uploadMessage ||
                  success}
              </div>

              <button
                type="button"
                aria-label="Close notification"
                title="Close"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setUploadMessage("");
                }}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-lg font-medium leading-none transition ${
                  error
                    ? "border-red-200 bg-white/80 text-red-600 hover:bg-red-100"
                    : uploadMessage
                      ? "border-amber-200 bg-white/80 text-amber-700 hover:bg-amber-100"
                      : "border-emerald-200 bg-white/80 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                ×
              </button>
            </div>
=======
            {error ||
              uploadMessage ||
              success}
>>>>>>> aman
          </div>
        )}

        {/* =================================================
            CATEGORY SECTION
        ================================================= */}

        <SectionCard
          eyebrow="01"
          title="Categories"
          description="Choose one or more categories from the dropdown. Parent and child categories are shown together."
        >
          {categories.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 px-5 py-8 text-center text-sm text-black/45">
              No categories available.
            </div>
          ) : (
            <div className="relative">
              {/* ============================================
                  DROPDOWN BUTTON
              ============================================ */}

              <button
                type="button"
                onClick={() =>
                  setCategoryDropdownOpen(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className={`flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border bg-white px-4 text-left transition ${
                  categoryDropdownOpen
                    ? "border-[#8C1839]/35 ring-4 ring-[#8C1839]/[0.05]"
                    : "border-black/[0.08] hover:border-black/15"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#2A201D]/75">
                    Product Categories
                  </div>

                  <div className="mt-1 truncate text-sm text-[#251C19]">
                    {selectedCategories.length >
                    0
                      ? `${selectedCategories.length} categor${selectedCategories.length === 1 ? "y" : "ies"} selected`
                      : "Select categories"}
                  </div>
                </div>

                <span
                  className={`text-lg text-black/35 transition-transform ${
                    categoryDropdownOpen
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  ⌄
                </span>
              </button>

              {/* ============================================
                  DROPDOWN PANEL
              ============================================ */}

              {categoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_25px_70px_rgba(45,29,23,0.16)]">
                  {/* SEARCH */}

                  <div className="border-b border-black/[0.06] p-3">
                    <div className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-[#FAF8F6] px-3">
                      <span className="text-black/35">
                        ⌕
                      </span>

                      <input
                        type="search"
                        value={
                          categorySearch
                        }
                        onChange={(
                          event
                        ) =>
                          setCategorySearch(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="Search category..."
                        className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/30"
                      />

                      {categorySearch && (
                        <button
                          type="button"
                          onClick={() =>
                            setCategorySearch(
                              ""
                            )
                          }
                          className="grid h-7 w-7 place-items-center rounded-full text-black/35 hover:bg-black/[0.05] hover:text-[#8C1839]"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] text-black/40">
                        {selectedCategories.length} selected
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCategories(
                              categories
                                .map(
                                  (
                                    category
                                  ) =>
                                    String(
                                      category._id ||
                                        category.id ||
                                        ""
                                    )
                                )
                                .filter(
                                  Boolean
                                )
                            )
                          }
                          className="rounded-lg bg-[#FFF4F7] px-3 py-1.5 text-[10px] font-bold text-[#8C1839]"
                        >
                          Select All
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCategories(
                              []
                            )
                          }
                          className="rounded-lg bg-[#F5F2EF] px-3 py-1.5 text-[10px] font-bold text-black/50"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ALL CATEGORIES */}

                  <div className="max-h-80 overflow-y-auto p-2">
                    {filteredCategories.length ===
                    0 ? (
                      <div className="px-4 py-8 text-center text-xs text-black/40">
                        No category found.
                      </div>
                    ) : (
                      filteredCategories.map(
                        (
                          category
                        ) => {
                          const id =
                            String(
                              category._id ||
                                category.id ||
                                ""
                            );

                          const checked =
                            selectedCategories.includes(
                              id
                            );

                          const level =
                            Math.max(
                              0,
                              Number(
                                category.level ||
                                  0
                              )
                            );

                          return (
                            <button
                              key={
                                id
                              }
                              type="button"
                              onClick={() =>
                                toggleCategory(
                                  id
                                )
                              }
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                checked
                                  ? "bg-[#FFF4F7]"
                                  : "hover:bg-[#F8F6F4]"
                              }`}
                            >
                              <span
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-black ${
                                  checked
                                    ? "border-[#8C1839] bg-[#8C1839] text-white"
                                    : "border-black/15 bg-white text-transparent"
                                }`}
                              >
                                ✓
                              </span>

                              <span
                                className="min-w-0 flex-1"
                                style={{
                                  paddingLeft:
                                    `${level * 18}px`,
                                }}
                              >
                                <span className="block truncate text-sm font-semibold text-[#2A211E]">
                                  {
                                    category.name
                                  }
                                </span>

                                <span className="mt-0.5 block truncate text-[10px] text-black/35">
                                  {level ===
                                  0
                                    ? "Main category"
                                    : `Level ${level} category`}
                                  {category.slug
                                    ? ` · ${category.slug}`
                                    : ""}
                                </span>
                              </span>

                              {level >
                                0 && (
                                <span className="rounded-full bg-[#F3EFEC] px-2 py-1 text-[9px] font-semibold text-black/40">
                                  L{
                                    level
                                  }
                                </span>
                              )}
                            </button>
                          );
                        }
                      )
                    )}
                  </div>

                  {/* DONE */}

                  <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] bg-[#FCFAF8] p-3">
                    <span className="text-[10px] text-black/40">
                      Select all categories that apply to this product.
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCategoryDropdownOpen(
                          false
                        )
                      }
                      className="rounded-xl bg-[#211816] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#8C1839]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================
                  SELECTED CATEGORY CHIPS
              ============================================ */}

              {selectedCategoryObjects.length >
                0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedCategoryObjects.map(
                    (
                      category
                    ) => {
                      const id =
                        String(
                          category._id ||
                            category.id ||
                            ""
                        );

                      return (
                        <span
                          key={
                            id
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-[#8C1839]/15 bg-[#FFF6F8] px-3 py-2 text-[11px] font-semibold text-[#7A1734]"
                        >
                          {
                            category.name
                          }

                          <button
                            type="button"
                            onClick={() =>
                              toggleCategory(
                                id
                              )
                            }
                            className="grid h-4 w-4 place-items-center rounded-full bg-[#8C1839]/10 text-[12px] leading-none hover:bg-[#8C1839] hover:text-white"
                            aria-label={`Remove ${category.name}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* =================================================
            PRODUCT TYPE / COLOR MODE
        ================================================= */}

        <SectionCard
          eyebrow="02"
          title="Product Type"
          description="Choose whether this product has selectable color variants or is a single no-color product."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                changeColorMode(
                  true
                )
              }
              className={`group rounded-[22px] border p-5 text-left transition ${
                isColor
                  ? "border-[#8C1839]/25 bg-[#FFF5F8] shadow-[0_12px_35px_rgba(140,24,57,0.08)]"
                  : "border-black/[0.07] bg-white hover:border-black/15"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[#291F1C]">
                    Color Product
                  </div>

                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Multiple colors allowed. Every color can have its own name, SEO, images, sizes and stock.
                  </p>
                </div>

                <span
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    isColor
                      ? "bg-[#8C1839]"
                      : "bg-black/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      isColor
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C1839]">
                Database: isColor = true
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                changeColorMode(
                  false
                )
              }
              className={`group rounded-[22px] border p-5 text-left transition ${
                !isColor
                  ? "border-[#8C1839]/25 bg-[#FFF5F8] shadow-[0_12px_35px_rgba(140,24,57,0.08)]"
                  : "border-black/[0.07] bg-white hover:border-black/15"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[#291F1C]">
                    No Color Product
                  </div>

                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Color controls are hidden. Product name, SEO, images, sizes and stock stay available.
                  </p>
                </div>

                <span
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    !isColor
                      ? "bg-[#8C1839]"
                      : "bg-black/10"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      !isColor
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C1839]">
                Database: isColor = false
              </div>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[#E5D7DC] bg-[#FFF9FB] px-4 py-3 text-xs leading-5 text-[#704957]">
            <strong>
              {isColor
                ? "Color mode:"
                : "No Color mode:"}
            </strong>{" "}
            {isColor
              ? "Customers can select colors on the storefront."
              : "The form keeps one internal default details block only for storing product content; the storefront must not show a color selector."}
          </div>
        </SectionCard>

        {/* =================================================
            COLOR / PRODUCT DETAILS
        ================================================= */}

        <SectionCard
          eyebrow="03"
          title={
            isColor
              ? "Color Products"
              : "Product Details"
          }
          description={
            isColor
              ? "Every color can have a unique product name, slug, SEO copy, images and stock."
              : "No color selector will be shown. Manage the product name, SEO, gallery, sizes and stock here."
          }
          action={
            isColor ? (
              <button
                type="button"
                onClick={
                  addColor
                }
                className="rounded-2xl border border-[#8C1839]/15 bg-[#FFF7F9] px-4 py-2.5 text-xs font-bold text-[#7A1734] transition hover:bg-[#FCECF1]"
              >
                + Add Color
              </button>
            ) : null
          }
        >
          <div className="space-y-7">
            {visibleColors.map(
              (
                color,
                colorIndex
              ) => (
                <div
                  key={
                    colorIndex
                  }
                  className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-[#FBF9F7] shadow-[0_16px_45px_rgba(44,29,23,0.05)]"
                >
                  {/* COLOR HEADER */}

                  <div className="flex flex-col gap-4 border-b border-black/[0.06] bg-white px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
                    <div className="flex items-center gap-3">
                      {isColor ? (
                        <div
                          className="h-11 w-11 rounded-2xl border border-black/10 shadow-inner"
                          style={{
                            backgroundColor:
                              color.hex ||
                              "#000000",
                          }}
                        />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F8E8ED] text-lg text-[#8C1839]">
                          ◇
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[#241B18]">
                            {isColor
                              ? color.nameColor ||
                                `Color ${colorIndex + 1}`
                              : color.nameProduct ||
                                "No Color Product"}
                          </h3>

                          <span className="rounded-full bg-[#FBE8EE] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C1839]">
                            {isColor
                              ? color.isDefault
                                ? "Default"
                                : "Color"
                              : "No Color"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-black/40">
                          {isColor
                            ? `Color variant ${colorIndex + 1}`
                            : "Single product · no customer color selector"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isColor && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              makeDefaultColor(
                                colorIndex
                              )
                            }
                            className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-xs font-semibold text-black/65 transition hover:border-[#8C1839]/25 hover:text-[#8C1839]"
                          >
                            Set default
                          </button>

                          {colors.length >
                            1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeColor(
                                  colorIndex
                                )
                              }
                              className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Remove color
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        aria-expanded={
                          expandedColorIndexes.includes(
                            colorIndex
                          )
                        }
                        aria-controls={`product-color-details-${colorIndex}`}
                        onClick={() =>
                          toggleColorExpanded(
                            colorIndex
                          )
                        }
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                          expandedColorIndexes.includes(
                            colorIndex
                          )
                            ? "border-[#8C1839]/20 bg-[#FFF4F7] text-[#8C1839]"
                            : "border-black/[0.08] bg-white text-black/65 hover:border-[#8C1839]/25 hover:bg-[#FFF7F9] hover:text-[#8C1839]"
                        }`}
                      >
                        {expandedColorIndexes.includes(
                          colorIndex
                        )
                          ? "Collapse"
                          : "Expand"}

                        <span
                          aria-hidden="true"
                          className={`text-sm leading-none transition-transform duration-200 ${
                            expandedColorIndexes.includes(
                              colorIndex
                            )
                              ? "rotate-180"
                              : ""
                          }`}
                        >
                          ⌄
                        </span>
                      </button>
                    </div>
                  </div>

                  <div
                    id={`product-color-details-${colorIndex}`}
                    hidden={
                      !expandedColorIndexes.includes(
                        colorIndex
                      )
                    }
                    className="p-5 md:p-6"
                  >
                    {/* PRODUCT IDENTITY */}

                    <SubHeading
                      title="Product identity"
                      description="Name and slug shown on storefront and used in product URLs."
                    />

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field
                        label="Product Name"
                        required
                      >
                        <input
                          className={
                            inputClass
                          }
                          value={
                            color.nameProduct
                          }
                          placeholder="Black Bikini Panty For Women"
                          onChange={(
                            event
                          ) => {
                            const nextName =
                              event
                                .target
                                .value;

                            updateColor(
                              colorIndex,
                              {
                                nameProduct:
                                  nextName,

                                slugProduct:
                                  color.productSlugManuallyEdited
                                    ? color.slugProduct
                                    : slugify(
                                        nextName
                                      ),
                              }
                            );
                          }}
                        />
                      </Field>

                      <Field
                        label="Product Slug"
                        hint={
                          isEdit
                            ? "Existing URL stays unchanged when the name changes. Edit this field only when you intentionally want to change the URL."
                            : "Generated from the product name automatically. You can type a custom slug manually."
                        }
                      >
                        <input
                          className={
                            inputClass
                          }
                          value={
                            color.slugProduct
                          }
                          placeholder="black-bikini-panty-for-women"
                          onChange={(
                            event
                          ) => {
                            const rawValue =
                              event.target.value;

                            const hasManualValue =
                              rawValue.trim().length > 0;

                            updateColor(
                              colorIndex,
                              {
                                slugProduct:
                                  hasManualValue
                                    ? slugify(rawValue)
                                    : slugify(
                                        color.nameProduct
                                      ),

                                productSlugManuallyEdited:
                                  hasManualValue,
                              }
                            );
                          }}
                        />
                      </Field>

                      {isColor && (
                        <>
                          <Field
                            label="Color Name"
                            required
                          >
                            <input
                              className={
                                inputClass
                              }
                              value={
                                color.nameColor
                              }
                              placeholder="Black"
                              onChange={(
                                event
                              ) => {
                                const nextName =
                                  event
                                    .target
                                    .value;

                                updateColor(
                                  colorIndex,
                                  {
                                    nameColor:
                                      nextName,

                                    slugColor:
                                      color.colorSlugManuallyEdited
                                        ? color.slugColor
                                        : slugify(
                                            nextName
                                          ),
                                  }
                                );
                              }}
                            />
                          </Field>

                          <Field
                            label="Color Slug"
                          >
                            <input
                              className={
                                inputClass
                              }
                              value={
                                color.slugColor
                              }
                              placeholder="black"
                              onChange={(
                                event
                              ) => {
                                const rawValue =
                                  event.target.value;

                                const hasManualValue =
                                  rawValue.trim().length > 0;

                                updateColor(
                                  colorIndex,
                                  {
                                    slugColor:
                                      hasManualValue
                                        ? slugify(rawValue)
                                        : slugify(
                                            color.nameColor
                                          ),

                                    colorSlugManuallyEdited:
                                      hasManualValue,
                                  }
                                );
                              }}
                            />
                          </Field>

                          <Field
                            label="Color"
                            hint="Choose color visually or enter HEX."
                          >
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={
                                  /^#[0-9a-fA-F]{6}$/.test(
                                    color.hex
                                  )
                                    ? color.hex
                                    : "#000000"
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateColor(
                                    colorIndex,
                                    {
                                      hex:
                                        event
                                          .target
                                          .value,
                                    }
                                  )
                                }
                                className="h-12 w-14 cursor-pointer rounded-xl border border-black/[0.08] bg-white p-1.5"
                              />

                              <input
                                className={
                                  inputClass
                                }
                                value={
                                  color.hex
                                }
                                placeholder="#000000"
                                onChange={(
                                  event
                                ) =>
                                  updateColor(
                                    colorIndex,
                                    {
                                      hex:
                                        event
                                          .target
                                          .value,
                                    }
                                  )
                                }
                              />
                            </div>
                          </Field>
                        </>
                      )}

                      <Field
                        label="Tags"
                        hint="Separate tags with commas."
                      >
                        <input
                          className={
                            inputClass
                          }
                          value={
                            color.tags
                          }
                          placeholder="women, panty, black panty"
                          onChange={(
                            event
                          ) =>
                            updateColor(
                              colorIndex,
                              {
                                tags:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </Field>
                    </div>

                    {/* PRODUCT PRICING */}

                    <Divider />

                    <SubHeading
                      title="Product Pricing"
                      description="Default price for this color/product. Size-specific prices below can override it."
                    />

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <Field label="Original Price" required hint="MRP / original amount">
                        <input
                          className={inputClass}
                          type="number"
                          min={0}
                          step="0.01"
                          value={color.originalPrice}
                          placeholder="499"
                          onChange={(event) => {
                            const originalPrice = event.target.value;
                            const original = Number(originalPrice || 0);
                            const show = Number(color.showPrice || 0);
                            const discountPrice =
                              Math.max(0, original - show);

                            updateColor(colorIndex, {
                              originalPrice,
                              discountPrice,
                              ...(color.samePriceForAllSizes
                                ? {
                                    sizes: color.sizes.map((size) => ({
                                      ...size,
                                      originalPrice,
                                      showPrice: color.showPrice,
                                      discountPrice,
                                    })),
                                  }
                                : {}),
                            });
                          }}
                        />
                      </Field>

                      <Field label="Show Price" required hint="Customer ko dikhne wali selling price">
                        <input
                          className={inputClass}
                          type="number"
                          min={0}
                          step="0.01"
                          value={color.showPrice}
                          placeholder="399"
                          onChange={(event) => {
                            const showPrice = event.target.value;
                            const original = Number(color.originalPrice || 0);
                            const show = Number(showPrice || 0);
                            const discountPrice =
                              Math.max(0, original - show);

                            updateColor(colorIndex, {
                              showPrice,
                              discountPrice,
                              ...(color.samePriceForAllSizes
                                ? {
                                    sizes: color.sizes.map((size) => ({
                                      ...size,
                                      originalPrice: color.originalPrice,
                                      showPrice,
                                      discountPrice,
                                    })),
                                  }
                                : {}),
                            });
                          }}
                        />
                      </Field>

                      <Field label="Discount Price" hint="Auto: Original Price - Show Price">
                        <input
                          className={`${inputClass} bg-[#F7F5F3]`}
                          type="number"
                          readOnly
                          value={Number(color.discountPrice || 0)}
                        />
                      </Field>
                    </div>

                    {/* CONTENT */}

                    <Divider />

                    <SubHeading
                      title="Content"
                      description="Short copy for cards and full HTML description for the product detail page."
                    />

                    <div className="mt-4 grid gap-4">
                      <Field
                        label="Short Description"
                        hint={`${color.shortDescription.length}/1000 characters`}
                      >
                        <textarea
                          className={`${inputClass} min-h-28 resize-y py-3 leading-6`}
                          maxLength={
                            1000
                          }
                          value={
                            color.shortDescription
                          }
                          placeholder="Short premium product summary..."
                          onChange={(
                            event
                          ) =>
                            updateColor(
                              colorIndex,
                              {
                                shortDescription:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </Field>

                      <Field
                        label="Description"
                        hint="HTML supported by your backend sanitizer."
                      >
                        <textarea
                          className={`${inputClass} min-h-52 resize-y py-3 font-mono text-xs leading-6`}
                          value={
                            color.description
                          }
                          placeholder="<p>Full product description...</p>"
                          onChange={(
                            event
                          ) =>
                            updateColor(
                              colorIndex,
                              {
                                description:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </Field>
                    </div>

                    {/* SEO */}

                    <Divider />

                    <SubHeading
                      title="Search & SEO"
                      description="Metadata used for search engines and social/product snippets."
                    />

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field
                        label="SEO Title"
                        hint={`${color.seoTitle.length}/200`}
                      >
                        <input
                          className={
                            inputClass
                          }
                          maxLength={
                            200
                          }
                          value={
                            color.seoTitle
                          }
                          placeholder="Black Bikini Panty For Women"
                          onChange={(
                            event
                          ) =>
                            updateColor(
                              colorIndex,
                              {
                                seoTitle:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </Field>

                      <Field
                        label="SEO Description"
                        hint={`${color.seoDescription.length}/1000`}
                      >
                        <textarea
                          className={`${inputClass} min-h-24 resize-y py-3`}
                          maxLength={
                            1000
                          }
                          value={
                            color.seoDescription
                          }
                          placeholder="Search-friendly description..."
                          onChange={(
                            event
                          ) =>
                            updateColor(
                              colorIndex,
                              {
                                seoDescription:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        />
                      </Field>
                    </div>

                    {/* IMAGE STUDIO */}

                    <Divider />

                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <SubHeading
                        title="Image Studio"
<<<<<<< HEAD
                        description="Preview before upload, assign image name and ALT text, choose the primary image, and set the photo index. Index 1 is stored first."
=======
                        description="Preview before upload, assign image name and ALT text, and choose the primary image."
>>>>>>> aman
                      />

                      <label className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#211816] px-5 py-3 text-xs font-bold text-white shadow-lg transition hover:-translate-y-0.5">
                        <span className="relative z-10">
                          + Choose Images
                        </span>

                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          onChange={(
                            event
                          ) => {
                            addPendingImages(
                              colorIndex,
                              event
                                .target
                                .files
                            );

                            event.currentTarget.value =
                              "";
                          }}
                        />
                      </label>
                    </div>

                    {color.images
                      .length ===
                      0 &&
                    color
                      .pendingImages
                      .length ===
                      0 ? (
                      <label className="mt-5 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#8C1839]/20 bg-[linear-gradient(145deg,#FFF9FB,#FFFFFF)] px-6 text-center transition hover:border-[#8C1839]/40 hover:bg-[#FFF7FA]">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F8E8ED] text-2xl">
                          ↑
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#2B201D]">
                          Upload product photos
                        </p>

                        <p className="mt-1 max-w-md text-xs leading-5 text-black/45">
                          JPG, PNG, WEBP or AVIF. You will see an instant preview before the image is uploaded.
                        </p>

                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          onChange={(
                            event
                          ) => {
                            addPendingImages(
                              colorIndex,
                              event
                                .target
                                .files
                            );

                            event.currentTarget.value =
                              "";
                          }}
                        />
                      </label>
                    ) : (
                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {/* EXISTING IMAGES */}

                        {color.images.map(
                          (
                            image
                          ) => (
                            <ImageEditorCard
                              key={
                                image.publicId
                              }
                              src={
                                image.url
                              }
                              badge="Uploaded"
                              isDefault={
                                image.isDefault ===
                                true
                              }
                              name={
                                image.name ||
                                ""
                              }
                              alt={
                                image.alt ||
                                ""
                              }
                              publicId={
                                image.publicId
                              }
                              onNameChange={(
                                value
                              ) =>
                                updateExistingImageMeta(
                                  colorIndex,
                                  image.publicId,
                                  {
                                    name:
                                      value,
                                  }
                                )
                              }
                              onAltChange={(
                                value
                              ) =>
                                updateExistingImageMeta(
                                  colorIndex,
                                  image.publicId,
                                  {
                                    alt:
                                      value,
                                  }
                                )
                              }
                              onDefault={() =>
                                void setDefaultImage(
                                  colorIndex,
                                  image
                                )
                              }
                              onDelete={() =>
                                void deleteExistingImage(
                                  colorIndex,
                                  image
                                )
                              }
                            />
                          )
                        )}

                        {/* LOCAL PREVIEW IMAGES */}

                        {color.pendingImages.map(
                          (
<<<<<<< HEAD
                            image,
                            imageIndex
=======
                            image
>>>>>>> aman
                          ) => (
                            <ImageEditorCard
                              key={
                                image.id
                              }
                              src={
                                image.previewUrl
                              }
                              badge="Preview · Not uploaded yet"
                              isDefault={
                                image.isDefault
                              }
                              name={
                                image.name
                              }
                              alt={
                                image.alt
                              }
                              fileInfo={`${(
                                image.file
                                  .size /
                                1024 /
                                1024
                              ).toFixed(
                                2
                              )} MB · ${image.file.type}`}
<<<<<<< HEAD
                              position={
                                imageIndex +
                                1
                              }
                              maxPosition={
                                color
                                  .pendingImages
                                  .length
                              }
                              onPositionChange={(
                                position
                              ) =>
                                movePendingImageToPosition(
                                  colorIndex,
                                  image.id,
                                  position
                                )
                              }
=======
>>>>>>> aman
                              onNameChange={(
                                value
                              ) =>
                                updatePendingImage(
                                  colorIndex,
                                  image.id,
                                  {
                                    name:
                                      value,
                                  }
                                )
                              }
                              onAltChange={(
                                value
                              ) =>
                                updatePendingImage(
                                  colorIndex,
                                  image.id,
                                  {
                                    alt:
                                      value,
                                  }
                                )
                              }
                              onDefault={() =>
                                setDefaultPendingImage(
                                  colorIndex,
                                  image.id
                                )
                              }
                              onDelete={() =>
                                removePendingImage(
                                  colorIndex,
                                  image.id
                                )
                              }
                            />
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl border border-[#D9C7CE] bg-[#FFF9FB] px-4 py-3 text-xs leading-5 text-[#704957]">
                      <strong>
                        SEO image tip:
                      </strong>{" "}
                      Image ALT should describe the actual photo, for example{" "}
                      <span className="font-semibold">
                        “Black Bikini Panty For Women front view”
                      </span>
                      . Avoid keyword stuffing.
                    </div>

                    {/* SIZES */}

                    <Divider />

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <SubHeading
                        title="Sizes & Inventory"
                        description="Size and stock are always separate. Turn on Same Price to use Product Pricing for every size."
                      />

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                            color.samePriceForAllSizes
                              ? "border-[#8C1839]/20 bg-[#FFF5F8]"
                              : "border-black/[0.08] bg-white"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-[#2A201D]">
                              Same Price for All Sizes
                            </div>
                            <div className="mt-0.5 text-[10px] text-black/40">
                              {color.samePriceForAllSizes
                                ? "ON · Product price applies to every size"
                                : "OFF · Set price separately for each size"}
                            </div>
                          </div>

                          <span
                            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                              color.samePriceForAllSizes
                                ? "bg-[#8C1839]"
                                : "bg-black/10"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={color.samePriceForAllSizes}
                              onChange={(event) =>
                                setSamePriceForAllSizes(
                                  colorIndex,
                                  event.target.checked
                                )
                              }
                              className="sr-only"
                            />
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                                color.samePriceForAllSizes
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            addSize(
                              colorIndex
                            )
                          }
                          className="rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-xs font-bold text-black/65 transition hover:border-[#8C1839]/20 hover:text-[#8C1839]"
                        >
                          + Add Size
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {color.sizes.map(
                        (
                          size,
                          sizeIndex
                        ) => (
                          <div
                            key={
                              size._id ||
                              sizeIndex
                            }
                            className="grid gap-3 rounded-2xl border border-black/[0.07] bg-white p-3 lg:grid-cols-[0.7fr_0.8fr_1fr_1fr_1fr_auto_auto] lg:items-end"
                          >
                            <Field label="Size">
                              <input
                                className={
                                  inputClass
                                }
                                placeholder="Size (S / M / L)"
                                value={
                                  size.size
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateSize(
                                    colorIndex,
                                    sizeIndex,
                                    {
                                      size:
                                        event
                                          .target
                                          .value
                                          .toUpperCase(),
                                    }
                                  )
                                }
                              />
                            </Field>

                            <Field label="Stock">
                              <input
                                className={
                                  inputClass
                                }
                                type="number"
                                min={
                                  0
                                }
                                step={
                                  1
                                }
                                placeholder="Stock"
                                value={
                                  size.stock
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateSize(
                                    colorIndex,
                                    sizeIndex,
                                    {
                                      stock:
                                        event
                                          .target
                                          .value,
                                    }
                                  )
                                }
                              />
                            </Field>

                            <Field
                              label="Original Price"
                              hint={
                                color.samePriceForAllSizes
                                  ? "Same for all"
                                  : undefined
                              }
                            >
                              <input
                                className={`${inputClass} ${
                                  color.samePriceForAllSizes
                                    ? "cursor-not-allowed bg-[#F7F5F3] text-black/55"
                                    : ""
                                }`}
                                type="number"
                                min={0}
                                step="0.01"
                                readOnly={color.samePriceForAllSizes}
                                placeholder="Original Price"
                                value={
                                  color.samePriceForAllSizes
                                    ? color.originalPrice
                                    : size.originalPrice
                                }
                                onChange={(event) => {
                                  if (color.samePriceForAllSizes) {
                                    return;
                                  }

                                  const originalPrice = event.target.value;
                                  const original = Number(originalPrice || 0);
                                  const show = Number(size.showPrice || 0);
                                  updateSize(colorIndex, sizeIndex, {
                                    originalPrice,
                                    discountPrice: Math.max(0, original - show),
                                  });
                                }}
                              />
                            </Field>

                            <Field
                              label="Show Price"
                              hint={
                                color.samePriceForAllSizes
                                  ? "Same for all"
                                  : undefined
                              }
                            >
                              <input
                                className={`${inputClass} ${
                                  color.samePriceForAllSizes
                                    ? "cursor-not-allowed bg-[#F7F5F3] text-black/55"
                                    : ""
                                }`}
                                type="number"
                                min={0}
                                step="0.01"
                                readOnly={color.samePriceForAllSizes}
                                placeholder="Show Price"
                                value={
                                  color.samePriceForAllSizes
                                    ? color.showPrice
                                    : size.showPrice
                                }
                                onChange={(event) => {
                                  if (color.samePriceForAllSizes) {
                                    return;
                                  }

                                  const showPrice = event.target.value;
                                  const original = Number(size.originalPrice || 0);
                                  const show = Number(showPrice || 0);
                                  updateSize(colorIndex, sizeIndex, {
                                    showPrice,
                                    discountPrice: Math.max(0, original - show),
                                  });
                                }}
                              />
                            </Field>

                            <Field label="Discount">
                              <input
                                className={`${inputClass} bg-[#F7F5F3]`}
                                type="number"
                                readOnly
                                placeholder="Discount"
                                value={
                                  color.samePriceForAllSizes
                                    ? Number(color.discountPrice || 0)
                                    : Number(size.discountPrice || 0)
                                }
                              />
                            </Field>

                            <label className="flex items-center gap-2 rounded-xl bg-[#F7F5F3] px-3 py-3 text-xs font-semibold text-black/60">
                              <input
                                type="checkbox"
                                checked={
                                  size.isActive !==
                                  false
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateSize(
                                    colorIndex,
                                    sizeIndex,
                                    {
                                      isActive:
                                        event
                                          .target
                                          .checked,
                                    }
                                  )
                                }
                                className="accent-[#8C1839]"
                              />

                              Active
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                removeSize(
                                  colorIndex,
                                  sizeIndex
                                )
                              }
                              className="rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-xs font-semibold text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <div className="rounded-full bg-[#EEE8E3] px-3 py-1.5 text-[11px] font-semibold text-black/50">
                        Color stock:{" "}
                        {color.sizes.reduce(
                          (
                            total,
                            size
                          ) =>
                            total +
                            Math.max(
                              0,
                              Number(
                                size.stock ||
                                  0
                              )
                            ),
                          0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </SectionCard>

        {/* =================================================
            PUBLISHING
        ================================================= */}

        <SectionCard
          eyebrow="04"
          title="Publishing"
          description="Control where this product appears across the storefront."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Toggle
              label="Active"
              description="Visible on the live storefront."
              checked={
                isActive
              }
              onChange={
                setIsActive
              }
            />

            <Toggle
              label="Featured"
              description="Show in featured product sections."
              checked={
                isFeatured
              }
              onChange={
                setIsFeatured
              }
            />

            <Toggle
              label="New Launch"
              description="Show in new-launch collections."
              checked={
                isNewLaunch
              }
              onChange={
                setIsNewLaunch
              }
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryBox
              label="Color Mode"
              value={
                isColor
                  ? `${colors.length} color${colors.length === 1 ? "" : "s"}`
                  : "No Color"
              }
            />

            <SummaryBox
              label="Total Images"
              value={
                totalImages
              }
            />

            <SummaryBox
              label="Total Stock"
              value={
                totalStock
              }
            />
          </div>
        </SectionCard>

        {/* =================================================
            BOTTOM ACTION BAR
        ================================================= */}

        <div className="sticky bottom-4 z-30 mt-6">
          <div className="flex flex-col gap-3 rounded-[22px] border border-white/80 bg-white/90 p-3 shadow-[0_20px_70px_rgba(45,29,23,0.16)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="px-2 text-xs text-black/45">
              {saving
                ? uploadMessage ||
                  "Saving product..."
                : "Review product details, image ALT tags and stock before publishing."}
            </div>

            <button
              type="submit"
              disabled={
                saving
              }
              className="h-12 rounded-2xl bg-[#8C1839] px-8 text-sm font-bold text-white shadow-[0_10px_30px_rgba(140,24,57,0.22)] transition hover:-translate-y-0.5 hover:bg-[#77132F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* =========================================================
   IMAGE EDITOR CARD
========================================================= */

function ImageEditorCard({
  src,
  badge,
  isDefault,
  name,
  alt,
  publicId,
  fileInfo,
<<<<<<< HEAD
  position,
  maxPosition,
  onPositionChange,
=======
>>>>>>> aman
  onNameChange,
  onAltChange,
  onDefault,
  onDelete,
}: {
  src: string;
  badge: string;
  isDefault: boolean;
  name: string;
  alt: string;
  publicId?: string;
  fileInfo?: string;
<<<<<<< HEAD
  position?: number;
  maxPosition?: number;
  onPositionChange?:
    (position: number) =>
      void;
=======
>>>>>>> aman

  onNameChange:
    (value: string) =>
      void;

  onAltChange:
    (value: string) =>
      void;

  onDefault:
    () => void;

  onDelete:
    () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-black/[0.07] bg-white shadow-[0_12px_32px_rgba(45,29,23,0.06)]">
      <div className="relative bg-[#EEEAE6]">
        <img
          src={
            src
          }
          alt={
            alt ||
            name ||
            "Product preview"
          }
          className="aspect-[4/5] w-full object-cover"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {
              badge
            }
          </span>

          {isDefault && (
            <span className="rounded-full bg-[#8C1839] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg">
              Main image
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <Field
          label="Image Name"
          hint="Readable internal/SEO-friendly image name."
        >
          <input
            className={
              smallInputClass
            }
            value={
              name
            }
            placeholder="Black bikini panty front view"
            onChange={(
              event
            ) =>
              onNameChange(
                event
                  .target
                  .value
              )
            }
          />
        </Field>

        <Field
          label="Image ALT Tag"
          hint={`${alt.length}/160 · Used by accessibility and image SEO.`}
        >
          <textarea
            className={`${smallInputClass} min-h-20 resize-y py-2.5 leading-5`}
            maxLength={
              160
            }
            value={
              alt
            }
            placeholder="Black Bikini Panty For Women front view"
            onChange={(
              event
            ) =>
              onAltChange(
                event
                  .target
                  .value
              )
            }
          />
        </Field>

<<<<<<< HEAD
        {typeof position ===
          "number" &&
          typeof maxPosition ===
            "number" &&
          onPositionChange && (
            <Field
              label="Photo Index"
              hint={`1-${maxPosition} · This controls the saved/upload order.`}
            >
              <input
                type="number"
                min={1}
                max={
                  maxPosition
                }
                step={1}
                className={
                  smallInputClass
                }
                value={
                  position
                }
                onChange={(
                  event
                ) =>
                  onPositionChange(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
              />
            </Field>
          )}

=======
>>>>>>> aman
        {(fileInfo ||
          publicId) && (
          <div className="rounded-xl bg-[#F8F6F4] px-3 py-2 text-[10px] leading-4 text-black/40">
            {fileInfo ||
              publicId}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={
              onDefault
            }
            className={`flex-1 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition ${
              isDefault
                ? "border-[#8C1839]/20 bg-[#FFF4F7] text-[#8C1839]"
                : "border-black/[0.08] text-black/55 hover:border-[#8C1839]/20 hover:text-[#8C1839]"
            }`}
          >
            {isDefault
              ? "✓ Main Image"
              : "Set Main"}
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description:
    string;
  action?:
    ReactNode;
  children:
    ReactNode;
}) {
  return (
    <section className="mt-6 rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-[0_24px_70px_rgba(45,29,23,0.07)] md:p-7">
      <div className="mb-5 flex flex-col gap-4 border-b border-black/[0.06] pb-5 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F8E8ED] text-[11px] font-black text-[#8C1839]">
            {
              eyebrow
            }
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#251C19]">
              {
                title
              }
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-5 text-black/45">
              {
                description
              }
            </p>
          </div>
        </div>

        {
          action
        }
      </div>

      {
        children
      }
    </section>
  );
}

function SubHeading({
  title,
  description,
}: {
  title: string;
  description:
    string;
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-[#2B211E]">
        {
          title
        }
      </h4>

      <p className="mt-1 text-xs leading-5 text-black/40">
        {
          description
        }
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-7 h-px bg-black/[0.06]" />
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children:
    ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-[#2A201D]/75">
          {
            label
          }

          {required && (
            <span className="ml-1 text-[#8C1839]">
              *
            </span>
          )}
        </span>

        {hint && (
          <span className="text-right text-[10px] leading-4 text-black/35">
            {
              hint
            }
          </span>
        )}
      </div>

      {
        children
      }
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description:
    string;
  checked: boolean;
  onChange:
    (
      value: boolean
    ) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition ${
        checked
          ? "border-[#8C1839]/20 bg-[#FFF7F9]"
          : "border-black/[0.07] bg-white"
      }`}
    >
      <div>
        <div className="text-sm font-bold text-[#2A201D]">
          {
            label
          }
        </div>

        <p className="mt-1 text-xs leading-5 text-black/40">
          {
            description
          }
        </p>
      </div>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#8C1839]"
            : "bg-black/10"
        }`}
      >
        <input
          type="checkbox"
          checked={
            checked
          }
          onChange={(
            event
          ) =>
            onChange(
              event
                .target
                .checked
            )
          }
          className="sr-only"
        />

        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </label>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value:
    string | number;
}) {
  return (
    <div className="min-w-[82px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 backdrop-blur">
      <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">
        {
          label
        }
      </div>

      <div className="mt-0.5 text-lg font-semibold">
        {
          value
        }
      </div>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value:
    number | string;
}) {
  return (
    <div className="rounded-2xl bg-[#F7F4F1] px-4 py-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/35">
        {
          label
        }
      </div>

      <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#2A201D]">
        {
          value
        }
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const inputClass =
  "min-h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 text-sm text-[#251C19] outline-none transition placeholder:text-black/25 focus:border-[#8C1839]/35 focus:ring-4 focus:ring-[#8C1839]/[0.05]";

const smallInputClass =
  "min-h-10 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-[#251C19] outline-none transition placeholder:text-black/25 focus:border-[#8C1839]/35 focus:ring-4 focus:ring-[#8C1839]/[0.05]";
