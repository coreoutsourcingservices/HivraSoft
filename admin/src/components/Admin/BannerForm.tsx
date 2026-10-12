"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  BANNER_SECTIONS,
} from "@/lib/banner";

import {
  FlatCategoryOption,
  ProductOption,
  flattenCategories,
} from "@/lib/banner-admin";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

type Mode =
  | "create"
  | "edit";

type MediaType =
  | "image"
  | "video";

type LinkType =
  | "none"
  | "custom"
  | "category"
  | "product";

type RefValue =
  | string
  | {
      _id: string;
      name?: string;
      slug?: string;
    }
  | null
  | undefined;

interface BannerMediaApiItem {
  url: string;
  publicId: string;
  alt?: string;

  title: string;
  subtitle: string;
  description: string;
  buttonText: string;

  linkType: LinkType;
  customLink: string;
  category: RefValue;
  product: RefValue;
  openInNewTab: boolean;

  poster?: {
    url: string;
    publicId: string;
  };

  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

interface BannerApiData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  mediaType: MediaType;
  images: BannerMediaApiItem[];
  videos: BannerMediaApiItem[];
  position: string;
  device:
    | "all"
    | "desktop"
    | "mobile";
  sortOrder: number;
  isActive: boolean;
}

interface MediaItemForm {
  key: string;

  existing: boolean;
  publicId?: string;
  url?: string;

  file?: File;
  previewUrl?: string;

  alt: string;

  title: string;
  subtitle: string;
  description: string;
  buttonText: string;

  linkType: LinkType;
  customLink: string;
  category: string;
  product: string;
  openInNewTab: boolean;

  posterUrl?: string;
  posterFile?: File;
  posterPreviewUrl?: string;

  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
}

interface BannerFormProps {
  mode: Mode;
  bannerId?: string;
  initialPosition?: string | null;
}

const getRefId = (
  value: RefValue
): string => {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return value._id || "";
};

const createKey = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

const makeBlankMediaItem = (
  file: File,
  mediaType: MediaType
): MediaItemForm => ({
  key: createKey(),

  existing: false,
  file,
  previewUrl:
    URL.createObjectURL(file),

  alt:
    mediaType === "image"
      ? file.name
      : "",

  title: "",
  subtitle: "",
  description: "",
  buttonText: "Shop Now",

  linkType: "none",
  customLink: "",
  category: "",
  product: "",
  openInNewTab: false,

  autoplay: true,
  muted: true,
  loop: true,
  controls: false,
});

const apiItemToForm = (
  item: BannerMediaApiItem,
  mediaType: MediaType
): MediaItemForm => ({
  key:
    item.publicId ||
    createKey(),

  existing: true,
  publicId:
    item.publicId,
  url: item.url,

  alt:
    item.alt || "",

  title:
    item.title || "",
  subtitle:
    item.subtitle || "",
  description:
    item.description || "",
  buttonText:
    item.buttonText ||
    "Shop Now",

  linkType:
    item.linkType ||
    "none",
  customLink:
    item.customLink || "",
  category:
    getRefId(
      item.category
    ),
  product:
    getRefId(
      item.product
    ),
  openInNewTab:
    item.openInNewTab ??
    false,

  posterUrl:
    item.poster?.url,

  autoplay:
    mediaType === "video"
      ? item.autoplay ?? true
      : true,
  muted:
    mediaType === "video"
      ? item.muted ?? true
      : true,
  loop:
    mediaType === "video"
      ? item.loop ?? true
      : true,
  controls:
    mediaType === "video"
      ? item.controls ?? false
      : false,
});

