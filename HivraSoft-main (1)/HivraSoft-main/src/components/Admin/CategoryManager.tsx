"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CategoryImagesUploader, {
  CategoryImage,
} from "./CategoryImagesUploader";

/* =========================================================
   TYPES
========================================================= */

type CategoryNode = {
  id: string;

  name: string;

  slug: string;

  description: string;

  parent: string | null;

  ancestors: string[];

  level: number;

  images: CategoryImage[];

  isActive: boolean;

  sortOrder: number;

  children: CategoryNode[];
};

type CategoryApiItem = {
  _id?: string;

  id?: string;

  name?: string;

  slug?: string;

  description?: string;

  parent?:
    | string
    | {
        _id?: string;
      }
    | null;

  ancestors?: string[];

  level?: number;

  images?: CategoryImage[];

  isActive?: boolean;

  sortOrder?: number;

  children?: CategoryApiItem[];
};

type CategoryForm = {
  name: string;

  slug: string;

  description: string;

  parentId: string;

  sortOrder: string;

  isActive: boolean;

  images: CategoryImage[];
};

type ViewMode =
  | "all"
  | "form";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
  images: [],
};

/* =========================================================
   NORMALIZE API DATA
========================================================= */

function getCategoryId(
  category: CategoryApiItem
): string {
  return String(
    category.id ||
      category._id ||
      ""
  );
}

function getParentId(
  parent:
    CategoryApiItem["parent"]
): string {
  if (
    !parent
  ) {
    return "";
  }

  if (
    typeof parent ===
    "string"
  ) {
    return parent;
  }

  return String(
    parent._id ||
      ""
  );
}

function normalizeTree(
  items:
    CategoryApiItem[] =
      []
): CategoryNode[] {
  return items.map(
    (
      item
    ) => ({
      id:
        getCategoryId(
          item
        ),

      name:
        item.name ||
        "",

      slug:
        item.slug ||
        "",

      description:
        item.description ||
        "",

      parent:
        getParentId(
          item.parent
        ) ||
        null,

      ancestors:
        Array.isArray(
          item.ancestors
        )
          ? item.ancestors.map(
              String
            )
          : [],

      level:
        Number(
          item.level ||
            0
        ),

      images:
        Array.isArray(
          item.images
        )
          ? item.images
              .filter(
                (
                  image
                ) =>
                  Boolean(
                    image?.url &&
                      image?.publicId
                  )
              )
              .map(
                (
                  image
                ) => ({
                  url:
                    image.url,

                  publicId:
                    image.publicId,

                  alt:
                    image.alt ||
                    item.name ||
                    "Category image",
                })
              )
          : [],

      isActive:
        item.isActive ??
        true,

      sortOrder:
        Number(
          item.sortOrder ||
            0
        ),

      children:
        normalizeTree(
          item.children ||
            []
        ),
    })
  );
}

/* =========================================================
   CLOUDINARY SAFE PREVIEW SEGMENT
========================================================= */

function toFolderSegment(
  value: string
): string {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize(
        "NFKD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /&/g,
        " and "
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
      ) ||
    "category"
  );
}

/* =========================================================
   CATEGORY SLUG

   Admin can type slug manually.
   This helper only normalizes the value for URL use.

   Example:
   "Sports Bra" -> "sports-bra"
========================================================= */

