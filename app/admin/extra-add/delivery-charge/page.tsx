"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PaymentMethod = "cod" | "online";

type HistoryItem = {
  _id?: string;
  ruleId?: string;
  action?: string;
  paymentMethod: PaymentMethod;
  minAmount: number;
  maxAmount: number | null;
  charge: number;
  isActive: boolean;
  changedAt?: string;
};

type DeliveryRule = {
  _id: string;
  paymentMethod: PaymentMethod;
  minAmount: number;
  maxAmount: number | null;
  charge: number;
  isActive: boolean;
  history?: HistoryItem[];
  createdAt?: string;
  updatedAt?: string;
};

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function dateTime(value?: string) {
  if (!value) return "—";
<<<<<<< HEAD

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

=======
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
>>>>>>> aman
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeliveryChargePage() {
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingId, setEditingId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [minAmount, setMinAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("500");
  const [charge, setCharge] = useState("40");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadRules() {
    try {
      setLoading(true);
<<<<<<< HEAD

=======
>>>>>>> aman
      const response = await fetch(`${API_URL}/api/admin/delivery-charges`, {
        credentials: "include",
        cache: "no-store",
      });
<<<<<<< HEAD

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load delivery charges.");
      }

      setRules(Array.isArray(data?.rules) ? data.rules : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load delivery charges."
      );
=======
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to load delivery charges.");
      setRules(Array.isArray(data?.rules) ? data.rules : []);
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load delivery charges.");
>>>>>>> aman
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRules();
  }, []);

  function resetForm(method: PaymentMethod = "cod") {
    setEditingId("");
    setPaymentMethod(method);
    setMinAmount("0");
    setMaxAmount("500");
    setCharge(method === "cod" ? "40" : "30");
    setIsActive(true);
  }

  function usePreset(method: PaymentMethod) {
    resetForm(method);
    setSuccess("");
    setError("");
  }

  function editRule(rule: DeliveryRule) {
    setEditingId(rule._id);
    setPaymentMethod(rule.paymentMethod);
    setMinAmount(String(rule.minAmount ?? 0));
<<<<<<< HEAD
    setMaxAmount(
      rule.maxAmount === null || rule.maxAmount === undefined
        ? ""
        : String(rule.maxAmount)
    );
=======
    setMaxAmount(rule.maxAmount === null || rule.maxAmount === undefined ? "" : String(rule.maxAmount));
>>>>>>> aman
    setCharge(String(rule.charge ?? 0));
    setIsActive(rule.isActive === true);
    setError("");
    setSuccess("");
<<<<<<< HEAD

=======
>>>>>>> aman
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveRule() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const min = Number(minAmount);
      const max = maxAmount.trim() === "" ? null : Number(maxAmount);
      const fee = Number(charge);

<<<<<<< HEAD
      if (!Number.isFinite(min) || min < 0) {
        throw new Error("Minimum price must be 0 or greater.");
      }

      if (max !== null && (!Number.isFinite(max) || max < min)) {
        throw new Error(
          "Maximum price must be greater than or equal to minimum price."
        );
      }

      if (!Number.isFinite(fee) || fee < 0) {
        throw new Error("Delivery charge must be 0 or greater.");
      }
=======
      if (!Number.isFinite(min) || min < 0) throw new Error("Minimum price must be 0 or greater.");
      if (max !== null && (!Number.isFinite(max) || max < min)) {
        throw new Error("Maximum price must be greater than or equal to minimum price.");
      }
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Delivery charge must be 0 or greater.");
>>>>>>> aman

      const response = await fetch(
        editingId
          ? `${API_URL}/api/admin/delivery-charges/${editingId}`
          : `${API_URL}/api/admin/delivery-charges`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod,
            minAmount: min,
            maxAmount: max,
            charge: fee,
            isActive,
          }),
        }
      );
<<<<<<< HEAD

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to save delivery charge rule."
        );
      }
=======
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to save delivery charge rule.");
>>>>>>> aman

      setSuccess(data?.message || "Delivery charge rule saved.");
      resetForm(paymentMethod);
      await loadRules();
    } catch (saveError) {
<<<<<<< HEAD
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save delivery charge rule."
      );
