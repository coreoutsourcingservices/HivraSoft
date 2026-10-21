"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { Bell, Check, Clock3 } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { NOTIFICATIONS_CHANGED, newestNotifications, type CustomerNotification } from "@/lib/notifications";

type Inbox = { userId: string; items: CustomerNotification[]; unreadCount: number };
const emptyInbox: Inbox = { userId: "", items: [], unreadCount: 0 };
const storageKey = (userId: string) => `hivrasoft:notification-dismissed:${userId}`;

function readDismissed(userId: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(userId)) === "true";
  } catch { return false; }
}

export default function UnreadNotificationCard() {
  const pathname = usePathname();
  const hidden = pathname === "/admin" || pathname.startsWith("/admin/");
  const [inbox, setInbox] = useState<Inbox>(emptyInbox);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const identity = useRef("");

  useEffect(() => {
    if (hidden) return;
    let stopped = false;
    let pending = false;
    let generation = 0;

    async function refresh() {
      if (stopped || pending || document.visibilityState === "hidden") return;
      pending = true;
      const current = ++generation;
      // Ignore superseded responses using generation/stopped checks. These
      // short reads can finish without aborting during Strict Mode cleanup.
      try {
        const auth = await apiFetch<{ user?: { id: string; role: string } }>("/api/auth/me");
        if (stopped || current !== generation) return;
        const userId = auth.user?.role === "customer" ? auth.user.id : "";
        if (!userId) {
          identity.current = "";
          setInbox(emptyInbox);
          setDismissed(false);
          return;
        }
        if (identity.current !== userId) {
          identity.current = userId;
          setInbox(emptyInbox);
          setDismissed(readDismissed(userId));
          setError("");
          setBusy(false);
        }
        const data = await apiFetch<{ notifications: CustomerNotification[]; unreadCount?: number }>("/api/notifications");
        if (stopped || current !== generation) return;
        const items = newestNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setInbox({ userId, items, unreadCount: data.unreadCount ?? items.filter((item) => !item.isRead).length });
      } catch (cause) {
        if (!stopped && current === generation && cause instanceof ApiError && [401, 403].includes(cause.status)) {
          identity.current = "";
          setInbox(emptyInbox);
          setDismissed(false);
        }
      } finally {
        if (current === generation) pending = false;
      }
    }

    function authChanged() {
      generation++;
      pending = false;
      identity.current = "";
      setInbox(emptyInbox);
      setDismissed(false);
      setError("");
      setBusy(false);
      void refresh();
    }
    function notificationsChanged() {
      generation++;
      pending = false;
      void refresh();
    }
    const update = () => { void refresh(); };
    void refresh();
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("hivrasoft-auth-changed", authChanged);
    window.addEventListener(NOTIFICATIONS_CHANGED, notificationsChanged);
    return () => {
      stopped = true;
      generation++;
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("hivrasoft-auth-changed", authChanged);
      window.removeEventListener(NOTIFICATIONS_CHANGED, notificationsChanged);
      identity.current = "";
    };
  }, [hidden]);

  const current = inbox.items.find((item) => !item.isRead);
  const unreadCount = inbox.unreadCount;

  function dismiss() {
    setDismissed(true);
    setError("");
    try { sessionStorage.setItem(storageKey(inbox.userId), "true"); } catch { /* Still hide the card when storage is unavailable. */ }
  }

  async function markRead() {
    if (!current || busy) return;
    const userId = inbox.userId;
    const id = current._id;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
      if (identity.current !== userId) return;
      setInbox((previous) => previous.userId === userId ? {
        ...previous,
        items: previous.items.map((item) => item._id === id ? { ...item, isRead: true } : item),
        unreadCount: Math.max(0, previous.unreadCount - (previous.items.some((item) => item._id === id && !item.isRead) ? 1 : 0)),
      } : previous);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    } catch {
      if (identity.current === userId) setError("Could not mark as read. Please try again.");
    } finally {
      if (identity.current === userId) setBusy(false);
    }
  }

  if (hidden || dismissed || !inbox.userId || !unreadCount || !current || typeof document === "undefined") return null;

  // Portal keeps the fixed card outside storefront scaling/transform containers.
  return createPortal(
    <aside aria-label="Unread notifications" className="fixed left-3 z-[9900] w-[calc(100vw-24px)] max-w-[340px] sm:left-5" style={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <section className="overflow-hidden rounded-2xl border border-[#8C1839]/20 bg-white text-[#211A18] shadow-[0_12px_45px_rgba(33,26,24,0.2)]">
          <div className="flex items-center gap-2 border-b border-[#8C1839]/10 bg-[#FFF7F9] px-4 py-3">
            <Bell size={17} className="text-[#8C1839]" />
            <span className="flex-1 text-xs font-semibold">Unread notification</span>
            <span aria-live="polite" className="rounded-full bg-[#8C1839] px-2 py-1 text-[11px] font-semibold text-white">{unreadCount} unread</span>
          </div>
          <div className="p-4" key={current._id}>
            <h2 className="break-words text-sm font-semibold">{current.title}</h2>
            <div className="mt-2 max-h-[min(180px,25dvh)] overflow-y-auto break-words text-xs leading-5 text-[#211A18]/75 [&_a]:text-[#8C1839] [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.message, { FORBID_TAGS: ["style", "iframe", "form", "input", "button"], FORBID_ATTR: ["style", "id"] }) }} />
            <p className="mt-2 text-[11px] text-[#211A18]/60">{Math.max(0, unreadCount - 1)} other unread</p>
            {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={busy} onClick={() => void markRead()} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#8C1839] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C1839]"><Check size={15} />{busy ? "Saving…" : "Mark as read"}</button>
              <button type="button" disabled={busy} onClick={dismiss} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#F6F1F0] px-3 py-2.5 text-xs font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C1839]"><Clock3 size={15} />Later</button>
            </div>
            <Link href="/account/notifications" className="mt-3 block text-center text-xs font-medium text-[#8C1839] underline">View all notifications</Link>
          </div>
        </section>
    </aside>, document.body,
  );
}
