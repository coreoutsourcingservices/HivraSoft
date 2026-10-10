"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarHeart, Gift, Heart, UserRound, X } from "lucide-react";
import { ApiError, apiFetch, requestLogin } from "@/lib/api";

type Field = "birthday" | "anniversary" | "gender";
type Gender = "male" | "female" | "other";
type Account = {
  id: string;
  name?: string;
  birthday?: string | null;
  anniversary?: string | null;
  gender?: Gender;
};
type AccountResponse = { success?: boolean; account?: Account; message?: string };
const fieldLabels: Record<Field, string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  gender: "Gender",
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

/**
 * Manual profile launcher. Automatic prompts have a three-day/login requirement;
 * this editor is deliberately available to everyone (guests see a login prompt).
 */
export default function ProfileDetailsPopup() {
  const pathname = usePathname();
  const hidden = ["/admin", "/account", "/cart", "/wishlist", "/checkout", "/payment", "/thanks"].some(
    (segment) => pathname === segment || pathname.startsWith(`${segment}/`),
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [field, setField] = useState<Field>("birthday");
  const [date, setDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, saving]);

  async function openEditor() {
    setOpen(true);
    setLoading(true);
    setError("");
    setMessage("");
    setNeedsLogin(false);
    try {
      const result = await apiFetch<AccountResponse>("/api/auth/account", { method: "GET" });
      setAccount(result.account ?? null);
      setField("birthday");
      setDate(toDateInput(result.account?.birthday));
      setGender(result.account?.gender ?? "");
    } catch (cause) {
      setAccount(null);
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
        setNeedsLogin(true);
      } else {
        setError("Account information is unavailable. Please ensure the backend is running on port 5000.");
      }
    } finally {
      setLoading(false);
    }
  }

  function chooseField(next: Field) {
    setField(next);
    setDate(toDateInput(next === "birthday" ? account?.birthday : account?.anniversary));
    setGender(account?.gender || "");
    setError("");
    setMessage("");
  }

  async function save() {
    if (!account) return;
    if (field !== "gender" && !date) { setError(`Please select your ${fieldLabels[field].toLowerCase()} date.`); return; }
    if (field === "gender" && !gender) { setError("Please select your gender."); return; }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body: Partial<Pick<Account, Field>> = field === "gender"
        ? { gender: gender || undefined }
        : { [field]: date };
      const updated = await apiFetch<AccountResponse>("/api/auth/account", { method: "PATCH", body });
      setAccount(updated.account ?? { ...account, ...body });
      setMessage(`${fieldLabels[field]} saved successfully.`);
      if (field === "gender") {
        window.localStorage.setItem(`hivrasoft-profile-gender-completed:${account.id}`, "1");
      }
      // Keep the original three-day automatic prompt in sync with the updated profile.
      window.dispatchEvent(new Event("hivrasoft-auth-changed"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Open birthday, anniversary and profile popup"
        title="Birthday / Anniversary / Profile"
        onClick={() => void openEditor()}
        className="fixed bottom-[242px] right-4 z-[50001] flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#F2ADC1] bg-white text-[#D41455] shadow-[0_8px_25px_rgba(133,28,63,.20)] transition hover:scale-105 sm:bottom-[252px] sm:right-5 lg:bottom-[260px] lg:right-7"
      >
        <UserRound size={23} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[61000] flex items-center justify-center bg-black/50 px-3 py-6" onClick={() => !saving && setOpen(false)} role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Birthday anniversary and profile editor" onClick={(event) => event.stopPropagation()} className="relative w-full max-w-[420px] rounded-[20px] bg-white p-5 shadow-[0_24px_85px_rgba(0,0,0,.35)] sm:p-6">
            <button type="button" aria-label="Close profile popup" onClick={() => setOpen(false)} disabled={saving} className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 hover:bg-rose-100"><X size={18} /></button>
            <div className="mb-5 flex items-center gap-3 pr-10">
              <span className="rounded-full bg-rose-100 p-3 text-[#b41447]"><UserRound size={22} /></span>
              <div>
                <h2 className="text-lg font-bold text-[#30242b]">Your Special Dates</h2>
                <p className="text-xs text-gray-500">Birthday, anniversary &amp; profile</p>
              </div>
            </div>
            {loading ? (
              <p className="py-10 text-center text-sm text-gray-500">Loading account...</p>
            ) : !account ? (
              <div className="py-6 text-center">
                <p className="mb-5 text-sm text-gray-600">{needsLogin ? "Please log in to save your birthday, anniversary and profile details." : error || "Unable to load profile."}</p>
                <button type="button" onClick={() => { setOpen(false); requestLogin(); }} className="rounded-xl bg-[#be164d] px-6 py-3 text-sm font-semibold text-white">{needsLogin ? "Login / Sign Up" : "Open Login"}</button>
                {!needsLogin && <button type="button" onClick={() => void openEditor()} className="ml-2 rounded-xl border px-4 py-3 text-sm">Retry</button>}
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">{account.name ? `Hello ${account.name}! ` : ""}Choose the detail you want to add or update.</p>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Choose profile field">
                  {(["birthday", "anniversary", "gender"] as Field[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => chooseField(choice)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-[11px] font-semibold ${field === choice ? "border-[#be164d] bg-rose-50 text-[#be164d]" : "border-gray-200 text-gray-700"}`}
                    >
                      {choice === "birthday" ? <Gift size={20} /> : choice === "anniversary" ? <Heart size={20} /> : <CalendarHeart size={20} />}
                      {fieldLabels[choice]}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="hivra-profile-field">{fieldLabels[field]}</label>
                  {field === "gender" ? (
                    <select id="hivra-profile-field" value={gender} onChange={(event) => setGender(event.target.value as Gender | "")} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <input id="hivra-profile-field" type="date" value={date} onChange={(event) => setDate(event.target.value)} max={field === "birthday" ? new Date().toISOString().slice(0, 10) : undefined} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800" />
                  )}
                </div>
                {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
                {message && <p role="status" className="mt-3 text-xs font-semibold text-green-700">{message}</p>}
                <button type="button" disabled={saving} onClick={() => void save()} className="mt-5 w-full rounded-xl bg-[#c41651] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : `Save ${fieldLabels[field]}`}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
