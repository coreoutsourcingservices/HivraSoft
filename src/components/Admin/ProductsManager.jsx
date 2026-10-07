"use client";



import Link from "next/link";

import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  Eye,

  Pencil,

  RefreshCw,

  Search,

  Trash2,

} from "lucide-react";



import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";

import { apiFetch, ApiError } from "@/lib/api";



function getProductsFromResponse(response) {

  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.products)) return response.products;

  if (Array.isArray(response?.data)) return response.data;

  if (Array.isArray(response?.data?.products)) return response.data.products;

  return [];

}



function getErrorMessage(error, fallback) {

  return error instanceof ApiError || error instanceof Error

    ? error.message

    : fallback;

}



function safeText(value) {

  return String(value ?? "").trim();

}



function escapeCsv(value) {

  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;

}



function seoTone(score) {

  if (score >= 80) {

    return {

      badge: "border-emerald-200 bg-emerald-100 text-emerald-700",

      dot: "bg-emerald-500",

      label: "Good",

    };

  }



  if (score >= 60) {

    return {

      badge: "border-amber-200 bg-amber-100 text-amber-700",

      dot: "bg-amber-500",

      label: "Needs work",

    };

  }



  return {

    badge: "border-red-200 bg-red-100 text-red-700",

    dot: "bg-red-500",

    label: "Poor",

  };

}



function stockTone(stock) {

  if (stock <= 0) {

    return {

      text: "text-red-600",

      bg: "bg-red-50 border-red-100",

      label: "Out of stock",

    };

  }



  if (stock < 10) {

    return {

      text: "text-red-600",

      bg: "bg-red-50 border-red-100",

      label: "Low stock",

    };

  }



  return {

    text: "text-emerald-700",

    bg: "bg-emerald-50 border-emerald-100",

    label: "In stock",

  };

}



function normalizeProduct(product) {

  const id = safeText(product?._id || product?.id);

  const colors = Array.isArray(product?.colors) ? product.colors : [];

  const defaultColor =

    colors.find((color) => color?.isDefault === true) || colors[0] || null;



  const defaultImages = Array.isArray(defaultColor?.images)

    ? defaultColor.images

    : [];

  const image =

    defaultImages.find((item) => item?.isDefault && item?.url)?.url ||

    defaultImages.find((item) => item?.url)?.url ||

    colors

      .flatMap((color) => (Array.isArray(color?.images) ? color.images : []))

      .find((item) => item?.url)?.url ||

    "";



  const normalizedColors = colors.map((color, colorIndex) => {

    const sizes = Array.isArray(color?.sizes)

      ? color.sizes.map((size) => ({

          id: safeText(size?._id || `${colorIndex}-${size?.size}`),

          size: safeText(size?.size || "—"),

          stock: Math.max(0, Number(size?.stock) || 0),

          isActive: size?.isActive !== false,

        }))

      : [];



    const stock = sizes.reduce(

      (sum, size) => sum + (size.isActive ? size.stock : 0),

      0

    );



    return {

      id: safeText(color?._id || color?.slugColor || colorIndex),

      name: safeText(color?.nameColor || `Color ${colorIndex + 1}`),

      slug: safeText(color?.slugColor),

      hex: safeText(color?.hex || "#D9D9D9"),

      isDefault: color?.isDefault === true,

      sizes,

      stock,

      focusKeyword: safeText(color?.focusKeyword),

      seoScore: Math.max(0, Math.min(100, Number(color?.seoScore) || 0)),

    };

  });



  const totalStock = normalizedColors.reduce(

    (sum, color) => sum + color.stock,

    0

  );



  const categories = Array.isArray(product?.categories)

    ? product.categories.map((category) => ({

        id: safeText(category?._id || category?.id),

        name: safeText(category?.name || category?.slug),

      }))

    : [];



  const average = Math.max(

    0,

    Math.min(5, Number(product?.ratings?.average) || 0)

  );

  const ratingCount = Math.max(0, Number(product?.ratings?.count) || 0);



  return {

    id,

    name: safeText(defaultColor?.nameProduct || "Unnamed Product"),

    slug: safeText(defaultColor?.slugProduct),

    image,

    shortDescription: safeText(defaultColor?.shortDescription),

    isColor: product?.isColor === true,

    colors: normalizedColors,

    totalStock,

    categories,

    categoriesText: categories.map((category) => category.name).join(" "),

    categoryName: categories.at(-1)?.name || "",

    isActive: product?.isActive === true,

    status: product?.isActive === true ? "active" : "inactive",

    ratings: {

      average,

      count: ratingCount,

    },

    seoScore:

      normalizedColors.find((color) => color.isDefault)?.seoScore ??

      normalizedColors[0]?.seoScore ??

      0,

    focusKeyword: safeText(defaultColor?.focusKeyword),

  };

}



