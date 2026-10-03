"use client";

import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";

import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Crosshair, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  ActiveToggle,
  CategorySelect,
  formatDateTime,
  HOMEPAGE_API_URL,
  ImageUploadField,
  MultiProductPicker,
  readJson,
  type HomepageImage,
  useHomepageOptions,
} from "@/src/components/Admin/HomepageAdminShared";

type Gender = "men" | "women";
type HotspotType = "product" | "category";

type Hotspot = {
  _id?: string;
  x: number;
  y: number;
  productIds: string[];
  /** Legacy value may still come from old database records. */
  productId?: string | null;
  categoryId: string | null;
  isActive: boolean;
};

type PrimeItem = {
  _id: string;
  gender: Gender;
  mainImage: HomepageImage;
  hotspots: Hotspot[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type HistoryItem = {
  _id?: string;
  itemId: string;
  action: string;
  gender: Gender;
  hotspots?: Hotspot[];
  isActive?: boolean;
  changedAt?: string;
};

type DraftHotspot = {
  x: number;
  y: number;
  type: HotspotType;
  productIds: string[];
  categoryId: string;
  isActive: boolean;
};

const newDraft = (x = 50, y = 50): DraftHotspot => ({
  x,
  y,
  type: "product",
  productIds: [],
  categoryId: "",
  isActive: true,
});

export default function PrimeSelectionAdminPage() {
  const {
    products,
    categories,
    loading: optionsLoading,
    error: optionsError,
  } = useHomepageOptions();

  const [items, setItems] = useState<PrimeItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState("");
  const [gender, setGender] = useState<Gender>("women");
  const [mainImage, setMainImage] = useState<HomepageImage | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState<DraftHotspot | null>(null);
  const [editingHotspotIndex, setEditingHotspotIndex] = useState<number | null>(
    null,
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product._id, product.name])),
    [products],
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category._id, category.name])),
    [categories],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${HOMEPAGE_API_URL}/api/admin/prime-selection`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load Prime Selection.");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Prime Selection.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetHotspotEditor() {
    setDraft(null);
    setEditingHotspotIndex(null);
    setPlacing(false);
  }

  function resetForm() {
    setEditingId("");
    setGender("women");
    setMainImage(null);
    setHotspots([]);
    setIsActive(true);
    resetHotspotEditor();
  }

  function normalizeHotspotForState(hotspot: Hotspot): Hotspot {
    const productIds =
      Array.isArray(hotspot.productIds) && hotspot.productIds.length > 0
        ? hotspot.productIds
            .map((id: any) => String(id?._id || id))
            .filter(Boolean)
        : hotspot.productId
          ? [String((hotspot.productId as any)?._id || hotspot.productId)]
          : [];

    return {
      _id: hotspot._id ? String(hotspot._id) : undefined,
      x: Number(hotspot.x || 0),
      y: Number(hotspot.y || 0),
      productIds,
      productId: null,
      categoryId: hotspot.categoryId
        ? String((hotspot.categoryId as any)?._id || hotspot.categoryId)
        : null,
      isActive: hotspot.isActive !== false,
    };
  }

  function editItem(item: PrimeItem) {
    setEditingId(item._id);
    setGender(item.gender);
    setMainImage(item.mainImage || null);
    setHotspots(
      Array.isArray(item.hotspots)
        ? item.hotspots.map(normalizeHotspotForState)
        : [],
    );
    setIsActive(item.isActive !== false);
    resetHotspotEditor();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleImageClick(event: MouseEvent<HTMLDivElement>) {
    if (!placing || !mainImage?.url) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
    );

    setDraft(newDraft(Number(x.toFixed(2)), Number(y.toFixed(2))));
    setEditingHotspotIndex(null);
    setPlacing(false);
  }

  function editHotspot(index: number) {
    const hotspot = hotspots[index];
    if (!hotspot) return;

    setEditingHotspotIndex(index);
    setDraft({
      x: Number(hotspot.x),
      y: Number(hotspot.y),
      type: hotspot.categoryId ? "category" : "product",
      productIds: Array.isArray(hotspot.productIds)
        ? hotspot.productIds
        : [],
      categoryId: hotspot.categoryId || "",
      isActive: hotspot.isActive !== false,
    });
    setPlacing(false);
  }

  function saveHotspotDraft() {
    if (!draft) return;

    if (draft.type === "product" && draft.productIds.length === 0) {
      setError("Hotspot ke liye kam se kam 1 product select karo.");
      return;
    }

    if (draft.type === "category" && !draft.categoryId) {
      setError("Hotspot ke liye category select karo.");
      return;
    }

    const next: Hotspot = {
      ...(editingHotspotIndex !== null &&
      hotspots[editingHotspotIndex]?._id
        ? { _id: hotspots[editingHotspotIndex]._id }
        : {}),
      x: Number(draft.x.toFixed(2)),
      y: Number(draft.y.toFixed(2)),
      productIds: draft.type === "product" ? draft.productIds : [],
      productId: null,
      categoryId: draft.type === "category" ? draft.categoryId : null,
      isActive: draft.isActive,
    };

    if (editingHotspotIndex === null) {
      setHotspots((current) => [...current, next]);
    } else {
      setHotspots((current) =>
        current.map((item, index) =>
          index === editingHotspotIndex ? next : item,
        ),
      );
    }

    setError("");
    resetHotspotEditor();
  }

  function removeHotspot(index: number) {
    setHotspots((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );

    if (editingHotspotIndex === index) {
      resetHotspotEditor();
    }
  }

  function hotspotLabel(hotspot: Hotspot) {
    if (Array.isArray(hotspot.productIds) && hotspot.productIds.length > 0) {
      const names = hotspot.productIds
        .slice(0, 2)
        .map(
          (id) =>
            productMap.get(String(id)) || `Product ${String(id).slice(-6)}`,
        );

      const extra =
        hotspot.productIds.length > 2
          ? ` +${hotspot.productIds.length - 2} more`
          : "";

      return `${names.join(", ")}${extra}`;
    }

    if (hotspot.categoryId) {
      return (
        categoryMap.get(String(hotspot.categoryId)) ||
        `Category ${String(hotspot.categoryId).slice(-6)}`
      );
    }

    return "Hotspot";
  }

  async function saveItem() {
    try {
      setError("");
      setSuccess("");

      if (!mainImage?.url || !mainImage.publicId) {
        throw new Error("Main image upload is required.");
      }

      if (draft) {
        throw new Error(
          "Hotspot edit ko Save Hotspot ya Cancel karo pehle.",
        );
      }

      setSaving(true);

      const response = await fetch(
        editingId
          ? `${HOMEPAGE_API_URL}/api/admin/prime-selection/${editingId}`
          : `${HOMEPAGE_API_URL}/api/admin/prime-selection`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender,
            mainImage,
            hotspots: hotspots.map((hotspot) => ({
              x: hotspot.x,
              y: hotspot.y,
              productIds: hotspot.productIds,
              productId: null,
              categoryId: hotspot.categoryId,
              isActive: hotspot.isActive,
            })),
            isActive,
          }),
        },
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to save Prime Selection.");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setSuccess(data?.message || "Saved successfully.");
      resetForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save Prime Selection.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: PrimeItem) {
    const confirmed = await confirmAdminAction({
      title: "Delete Prime Selection?",
      itemName: item.gender === "women" ? "Women" : "Men",
      description: "This Prime Selection record and its hotspots will move to Trash for 30 days. Cloudinary media will be preserved until permanent deletion.",
      confirmLabel: "Move to Trash",
    });
    if (!confirmed) return;

    try {
      setBusyId(item._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${HOMEPAGE_API_URL}/api/admin/prime-selection/${item._id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to delete Prime Selection.");
      }

      setItems(Array.isArray(data?.items) ? data.items : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setSuccess(data?.message || "Deleted.");

      if (editingId === item._id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete Prime Selection.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="min-w-0 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 md:px-7 md:py-7 xl:px-8 xl:py-8">
      <section className="rounded-[20px] bg-[#211A18] p-4 text-white sm:rounded-[24px] sm:p-5 md:rounded-[26px] md:p-7">
        <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/45 sm:text-[9px] sm:tracking-[0.18em]">
          Homepage Management
        </p>

        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-[22px] font-semibold leading-tight sm:text-[26px] md:text-[28px]">
              PRIME SELECTION
            </h1>
            <p className="mt-2 max-w-3xl text-[11px] leading-5 text-white/55 sm:text-[12px]">
              Gender + main image save hoti hai. “Add Hotspot” dabao, image
              par click karo. Ek hotspot par multiple products select kar
              sakte ho, ya ek category link kar sakte ho. X/Y percentage
              database me save hota hai.
            </p>
          </div>

          <div className="w-full shrink-0 rounded-[14px] bg-white/[0.08] px-4 py-3 text-center text-[10px] text-white/65 sm:w-auto sm:rounded-[16px] sm:text-[11px]">
            {items.length}/2 gender records
          </div>
        </div>
      </section>

      {(error || success || optionsError) && (
        <div
          className={`mt-4 break-words rounded-[14px] border px-3 py-3 text-[11px] leading-5 sm:mt-5 sm:rounded-[16px] sm:px-4 sm:text-[12px] ${
            error || optionsError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || optionsError || success}
        </div>
      )}

      <div className="mt-5 grid min-w-0 gap-4 sm:gap-5 xl:mt-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="h-fit min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold sm:text-[18px]">
                {editingId ? "Edit Prime Selection" : "Add Prime Selection"}
              </h2>
              <p className="mt-1 text-[10px] text-[#211A18]/45">
                Men/Women ka ek-ek record.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="h-10 w-full rounded-xl border border-[#211A18]/10 px-3 text-[10px] font-semibold sm:w-auto"
              >
                Cancel edit
              </button>
            )}
          </div>

          <label className="mt-5 block min-w-0">
            <span className="text-[12px] font-semibold">Gender</span>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender)}
              className="mt-3 h-12 w-full min-w-0 rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none"
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
            </select>
          </label>

          <div className="mt-4 min-w-0 overflow-hidden">
            <ImageUploadField
              label="Main Image"
              folder={`homepage/prime-selection/${gender}`}
              value={mainImage}
              onChange={(next) => {
                setMainImage(next);
                setHotspots([]);
                resetHotspotEditor();
              }}
            />
          </div>

          <div className="mt-4 min-w-0">
            <ActiveToggle checked={isActive} onChange={setIsActive} />
          </div>

          <button
            type="button"
            onClick={() => void saveItem()}
            disabled={saving || optionsLoading}
            className="mt-5 flex h-[50px] w-full touch-manipulation items-center justify-center gap-2 rounded-[14px] bg-[#A51D45] px-3 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-50 sm:h-[52px] sm:text-[11px] sm:tracking-[0.08em]"
          >
            {editingId ? <Pencil size={14} /> : <Plus size={14} />}
            <span className="truncate">
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Prime Selection"
                  : "Save Prime Selection"}
            </span>
          </button>
        </section>

        <section className="min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 border-b border-[#211A18]/8 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold sm:text-[18px]">
                Hotspot Image Editor
              </h2>
              <p className="mt-1 text-[10px] leading-4 text-[#211A18]/45">
                Coordinates image ke percentage me save honge, isliye
                responsive frontend me same position rahegi.
              </p>
            </div>

            <button
              type="button"
              disabled={!mainImage?.url}
              onClick={() => {
                setPlacing((current) => !current);
                setDraft(null);
                setEditingHotspotIndex(null);
              }}
              className={`flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-[13px] px-4 py-3 text-[10px] font-semibold disabled:opacity-40 sm:w-auto ${
                placing
                  ? "bg-[#211A18] text-white"
                  : "bg-[#FFF1F5] text-[#A51D45]"
              }`}
            >
              <Crosshair size={14} />
              {placing ? "Click Image Now" : "+ Add Hotspot"}
            </button>
          </div>

          {!mainImage?.url ? (
            <div className="mt-5 rounded-[16px] border border-dashed border-[#211A18]/10 px-4 py-12 text-center text-[11px] text-[#211A18]/40 sm:rounded-[18px] sm:px-5 sm:py-16 sm:text-[12px]">
              Pehle main image upload karo.
            </div>
          ) : (
            <div className="mt-4 min-w-0 sm:mt-5">
              {placing && (
                <div className="mb-3 rounded-[13px] border border-[#A51D45]/15 bg-[#FFF3F7] px-3 py-3 text-[10px] font-semibold leading-4 text-[#8C1839] sm:px-4">
                  Image par exact jagah click karo jahan “+” symbol dikhana
                  hai.
                </div>
              )}

              <div
                onClick={handleImageClick}
                className={`relative w-full min-w-0 overflow-hidden rounded-[14px] border border-[#211A18]/10 bg-[#F5F2EF] sm:rounded-[18px] ${
                  placing
                    ? "cursor-crosshair ring-2 ring-[#A51D45]/25"
                    : ""
                }`}
              >
                <img
                  src={mainImage.url}
                  alt="Prime Selection hotspot editor"
                  className="block h-auto w-full select-none"
                  draggable={false}
                />

                {hotspots.map((hotspot, index) => (
                  <button
                    key={hotspot._id || `${hotspot.x}-${hotspot.y}-${index}`}
                    type="button"
                    title={hotspotLabel(hotspot)}
                    aria-label={`Edit hotspot ${index + 1}: ${hotspotLabel(hotspot)}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      editHotspot(index);
                    }}
                    className={`absolute z-10 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 touch-manipulation place-items-center rounded-full border-2 border-white text-[18px] leading-none text-white shadow-lg sm:h-7 sm:w-7 ${
                      hotspot.isActive ? "bg-[#211A18]" : "bg-zinc-400"
                    }`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                    }}
                  >
                    +
                  </button>
                ))}
              </div>
            </div>
          )}

          {draft && (
            <div className="mt-5 min-w-0 rounded-[16px] border border-[#A51D45]/15 bg-[#FFF9FB] p-3 sm:rounded-[18px] sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold">
                    {editingHotspotIndex === null
                      ? "New Hotspot"
                      : "Edit Hotspot"}
                  </h3>
                  <p className="mt-1 break-words text-[9px] text-[#211A18]/45">
                    X {draft.x.toFixed(2)}% · Y {draft.y.toFixed(2)}%
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetHotspotEditor}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#211A18]/45"
                  aria-label="Close hotspot editor"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="min-w-0">
                  <span className="text-[10px] font-semibold">
                    X position (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={draft.x}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              x: Math.max(
                                0,
                                Math.min(
                                  100,
                                  Number(event.target.value || 0),
                                ),
                              ),
                            }
                          : current,
                      )
                    }
                    className="mt-2 h-11 w-full min-w-0 rounded-[12px] border border-[#211A18]/10 bg-white px-3 text-[11px] outline-none"
                  />
                </label>

                <label className="min-w-0">
                  <span className="text-[10px] font-semibold">
                    Y position (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={draft.y}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              y: Math.max(
                                0,
                                Math.min(
                                  100,
                                  Number(event.target.value || 0),
                                ),
                              ),
                            }
                          : current,
                      )
                    }
                    className="mt-2 h-11 w-full min-w-0 rounded-[12px] border border-[#211A18]/10 bg-white px-3 text-[11px] outline-none"
                  />
                </label>
              </div>

              <label className="mt-4 block min-w-0">
                <span className="text-[10px] font-semibold">Hotspot type</span>
                <select
                  value={draft.type}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            type: event.target.value as HotspotType,
                            productIds: [],
                            categoryId: "",
                          }
                        : current,
                    )
                  }
                  className="mt-2 h-11 w-full min-w-0 rounded-[12px] border border-[#211A18]/10 bg-white px-3 text-[11px] outline-none"
                >
                  <option value="product">Product</option>
                  <option value="category">Category</option>
                </select>
              </label>

              {draft.type === "product" ? (
                <div className="mt-4 min-w-0 overflow-hidden">
                  {optionsLoading ? (
                    <div className="rounded-[14px] bg-white px-4 py-6 text-center text-[10px] text-[#211A18]/40">
                      Loading products...
                    </div>
                  ) : (
                    <div className="min-w-0 overflow-hidden">
                      <MultiProductPicker
                        products={products}
                        selectedIds={draft.productIds}
                        onChange={(productIds) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  productIds,
                                  categoryId: "",
                                }
                              : current,
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 min-w-0 overflow-hidden">
                  <CategorySelect
                    categories={categories}
                    value={draft.categoryId}
                    onChange={(categoryId) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              categoryId,
                              productIds: [],
                            }
                          : current,
                      )
                    }
                    disabled={optionsLoading}
                  />
                </div>
              )}

              <label className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-[12px] bg-white px-3 py-3 text-[10px] font-semibold">
                <span>Hotspot Active</span>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, isActive: event.target.checked }
                        : current,
                    )
                  }
                  className="h-4 w-4 shrink-0 accent-[#A51D45]"
                />
              </label>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={saveHotspotDraft}
                  className="h-11 w-full rounded-[12px] bg-[#A51D45] px-4 text-[10px] font-semibold text-white sm:flex-1"
                >
                  Save Hotspot
                </button>
                <button
                  type="button"
                  onClick={resetHotspotEditor}
                  className="h-11 w-full rounded-[12px] border border-[#211A18]/10 bg-white px-4 text-[10px] font-semibold sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 min-w-0 border-t border-[#211A18]/8 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-semibold">Hotspots</h3>
              <span className="shrink-0 rounded-full bg-[#F2EEEA] px-3 py-1 text-[9px] font-semibold">
                {hotspots.length}
              </span>
            </div>

            {hotspots.length === 0 ? (
              <div className="mt-3 rounded-[14px] bg-[#FAF8F6] px-4 py-6 text-center text-[10px] text-[#211A18]/40">
                No hotspots added.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {hotspots.map((hotspot, index) => (
                  <div
                    key={hotspot._id || index}
                    className="flex min-w-0 flex-col gap-3 rounded-[14px] bg-[#FAF8F6] p-3 sm:flex-row sm:items-center"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#211A18] text-[15px] text-white sm:h-7 sm:w-7">
                      +
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-[10px] font-semibold sm:truncate">
                        {hotspotLabel(hotspot)}
                      </p>
                      <p className="mt-1 break-words text-[9px] leading-4 text-[#211A18]/40">
                        X {hotspot.x.toFixed(2)}% · Y {hotspot.y.toFixed(2)}% ·{" "}
                        {hotspot.categoryId
                          ? "Category"
                          : `${hotspot.productIds.length} product${
                              hotspot.productIds.length === 1 ? "" : "s"
                            }`} · {hotspot.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                      <button
                        type="button"
                        onClick={() => editHotspot(index)}
                        className="h-10 rounded-lg border bg-white px-3 text-[9px] font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeHotspot(index)}
                        className="h-10 rounded-lg border border-red-100 bg-red-50 px-3 text-[9px] font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:mt-6 sm:rounded-[24px] sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 border-b border-[#211A18]/8 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold sm:text-[18px]">
              Prime Selection Records
            </h2>
            <p className="mt-1 text-[10px] leading-4 text-[#211A18]/45">
              Men/Women image + hotspots ko edit/delete karo.
            </p>
          </div>
          <span className="w-fit shrink-0 rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold">
            {items.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[12px] text-[#211A18]/40">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-[12px] text-[#211A18]/40">
            No Prime Selection record yet.
          </div>
        ) : (
          <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="min-w-0 overflow-hidden rounded-[16px] bg-[#FAF8F6] p-3 sm:rounded-[18px] sm:p-4"
              >
                <div className="overflow-hidden rounded-[12px] bg-[#F1EEEB] sm:rounded-[14px]">
                  <img
                    src={item.mainImage?.url}
                    alt={item.gender}
                    className="aspect-[16/9] h-auto w-full object-cover"
                  />
                </div>

                <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[12px] font-semibold capitalize">
                        {item.gender}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-200 text-zinc-600"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] text-[#211A18]/50">
                      {Array.isArray(item.hotspots) ? item.hotspots.length : 0}{" "}
                      hotspots
                    </p>
                    <p className="mt-1 break-words text-[9px] text-[#211A18]/35">
                      Updated {formatDateTime(item.updatedAt)}
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    <button
                      type="button"
                      onClick={() => editItem(item)}
                      className="h-10 rounded-xl border border-[#211A18]/10 bg-white px-3 text-[10px] font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item._id}
                      onClick={() => void deleteItem(item)}
                      className="flex h-10 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 text-[10px] font-semibold text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5 min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:mt-6 sm:rounded-[24px] sm:p-5 md:p-6">
        <div className="border-b border-[#211A18]/8 pb-4 sm:pb-5">
          <h2 className="text-[16px] font-semibold sm:text-[18px]">
            Prime Selection History
          </h2>
          <p className="mt-1 text-[10px] leading-4 text-[#211A18]/45">
            Create, edit, hotspot changes, status and delete history.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#211A18]/40">
            No history yet.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3 md:hidden">
              {history.map((entry, index) => (
                <div
                  key={entry._id || `${entry.itemId}-${index}`}
                  className="rounded-[14px] bg-[#FAF8F6] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold capitalize">
                      {String(entry.action || "updated").replaceAll("_", " ")}
                    </span>
                    <span className="text-[9px] text-[#211A18]/40">
                      {formatDateTime(entry.changedAt)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-[10px] bg-white p-2.5">
                      <p className="text-[8px] uppercase tracking-wide text-[#211A18]/35">
                        Gender
                      </p>
                      <p className="mt-1 font-semibold capitalize">
                        {entry.gender}
                      </p>
                    </div>
                    <div className="rounded-[10px] bg-white p-2.5">
                      <p className="text-[8px] uppercase tracking-wide text-[#211A18]/35">
                        Hotspots
                      </p>
                      <p className="mt-1 font-semibold">
                        {Array.isArray(entry.hotspots)
                          ? entry.hotspots.length
                          : 0}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-[10px] bg-white p-2.5">
                      <p className="text-[8px] uppercase tracking-wide text-[#211A18]/35">
                        Status
                      </p>
                      <p className="mt-1 font-semibold">
                        {entry.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-[11px]">
                <thead className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40">
                  <tr>
                    <th className="px-3 py-3">Changed</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Gender</th>
                    <th className="px-3 py-3">Hotspots</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, index) => (
                    <tr
                      key={entry._id || `${entry.itemId}-${index}`}
                      className="border-t border-[#211A18]/6"
                    >
                      <td className="px-3 py-3">
                        {formatDateTime(entry.changedAt)}
                      </td>
                      <td className="px-3 py-3 font-semibold capitalize">
                        {String(entry.action || "updated").replaceAll("_", " ")}
                      </td>
                      <td className="px-3 py-3 capitalize">{entry.gender}</td>
                      <td className="px-3 py-3">
                        {Array.isArray(entry.hotspots)
                          ? entry.hotspots.length
                          : 0}
                      </td>
                      <td className="px-3 py-3">
                        {entry.isActive ? "Active" : "Inactive"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