export default function BannerForm({
  mode,
  bannerId,
  initialPosition,
}: BannerFormProps) {
  const router =
    useRouter();

  const [form, setForm] =
    useState({
      title: "",
      slug: "",
      description: "",

      mediaType:
        "image" as MediaType,

      position:
        initialPosition ===
          "home_middle" ||
        initialPosition ===
          "home_bottom" ||
        initialPosition ===
          "home_hero"
          ? initialPosition
          : "home_hero",

      device:
        "all" as
          | "all"
          | "desktop"
          | "mobile",

      sortOrder: 0,
      isActive: true,
    });

  const [mediaItems, setMediaItems] =
    useState<MediaItemForm[]>(
      []
    );

  const [categories, setCategories] =
    useState<FlatCategoryOption[]>(
      []
    );

  const [products, setProducts] =
    useState<ProductOption[]>(
      []
    );

  const [loading, setLoading] =
    useState(
      mode === "edit"
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ======================================================
     OPTIONS + EDIT BANNER LOAD
  ====================================================== */

  useEffect(() => {
    const load = async () => {
      try {
        setError("");

        const requests: Promise<Response>[] = [
          fetch(
            `${API_URL}/api/categories/active`,
            {
              credentials:
                "include",
              cache:
                "no-store",
            }
          ),

          fetch(
            `${API_URL}/api/products/catalog`,
            {
              credentials:
                "include",
              cache:
                "no-store",
            }
          ),
        ];

        if (
          mode === "edit"
        ) {
          if (!bannerId) {
            throw new Error(
              "Banner ID is required."
            );
          }

          requests.push(
            fetch(
              `${API_URL}/api/banners/${bannerId}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            )
          );
        }

        const responses =
          await Promise.all(
            requests
          );

        const categoryResult =
          await responses[0].json();

        const productResult =
          await responses[1].json();

        if (
          !responses[0].ok
        ) {
          throw new Error(
            categoryResult.message ||
              "Unable to load categories."
          );
        }

        if (
          !responses[1].ok
        ) {
          throw new Error(
            productResult.message ||
              "Unable to load products."
          );
        }

        /*
          IMPORTANT:

          Tumhare existing APIs ka response shape:

          GET /api/categories/active
          { success, count, categories: [...] }

          GET /api/products/catalog
          { success, count, products: [...] }

          Isliye sirf result.data read karne par dropdown empty tha.
          Neeche dono response shapes support kiye hain.
        */

        const categoryRows =
          Array.isArray(
            categoryResult.categories
          )
            ? categoryResult.categories
            : Array.isArray(
                categoryResult.data
              )
              ? categoryResult.data
              : [];

        const productRows =
          Array.isArray(
            productResult.products
          )
            ? productResult.products
            : Array.isArray(
                productResult.data
              )
              ? productResult.data
              : [];

        setCategories(
          flattenCategories(
            categoryRows
          )
        );

        setProducts(
          productRows.map((product: any) => {
            const colors = Array.isArray(product?.colors) ? product.colors : [];
            const color = colors.find((item: any) => item?.isDefault) || colors[0] || {};

            return {
              _id: String(product?._id || ""),
              name: color.nameProduct || "Product",
              slug: color.slugProduct || "",
            };
          }).filter((product: ProductOption) => Boolean(product._id))
        );

        if (
          mode === "edit"
        ) {
          const bannerResult =
            await responses[2].json();

          if (
            !responses[2].ok
          ) {
            throw new Error(
              bannerResult.message ||
                "Unable to load banner."
            );
          }

          const banner =
            bannerResult.data as
              BannerApiData;

          setForm({
            title:
              banner.title || "",
            slug:
              banner.slug || "",
            description:
              banner.description ||
              "",
            mediaType:
              banner.mediaType ||
              "image",
            position:
              banner.position ||
              "home_hero",
            device:
              banner.device ||
              "all",
            sortOrder:
              banner.sortOrder ??
              0,
            isActive:
              banner.isActive ??
              true,
          });

          const source =
            banner.mediaType ===
            "video"
              ? banner.videos
              : banner.images;

          setMediaItems(
            (source || []).map(
              item =>
                apiItemToForm(
                  item,
                  banner.mediaType
                )
            )
          );
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load banner form."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    mode,
    bannerId,
  ]);

  /* ======================================================
     COUNTS
  ====================================================== */

  const existingCount =
    useMemo(
      () =>
        mediaItems.filter(
          item =>
            item.existing
        ).length,
      [mediaItems]
    );

  const newCount =
    mediaItems.length -
    existingCount;

  /* ======================================================
     BASIC FIELD
  ====================================================== */

  const handleBasicChange = (
    event:
      ChangeEvent<
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
      >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      previous => ({
        ...previous,
        [name]:
          name === "sortOrder"
            ? Number(value)
            : value,
      })
    );
  };

  const handleTitle = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const title =
      event.target.value;

    const slug =
      title
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        );

    setForm(
      previous => ({
        ...previous,
        title,
        slug:
          mode === "create"
            ? slug
            : previous.slug,
      })
    );
  };

  /* ======================================================
     MEDIA TYPE CHANGE
  ====================================================== */

  const changeMediaType = (
    mediaType: MediaType
  ) => {
    if (
      mediaType ===
      form.mediaType
    ) {
      return;
    }

    if (
      mediaItems.length > 0
    ) {
      const confirmed =
        window.confirm(
          "Media type change karne par current media list clear ho jayegi. Continue?"
        );

      if (!confirmed) {
        return;
      }
    }

    mediaItems.forEach(
      item => {
        if (
          item.previewUrl
        ) {
          URL.revokeObjectURL(
            item.previewUrl
          );
        }

        if (
          item.posterPreviewUrl
        ) {
          URL.revokeObjectURL(
            item.posterPreviewUrl
          );
        }
      }
    );

    setMediaItems([]);

    setForm(
      previous => ({
        ...previous,
        mediaType,
      })
    );
  };

  /* ======================================================
     FILE SELECT
  ====================================================== */

  const handleFiles = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    setMediaItems(
      previous => [
        ...previous,
        ...files.map(
          file =>
            makeBlankMediaItem(
              file,
              form.mediaType
            )
        ),
      ]
    );

    event.target.value =
      "";
  };

  /* ======================================================
     ITEM UPDATE
  ====================================================== */

  const updateItem = <
    K extends keyof MediaItemForm
  >(
    index: number,
    field: K,
    value: MediaItemForm[K]
  ) => {
    setMediaItems(
      previous =>
        previous.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    );
  };

  const removeItem = (
    index: number
  ) => {
    setMediaItems(
      previous => {
        const item =
          previous[index];

        if (
          item?.previewUrl
        ) {
          URL.revokeObjectURL(
            item.previewUrl
          );
        }

        if (
          item?.posterPreviewUrl
        ) {
          URL.revokeObjectURL(
            item.posterPreviewUrl
          );
        }

        return previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        );
      }
    );
  };

  const setPosterFile = (
    index: number,
    file?: File
  ) => {
    setMediaItems(
      previous =>
        previous.map(
          (item, itemIndex) => {
            if (
              itemIndex !== index
            ) {
              return item;
            }

            if (
              item.posterPreviewUrl
            ) {
              URL.revokeObjectURL(
                item.posterPreviewUrl
              );
            }

            return {
              ...item,
              posterFile: file,
              posterPreviewUrl:
                file
                  ? URL.createObjectURL(
                      file
                    )
                  : undefined,
            };
          }
        )
    );
  };

  /* ======================================================
     VALIDATION
  ====================================================== */

  const validate = () => {
    if (
      !form.title.trim()
    ) {
      return "Banner admin title is required.";
    }

    if (
      !form.slug.trim()
    ) {
      return "Banner slug is required.";
    }

    if (
      mediaItems.length === 0
    ) {
      return `Please add at least one ${form.mediaType}.`;
    }

    for (
      let index = 0;
      index < mediaItems.length;
      index++
    ) {
      const item =
        mediaItems[index];

      if (
        item.linkType ===
          "custom" &&
        !item.customLink.trim()
      ) {
        return `Media ${index + 1}: custom link is required.`;
      }

      if (
        item.linkType ===
          "category" &&
        !item.category
      ) {
        return `Media ${index + 1}: category is required.`;
      }

      if (
        item.linkType ===
          "product" &&
        !item.product
      ) {
        return `Media ${index + 1}: product is required.`;
      }
    }

    return "";
  };

  /* ======================================================
     META
  ====================================================== */

  const itemToMeta = (
    item: MediaItemForm
  ) => ({
    ...(item.existing &&
    item.publicId
      ? {
          publicId:
            item.publicId,
        }
      : {}),

    alt: item.alt,

    title:
      item.title,
    subtitle:
      item.subtitle,
    description:
      item.description,
    buttonText:
      item.buttonText,

    linkType:
      item.linkType,

    customLink:
      item.linkType ===
      "custom"
        ? item.customLink
        : "",

    category:
      item.linkType ===
      "category"
        ? item.category
        : null,

    product:
      item.linkType ===
      "product"
        ? item.product
        : null,

    openInNewTab:
      item.openInNewTab,

    autoplay:
      item.autoplay,
    muted:
      item.muted,
    loop:
      item.loop,
    controls:
      item.controls,
  });

  /* ======================================================
     SUBMIT
  ====================================================== */

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    const validationError =
      validate();

    if (
      validationError
    ) {
      setError(
        validationError
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data =
        new FormData();

      data.append(
        "title",
        form.title.trim()
      );

      data.append(
        "slug",
        form.slug.trim()
      );

      data.append(
        "description",
        form.description.trim()
      );

      data.append(
        "mediaType",
        form.mediaType
      );

      data.append(
        "position",
        form.position
      );

      data.append(
        "device",
        form.device
      );

      data.append(
        "sortOrder",
        String(
          form.sortOrder
        )
      );

      data.append(
        "isActive",
        String(
          form.isActive
        )
      );

      const existingItems =
        mediaItems.filter(
          item =>
            item.existing
        );

      const newItems =
        mediaItems.filter(
          item =>
            !item.existing
        );

      if (
        mode === "edit"
      ) {
        data.append(
          "existingItemsMeta",
          JSON.stringify(
            existingItems.map(
              item =>
                itemToMeta(
                  item
                )
            )
          )
        );
      }

      let posterFileIndex =
        0;

      const newItemsMeta =
        newItems.map(
          item => {
            const meta =
              itemToMeta(
                item
              );

            if (
              form.mediaType ===
                "image" &&
              item.file
            ) {
              data.append(
                "images",
                item.file
              );
            }

            if (
              form.mediaType ===
                "video" &&
              item.file
            ) {
              data.append(
                "videos",
                item.file
              );

              if (
                item.posterFile
              ) {
                data.append(
                  "posters",
                  item.posterFile
                );

                return {
                  ...meta,
                  posterFileIndex:
                    posterFileIndex++,
                };
              }
            }

            return {
              ...meta,
              posterFileIndex:
                null,
            };
          }
        );

      data.append(
        "itemsMeta",
        JSON.stringify(
          newItemsMeta
        )
      );

      const url =
        mode === "create"
          ? `${API_URL}/api/banners`
          : `${API_URL}/api/banners/${bannerId}`;

      const response =
        await fetch(url, {
          method:
            mode === "create"
              ? "POST"
              : "PATCH",

          credentials:
            "include",

          /*
            FormData ke saath Content-Type manually mat lagao.
            Browser multipart boundary khud set karega.
          */
          body: data,
        });

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Unable to ${mode === "create" ? "create" : "update"} banner.`
        );
      }

      router.push(
        `/admin/banners?position=${form.position}`
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-[#f8f4f0]">
        <p className="text-sm text-gray-500">
          Loading banner...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f4f0] px-6 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1260px]">
        {/* HEADER */}

        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#b51d49]">
            Banner Management
          </p>

          <h1 className="text-3xl font-semibold text-[#17110f] lg:text-4xl">
            {mode === "create"
              ? "Add New Banner"
              : "Edit Banner"}
          </h1>

          <p className="mt-3 text-sm text-[#706763]">
            Har image/video ka apna content aur apna category/product/custom link set karo.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* ADMIN DETAILS */}

          <FormCard
            title="Banner Details"
            description="Ye details admin list/group ke liye hain. Customer slide content niche har media item me alag hoga."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Admin Banner Title *"
                name="title"
                value={form.title}
                onChange={handleTitle}
                placeholder="Homepage Hero Banner"
              />

              <Input
                label="Slug *"
                name="slug"
                value={form.slug}
                onChange={handleBasicChange}
                placeholder="homepage-hero-banner"
              />
            </div>

            <div className="mt-5">
              <TextArea
                label="Admin Description"
                name="description"
                value={form.description}
                onChange={handleBasicChange}
                placeholder="Internal description..."
              />
            </div>
          </FormCard>

          {/* SECTION */}

          <FormCard
            title="Banner Section"
            description="Homepage me banner kis section me show hoga."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {BANNER_SECTIONS.map(
                section => (
                  <button
                    key={
                      section.value
                    }
                    type="button"
                    onClick={() =>
                      setForm(
                        previous => ({
                          ...previous,
                          position:
                            section.value,
                        })
                      )
                    }
                    className={`rounded-2xl border p-5 text-left transition ${
                      form.position ===
                      section.value
                        ? "border-[#b51d49] bg-[#fff5f7]"
                        : "border-[#e4dcd7] bg-white hover:border-[#c9bbb5]"
                    }`}
                  >
                    <p className="text-sm font-bold text-[#17110f]">
                      {section.label}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {section.value}
                    </p>
                  </button>
                )
              )}
            </div>
          </FormCard>

          {/* MEDIA TYPE */}

          <FormCard
            title="Banner Media"
            description="Images ya videos select karo. Har selected media ke niche uska own content + Banner Link form aayega."
          >
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  changeMediaType(
                    "image"
                  )
                }
                className={`rounded-2xl border p-5 text-left ${
                  form.mediaType ===
                  "image"
                    ? "border-[#b51d49] bg-[#fff5f7]"
                    : "border-[#e4dcd7]"
                }`}
              >
                <p className="font-bold">
                  Image Banner
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  One or multiple images.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  changeMediaType(
                    "video"
                  )
                }
                className={`rounded-2xl border p-5 text-left ${
                  form.mediaType ===
                  "video"
                    ? "border-[#b51d49] bg-[#fff5f7]"
                    : "border-[#e4dcd7]"
                }`}
              >
                <p className="font-bold">
                  Video Banner
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  One or multiple videos.
                </p>
              </button>
            </div>

            <label className="flex min-h-[145px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9cec8] bg-[#fdfbf9] transition hover:border-[#b51d49]">
              <span className="text-3xl">
                +
              </span>
              <span className="mt-2 text-sm font-bold">
                Choose {form.mediaType === "image" ? "Images" : "Videos"}
              </span>
              <span className="mt-1 text-xs text-gray-400">
                Multiple files allowed
              </span>

              <input
                type="file"
                multiple
                accept={
                  form.mediaType ===
                  "image"
                    ? "image/*"
                    : "video/*"
                }
                onChange={handleFiles}
                className="hidden"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="rounded-full bg-[#f6f0ed] px-3 py-2">
                Total: {mediaItems.length}
              </span>
              {mode === "edit" && (
                <>
                  <span className="rounded-full bg-[#f6f0ed] px-3 py-2">
                    Existing: {existingCount}
                  </span>
                  <span className="rounded-full bg-[#f6f0ed] px-3 py-2">
                    New: {newCount}
                  </span>
                </>
              )}
            </div>
          </FormCard>

          {/* PER MEDIA CARDS */}

          {mediaItems.map(
            (item, index) => (
              <section
                key={item.key}
                className="overflow-hidden rounded-[26px] border border-[#e6ded8] bg-white"
              >
                <div className="flex items-center justify-between border-b border-[#f0e9e4] px-7 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b51d49]">
                      {form.mediaType} {index + 1}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-[#17110f]">
                      Media Content + Banner Link
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeItem(index)
                    }
                    className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50"
                  >
                    REMOVE
                  </button>
                </div>

                <div className="grid gap-7 p-7 lg:grid-cols-[310px_1fr]">
                  {/* PREVIEW */}

                  <div>
                    <div className="overflow-hidden rounded-2xl border border-[#e5ddd7] bg-[#f6f2ef]">
                      {form.mediaType ===
                      "image" ? (
                        <img
                          src={
                            item.previewUrl ||
                            item.url ||
                            ""
                          }
                          alt={
                            item.alt ||
                            item.title ||
                            `Banner ${index + 1}`
                          }
                          className="h-[230px] w-full object-cover"
                        />
                      ) : (
                        <video
                          src={
                            item.previewUrl ||
                            item.url ||
                            ""
                          }
                          poster={
                            item.posterPreviewUrl ||
                            item.posterUrl
                          }
                          controls
                          muted
                          className="h-[230px] w-full bg-black object-contain"
                        />
                      )}
                    </div>

                    <div className="mt-3 rounded-xl bg-[#f8f5f2] p-3 text-xs text-gray-500">
                      {item.existing
                        ? "Existing Cloudinary media"
                        : item.file?.name ||
                          "New media"}
                    </div>

                    {form.mediaType ===
                      "image" && (
                      <div className="mt-4">
                        <Input
                          label="Image ALT Text"
                          value={item.alt}
                          onChange={event =>
                            updateItem(
                              index,
                              "alt",
                              event.target.value
                            )
                          }
                          placeholder="Banner image alt"
                        />
                      </div>
                    )}

                    {form.mediaType ===
                      "video" && (
                      <div className="mt-4 space-y-4">
                        {!item.existing && (
                          <label className="block cursor-pointer rounded-xl border border-dashed border-[#d9cec8] p-4 text-center text-sm font-semibold">
                            {item.posterFile
                              ? "Change Poster"
                              : "Choose Optional Poster"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={event =>
                                setPosterFile(
                                  index,
                                  event.target.files?.[0]
                                )
                              }
                            />
                          </label>
                        )}

                        {(item.posterPreviewUrl ||
                          item.posterUrl) && (
                          <img
                            src={
                              item.posterPreviewUrl ||
                              item.posterUrl
                            }
                            alt="Video poster"
                            className="h-32 w-full rounded-xl object-cover"
                          />
                        )}

                        <div className="grid gap-2 sm:grid-cols-2">
                          <Checkbox
                            label="Autoplay"
                            checked={item.autoplay}
                            onChange={value =>
                              updateItem(
                                index,
                                "autoplay",
                                value
                              )
                            }
                          />
                          <Checkbox
                            label="Muted"
                            checked={item.muted}
                            onChange={value =>
                              updateItem(
                                index,
                                "muted",
                                value
                              )
                            }
                          />
                          <Checkbox
                            label="Loop"
                            checked={item.loop}
                            onChange={value =>
                              updateItem(
                                index,
                                "loop",
                                value
                              )
                            }
                          />
                          <Checkbox
                            label="Controls"
                            checked={item.controls}
                            onChange={value =>
                              updateItem(
                                index,
                                "controls",
                                value
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PER MEDIA CONTENT + LINK */}

                  <div className="space-y-7">
                    <div>
                      <h3 className="mb-4 text-sm font-bold text-[#17110f]">
                        Content
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          label="Title"
                          value={item.title}
                          onChange={event =>
                            updateItem(
                              index,
                              "title",
                              event.target.value
                            )
                          }
                          placeholder="Find your perfect fit"
                        />

                        <Input
                          label="Subtitle"
                          value={item.subtitle}
                          onChange={event =>
                            updateItem(
                              index,
                              "subtitle",
                              event.target.value
                            )
                          }
                          placeholder="New collection"
                        />
                      </div>

                      <div className="mt-4">
                        <TextArea
                          label="Description"
                          value={item.description}
                          onChange={event =>
                            updateItem(
                              index,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Banner content..."
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#eee7e2] pt-6">
                      <h3 className="text-sm font-bold text-[#17110f]">
                        Banner Link
                      </h3>
                      <p className="mt-1 text-xs text-gray-400">
                        Where should this media button take the customer?
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Select
                          label="Link Type"
                          value={item.linkType}
                          onChange={event => {
                            const linkType =
                              event.target.value as
                                LinkType;

                            setMediaItems(
                              previous =>
                                previous.map(
                                  (current, currentIndex) =>
                                    currentIndex === index
                                      ? {
                                          ...current,
                                          linkType,
                                          customLink:
                                            linkType === "custom"
                                              ? current.customLink
                                              : "",
                                          category:
                                            linkType === "category"
                                              ? current.category
                                              : "",
                                          product:
                                            linkType === "product"
                                              ? current.product
                                              : "",
                                        }
                                      : current
                                )
                            );
                          }}
                        >
                          <option value="none">
                            No Link
                          </option>
                          <option value="custom">
                            Custom Link
                          </option>
                          <option value="category">
                            Category / Subcategory
                          </option>
                          <option value="product">
                            Product
                          </option>
                        </Select>

                        <Input
                          label="Button Text"
                          value={item.buttonText}
                          onChange={event =>
                            updateItem(
                              index,
                              "buttonText",
                              event.target.value
                            )
                          }
                          placeholder="Shop Now"
                        />

                        {item.linkType ===
                          "custom" && (
                          <Input
                            label="Custom Link"
                            value={item.customLink}
                            onChange={event =>
                              updateItem(
                                index,
                                "customLink",
                                event.target.value
                              )
                            }
                            placeholder="/collections/new"
                          />
                        )}

                        {item.linkType ===
                          "category" && (
                          <Select
                            label="Category / Subcategory"
                            value={item.category}
                            onChange={event =>
                              updateItem(
                                index,
                                "category",
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Select Category
                            </option>

                            {categories.map(
                              category => (
                                <option
                                  key={category._id}
                                  value={category._id}
                                >
                                  {category.level > 0
                                    ? "— ".repeat(
                                        category.level
                                      )
                                    : ""}
                                  {category.name}
                                </option>
                              )
                            )}
                          </Select>
                        )}

                        {item.linkType ===
                          "product" && (
                          <Select
                            label="Product"
                            value={item.product}
                            onChange={event =>
                              updateItem(
                                index,
                                "product",
                                event.target.value
                              )
                            }
                          >
                            <option value="">
                              Select Product
                            </option>

                            {products.map(
                              product => (
                                <option
                                  key={product._id}
                                  value={product._id}
                                >
                                  {product.name}
                                  
                                </option>
                              )
                            )}
                          </Select>
                        )}
                      </div>

                      <div className="mt-4">
                        <Checkbox
                          label="Open link in new tab"
                          checked={item.openInNewTab}
                          onChange={value =>
                            updateItem(
                              index,
                              "openInNewTab",
                              value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          )}

          {/* DISPLAY */}

          <FormCard
            title="Display Settings"
            description="Device, sorting and active status."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Select
                label="Device"
                name="device"
                value={form.device}
                onChange={handleBasicChange}
              >
                <option value="all">
                  All Devices
                </option>
                <option value="desktop">
                  Desktop
                </option>
                <option value="mobile">
                  Mobile
                </option>
              </Select>

              <Input
                label="Sort Order"
                name="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={handleBasicChange}
              />
            </div>

            <div className="mt-5">
              <Checkbox
                label="Banner Active"
                checked={form.isActive}
                onChange={value =>
                  setForm(
                    previous => ({
                      ...previous,
                      isActive: value,
                    })
                  )
                }
              />
            </div>
          </FormCard>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pb-12">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                router.push(
                  "/admin/banners"
                )
              }
              className="rounded-xl border border-[#d9d0ca] bg-white px-8 py-4 text-sm font-bold"
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={saving}
              className="min-w-[190px] rounded-xl bg-[#b51d49] px-8 py-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving
                ? mode === "create"
                  ? "UPLOADING..."
                  : "UPDATING..."
                : mode === "create"
                  ? "SAVE BANNER"
                  : "UPDATE BANNER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#e6ded8] bg-white p-7 lg:p-8">
      <div className="mb-7 border-b border-[#f0e9e4] pb-5">
        <h2 className="text-xl font-bold text-[#17110f]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-gray-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#332b28]">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-[#ddd4ce] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#b51d49]"
      />
    </div>
  );
}

function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#332b28]">
        {label}
      </label>
      <textarea
        rows={4}
        {...props}
        className="w-full resize-none rounded-xl border border-[#ddd4ce] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-[#b51d49]"
      />
    </div>
  );
}

function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#332b28]">
        {label}
      </label>
      <select
        {...props}
        className="w-full rounded-xl border border-[#ddd4ce] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#b51d49]"
      >
        {children}
      </select>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e4dcd7] bg-[#fdfbf9] px-4 py-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={event =>
          onChange(
            event.target.checked
          )
        }
        className="h-4 w-4 accent-[#b51d49]"
      />
      <span className="text-sm font-semibold text-[#443b37]">
        {label}
      </span>
    </label>
  );
}