export default function ProductsManager() {

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [category, setCategory] = useState("all");

  const [productType, setProductType] = useState("all");

  const [stockStatus, setStockStatus] = useState("all");

  const [seoStatus, setSeoStatus] = useState("all");



  const [selectedIds, setSelectedIds] = useState([]);

  const [bulkAction, setBulkAction] = useState("");



  const loadProducts = useCallback(async () => {

    try {

      setLoading(true);

      setError("");

      setSuccess("");



      const response = await apiFetch("/api/products", {

        method: "GET",

      });



      setProducts(

        getProductsFromResponse(response)

          .map(normalizeProduct)

          .filter((product) => Boolean(product.id))

      );

    } catch (loadError) {

      setError(getErrorMessage(loadError, "Unable to load products."));

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void loadProducts();

  }, [loadProducts]);



  const categoryOptions = useMemo(() => {

    const map = new Map();



    products.forEach((product) => {

      product.categories.forEach((item) => {

        if (item.id && item.name) map.set(item.id, item.name);

      });

    });



    return [...map.entries()]

      .map(([id, name]) => ({ id, name }))

      .sort((a, b) => a.name.localeCompare(b.name));

  }, [products]);



  const filteredProducts = useMemo(() => {

    const text = search.trim().toLowerCase();



    return products.filter((product) => {

      const searchMatch =

        !text ||

        product.name.toLowerCase().includes(text) ||

        product.slug.toLowerCase().includes(text) ||

        product.id.toLowerCase().includes(text) ||

        product.categoriesText.toLowerCase().includes(text) ||

        product.colors.some((color) => color.name.toLowerCase().includes(text));



      const statusMatch = status === "all" || product.status === status;

      const categoryMatch =

        category === "all" ||

        product.categories.some((item) => item.id === category);

      const typeMatch =

        productType === "all" ||

        (productType === "color" && product.isColor) ||

        (productType === "no-color" && !product.isColor);

      const stockMatch =

        stockStatus === "all" ||

        (stockStatus === "in" && product.totalStock >= 10) ||

        (stockStatus === "low" && product.totalStock > 0 && product.totalStock < 10) ||

        (stockStatus === "out" && product.totalStock <= 0);

      const seoMatch =

        seoStatus === "all" ||

        (seoStatus === "good" && product.seoScore >= 80) ||

        (seoStatus === "warning" &&

          product.seoScore >= 60 &&

          product.seoScore < 80) ||

        (seoStatus === "poor" && product.seoScore < 60);



      return (

        searchMatch &&

        statusMatch &&

        categoryMatch &&

        typeMatch &&

        stockMatch &&

        seoMatch

      );

    });

  }, [products, search, status, category, productType, stockStatus, seoStatus]);



  const visibleIds = filteredProducts.map((product) => product.id);

  const allVisibleSelected =

    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));



  const clearFilters = () => {

    setSearch("");

    setStatus("all");

    setCategory("all");

    setProductType("all");

    setStockStatus("all");

    setSeoStatus("all");

  };



  const toggleAllVisible = () => {

    if (allVisibleSelected) {

      setSelectedIds((current) =>

        current.filter((id) => !visibleIds.includes(id))

      );

      return;

    }



    setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);

  };



  const toggleSelected = (id) => {

    setSelectedIds((current) =>

      current.includes(id)

        ? current.filter((item) => item !== id)

        : [...current, id]

    );

  };



  const updateSelectedStatus = async (nextActive) => {

    for (const id of selectedIds) {

      await apiFetch(`/api/products/${id}`, {

        method: "PATCH",

        body: { isActive: nextActive },

      });

    }



    setProducts((current) =>

      current.map((product) =>

        selectedIds.includes(product.id)

          ? {

              ...product,

              isActive: nextActive,

              status: nextActive ? "active" : "inactive",

            }

          : product

      )

    );

  };



  const deleteSelected = async () => {

    const selectedProducts = products.filter((product) =>

      selectedIds.includes(product.id)

    );



    const confirmed = await confirmAdminAction({

      title: "Move selected products to Trash?",

      itemName: `${selectedProducts.length} product${

        selectedProducts.length === 1 ? "" : "s"

      }`,

      description:

        "Selected products will move to Trash. Product images are preserved until permanent deletion.",

      confirmLabel: "Move to Trash",

    });



    if (!confirmed) return false;



    for (const product of selectedProducts) {

      await apiFetch(`/api/products/${product.id}`, {

        method: "DELETE",

      });

    }



    setProducts((current) =>

      current.filter((product) => !selectedIds.includes(product.id))

    );



    return true;

  };



  const deleteProduct = async (product) => {

    if (busy) return;

    const confirmed = await confirmAdminAction({

      title: "Move product to Trash?",

      itemName: product.name,

      description:

        "This product will move to Trash. Product images are preserved until permanent deletion.",

      confirmLabel: "Move to Trash",

    });

    if (!confirmed) return;

    try {

      setBusy(true);

      setError("");

      setSuccess("");

      await apiFetch(`/api/products/${product.id}`, { method: "DELETE" });

      setProducts((current) =>

        current.filter((item) => item.id !== product.id)

      );

      setSelectedIds((current) => current.filter((id) => id !== product.id));

      setSuccess("Product moved to Trash.");

    } catch (deleteError) {

      setError(getErrorMessage(deleteError, "Unable to delete product."));

    } finally {

      setBusy(false);

    }

  };



  const exportSelected = () => {

    const rows = products.filter((product) => selectedIds.includes(product.id));

    const csv = [

      [

        "ID",

        "Product",

        "Slug",

        "Type",

        "Categories",

        "Stock",

        "SEO Score",

        "Focus Keyword",

        "Status",

      ],

      ...rows.map((product) => [

        product.id,

        product.name,

        product.slug,

        product.isColor ? "Color" : "No Color",

        product.categories.map((item) => item.name).join(" | "),

        product.totalStock,

        product.seoScore,

        product.focusKeyword,

        product.isActive ? "Published" : "Unpublished",

      ]),

    ]

      .map((row) => row.map(escapeCsv).join(","))

      .join("\n");



    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `hivrasoft-products-${new Date()

      .toISOString()

      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

  };



  const applyBulkAction = async () => {

    if (!bulkAction) {

      setError("Choose a bulk action first.");

      return;

    }



    if (!selectedIds.length) {

      setError("Select at least one product first.");

      return;

    }



    try {

      setBusy(true);

      setError("");

      setSuccess("");



      if (bulkAction === "export") {

        exportSelected();

        setSuccess(`${selectedIds.length} selected products exported.`);

      }



      if (bulkAction === "publish") {

        await updateSelectedStatus(true);

        setSuccess(`${selectedIds.length} selected products published.`);

      }



      if (bulkAction === "unpublish") {

        await updateSelectedStatus(false);

        setSuccess(`${selectedIds.length} selected products unpublished.`);

      }



      if (bulkAction === "trash") {

        const deleted = await deleteSelected();

        if (!deleted) return;

        setSuccess(`${selectedIds.length} selected products moved to Trash.`);

        setSelectedIds([]);

      }



      setBulkAction("");

    } catch (actionError) {

      setError(getErrorMessage(actionError, "Bulk action failed."));

    } finally {

      setBusy(false);

    }

  };



  const hasFilters =

    search ||

    status !== "all" ||

    category !== "all" ||

    productType !== "all" ||

    stockStatus !== "all" ||

    seoStatus !== "all";



  return (

    <div className="mx-auto w-full min-w-0 max-w-[1600px] overflow-x-hidden">

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8C1839]">

            Catalog Management

          </p>

          <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-[#211A18]">

            All Products

          </h1>

          <p className="mt-1 text-[11px] leading-5 text-[#211A18]/45">

            Filter products, manage stock by color/size, review SEO scores and run bulk actions.

          </p>

        </div>



        <Link

          href="/admin/products/new"

          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#8C1839] px-6 text-[9px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#211A18]"

        >

          + Add Product

        </Link>

      </div>



      {error ? <Message tone="error">{error}</Message> : null}

      {success ? <Message tone="success">{success}</Message> : null}



      <section className="mt-6 rounded-2xl border border-[#211A18]/10 bg-white p-4">

        <div className="grid gap-3 lg:grid-cols-[260px_auto_minmax(280px,1fr)] lg:items-center">

          <div className="flex gap-2">

            <select

              value={bulkAction}

              onChange={(event) => setBulkAction(event.target.value)}

              className="h-11 min-w-0 flex-1 rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[11px] outline-none focus:border-[#8C1839]"

            >

              <option value="">Bulk actions</option>

              <option value="export">Export selected as CSV</option>

              <option value="publish">Publish selected</option>

              <option value="unpublish">Unpublish selected</option>

              <option value="trash">Move selected to Trash</option>

            </select>



            <button

              type="button"

              disabled={busy}

              onClick={() => void applyBulkAction()}

              className="h-11 rounded-xl border border-[#8C1839]/20 bg-white px-4 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8C1839] transition hover:bg-[#8C1839] hover:text-white disabled:opacity-50"

            >

              Apply

            </button>

          </div>



          <p className="flex items-center text-[10px] font-medium text-[#211A18]/45">

            {selectedIds.length} selected

          </p>



          <div className="flex h-11 items-center gap-3 rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-4 focus-within:border-[#8C1839]">

            <Search size={15} className="text-[#211A18]/35" />

            <input

              type="search"

              value={search}

              onChange={(event) => setSearch(event.target.value)}

              placeholder="Search by product, ID, slug, color or category..."

              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#211A18]/30"

            />

          </div>

        </div>



        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">

          <FilterSelect value={category} onChange={setCategory}>

            <option value="all">All categories</option>

            {categoryOptions.map((item) => (

              <option key={item.id} value={item.id}>

                {item.name}

              </option>

            ))}

          </FilterSelect>



          <FilterSelect value={productType} onChange={setProductType}>

            <option value="all">All product types</option>

            <option value="color">Color products</option>

            <option value="no-color">No Color products</option>

          </FilterSelect>



          <FilterSelect value={stockStatus} onChange={setStockStatus}>

            <option value="all">All stock status</option>

            <option value="in">In stock (10+)</option>

            <option value="low">Low stock (1-9)</option>

            <option value="out">Out of stock</option>

          </FilterSelect>



          <FilterSelect value={seoStatus} onChange={setSeoStatus}>

            <option value="all">All SEO scores</option>

            <option value="good">SEO 80-100</option>

            <option value="warning">SEO 60-79</option>

            <option value="poor">SEO 0-59</option>

          </FilterSelect>



          <FilterSelect value={status} onChange={setStatus}>

            <option value="all">All status</option>

            <option value="active">Published</option>

            <option value="inactive">Unpublished</option>

          </FilterSelect>



          <button

            type="button"

            disabled={loading}

            onClick={() => void loadProducts()}

            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#211A18]/10 bg-white px-4 text-[9px] font-bold uppercase tracking-[0.08em] text-[#211A18]/65 transition hover:border-[#8C1839]/20 hover:text-[#8C1839] disabled:opacity-50"

          >

            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />

            Refresh

          </button>

        </div>

      </section>



      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

        <p className="text-[9px] text-[#211A18]/40">

          Showing <strong className="text-[#211A18]">{filteredProducts.length}</strong> of{" "}

          <strong className="text-[#211A18]">{products.length}</strong> products

        </p>



        {hasFilters ? (

          <button

            type="button"

            onClick={clearFilters}

            className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#8C1839] hover:underline"

          >

            Clear Filters

          </button>

        ) : null}

      </div>



      <section className="mt-3 w-full min-w-0 overflow-hidden rounded-2xl border border-[#211A18]/10 bg-white shadow-sm">

        <div className="w-full">

          <div className="grid w-full min-w-0 items-center gap-3 border-b border-[#211A18]/10 bg-[#FAF8F6] px-4 py-3.5"
            style={{ gridTemplateColumns: "32px minmax(260px,1.7fr) 72px 104px minmax(170px,1.05fr) 116px 90px 108px" }}>

            <input

              type="checkbox"

              checked={allVisibleSelected}

              onChange={toggleAllVisible}

              aria-label="Select all visible products"

              className="h-4 w-4 cursor-pointer accent-[#8C1839]"

            />

            <ColumnTitle>Product</ColumnTitle>

            <ColumnTitle>Type</ColumnTitle>

            <ColumnTitle>Colors</ColumnTitle>

            <ColumnTitle>Stock</ColumnTitle>

            <ColumnTitle>SEO Details</ColumnTitle>

            <ColumnTitle>Status</ColumnTitle>

            <ColumnTitle>Actions</ColumnTitle>

          </div>



          {loading ? (

            <div className="grid min-h-[300px] place-items-center text-[10px] font-semibold uppercase tracking-[0.1em] text-[#211A18]/35">

              Loading products...

            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="grid min-h-[300px] place-items-center text-center">

              <div>

                <p className="text-sm font-semibold text-[#211A18]">No products found.</p>

                <p className="mt-1 text-[10px] text-[#211A18]/40">

                  Change filters or add a new product.

                </p>

              </div>

            </div>

          ) : (

            filteredProducts.map((product) => (

              <ProductRow

                key={product.id}

                product={product}

                selected={selectedIds.includes(product.id)}

                onToggleSelected={() => toggleSelected(product.id)}

                onDelete={() => void deleteProduct(product)}

                busy={busy}

              />

            ))

          )}

        </div>

      </section>

    </div>

  );

}



function ProductRow({ product, selected, onToggleSelected, onDelete, busy }) {

  const [selectedColorId, setSelectedColorId] = useState(

    product.colors.find((color) => color.isDefault)?.id || product.colors[0]?.id || ""

  );



  const selectedColor =

    product.colors.find((color) => color.id === selectedColorId) ||

    product.colors[0] ||

    null;

  const totalStockTone = stockTone(product.totalStock);

  const currentSeoScore = selectedColor?.seoScore ?? product.seoScore;

  const currentFocusKeyword =

    selectedColor?.focusKeyword || product.focusKeyword;

  const seo = seoTone(currentSeoScore);



  return (

    <div className="grid w-full min-w-0 items-start gap-3 border-b border-[#211A18]/10 px-4 py-4 transition-colors last:border-b-0 hover:bg-[#FFFCFB]"
      style={{ gridTemplateColumns: "32px minmax(260px,1.7fr) 72px 104px minmax(170px,1.05fr) 116px 90px 108px" }}>

      <div className="pt-7">

        <input

          type="checkbox"

          checked={selected}

          onChange={onToggleSelected}

          aria-label={`Select ${product.name}`}

          className="h-4 w-4 cursor-pointer accent-[#8C1839]"

        />

      </div>



      <div className="flex min-w-0 items-center gap-4">

        <div className="h-[72px] w-[58px] shrink-0 overflow-hidden rounded-xl border border-[#211A18]/8 bg-[#F3EEE8]">

          {product.image ? (

            <img

              src={product.image}

              alt={product.name}

              className="h-full w-full object-cover"

            />

          ) : (

            <div className="grid h-full place-items-center px-2 text-center text-[7px] font-semibold uppercase text-[#211A18]/25">

              No Image

            </div>

          )}

        </div>



        <div className="min-w-0">

          <p className="truncate text-[12px] font-semibold text-[#211A18]">

            {product.name}

          </p>

          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#211A18]/40">

            {product.shortDescription || "No description"}

          </p>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[7px]">

            <span className="text-[#211A18]/30">{product.id}</span>

            {product.categoryName ? (

              <span className="text-[#8C1839]/60">{product.categoryName}</span>

            ) : null}

          </div>

        </div>

      </div>



      <div className="pt-5">

        <span

          className={`inline-flex rounded-full px-3 py-2 text-[7px] font-semibold uppercase ${

            product.isColor

              ? "bg-[#F8E5E8] text-[#8C1839]"

              : "bg-[#F4F0ED] text-[#211A18]/60"

          }`}

        >

          {product.isColor ? "Color" : "No Color"}

        </span>

      </div>



      <div className="pt-3">

        {product.isColor && product.colors.length ? (

          <div className="grid w-fit grid-cols-3 gap-1.5">

            {product.colors.map((color) => {

              const active = selectedColor?.id === color.id;

              return (

                <button

                  key={color.id}

                  type="button"

                  title={color.name}

                  aria-label={`${color.name} stock`}

                  aria-pressed={active}

                  onClick={() => setSelectedColorId(color.id)}

                  className={`group relative h-7 w-7 rounded-full border-2 p-[2px] transition ${

                    active

                      ? "border-[#8C1839] shadow-[0_0_0_2px_rgba(140,24,57,0.10)]"

                      : "border-black/10 hover:border-[#8C1839]/40"

                  }`}

                >

                  <span

                    className="block h-full w-full rounded-full border border-black/5"

                    style={{ backgroundColor: color.hex || "#D9D9D9" }}

                  />

                  <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#211A18] px-2 py-1 text-[7px] font-medium text-white shadow-lg group-hover:block">

                    {color.name}

                  </span>

                </button>

              );

            })}

          </div>

        ) : (

          <span className="text-[9px] text-[#211A18]/35">No color selector</span>

        )}

      </div>



      <div className="pt-1">

        <div className="flex items-center gap-2">

          <span className="text-[13px] font-bold text-[#211A18]">{product.totalStock}</span>

          <span className={`text-[7px] font-semibold ${totalStockTone.text}`}>

            {totalStockTone.label}

          </span>

        </div>



        {selectedColor ? (

          <div className="mt-2 max-w-[175px] rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] p-2.5">

            <p className="mb-2 truncate text-[8px] font-bold text-[#8C1839]">

              {selectedColor.name}

            </p>

            <div className="flex flex-wrap gap-1.5">

              {selectedColor.sizes.length ? (

                selectedColor.sizes.map((size) => {

                  const tone = stockTone(size.stock);

                  return (

                    <div

                      key={size.id}

                      title={`${selectedColor.name} / ${size.size}: ${size.stock} in stock`}

                      className={`min-w-[42px] rounded-lg border px-2 py-1.5 text-center ${tone.bg}`}

                    >

                      <div className="text-[8px] font-black text-[#211A18]">{size.size}</div>

                      <div className={`mt-0.5 text-[8px] font-bold ${tone.text}`}>{size.stock}</div>

                    </div>

                  );

                })

              ) : (

                <span className="text-[8px] text-[#211A18]/35">No sizes</span>

              )}

            </div>

          </div>

        ) : null}

      </div>



      <div className="pt-3">

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black ${seo.badge}`}>

          <span className={`h-2 w-2 rounded-full ${seo.dot}`} />

          {currentSeoScore} / 100

        </div>

        <p className="mt-2 line-clamp-2 text-[8px] leading-4 text-[#211A18]/45">

          <strong className="text-[#211A18]/65">Keyword:</strong>{" "}

          {currentFocusKeyword || "Not set"}

        </p>

        <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/35">

          {seo.label}

        </p>

      </div>



      <div className="pt-5">

        <StatusBadge active={product.isActive} />

      </div>



      <div className="flex min-w-0 items-center gap-1.5 pt-4">

        <Link

          href={`/admin/products/${product.id}/edit`}

          title="Edit product"

          aria-label={`Edit ${product.name}`}

          className="grid h-8 w-8 place-items-center rounded-lg border border-[#211A18]/10 bg-white text-[#211A18]/65 transition hover:-translate-y-0.5 hover:border-[#8C1839]/30 hover:bg-[#FFF7F8] hover:text-[#8C1839] hover:shadow-sm"

        >

          <Pencil size={14} />

        </Link>



        {product.slug ? (

          <Link

            href={`/product/${product.slug}`}

            target="_blank"

            rel="noopener noreferrer"

            title="View product"

            aria-label={`View ${product.name}`}

            className="grid h-8 w-8 place-items-center rounded-lg border border-[#8C1839]/15 bg-[#FFF7F8] text-[#8C1839] transition hover:-translate-y-0.5 hover:bg-[#8C1839] hover:text-white hover:shadow-sm"

          >

            <Eye size={15} />

          </Link>

        ) : null}

        <button

          type="button"

          disabled={busy}

          onClick={onDelete}

          title="Delete product"

          aria-label={`Delete ${product.name}`}

          className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45"

        >

          <Trash2 size={14} />

        </button>

      </div>

    </div>

  );

}



function FilterSelect({ value, onChange, children }) {

  return (

    <select

      value={value}

      onChange={(event) => onChange(event.target.value)}

      className="h-11 w-full rounded-xl border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[10px] text-[#211A18]/75 outline-none transition focus:border-[#8C1839] focus:ring-2 focus:ring-[#8C1839]/10"

    >

      {children}

    </select>

  );

}



function StatusBadge({ active }) {

  return (

    <span

      className={`inline-flex rounded-full px-3 py-2 text-[7px] font-bold uppercase tracking-[0.06em] ${

        active

          ? "bg-emerald-50 text-emerald-700"

          : "bg-[#F4F0ED] text-[#211A18]/55"

      }`}

    >

      {active ? "Published" : "Unpublished"}

    </span>

  );

}



function ColumnTitle({ children }) {

  return (

    <p className="whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.13em] text-[#211A18]/45">

      {children}

    </p>

  );

}



function Message({ tone, children }) {

  return (

    <div

      className={`mt-5 rounded-xl border px-4 py-3 text-[10px] font-medium ${

        tone === "error"

          ? "border-red-100 bg-red-50 text-red-700"

          : "border-emerald-100 bg-emerald-50 text-emerald-700"

      }`}

    >

      {children}

    </div>

  );

}
