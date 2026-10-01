"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Clock3, ExternalLink } from "lucide-react";
import Header from "@/src/components/Header/Header";
import AccountSidebar from "@/app/account/components/AccountSidebar";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  source?: "admin" | "system";
};

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed.");
  return data;
}

function displayType(type: string) {
  return String(type || "general").replaceAll("_", " ");
}

export default function AccountNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await request("/api/notifications");
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const unread = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  async function markRead(id: string) {
    try {
      setBusyId(id);
      await request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
      setItems((current) => current.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to mark notification as read.");
    } finally {
      setBusyId("");
    }
  }

  async function markAllRead() {
    try {
      setBusyId("all");
      await request("/api/notifications/read-all", { method: "PATCH" });
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to mark notifications as read.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFCFB] px-4 py-8 md:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-6 lg:grid-cols-[280px_1fr]">
          <AccountSidebar />
          <section>
            <div className="rounded-[26px] bg-[#211A18] px-6 py-7 text-white md:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#E7AE72]">My Account</p>
                  <h1 className="mt-3 font-serif text-3xl">Notifications</h1>
                  <p className="mt-2 text-[11px] text-white/50">Admin messages, order updates and cart/wishlist reminders.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-2 text-[10px]">{unread} unread</span>
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    disabled={unread === 0 || busyId === "all"}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F4DCE3] px-4 text-[9px] font-semibold uppercase text-[#64142D] disabled:opacity-40"
                  >
                    <CheckCheck size={14} /> {busyId === "all" ? "Saving..." : "Mark all read"}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-[11px] text-red-700">{error}</div>}

            <div className="mt-5 rounded-[24px] border border-[#211A18]/10 bg-white p-4 md:p-6">
              {loading ? (
                <div className="py-16 text-center text-[11px] text-[#211A18]/40">Loading notifications...</div>
              ) : items.length === 0 ? (
                <div className="grid min-h-[320px] place-items-center text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F8E8ED] text-[#8C1839]"><Bell size={22} /></div>
                    <h2 className="mt-4 text-[15px] font-semibold text-[#211A18]">No notifications yet</h2>
                    <p className="mt-2 text-[10px] text-[#211A18]/40">New messages and reminders will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <article key={item._id} className={`rounded-[18px] border p-4 transition ${item.isRead ? "border-[#211A18]/8 bg-[#FAF8F6]" : "border-[#8C1839]/20 bg-[#FFF7F9]"}`}>
                      <div className="flex gap-3">
                        <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${item.isRead ? "bg-[#EEE9E5] text-[#211A18]/45" : "bg-[#F8E8ED] text-[#8C1839]"}`}><Bell size={15} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-[12px] font-semibold text-[#211A18]">{item.title}</h2>
                            <span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold uppercase text-[#8C1839]">{displayType(item.type)}</span>
                            {!item.isRead && <span className="h-2 w-2 rounded-full bg-[#A51D45]" />}
                          </div>
                          <p className="mt-2 text-[10px] leading-5 text-[#211A18]/60">{item.message}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] text-[#211A18]/35">
                            <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {new Date(item.createdAt).toLocaleString("en-IN")}</span>
                            {item.link && (
                              <Link href={item.link} className="inline-flex items-center gap-1 font-semibold text-[#8C1839]">
                                Open <ExternalLink size={10} />
                              </Link>
                            )}
                            {!item.isRead && (
                              <button type="button" disabled={busyId === item._id} onClick={() => void markRead(item._id)} className="font-semibold text-[#8C1839] disabled:opacity-40">
                                {busyId === item._id ? "Saving..." : "Mark read"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
