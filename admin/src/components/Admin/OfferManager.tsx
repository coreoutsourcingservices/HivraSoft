"use client";

import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Gift, IndianRupee, Pencil, Trash2 } from "lucide-react";
import OfferTargetSelector from "./OfferTargetSelector";
import OfferImageField, { type OfferImage } from "./OfferImageField";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type OfferType = "buy_get" | "fixed_price_bundle";

type Offer = {
  _id: string;
  name: string;
  slug?: string;
  offerType: OfferType;
  buyQuantity: number;
  getQuantity: number;
  getPrice?: number;
  fixedPrice: number;
  appliesToAllProducts: boolean;
  productIds: string[];
  categoryIds: string[];
  image?: OfferImage | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type HistoryItem = {
  _id?: string;
  offerId?: string;
  action?: string;
  name?: string;
  slug?: string;
  offerType?: OfferType;
  buyQuantity?: number;
  getQuantity?: number;
  getPrice?: number;
  fixedPrice?: number;
  appliesToAllProducts?: boolean;
  productCount?: number;
  categoryCount?: number;
  isActive?: boolean;
  changedAt?: string;
};

type Props = { type: OfferType };

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

function dateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OfferManager({ type }: Props) {
  const isBuyGet = type === "buy_get";
  const endpoint = isBuyGet ? "buy-get" : "fixed-price-bundle";
  const title = isBuyGet ? "Buy & Get Offer" : "Fixed Price Bundle";
  const description = isBuyGet
    ? "Set Buy/Get quantities and the price of each Get item (₹0 = Free). The cheapest eligible items receive the special price."
    : "Set the minimum eligible product quantity and the fixed per-product price. Once the quantity is reached, every eligible cart unit uses the fixed price when it gives the customer a discount.";

  const [offers, setOffers] = useState<Offer[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [buyQuantity, setBuyQuantity] = useState(isBuyGet ? "3" : "4");
  const [getQuantity, setGetQuantity] = useState("1");
  const [getPrice, setGetPrice] = useState("0");
  const [fixedPrice, setFixedPrice] = useState("499");
  const [appliesToAllProducts, setAppliesToAllProducts] = useState(false);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<OfferImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const preview = useMemo(() => {
    const buy = Math.max(0, Number(buyQuantity || 0));
    if (isBuyGet) {
      const get = Math.max(0, Number(getQuantity || 0));
      const price = Number(getPrice || 0);
      return `Buy ${buy || "X"} + Get ${get || "Y"} ${price === 0 ? "Free" : `@ ${money(price)} each`}`;
    }
    return `Buy ${buy || "X"}+ → ${money(Number(fixedPrice || 0))} each`;
  }, [buyQuantity, fixedPrice, getQuantity, getPrice, isBuyGet]);

  async function loadOffers() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/offers/${endpoint}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load offers.");
      setOffers(Array.isArray(data?.offers) ? data.offers : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load offers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  function resetForm() {
    setEditingId("");
    setName("");
    setSlug("");
    setBuyQuantity(isBuyGet ? "3" : "4");
    setGetQuantity("1");
    setGetPrice("0");
    setFixedPrice("499");
    setAppliesToAllProducts(false);
    setProductIds([]);
    setCategoryIds([]);
    setIsActive(true);
    setImage(null);
  }

  function editOffer(offer: Offer) {
    setEditingId(offer._id);
    setName(offer.name || "");
    setSlug(offer.slug || slugify(offer.name || ""));
    setBuyQuantity(String(offer.buyQuantity || (isBuyGet ? 3 : 4)));
    setGetQuantity(String(offer.getQuantity || 1));
    setGetPrice(String(offer.getPrice ?? 0));
    setFixedPrice(String(offer.fixedPrice || 0));
    setAppliesToAllProducts(Boolean(offer.appliesToAllProducts));
    setProductIds(Array.isArray(offer.productIds) ? offer.productIds.map(String) : []);
    setCategoryIds(Array.isArray(offer.categoryIds) ? offer.categoryIds.map(String) : []);
    setIsActive(offer.isActive === true);
    setImage(offer.image?.url && offer.image?.publicId ? offer.image : null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveOffer() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (uploadingImage) throw new Error("Wait for the Cloudinary upload to finish.");
      const buy = Number(buyQuantity);
      const get = Number(getQuantity);
      const getItemPrice = Number(getPrice);
      const price = Number(fixedPrice);
      if (!Number.isInteger(buy) || buy < 1 || buy > 999) {
        throw new Error("Buy quantity must be a whole number between 1 and 999.");
      }
      if (isBuyGet && (!Number.isInteger(get) || get < 1 || get > 999)) {
        throw new Error("Get quantity must be a whole number between 1 and 999.");
      }
      if (isBuyGet && (getPrice.trim() === "" || !Number.isFinite(getItemPrice) || getItemPrice < 0)) {
        throw new Error("Get product price must be ₹0 or greater.");
      }
      if (!isBuyGet && (!Number.isFinite(price) || price <= 0)) {
        throw new Error("Fixed price must be greater than 0.");
      }
      if (!appliesToAllProducts && productIds.length === 0 && categoryIds.length === 0) {
        throw new Error("Choose at least one product or category, or enable All Products.");
      }

      const response = await fetch(
        editingId
          ? `${API_URL}/api/admin/offers/${endpoint}/${editingId}`
          : `${API_URL}/api/admin/offers/${endpoint}`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerType: type,
            name: name.trim(),
            slug: slugify(slug || name),
            buyQuantity: buy,
            getQuantity: isBuyGet ? get : 0,
            getPrice: isBuyGet ? getItemPrice : 0,
            fixedPrice: isBuyGet ? 0 : price,
            appliesToAllProducts,
            productIds: appliesToAllProducts ? [] : productIds,
            categoryIds: appliesToAllProducts ? [] : categoryIds,
            isActive,
            image,
          }),
        }
      );
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to save offer.");
      setSuccess(data?.message || "Offer saved.");
      resetForm();
      await loadOffers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save offer.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    try {
      setBusyId(offer._id);
      setError("");
      setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/offers/${endpoint}/${offer._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to update offer status.");
      setSuccess(data?.message || "Offer updated.");
      await loadOffers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update offer status.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteOffer(offer: Offer) {
    const confirmed = await confirmAdminAction({
      title: "Delete Offer?",
      itemName: offer.name,
      description: "The offer will move to Trash for 30 days and will stop applying on the storefront immediately.",
      confirmLabel: "Move to Trash",
    });
    if (!confirmed) return;
    try {
      setBusyId(offer._id);
      setError("");
      setSuccess("");
      const response = await fetch(`${API_URL}/api/admin/offers/${endpoint}/${offer._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to delete offer.");
      setSuccess(data?.message || "Offer deleted.");
      if (editingId === offer._id) resetForm();
      await loadOffers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete offer.");
    } finally {
      setBusyId("");
    }
  }

  function handleAllProducts(value: boolean) {
    setAppliesToAllProducts(value);
    if (value) {
      setProductIds([]);
      setCategoryIds([]);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-8">
      <section className="rounded-[30px] bg-[#211A18] px-6 py-7 text-white md:px-8 md:py-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Offers</p>
            <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.03em] md:text-[30px]">{title}</h2>
            <p className="mt-3 max-w-3xl text-[12px] leading-6 text-white/65 md:text-[13px]">{description}</p>
          </div>
          <div className="flex min-w-[230px] items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.06] px-5 py-4">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#A51D45]">
              {isBuyGet ? <Gift size={20} /> : <IndianRupee size={20} />}
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/45">Active offers</p>
              <p className="mt-1 text-[24px] font-semibold">{offers.filter((offer) => offer.isActive).length}</p>
            </div>
          </div>
        </div>
      </section>

      {(error || success) && (
        <div
          className={`mt-5 rounded-[16px] border px-4 py-3 text-[12px] ${
            error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-semibold">{editingId ? "Edit Offer" : "Add Offer"}</h3>
              <p className="mt-1 text-[10px] text-[#211A18]/45">Preview: {preview}</p>
            </div>
            {editingId && (
              <button type="button" disabled={saving || uploadingImage} onClick={resetForm} className="text-[10px] font-semibold text-[#A51D45] disabled:opacity-50">
                Cancel edit
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Offer name (optional)">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => {
                  if (!slug) setSlug(slugify(name));
                }}
                placeholder={isBuyGet ? "Buy 3 Get 1 @ ₹1" : "Any 4 @ ₹499 Each"}
                className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none focus:border-[#A51D45]/40"
              />
            </Field>

            <Field label="Slug">
              <div>
                <input
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  placeholder={isBuyGet ? "buy-3-get-1-at-1" : "any-4-at-499-each"}
                  className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none focus:border-[#A51D45]/40"
                />
                <p className="mt-1.5 text-[9px] leading-4 text-[#211A18]/40">
                  Database me save hoga. Empty chhodne par offer name se auto slug banega.
                </p>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Buy quantity">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={buyQuantity}
                  onChange={(event) => setBuyQuantity(event.target.value)}
                  className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none"
                />
              </Field>
              {isBuyGet ? (
                <Field label="Get quantity">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={getQuantity}
                    onChange={(event) => setGetQuantity(event.target.value)}
                    className="h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[12px] outline-none"
                  />
                </Field>
              ) : (
                <Field label="Fixed price / product">
                  <div className="flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                    <span className="mr-2 text-[12px]">₹</span>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={fixedPrice}
                      onChange={(event) => setFixedPrice(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
                    />
                  </div>
                </Field>
              )}
            </div>

            {isBuyGet && (
              <Field label="Price per Get product (₹0 = Free)">
                <div className="flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
                  <span className="mr-2 text-[12px]">₹</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={getPrice}
                    onChange={(event) => setGetPrice(event.target.value)}
                    placeholder="0 / 1 / 100"
                    className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#211A18]/50">Example: Buy 3 + Get 1 for ₹1 or ₹100. Use ₹0 for free.</p>
              </Field>
            )}

            <OfferImageField
              value={image}
              onChange={setImage}
              offerType={type}
              disabled={saving}
              onUploadingChange={setUploadingImage}
            />

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[16px] bg-[#FAF8F6] px-4 py-4">
              <span>
                <span className="block text-[12px] font-semibold">Active</span>
                <span className="mt-1 block text-[10px] text-[#211A18]/45">Only active offers affect cart pricing.</span>
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 accent-[#A51D45]"
              />
            </label>

            <button
              type="button"
              disabled={saving || uploadingImage}
              onClick={() => void saveOffer()}
              className="h-12 w-full rounded-[14px] bg-[#A51D45] text-[11px] font-semibold uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingImage ? "Uploading image..." : saving ? "Saving..." : editingId ? "Update Offer" : "Add Offer"}
            </button>
          </div>
        </section>

        <OfferTargetSelector
          appliesToAllProducts={appliesToAllProducts}
          onAllProductsChange={handleAllProducts}
          selectedProductIds={productIds}
          onProductIdsChange={setProductIds}
          selectedCategoryIds={categoryIds}
          onCategoryIdsChange={setCategoryIds}
          disabled={saving}
        />
      </div>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-[#211A18]/8 pb-5">
          <div>
            <h3 className="text-[18px] font-semibold">Current {title}s</h3>
            <p className="mt-1 text-[10px] text-[#211A18]/45">Edit, activate/deactivate or delete a rule.</p>
          </div>
          <span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">
            {offers.length} total
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead>
              <tr className="border-b border-[#211A18]/8 text-[9px] uppercase tracking-[0.12em] text-[#211A18]/35">
                <th className="px-3 py-3 font-semibold">Offer</th>
                <th className="px-3 py-3 font-semibold">Rule</th>
                <th className="px-3 py-3 font-semibold">Targets</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <RowMessage text="Loading offers..." />
              ) : offers.length === 0 ? (
                <RowMessage text="No offers created yet." />
              ) : (
                offers.map((offer) => (
                  <tr key={offer._id} className="border-b border-[#211A18]/6 text-[11px] last:border-0">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {offer.image?.url ? (
                          <img src={offer.image.url} alt={offer.name} className="h-12 w-12 shrink-0 rounded-xl border border-[#211A18]/10 object-cover" />
                        ) : null}
                        <div className="min-w-0"><p className="font-semibold">{offer.name}</p>
                        {offer.image?.publicId ? <p className="mt-1 max-w-[190px] truncate text-[9px] text-[#211A18]/40" title={offer.image.publicId}>{offer.image.publicId}</p> : null}</div>
                      </div>
                      <p className="mt-1 text-[9px] text-[#A51D45]/70">/{offer.slug || slugify(offer.name || "")}</p>
                      <p className="mt-1 text-[9px] text-[#211A18]/40">Updated {dateTime(offer.updatedAt)}</p>
                    </td>
                    <td className="px-3 py-4 font-medium">
                      {offer.offerType === "buy_get"
                        ? `Buy ${offer.buyQuantity} + Get ${offer.getQuantity} ${Number(offer.getPrice ?? 0) === 0 ? "Free" : `@ ${money(Number(offer.getPrice))} each`}`
                        : `Buy ${offer.buyQuantity}+ @ ${money(offer.fixedPrice)} each`}
                    </td>
                    <td className="px-3 py-4 text-[#211A18]/60">
                      {offer.appliesToAllProducts
                        ? "All Products"
                        : `${offer.productIds?.length || 0} products + ${offer.categoryIds?.length || 0} categories`}
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        disabled={busyId === offer._id || uploadingImage || saving}
                        onClick={() => void toggleOffer(offer)}
                        className={`rounded-full px-3 py-1.5 text-[9px] font-semibold ${
                          offer.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F2EEEA] text-[#211A18]/50"
                        }`}
                      >
                        {offer.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={uploadingImage || saving}
                          onClick={() => editOffer(offer)}
                          className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#211A18]/10 hover:bg-[#FAF8F6] disabled:opacity-50"
                          title="Edit offer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === offer._id || uploadingImage || saving}
                          onClick={() => void deleteOffer(offer)}
                          className="grid h-9 w-9 place-items-center rounded-[10px] border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete offer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="border-b border-[#211A18]/8 pb-5">
          <h3 className="text-[18px] font-semibold">Offer History</h3>
          <p className="mt-1 text-[10px] text-[#211A18]/45">Create, edit, status and delete changes are kept here.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[820px] w-full text-left">
            <thead>
              <tr className="border-b border-[#211A18]/8 text-[9px] uppercase tracking-[0.12em] text-[#211A18]/35">
                <th className="px-3 py-3 font-semibold">Changed</th>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">Offer</th>
                <th className="px-3 py-3 font-semibold">Rule</th>
                <th className="px-3 py-3 font-semibold">Targets</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-[11px] text-[#211A18]/40">No history yet.</td></tr>
              ) : (
                history.slice(0, 30).map((item, index) => (
                  <tr key={`${item.offerId || "history"}-${item._id || index}`} className="border-b border-[#211A18]/6 text-[10px] last:border-0">
                    <td className="px-3 py-4 text-[#211A18]/55">{dateTime(item.changedAt)}</td>
                    <td className="px-3 py-4 font-medium capitalize">{String(item.action || "updated").replace(/_/g, " ")}</td>
                    <td className="px-3 py-4 font-medium">
                      <p>{item.name || "Offer"}</p>
                      <p className="mt-1 text-[9px] font-normal text-[#A51D45]/65">
                        /{item.slug || slugify(item.name || "")}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      {item.offerType === "buy_get"
                        ? `Buy ${item.buyQuantity || 0} + Get ${item.getQuantity || 0} ${Number(item.getPrice ?? 0) === 0 ? "Free" : `@ ${money(Number(item.getPrice))} each`}`
                        : `Buy ${item.buyQuantity || 0}+ @ ${money(Number(item.fixedPrice || 0))}`}
                    </td>
                    <td className="px-3 py-4 text-[#211A18]/55">
                      {item.appliesToAllProducts
                        ? "All Products"
                        : `${item.productCount || 0} products + ${item.categoryCount || 0} categories`}
                    </td>
                    <td className="px-3 py-4">{item.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold text-[#211A18]/65">{label}</span>
      {children}
    </label>
  );
}

function RowMessage({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={5} className="px-3 py-12 text-center text-[11px] text-[#211A18]/40">
        {text}
      </td>
    </tr>
  );
}