function normalizeCategorySlug(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize(
      "NFKD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /&/g,
      " and "
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CategoryManager() {
  const [
    categories,
    setCategories,
  ] =
    useState<
      CategoryNode[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    viewMode,
    setViewMode,
  ] =
    useState<ViewMode>(
      "all"
    );

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(
      false
    );

  const [
    form,
    setForm,
  ] =
    useState<CategoryForm>({
      ...EMPTY_FORM,
    });

  const [
    slugManuallyEdited,
    setSlugManuallyEdited,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    success,
    setSuccess,
  ] =
    useState(
      ""
    );

  /*
    Current form session me newly uploaded Cloudinary
    images. Agar user Cancel karta hai aur category save
    nahi karta, inhe cleanup karna zaroori hai.
  */
  const [
    newUploadIds,
    setNewUploadIds,
  ] =
    useState<
      string[]
    >([]);

  const menuRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =========================================================
     LOAD CATEGORY TREE
  ========================================================= */

  const loadCategories =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await fetch(
              `${API_URL}/api/categories/tree`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                "Unable to load categories."
            );
          }

          setCategories(
            normalizeTree(
              data.categories ||
                []
            )
          );
        } catch (
          error
        ) {
          setError(
            error instanceof
              Error
              ? error.message
              : "Unable to load categories."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      void loadCategories();
    },
    [
      loadCategories,
    ]
  );

  /* =========================================================
     CLOSE MENU OUTSIDE
  ========================================================= */

  useEffect(
    () => {
      const handleClick = (
        event: MouseEvent
      ) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target as Node
          )
        ) {
          setMenuOpen(
            false
          );
        }
      };

      document.addEventListener(
        "mousedown",
        handleClick
      );

      return () =>
        document.removeEventListener(
          "mousedown",
          handleClick
        );
    },
    []
  );

  /* =========================================================
     FLATTEN TREE
  ========================================================= */

  const flatCategories =
    useMemo(
      () => {
        const result:
          CategoryNode[] =
          [];

        const walk = (
          nodes:
            CategoryNode[]
        ) => {
          for (
            const node
            of nodes
          ) {
            result.push(
              node
            );

            walk(
              node.children ||
                []
            );
          }
        };

        walk(
          categories
        );

        return result;
      },
      [
        categories,
      ]
    );

  const categoryById =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            CategoryNode
          >();

        flatCategories.forEach(
          (
            category
          ) => {
            map.set(
              category.id,
              category
            );
          }
        );

        return map;
      },
      [
        flatCategories,
      ]
    );

  /* =========================================================
     FIND / DESCENDANTS
  ========================================================= */

  const findNode =
    useCallback(
      (
        categoryId: string
      ):
        | CategoryNode
        | null => {
        return (
          categoryById.get(
            categoryId
          ) ||
          null
        );
      },
      [
        categoryById,
      ]
    );

  const getDescendantIds =
    useCallback(
      (
        categoryId: string
      ) => {
        const ids =
          new Set<string>();

        const node =
          findNode(
            categoryId
          );

        const collect = (
          current:
            CategoryNode
        ) => {
          for (
            const child
            of current.children ||
            []
          ) {
            ids.add(
              child.id
            );

            collect(
              child
            );
          }
        };

        if (
          node
        ) {
          collect(
            node
          );
        }

        return ids;
      },
      [
        findNode,
      ]
    );

  /* =========================================================
     CLOUDINARY CATEGORY FOLDER

     Every category gets its OWN folder by category name:

     Women:
     category-images/women

     Sports Bra:
     category-images/sports-bra

     Photo Name "Front View":
     hivrasoft/category-images/sports-bra/front-view
  ========================================================= */

  const cloudinaryCategoryFolder =
    useMemo(
      () => {
        return `category-images/${toFolderSegment(
          form.name ||
            "category"
        )}`;
      },
      [
        form.name,
      ]
    );

  /* =========================================================
     CLEANUP UNSAVED NEW UPLOADS
  ========================================================= */

  const cleanupUnsavedUploads =
    useCallback(
      async () => {
        if (
          newUploadIds.length ===
          0
        ) {
          return;
        }

        const ids = [
          ...newUploadIds,
        ];

        await Promise.allSettled(
          ids.map(
            (
              publicId
            ) =>
              fetch(
                `${API_URL}/api/uploads/image`,
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
                    JSON.stringify({
                      publicId,
                    }),
                }
              )
          )
        );

        setNewUploadIds(
          []
        );
      },
      [
        newUploadIds,
      ]
    );

  /* =========================================================
     ALL CATEGORIES
  ========================================================= */

  const showAllCategories =
    async () => {
      await cleanupUnsavedUploads();

      setMenuOpen(
        false
      );

      setViewMode(
        "all"
      );

      setEditingId(
        null
      );

      setForm({
        ...EMPTY_FORM,
      });
      setSlugManuallyEdited(false);

      setError(
        ""
      );
    };

  /* =========================================================
     NEW ROOT / NEW SUB
  ========================================================= */

  const openNewCategory =
    async (
      parentId =
        ""
    ) => {
      await cleanupUnsavedUploads();

      setMenuOpen(
        false
      );

      setEditingId(
        null
      );
      setSlugManuallyEdited(false);

      setNewUploadIds(
        []
      );

      setForm({
        ...EMPTY_FORM,

        parentId,

        images:
          [],
      });

      setError(
        ""
      );

      setSuccess(
        ""
      );

      setViewMode(
        "form"
      );
    };

  /* =========================================================
     EDIT BY ID
  ========================================================= */

  const openEditById =
    async (
      categoryId: string
    ) => {
      try {
        await cleanupUnsavedUploads();

        setNewUploadIds(
          []
        );

        setMenuOpen(
          false
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const response =
          await fetch(
            `${API_URL}/api/categories/${categoryId}`,
            {
              method:
                "GET",

              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to load category."
          );
        }

        const category:
          CategoryApiItem =
          data.category ||
          {};

        setEditingId(
          categoryId
        );
        setSlugManuallyEdited(true);

        setForm({
          name:
            category.name ||
            "",

          slug:
            category.slug ||
            "",

          description:
            category.description ||
            "",

          parentId:
            getParentId(
              category.parent
            ),

          sortOrder:
            String(
              category.sortOrder ??
                0
            ),

          isActive:
            category.isActive ??
            true,

          images:
            Array.isArray(
              category.images
            )
              ? category.images.map(
                  (
                    image
                  ) => ({
                    url:
                      image.url,

                    publicId:
                      image.publicId,

                    alt:
                      image.alt ||
                      category.name ||
                      "Category image",
                  })
                )
              : [],
        });

        setViewMode(
          "form"
        );
      } catch (
        error
      ) {
        setError(
          error instanceof
            Error
            ? error.message
            : "Unable to load category."
        );
      }
    };

  /* =========================================================
     IMAGE UPLOADED
  ========================================================= */

  const handleImageUploaded =
    (
      image:
        CategoryImage
    ) => {
      setForm(
        (
          current
        ) => ({
          ...current,

          images: [
            ...current.images,
            image,
          ],
        })
      );

      setNewUploadIds(
        (
          current
        ) => [
          ...current,
          image.publicId,
        ]
      );
    };

  /* =========================================================
     REMOVE IMAGE

     New session image:
     - DB me save nahi hai
     - turant Cloudinary DELETE

     Existing edit image:
     - form se remove only
     - PATCH ke baad backend old publicId Cloudinary se delete karega
  ========================================================= */

  const handleRemoveImage =
    async (
      image:
        CategoryImage
    ) => {
      const isNewUpload =
        newUploadIds.includes(
          image.publicId
        );

      if (
        isNewUpload
      ) {
        try {
          const response =
            await fetch(
              `${API_URL}/api/uploads/image`,
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
                  JSON.stringify({
                    publicId:
                      image.publicId,
                  }),
              }
            );

          if (
            !response.ok
          ) {
            const data =
              await response.json();

            throw new Error(
              data.message ||
                "Unable to delete uploaded image."
            );
          }
        } catch (
          error
        ) {
          setError(
            error instanceof
              Error
              ? error.message
              : "Unable to delete uploaded image."
          );

          return;
        }

        setNewUploadIds(
          (
            current
          ) =>
            current.filter(
              (
                publicId
              ) =>
                publicId !==
                image.publicId
            )
        );
      }

      setForm(
        (
          current
        ) => ({
          ...current,

          images:
            current.images.filter(
              (
                currentImage
              ) =>
                currentImage.publicId !==
                image.publicId
            ),
        })
      );
    };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        saving
      ) {
        return;
      }

      const name =
        form.name.trim();

      if (
        !name
      ) {
        setError(
          "Category name is required."
        );

        return;
      }

      const slug =
        normalizeCategorySlug(
          form.slug
        );

      if (
        !slug
      ) {
        setError(
          "Category slug is required."
        );

        return;
      }

      const sortOrder =
        Number(
          form.sortOrder
        );

      if (
        !Number.isFinite(
          sortOrder
        )
      ) {
        setError(
          "Sort order must be a number."
        );

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

        const isEditing =
          Boolean(
            editingId
          );

        const endpoint =
          isEditing
            ? `${API_URL}/api/categories/${editingId}`
            : `${API_URL}/api/categories`;

        const response =
          await fetch(
            endpoint,
            {
              method:
                isEditing
                  ? "PATCH"
                  : "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  name,

                  slug,

                  description:
                    form.description.trim(),

                  parentId:
                    form.parentId ||
                    null,

                  images:
                    form.images,

                  sortOrder,

                  isActive:
                    form.isActive,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to save category."
          );
        }

        /*
          Images ab DB me save ho gayi hain,
          cleanup list clear.
        */
        setNewUploadIds(
          []
        );

        setSuccess(
          isEditing
            ? "Category updated successfully."
            : "Category created successfully."
        );

        setEditingId(
          null
        );

        setForm({
          ...EMPTY_FORM,
        });
        setSlugManuallyEdited(false);

        setViewMode(
          "all"
        );

        await loadCategories();
      } catch (
        error
      ) {
        setError(
          error instanceof
            Error
            ? error.message
            : "Unable to save category."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =========================================================
     DELETE CATEGORY

     Backend category.service:
     1. child check
     2. category.images[].publicId -> Cloudinary destroy
     3. MongoDB category delete
     4. empty folder cleanup
  ========================================================= */

  const handleDelete =
    async (
      categoryId: string
    ) => {
      const category =
        findNode(
          categoryId
        );

      if (
        !category
      ) {
        setError(
          "Category not found."
        );

        return;
      }

      if (
        category.children
          ?.length
      ) {
        setError(
          `"${category.name}" has subcategories. Delete or move them first.`
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${category.name}"?\n\nIts ${category.images.length} Cloudinary image(s) will also be deleted.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setDeletingId(
          categoryId
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const response =
          await fetch(
            `${API_URL}/api/categories/${categoryId}`,
            {
              method:
                "DELETE",

              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to delete category."
          );
        }

        setSuccess(
          `${data.message || "Category deleted."} Cloudinary images deleted: ${data.deletedImages ?? category.images.length}.`
        );

        await loadCategories();
      } catch (
        error
      ) {
        setError(
          error instanceof
            Error
            ? error.message
            : "Unable to delete category."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  /* =========================================================
     INVALID PARENT IDS
  ========================================================= */

  const invalidParentIds =
    useMemo(
      () => {
        const ids =
          new Set<string>();

        if (
          editingId
        ) {
          ids.add(
            editingId
          );

          for (
            const id
            of getDescendantIds(
              editingId
            )
          ) {
            ids.add(
              id
            );
          }
        }

        return ids;
      },
      [
        editingId,
        getDescendantIds,
      ]
    );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1500px]
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.24em]
              text-[#8C1839]
            "
          >
            Catalog Structure
          </p>

          <h1
            className="
              mt-2
              text-[28px]
              font-semibold
              text-[#211A18]
            "
          >
            Categories
          </h1>

          <p
            className="
              mt-1
              text-[11px]
              leading-5
              text-[#211A18]/45
            "
          >
            Unlimited category tree +
            named Cloudinary images.
          </p>
        </div>

        {/* CATEGORY MENU */}

        <div
          ref={
            menuRef
          }
          className="
            relative
            w-full
            sm:w-[245px]
          "
        >
          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (
                  current
                ) =>
                  !current
              )
            }
            className="
              flex
              h-[48px]
              w-full
              items-center
              justify-between
              rounded-[12px]
              bg-[#8C1839]
              px-5
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-white
              transition
              hover:bg-[#211A18]
            "
          >
            <span>
              Category
            </span>

            <ChevronIcon
              open={
                menuOpen
              }
            />
          </button>

          {menuOpen && (
            <div
              className="
                absolute
                right-0
                z-50
                mt-2
                w-full
                overflow-hidden
                rounded-[14px]
                border
                border-[#211A18]/10
                bg-white
                p-2
                shadow-[0_18px_45px_rgba(33,26,24,0.12)]
              "
            >
              <button
                type="button"
                onClick={() =>
                  void showAllCategories()
                }
                className="
                  w-full
                  rounded-[10px]
                  px-3
                  py-3
                  text-left
                  text-[11px]
                  font-semibold
                  text-[#211A18]
                  hover:bg-[#F3EEE8]
                "
              >
                All Categories
              </button>

              <button
                type="button"
                onClick={() =>
                  void openNewCategory()
                }
                className="
                  mt-1
                  w-full
                  rounded-[10px]
                  px-3
                  py-3
                  text-left
                  text-[11px]
                  font-semibold
                  text-[#8C1839]
                  hover:bg-[#F3EEE8]
                "
              >
                + New Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES */}

      {error && (
        <Message
          tone="error"
        >
          {error}
        </Message>
      )}

      {success && (
        <Message
          tone="success"
        >
          {success}
        </Message>
      )}

      {/* =====================================================
          ALL CATEGORY TREE
      ===================================================== */}

      {viewMode ===
        "all" && (
        <section
          className="
            mt-6
            overflow-hidden
            rounded-[22px]
            border
            border-[#211A18]/10
            bg-white
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              border-b
              border-[#211A18]/10
              px-5
              py-5
              md:flex-row
              md:items-center
              md:justify-between
              md:px-6
            "
          >
            <div>
              <h2
                className="
                  text-[16px]
                  font-semibold
                  text-[#211A18]
                "
              >
                All Categories
              </h2>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#211A18]/40
                "
              >
                + / − click karke
                subcategories open karo.
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  rounded-full
                  bg-[#F3EEE8]
                  px-3
                  py-1.5
                  text-[9px]
                  font-semibold
                  uppercase
                  text-[#8C1839]
                "
              >
                {
                  flatCategories.length
                }{" "}
                Categories
              </span>

              <button
                type="button"
                onClick={() =>
                  void openNewCategory()
                }
                className="
                  h-9
                  rounded-[10px]
                  bg-[#211A18]
                  px-4
                  text-[9px]
                  font-semibold
                  uppercase
                  text-white
                  hover:bg-[#8C1839]
                "
              >
                + New
              </button>
            </div>
          </div>

          {loading ? (
            <div
              className="
                flex
                min-h-[320px]
                items-center
                justify-center
                text-[11px]
                text-[#211A18]/45
              "
            >
              Loading categories...
            </div>
          ) : categories.length ===
            0 ? (
            <div
              className="
                flex
                min-h-[320px]
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <p
                className="
                  text-[13px]
                  font-semibold
                  text-[#211A18]
                "
              >
                No categories
              </p>

              <button
                type="button"
                onClick={() =>
                  void openNewCategory()
                }
                className="
                  mt-4
                  rounded-[10px]
                  bg-[#8C1839]
                  px-5
                  py-3
                  text-[9px]
                  font-semibold
                  uppercase
                  text-white
                "
              >
                + New Category
              </button>
            </div>
          ) : (
            <div
              className="
                p-3
                sm:p-4
              "
            >
              {categories.map(
                (
                  category
                ) => (
                  <CategoryRow
                    key={
                      category.id
                    }
                    category={
                      category
                    }
                    depth={
                      0
                    }
                    onAddChild={
                      openNewCategory
                    }
                    onEdit={
                      openEditById
                    }
                    onDelete={
                      handleDelete
                    }
                    deletingId={
                      deletingId
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          CREATE / EDIT FORM
      ===================================================== */}

      {viewMode ===
        "form" && (
        <section
          className="
            mt-6
            overflow-hidden
            rounded-[22px]
            border
            border-[#211A18]/10
            bg-white
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-[#211A18]/10
              px-5
              py-5
              md:px-6
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-[#8C1839]
                "
              >
                {editingId
                  ? "Edit"
                  : "New"}
              </p>

              <h2
                className="
                  mt-1
                  text-[17px]
                  font-semibold
                  text-[#211A18]
                "
              >
                {editingId
                  ? "Edit Category"
                  : "New Category"}
              </h2>

              {editingId && (
                <p
                  className="
                    mt-1
                    break-all
                    text-[8px]
                    text-[#211A18]/35
                  "
                >
                  ID:{" "}
                  {
                    editingId
                  }
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                void showAllCategories()
              }
              className="
                rounded-[10px]
                border
                border-[#211A18]/10
                px-4
                py-2.5
                text-[9px]
                font-semibold
                uppercase
                text-[#211A18]/60
              "
            >
              ← All
            </button>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="
              grid
              grid-cols-1
              gap-6
              p-5
              md:p-6
              lg:grid-cols-2
            "
          >
            {/* NAME */}

            <Field>
              <Label>
                Category Name
              </Label>

              <input
                value={
                  form.name
                }
                onChange={(
                  event
                ) => {
                  const nextName =
                    event.target.value;

                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      name:
                        nextName,

                      /*
                        New category me slug blank ho to
                        name se automatically suggest karo.
                        Admin baad me slug manually change kar sakta hai.
                      */
                      slug:
                        slugManuallyEdited
                          ? current.slug
                          : normalizeCategorySlug(
                              nextName
                            ),
                    })
                  );
                }}
                placeholder="e.g. Sports Bra"
                className={
                  inputClass
                }
              />

              <p
                className="
                  mt-2
                  text-[8px]
                  text-[#211A18]/35
                "
              >
                Category name se
                Cloudinary category folder
                banta hai.
              </p>
            </Field>

            {/* SLUG */}

            <Field>
              <Label>
                Category Slug
              </Label>

              <div
                className="
                  flex
                  gap-2
                "
              >
                <input
                  value={
                    form.slug
                  }
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }));
                  }}
                  onBlur={() =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        slug:
                          normalizeCategorySlug(
                            current.slug
                          ),
                      })
                    )
                  }
                  placeholder="e.g. sports-bra"
                  className={
                    inputClass
                  }
                />

                <button
                  type="button"
                  onClick={() => {
                    setSlugManuallyEdited(false);
                    setForm((current) => ({
                      ...current,
                      slug: normalizeCategorySlug(current.name),
                    }));
                  }}
                  className="
                    h-[48px]
                    shrink-0
                    rounded-[12px]
                    border
                    border-[#8C1839]/20
                    bg-white
                    px-4
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.08em]
                    text-[#8C1839]
                    hover:bg-[#8C1839]
                    hover:text-white
                  "
                >
                  Generate
                </button>
              </div>

              <p
                className="
                  mt-2
                  text-[8px]
                  text-[#211A18]/35
                "
              >
                Store URL example:
                /category/{form.slug || "sports-bra"}
              </p>
            </Field>

            {/* PARENT */}

            <Field>
              <Label>
                Parent Category
              </Label>

              <select
                value={
                  form.parentId
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      parentId:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  No Parent — Root Category
                </option>

                {flatCategories
                  .filter(
                    (
                      category
                    ) =>
                      !invalidParentIds.has(
                        category.id
                      )
                  )
                  .map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {`${"— ".repeat(
                          category.level
                        )}${category.name}`}
                      </option>
                    )
                  )}
              </select>
            </Field>

            {/* IMAGES */}

            <div
              className="
                lg:col-span-2
              "
            >
              <Label>
                Category Images
              </Label>

              <CategoryImagesUploader
                folder={
                  cloudinaryCategoryFolder
                }
                categoryName={
                  form.name
                }
                value={
                  form.images
                }
                disabled={
                  saving
                }
                onUploaded={
                  handleImageUploaded
                }
                onRemove={
                  handleRemoveImage
                }
              />

              <div
                className="
                  mt-3
                  rounded-[11px]
                  bg-[#FFF8EA]
                  px-4
                  py-3
                  text-[9px]
                  leading-5
                  text-[#6A4B13]
                "
              >
                Example: Category “Sports Bra”
                + Photo Name “Front View” ={" "}
                <strong>
                  hivrasoft/category-images/sports-bra/front-view
                </strong>
              </div>
            </div>

            {/* DESCRIPTION */}

            <div
              className="
                lg:col-span-2
              "
            >
              <Field>
                <Label>
                  Description
                </Label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={
                    5
                  }
                  placeholder="Category description"
                  className={`${inputClass} h-auto resize-none py-3`}
                />
              </Field>
            </div>

            {/* SORT */}

            <Field>
              <Label>
                Sort Order
              </Label>

              <input
                type="number"
                value={
                  form.sortOrder
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      sortOrder:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              />
            </Field>

            {/* STATUS */}

            <Field>
              <Label>
                Status
              </Label>

              <button
                type="button"
                onClick={() =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,

                      isActive:
                        !current.isActive,
                    })
                  )
                }
                className="
                  flex
                  h-[48px]
                  w-full
                  items-center
                  justify-between
                  rounded-[12px]
                  border
                  border-[#211A18]/12
                  bg-[#FAF8F6]
                  px-4
                "
              >
                <span
                  className="
                    text-[11px]
                    font-medium
                    text-[#211A18]
                  "
                >
                  {form.isActive
                    ? "Active"
                    : "Inactive"}
                </span>

                <span
                  className={`
                    relative
                    h-7
                    w-12
                    rounded-full

                    ${
                      form.isActive
                        ? "bg-[#8C1839]"
                        : "bg-[#211A18]/15"
                    }
                  `}
                >
                  <span
                    className={`
                      absolute
                      top-1
                      h-5
                      w-5
                      rounded-full
                      bg-white
                      shadow
                      transition-all

                      ${
                        form.isActive
                          ? "left-6"
                          : "left-1"
                      }
                    `}
                  />
                </span>
              </button>
            </Field>

            {/* BUTTONS */}

            <div
              className="
                flex
                flex-col-reverse
                gap-3
                border-t
                border-[#211A18]/8
                pt-5
                sm:flex-row
                sm:justify-end
                lg:col-span-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  void showAllCategories()
                }
                disabled={
                  saving
                }
                className="
                  h-[46px]
                  rounded-[11px]
                  border
                  border-[#211A18]/10
                  px-5
                  text-[9px]
                  font-semibold
                  uppercase
                  text-[#211A18]/60
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="
                  h-[46px]
                  rounded-[11px]
                  bg-[#8C1839]
                  px-6
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-white
                  hover:bg-[#211A18]
                  disabled:opacity-50
                "
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   CATEGORY ROW - RECURSIVE
========================================================= */

function CategoryRow({
  category,
  depth,
  onAddChild,
  onEdit,
  onDelete,
  deletingId,
}: {
  category:
    CategoryNode;

  depth:
    number;

  onAddChild: (
    parentId: string
  ) =>
    | void
    | Promise<void>;

  onEdit: (
    categoryId: string
  ) =>
    | void
    | Promise<void>;

  onDelete: (
    categoryId: string
  ) =>
    | void
    | Promise<void>;

  deletingId:
    | string
    | null;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const hasChildren =
    Boolean(
      category.children
        ?.length
    );

  const mainImage =
    category.images?.[0];

  return (
    <div>
      <div
        className="
          mb-2
          rounded-[14px]
          border
          border-[#211A18]/8
          bg-[#FAF8F6]
          px-4
          py-3
        "
        style={{
          marginLeft:
            Math.min(
              depth *
                22,
              110
            ),
        }}
      >
        <div
          className="
            flex
            flex-col
            gap-3
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          {/* LEFT */}

          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                hasChildren &&
                setOpen(
                  (
                    value
                  ) =>
                    !value
                )
              }
              disabled={
                !hasChildren
              }
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-[9px]
                bg-[#F3EEE8]
                text-[#8C1839]
                disabled:text-[#211A18]/20
              "
            >
              {hasChildren
                ? open
                  ? "−"
                  : "+"
                : "•"}
            </button>

            {/* THUMBNAIL */}

            <div
              className="
                h-11
                w-11
                shrink-0
                overflow-hidden
                rounded-[10px]
                border
                border-[#211A18]/8
                bg-white
              "
            >
              {mainImage?.url ? (
                <img
                  src={
                    mainImage.url
                  }
                  alt={
                    mainImage.alt ||
                    category.name
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    items-center
                    justify-center
                    text-[8px]
                    text-[#211A18]/25
                  "
                >
                  IMG
                </div>
              )}
            </div>

            <div
              className="
                min-w-0
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <p
                  className="
                    truncate
                    text-[12px]
                    font-semibold
                    text-[#211A18]
                  "
                >
                  {
                    category.name
                  }
                </p>

                <span
                  className={`
                    rounded-full
                    px-2
                    py-1
                    text-[7px]
                    font-semibold
                    uppercase

                    ${
                      category.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-[#211A18]/5 text-[#211A18]/40"
                    }
                  `}
                >
                  {category.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <p
                className="
                  mt-1
                  truncate
                  text-[8px]
                  text-[#211A18]/40
                "
              >
                /{
                  category.slug
                }
                {" • "}
                Level{" "}
                {
                  category.level
                }
                {" • "}
                {
                  category.images
                    .length
                }{" "}
                image(s)
              </p>

              {mainImage?.alt && (
                <p
                  className="
                    mt-1
                    truncate
                    text-[8px]
                    text-[#8C1839]/70
                  "
                >
                  Main ALT:{" "}
                  {
                    mainImage.alt
                  }
                </p>
              )}
            </div>
          </div>

          {/* ACTIONS */}

          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                void onAddChild(
                  category.id
                )
              }
              className="
                h-8
                rounded-[8px]
                border
                border-[#8C1839]/15
                px-3
                text-[8px]
                font-semibold
                uppercase
                text-[#8C1839]
              "
            >
              + Sub
            </button>

            <button
              type="button"
              onClick={() =>
                void onEdit(
                  category.id
                )
              }
              className="
                h-8
                rounded-[8px]
                border
                border-[#211A18]/10
                px-3
                text-[8px]
                font-semibold
                uppercase
                text-[#211A18]/65
              "
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                void onDelete(
                  category.id
                )
              }
              disabled={
                deletingId ===
                category.id
              }
              className="
                h-8
                rounded-[8px]
                border
                border-red-200
                px-3
                text-[8px]
                font-semibold
                uppercase
                text-red-500
                disabled:opacity-40
              "
            >
              {deletingId ===
              category.id
                ? "..."
                : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {hasChildren &&
        open &&
        category.children.map(
          (
            child
          ) => (
            <CategoryRow
              key={
                child.id
              }
              category={
                child
              }
              depth={
                depth +
                1
              }
              onAddChild={
                onAddChild
              }
              onEdit={
                onEdit
              }
              onDelete={
                onDelete
              }
              deletingId={
                deletingId
              }
            />
          )
        )}
    </div>
  );
}

/* =========================================================
   SMALL UI
========================================================= */

function Field({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}

function Label({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <label
      className="
        mb-2
        block
        text-[9px]
        font-semibold
        uppercase
        tracking-[0.15em]
        text-[#211A18]/55
      "
    >
      {children}
    </label>
  );
}

function Message({
  children,
  tone,
}: {
  children:
    ReactNode;

  tone:
    | "error"
    | "success";
}) {
  return (
    <div
      className={`
        mt-5
        rounded-[14px]
        border
        px-4
        py-3
        text-[11px]

        ${
          tone ===
          "error"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-green-200 bg-green-50 text-green-700"
        }
      `}
    >
      {children}
    </div>
  );
}

const inputClass = `
  h-[48px]
  w-full
  rounded-[12px]
  border
  border-[#211A18]/12
  bg-[#FAF8F6]
  px-4
  text-[12px]
  text-[#211A18]
  outline-none
  transition
  placeholder:text-[#211A18]/25
  focus:border-[#8C1839]
  focus:ring-4
  focus:ring-[#8C1839]/5
`;

function ChevronIcon({
  open,
}: {
  open:
    boolean;
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`
        transition
        ${
          open
            ? "rotate-180"
            : ""
        }
      `}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