=======
      setError(saveError instanceof Error ? saveError.message : "Unable to save delivery charge rule.");
>>>>>>> aman
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(rule: DeliveryRule) {
    try {
      setBusyId(rule._id);
      setError("");
<<<<<<< HEAD

      const response = await fetch(
        `${API_URL}/api/admin/delivery-charges/${rule._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !rule.isActive }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to update delivery charge rule."
        );
      }

      setSuccess(data?.message || "Delivery charge rule updated.");
      await loadRules();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update delivery charge rule."
      );
=======
      const response = await fetch(`${API_URL}/api/admin/delivery-charges/${rule._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to update delivery charge rule.");
      setSuccess(data?.message || "Delivery charge rule updated.");
      await loadRules();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update delivery charge rule.");
>>>>>>> aman
    } finally {
      setBusyId("");
    }
  }

  async function deleteRule(rule: DeliveryRule) {
    if (!window.confirm("Delete this delivery charge rule?")) return;
<<<<<<< HEAD

    try {
      setBusyId(rule._id);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/delivery-charges/${rule._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to delete delivery charge rule."
        );
      }

      setSuccess(data?.message || "Delivery charge rule deleted.");

      if (editingId === rule._id) {
        resetForm();
      }

      await loadRules();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete delivery charge rule."
      );
=======
    try {
      setBusyId(rule._id);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/delivery-charges/${rule._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data?.message || "Unable to delete delivery charge rule.");
      setSuccess(data?.message || "Delivery charge rule deleted.");
      if (editingId === rule._id) resetForm();
      await loadRules();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete delivery charge rule.");
>>>>>>> aman
    } finally {
      setBusyId("");
    }
  }

<<<<<<< HEAD
  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 pb-8 sm:px-4 md:px-5 lg:px-0">
      <section className="overflow-hidden rounded-[22px] bg-[#211A18] px-4 py-6 text-white sm:rounded-[26px] sm:px-6 sm:py-7 md:rounded-[30px] md:px-8 md:py-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#E7AE72] sm:text-[10px] sm:tracking-[0.24em]">
              Extra Add
            </p>

            <h2 className="mt-3 text-[25px] font-semibold tracking-[-0.03em] sm:mt-4 sm:text-[28px] md:text-[30px]">
              Delivery Charges
            </h2>

            <p className="mt-2 max-w-3xl text-[12px] leading-5 text-white/65 sm:mt-3 sm:text-[13px] sm:leading-6">
              Set separate COD and online-payment charges by base order price
              range. Rules can be activated or disabled without removing their
              history.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-[17px] border border-white/10 bg-white/[0.06] px-4 py-4 sm:gap-4 sm:rounded-[20px] sm:px-5 lg:w-auto lg:min-w-[220px]">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#A51D45] text-white sm:h-11 sm:w-11 sm:rounded-[14px]">
              <Truck size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[0.12em] text-white/45 sm:text-[9px] sm:tracking-[0.14em]">
                Active rules
              </p>
              <p className="mt-1 text-[22px] font-semibold sm:text-[24px]">
                {rules.filter((item) => item.isActive).length}
              </p>
=======


  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="overflow-hidden rounded-[30px] bg-[#211A18] px-7 py-8 text-white md:px-8 md:py-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7AE72]">Extra Add</p>
            <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em]">Delivery Charges</h2>
            <p className="mt-3 max-w-3xl text-[13px] leading-6 text-white/65">
              Set separate COD and online-payment charges by base order price range. Rules can be activated or disabled without removing their history.
            </p>
          </div>
          <div className="flex min-w-[220px] items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.06] px-5 py-4">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#A51D45] text-white">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/45">Active rules</p>
              <p className="mt-1 text-[24px] font-semibold">{rules.filter((item) => item.isActive).length}</p>
>>>>>>> aman
            </div>
          </div>
        </div>
      </section>

      {(error || success) && (
<<<<<<< HEAD
        <div
          className={`mt-4 rounded-[14px] border px-3 py-3 text-[11px] leading-5 sm:mt-5 sm:rounded-[16px] sm:px-4 sm:text-[12px] ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
=======
        <div className={`mt-5 rounded-[16px] border px-4 py-3 text-[12px] ${
          error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
>>>>>>> aman
          {error || success}
        </div>
      )}

<<<<<<< HEAD
      <div className="mt-5 grid grid-cols-1 gap-5 xl:mt-6 xl:grid-cols-[minmax(320px,460px)_minmax(0,1fr)]">
        <section className="h-fit min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold text-[#211A18] sm:text-[18px]">
                {editingId ? "Edit Rule" : "Add Rule"}
              </h3>
              <p className="mt-1 text-[10px] leading-4 text-[#211A18]/45">
                Base price means cart subtotal before discounts/tax.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={() => resetForm()}
                className="w-full rounded-xl border border-[#211A18]/10 px-3 py-2 text-[10px] font-semibold text-[#211A18]/60 transition hover:bg-[#FAF8F6] sm:w-auto"
              >
=======
      <div className="mt-6 grid gap-5 xl:grid-cols-[460px_1fr]">
        <section className="h-fit rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-semibold text-[#211A18]">{editingId ? "Edit Rule" : "Add Rule"}</h3>
              <p className="mt-1 text-[10px] text-[#211A18]/45">Base price means cart subtotal before discounts/tax.</p>
            </div>
            {editingId && (
              <button type="button" onClick={() => resetForm()} className="rounded-xl border border-[#211A18]/10 px-3 py-2 text-[10px] font-semibold text-[#211A18]/60">
>>>>>>> aman
                Cancel edit
              </button>
            )}
          </div>

<<<<<<< HEAD
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => usePreset("cod")}
              className="rounded-[13px] border border-[#A51D45]/15 bg-[#FFF7FA] px-3 py-3 text-left text-[10px] text-[#8C1839] transition hover:border-[#A51D45]/30"
            >
              <strong className="block text-[11px]">COD preset</strong>
              ₹40 for ₹0–₹500
            </button>

            <button
              type="button"
              onClick={() => usePreset("online")}
              className="rounded-[13px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 py-3 text-left text-[10px] text-[#211A18]/60 transition hover:border-[#211A18]/20"
            >
              <strong className="block text-[11px] text-[#211A18]">
                Online preset
              </strong>
=======
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => usePreset("cod")} className="rounded-[13px] border border-[#A51D45]/15 bg-[#FFF7FA] px-3 py-3 text-left text-[10px] text-[#8C1839]">
              <strong className="block text-[11px]">COD preset</strong>
              ₹40 for ₹0–₹500
            </button>
            <button type="button" onClick={() => usePreset("online")} className="rounded-[13px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 py-3 text-left text-[10px] text-[#211A18]/60">
              <strong className="block text-[11px] text-[#211A18]">Online preset</strong>
>>>>>>> aman
              ₹30 for ₹0–₹500
            </button>
          </div>

          <label className="mt-5 block">
<<<<<<< HEAD
            <span className="text-[12px] font-semibold text-[#211A18]">
              Payment method
            </span>

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
              className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 text-[12px] text-[#211A18] outline-none transition focus:border-[#A51D45]/40 sm:px-4 sm:text-[13px]"
=======
            <span className="text-[12px] font-semibold text-[#211A18]">Payment method</span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="mt-3 h-12 w-full rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4 text-[13px] text-[#211A18] outline-none"
>>>>>>> aman
            >
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="online">Online / Razorpay</option>
            </select>
          </label>

<<<<<<< HEAD
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MoneyInput
              label="Min base price"
              value={minAmount}
              onChange={setMinAmount}
              placeholder="0"
            />

            <MoneyInput
              label="Max base price"
              value={maxAmount}
              onChange={setMaxAmount}
              placeholder="No limit"
            />
          </div>

          <div className="mt-4">
            <MoneyInput
              label="Delivery charge"
              value={charge}
              onChange={setCharge}
              placeholder="40"
            />
=======
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MoneyInput label="Min base price" value={minAmount} onChange={setMinAmount} placeholder="0" />
            <MoneyInput label="Max base price" value={maxAmount} onChange={setMaxAmount} placeholder="No limit" />
          </div>

          <div className="mt-4">
            <MoneyInput label="Delivery charge" value={charge} onChange={setCharge} placeholder="40" />
>>>>>>> aman
          </div>

          <div className="mt-5">
            <ToggleRow
              label="Active"
              description="Only active rules are used while calculating an order."
              checked={isActive}
              onChange={setIsActive}
            />
          </div>

          <button
            type="button"
            onClick={() => void saveRule()}
            disabled={saving}
<<<<<<< HEAD
            className="mt-5 min-h-12 w-full rounded-[14px] bg-[#A51D45] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-white transition hover:bg-[#8C1839] disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:text-[12px] sm:tracking-[0.08em]"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Delivery Rule"
              : "Add Delivery Rule"}
          </button>
        </section>

        <section className="min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 border-b border-[#211A18]/8 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
            <div className="min-w-0">
              <h3 className="text-[17px] font-semibold text-[#211A18] sm:text-[18px]">
                Delivery Rules
              </h3>
              <p className="mt-1 text-[10px] leading-4 text-[#211A18]/40 sm:text-[11px]">
                COD and online ranges are managed independently.
              </p>
            </div>

            <span className="w-fit shrink-0 rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">
              {rules.length} rules
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px] text-[#211A18]/40">
              Loading delivery rules...
            </div>
          ) : rules.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-[#211A18]/40">
              No delivery charge rule created yet.
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {rules.map((rule) => (
                  <div
                    key={rule._id}
                    className="rounded-[16px] border border-[#211A18]/8 bg-[#FAF8F6] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-[#211A18]/40">
                          Method
                        </p>
                        <p className="mt-1 text-[13px] font-semibold text-[#211A18]">
                          {rule.paymentMethod === "cod" ? "COD" : "Online"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          rule.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#EEEAE6] text-[#211A18]/50"
                        }`}
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <InfoBlock
                        label="Base Price Range"
                        value={`${money(rule.minAmount)} – ${
                          rule.maxAmount === null
                            ? "No limit"
                            : money(rule.maxAmount)
                        }`}
                      />
                      <InfoBlock label="Charge" value={money(rule.charge)} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => editRule(rule)}
                        className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2.5 text-[10px] font-semibold text-[#211A18]/65"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={busyId === rule._id}
                        onClick={() => void toggleRule(rule)}
                        className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2.5 text-[10px] font-semibold text-[#211A18]/65 disabled:opacity-40"
                      >
                        {rule.isActive ? "Disable" : "Enable"}
                      </button>

                      <button
                        type="button"
                        disabled={busyId === rule._id}
                        onClick={() => void deleteRule(rule)}
                        className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[10px] font-semibold text-red-600 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.08em] text-[#211A18]/40">
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Base Price Range</th>
                      <th className="px-3 py-2">Charge</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rules.map((rule) => (
                      <tr
                        key={rule._id}
                        className="bg-[#FAF8F6] text-[12px] text-[#211A18]"
                      >
                        <td className="rounded-l-[14px] px-3 py-3 font-semibold">
                          {rule.paymentMethod === "cod" ? "COD" : "Online"}
                        </td>

                        <td className="px-3 py-3 text-[#211A18]/60">
                          {money(rule.minAmount)} –{" "}
                          {rule.maxAmount === null
                            ? "No limit"
                            : money(rule.maxAmount)}
                        </td>

                        <td className="px-3 py-3 font-semibold">
                          {money(rule.charge)}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              rule.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-[#EEEAE6] text-[#211A18]/50"
                            }`}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="rounded-r-[14px] px-3 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editRule(rule)}
                              className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2 text-[10px] font-semibold text-[#211A18]/65"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={busyId === rule._id}
                              onClick={() => void toggleRule(rule)}
                              className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2 text-[10px] font-semibold text-[#211A18]/65 disabled:opacity-40"
                            >
                              {rule.isActive ? "Disable" : "Enable"}
                            </button>

                            <button
                              type="button"
                              disabled={busyId === rule._id}
                              onClick={() => void deleteRule(rule)}
                              className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </div>
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

      <section className="mt-5 min-w-0 rounded-[20px] border border-[#211A18]/10 bg-white p-4 sm:mt-6 sm:rounded-[24px] sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 border-b border-[#211A18]/8 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold text-[#211A18] sm:text-[18px]">
              Delivery Charge History
            </h3>
            <p className="mt-1 text-[10px] leading-4 text-[#211A18]/40 sm:text-[11px]">
              Latest create, edit, active/inactive and delete changes are kept
              here.
            </p>
          </div>

          <span className="w-fit shrink-0 rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">
            Last {history.length}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#211A18]/40">
            No history yet.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3 md:hidden">
              {history.map((item, index) => (
                <div
                  key={`${item.ruleId}-${item._id || index}`}
                  className="rounded-[16px] border border-[#211A18]/8 bg-[#FAF8F6] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[#211A18]/40">
                        Changed
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-[#211A18]">
                        {dateTime(item.changedAt)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[#EEEAE6] text-[#211A18]/50"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoBlock
                      label="Action"
                      value={String(item.action || "updated").replaceAll(
                        "_",
                        " "
                      )}
                    />
                    <InfoBlock
                      label="Method"
                      value={item.paymentMethod === "cod" ? "COD" : "Online"}
                    />
                    <InfoBlock
                      label="Range"
                      value={`${money(item.minAmount)} – ${
                        item.maxAmount === null
                          ? "No limit"
                          : money(item.maxAmount)
                      }`}
                    />
                    <InfoBlock label="Charge" value={money(item.charge)} />
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
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Range</th>
                    <th className="px-3 py-3">Charge</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item, index) => (
                    <tr
                      key={`${item.ruleId}-${item._id || index}`}
                      className="border-t border-[#211A18]/6 text-[#211A18]/65"
                    >
                      <td className="px-3 py-3">{dateTime(item.changedAt)}</td>
                      <td className="px-3 py-3 capitalize">
                        {String(item.action || "updated").replaceAll("_", " ")}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#211A18]">
                        {item.paymentMethod === "cod" ? "COD" : "Online"}
                      </td>
                      <td className="px-3 py-3">
                        {money(item.minAmount)} –{" "}
                        {item.maxAmount === null
                          ? "No limit"
                          : money(item.maxAmount)}
                      </td>
                      <td className="px-3 py-3">{money(item.charge)}</td>
                      <td className="px-3 py-3">
                        {item.isActive ? "Active" : "Inactive"}
=======
            className="mt-5 h-14 w-full rounded-[14px] bg-[#A51D45] text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#8C1839] disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Update Delivery Rule" : "Add Delivery Rule"}
          </button>
        </section>

        <section className="rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#211A18]/8 pb-5">
            <div>
              <h3 className="text-[18px] font-semibold text-[#211A18]">Delivery Rules</h3>
              <p className="mt-1 text-[11px] text-[#211A18]/40">COD and online ranges are managed independently.</p>
            </div>
            <span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">{rules.length} rules</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[12px] text-[#211A18]/40">Loading delivery rules...</div>
          ) : rules.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-[#211A18]/40">No delivery charge rule created yet.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.08em] text-[#211A18]/40">
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Base Price Range</th>
                    <th className="px-3 py-2">Charge</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule._id} className="bg-[#FAF8F6] text-[12px] text-[#211A18]">
                      <td className="rounded-l-[14px] px-3 py-3 font-semibold">{rule.paymentMethod === "cod" ? "COD" : "Online"}</td>
                      <td className="px-3 py-3 text-[#211A18]/60">
                        {money(rule.minAmount)} – {rule.maxAmount === null ? "No limit" : money(rule.maxAmount)}
                      </td>
                      <td className="px-3 py-3 font-semibold">{money(rule.charge)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          rule.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#EEEAE6] text-[#211A18]/50"
                        }`}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="rounded-r-[14px] px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => editRule(rule)} className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2 text-[10px] font-semibold text-[#211A18]/65">Edit</button>
                          <button type="button" disabled={busyId === rule._id} onClick={() => void toggleRule(rule)} className="rounded-xl border border-[#211A18]/10 bg-white px-3 py-2 text-[10px] font-semibold text-[#211A18]/65 disabled:opacity-40">
                            {rule.isActive ? "Disable" : "Enable"}
                          </button>
                          <button type="button" disabled={busyId === rule._id} onClick={() => void deleteRule(rule)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600 disabled:opacity-40">Delete</button>
                        </div>
>>>>>>> aman
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
<<<<<<< HEAD
          </>
=======
          )}
        </section>
      </div>

      <section className="mt-6 rounded-[24px] border border-[#211A18]/10 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-[#211A18]/8 pb-5">
          <div>
            <h3 className="text-[18px] font-semibold text-[#211A18]">Delivery Charge History</h3>
            <p className="mt-1 text-[11px] text-[#211A18]/40">Latest create, edit, active/inactive and delete changes are kept here.</p>
          </div>
          <span className="rounded-full bg-[#F2EEEA] px-3 py-1.5 text-[10px] font-semibold text-[#211A18]/55">Last {history.length}</span>
        </div>

        {history.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#211A18]/40">No history yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[11px]">
              <thead className="text-[9px] uppercase tracking-[0.08em] text-[#211A18]/40">
                <tr>
                  <th className="px-3 py-3">Changed</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Range</th>
                  <th className="px-3 py-3">Charge</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={`${item.ruleId}-${item._id || index}`} className="border-t border-[#211A18]/6 text-[#211A18]/65">
                    <td className="px-3 py-3">{dateTime(item.changedAt)}</td>
                    <td className="px-3 py-3 capitalize">{String(item.action || "updated").replaceAll("_", " ")}</td>
                    <td className="px-3 py-3 font-semibold text-[#211A18]">{item.paymentMethod === "cod" ? "COD" : "Online"}</td>
                    <td className="px-3 py-3">{money(item.minAmount)} – {item.maxAmount === null ? "No limit" : money(item.maxAmount)}</td>
                    <td className="px-3 py-3">{money(item.charge)}</td>
                    <td className="px-3 py-3">{item.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
>>>>>>> aman
        )}
      </section>
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
<<<<<<< HEAD
    <label className="block min-w-0">
      <span className="text-[12px] font-semibold text-[#211A18]">{label}</span>

      <div className="mt-3 flex h-12 min-w-0 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-3 transition focus-within:border-[#A51D45]/40 sm:px-4">
        <span className="mr-2 shrink-0 text-[12px] font-semibold text-[#211A18]/45">
          ₹
        </span>

=======
    <label className="block">
      <span className="text-[12px] font-semibold text-[#211A18]">{label}</span>
      <div className="mt-3 flex h-12 items-center rounded-[14px] border border-[#211A18]/10 bg-[#FAF8F6] px-4">
        <span className="mr-2 text-[12px] font-semibold text-[#211A18]/45">₹</span>
>>>>>>> aman
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
<<<<<<< HEAD
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#211A18] outline-none sm:text-[13px]"
=======
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#211A18] outline-none"
>>>>>>> aman
        />
      </div>
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
<<<<<<< HEAD
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[16px] bg-[#FAF8F6] px-3 py-4 sm:gap-4 sm:px-4">
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold text-[#211A18]">
          {label}
        </span>
        <span className="mt-1 block text-[10px] leading-4 text-[#211A18]/45">
          {description}
        </span>
      </span>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#A51D45]" : "bg-[#211A18]/12"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
=======
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[16px] bg-[#FAF8F6] px-4 py-4">
      <span>
        <span className="block text-[12px] font-semibold text-[#211A18]">{label}</span>
        <span className="mt-1 block text-[10px] leading-4 text-[#211A18]/45">{description}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-[#A51D45]" : "bg-[#211A18]/12"}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
>>>>>>> aman
      </span>
    </label>
  );
}
<<<<<<< HEAD

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.06em] text-[#211A18]/35">
        {label}
      </p>
      <p className="mt-1 break-words text-[11px] font-medium capitalize leading-4 text-[#211A18]/70">
        {value}
      </p>
    </div>
  );
}
=======
>>>>>>> aman
