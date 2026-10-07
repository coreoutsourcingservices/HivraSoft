"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

import {
  Bell,
  CheckCheck,
  Clock3,
  ExternalLink,
} from "lucide-react";

import Header from "@/src/components/Header/Header";
import AccountSidebar from "@/app/account/components/AccountSidebar";

/* =========================================================
   API
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   REQUEST
========================================================= */

async function request(
  path: string,
  options: RequestInit = {},
) {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      credentials: "include",

      cache: "no-store",

      headers: {
        "Content-Type":
          "application/json",

        ...(options.headers || {}),
      },
    },
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Request failed.",
    );
  }

  return data;
}

/* =========================================================
   DISPLAY TYPE
========================================================= */

function displayType(
  type: string,
) {
  return String(
    type || "general",
  ).replaceAll("_", " ");
}

/* =========================================================
   PAGE
========================================================= */

export default function AccountNotificationsPage() {
  const [
    items,
    setItems,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busyId,
    setBusyId,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  async function load() {
    try {
      setLoading(true);

      setError("");

      const data =
        await request(
          "/api/notifications",
        );

      setItems(
        Array.isArray(
          data?.notifications,
        )
          ? data.notifications
          : [],
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD + SCROLL RESET

     Notification link neeche hone ki wajah se browser
     sidebar ko automatically neeche scroll kar raha tha.

     Yahan:
     1. Main page top par reset hoga.
     2. Desktop AccountSidebar bhi top par reset hoga.
  ======================================================= */

  useEffect(() => {
    void load();

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    const resetSidebarScroll =
      window.setTimeout(
        () => {
          const accountSidebar =
            document.querySelector(
              "aside",
            );

          if (
            accountSidebar instanceof
            HTMLElement
          ) {
            accountSidebar.scrollTop =
              0;
          }

          const activeElement =
            document.activeElement;

          if (
            activeElement instanceof
            HTMLElement
          ) {
            activeElement.blur();
          }
        },
        50,
      );

    return () => {
      window.clearTimeout(
        resetSidebarScroll,
      );
    };
  }, []);

  /* =======================================================
     UNREAD
  ======================================================= */

  const unread =
    useMemo(
      () =>
        items.filter(
          (item) =>
            !item.isRead,
        ).length,
      [items],
    );

  /* =======================================================
     MARK READ
  ======================================================= */

  async function markRead(
    id: string,
  ) {
    try {
      setBusyId(id);

      await request(
        `/api/notifications/${encodeURIComponent(
          id,
        )}/read`,
        {
          method: "PATCH",
        },
      );

      setItems(
        (current) =>
          current.map(
            (item) =>
              item._id === id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item,
          ),
      );
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Unable to mark notification as read.",
      );
    } finally {
      setBusyId("");
    }
  }

  /* =======================================================
     MARK ALL READ
  ======================================================= */

  async function markAllRead() {
    try {
      setBusyId("all");

      await request(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        },
      );

      setItems(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              isRead: true,
            }),
          ),
      );
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Unable to mark notifications as read.",
      );
    } finally {
      setBusyId("");
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <Header />

      {/* ===================================================
          PAGE

          Desktop:
          Header ke neeche remaining viewport fill karega.

          Mobile:
          normal full page rahega.
      =================================================== */}

      <div
        className="
          relative
          w-full
          max-w-full
          overflow-x-clip
          bg-[#FDFCFB]

          lg:min-h-[calc(100dvh-76px)]
        "
      >
        {/* =================================================
            DESKTOP LEFT BACKGROUND FIX

            Notification content chhota hai.
            Isliye page ke bottom tak left 280px dark rahega.
        ================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-0
            left-0
            top-0
            hidden
            w-[280px]
            bg-[#1B1514]

            lg:block
          "
        />

        {/* =================================================
            LAYOUT

            AccountSidebar DIRECT CHILD hai.
            Sticky ko koi extra wrapper break nahi karega.
        ================================================= */}

        <div
          className="
            relative
            z-[1]
            mx-auto
            flex
            w-full
            max-w-[1600px]
            flex-col

            lg:min-h-[calc(100dvh-76px)]
            lg:flex-row
            lg:items-start
          "
        >
          {/* =================================================
              ACCOUNT SIDEBAR
          ================================================= */}

          <AccountSidebar />

          {/* =================================================
              RIGHT CONTENT
          ================================================= */}

          <main
            className="
              min-w-0
              w-full
              max-w-full
              flex-1
              overflow-x-hidden
              px-3
              pb-8
              pt-3

              sm:px-5
              sm:pt-5

              lg:min-h-[calc(100dvh-76px)]
              lg:px-7
              lg:pb-10
              lg:pt-5
            "
          >
            {/* ===============================================
                HERO
            =============================================== */}

            <section
              className="
                w-full
                min-w-0
                max-w-full
                overflow-hidden
                rounded-[20px]
                bg-[#211A18]
                px-5
                py-6
                text-white

                sm:rounded-[26px]
                sm:px-6
                sm:py-7

                md:px-8
              "
            >
              <div
                className="
                  flex
                  min-w-0
                  flex-col
                  gap-5

                  sm:flex-row
                  sm:items-end
                  sm:justify-between
                "
              >
                {/* LEFT */}

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                      text-[#E7AE72]

                      sm:text-[9px]
                    "
                  >
                    My Account
                  </p>

                  <h1
                    className="
                      mt-3
                      max-w-full
                      break-words
                      font-serif
                      text-[28px]
                      leading-tight

                      sm:text-3xl
                    "
                  >
                    Notifications
                  </h1>

                  <p
                    className="
                      mt-2
                      max-w-[600px]
                      break-words
                      text-[10px]
                      leading-5
                      text-white/50

                      sm:text-[11px]

                      [overflow-wrap:anywhere]
                    "
                  >
                    Admin messages,
                    order updates and
                    cart/wishlist
                    reminders.
                  </p>
                </div>

                {/* RIGHT */}

                <div
                  className="
                    flex
                    w-full
                    min-w-0
                    flex-wrap
                    items-center
                    gap-2

                    sm:w-auto
                    sm:shrink-0
                    sm:justify-end
                  "
                >
                  <span
                    className="
                      inline-flex
                      min-h-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white/10
                      px-3
                      py-2
                      text-[9px]

                      sm:text-[10px]
                    "
                  >
                    {unread} unread
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      void markAllRead()
                    }
                    disabled={
                      unread === 0 ||
                      busyId ===
                        "all"
                    }
                    className="
                      inline-flex
                      min-h-9
                      max-w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#F4DCE3]
                      px-3
                      py-2
                      text-[8px]
                      font-semibold
                      uppercase
                      text-[#64142D]
                      transition

                      disabled:cursor-not-allowed
                      disabled:opacity-40

                      sm:h-10
                      sm:px-4
                      sm:text-[9px]
                    "
                  >
                    <CheckCheck
                      size={14}
                      className="
                        shrink-0
                      "
                    />

                    <span
                      className="
                        whitespace-nowrap
                      "
                    >
                      {busyId ===
                      "all"
                        ? "Saving..."
                        : "Mark all read"}
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* ===============================================
                ERROR
            =============================================== */}

            {error && (
              <div
                className="
                  mt-4
                  w-full
                  min-w-0
                  max-w-full
                  break-words
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-[11px]
                  leading-5
                  text-red-700

                  [overflow-wrap:anywhere]
                "
              >
                {error}
              </div>
            )}

            {/* ===============================================
                NOTIFICATION CONTAINER
            =============================================== */}

            <section
              className="
                mt-5
                w-full
                min-w-0
                max-w-full
                overflow-hidden
                rounded-[20px]
                border
                border-[#211A18]/10
                bg-white
                p-3

                sm:rounded-[24px]
                sm:p-4

                md:p-6
              "
            >
              {/* LOADING */}

              {loading ? (
                <div
                  className="
                    py-16
                    text-center
                    text-[11px]
                    text-[#211A18]/40
                  "
                >
                  Loading
                  notifications...
                </div>
              ) : items.length ===
                0 ? (
                /* ===========================================
                   EMPTY
                =========================================== */

                <div
                  className="
                    grid
                    min-h-[280px]
                    place-items-center
                    px-4
                    text-center

                    sm:min-h-[320px]
                  "
                >
                  <div
                    className="
                      min-w-0
                      max-w-[300px]
                    "
                  >
                    <div
                      className="
                        mx-auto
                        grid
                        h-14
                        w-14
                        place-items-center
                        rounded-full
                        bg-[#F8E8ED]
                        text-[#8C1839]
                      "
                    >
                      <Bell
                        size={22}
                      />
                    </div>

                    <h2
                      className="
                        mt-4
                        text-[15px]
                        font-semibold
                        text-[#211A18]
                      "
                    >
                      No notifications
                      yet
                    </h2>

                    <p
                      className="
                        mt-2
                        break-words
                        text-[10px]
                        leading-5
                        text-[#211A18]/40

                        [overflow-wrap:anywhere]
                      "
                    >
                      New messages and
                      reminders will
                      appear here.
                    </p>
                  </div>
                </div>
              ) : (
                /* ===========================================
                   NOTIFICATION LIST
                =========================================== */

                <div
                  className="
                    w-full
                    min-w-0
                    max-w-full
                    space-y-3
                  "
                >
                  {items.map(
                    (item) => (
                      <article
                        key={
                          item._id
                        }
                        className={`
                          w-full
                          min-w-0
                          max-w-full
                          overflow-hidden
                          rounded-[16px]
                          border
                          p-3
                          transition

                          sm:rounded-[18px]
                          sm:p-4

                          ${
                            item.isRead
                              ? `
                                border-[#211A18]/8
                                bg-[#FAF8F6]
                              `
                              : `
                                border-[#8C1839]/20
                                bg-[#FFF7F9]
                              `
                          }
                        `}
                      >
                        <div
                          className="
                            flex
                            w-full
                            min-w-0
                            max-w-full
                            items-start
                            gap-3
                          "
                        >
                          {/* ICON */}

                          <div
                            className={`
                              mt-0.5
                              grid
                              h-9
                              w-9
                              shrink-0
                              place-items-center
                              rounded-full

                              ${
                                item.isRead
                                  ? `
                                    bg-[#EEE9E5]
                                    text-[#211A18]/45
                                  `
                                  : `
                                    bg-[#F8E8ED]
                                    text-[#8C1839]
                                  `
                              }
                            `}
                          >
                            <Bell
                              size={15}
                            />
                          </div>

                          {/* CONTENT */}

                          <div
                            className="
                              min-w-0
                              max-w-full
                              flex-1
                            "
                          >
                            {/* TITLE ROW */}

                            <div
                              className="
                                flex
                                min-w-0
                                max-w-full
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >
                              <h2
                                className="
                                  min-w-0
                                  max-w-full
                                  break-words
                                  text-[12px]
                                  font-semibold
                                  leading-5
                                  text-[#211A18]

                                  [overflow-wrap:anywhere]
                                "
                              >
                                {
                                  item.title
                                }
                              </h2>

                              {/* TYPE */}

                              <span
                                className="
                                  inline-flex
                                  max-w-full
                                  rounded-full
                                  bg-white
                                  px-2
                                  py-1
                                  text-[8px]
                                  font-semibold
                                  uppercase
                                  text-[#8C1839]
                                "
                              >
                                <span
                                  className="
                                    max-w-[150px]
                                    truncate
                                  "
                                >
                                  {displayType(
                                    item.type,
                                  )}
                                </span>
                              </span>

                              {/* UNREAD DOT */}

                              {!item.isRead && (
                                <span
                                  className="
                                    h-2
                                    w-2
                                    shrink-0
                                    rounded-full
                                    bg-[#A51D45]
                                  "
                                />
                              )}
                            </div>

                            {/* MESSAGE */}

                            <div
                              className="
                                mt-2
                                w-full
                                min-w-0
                                max-w-full
                                break-words
                                text-[10px]
                                leading-5
                                text-[#211A18]/60

                                [overflow-wrap:anywhere]
                                [&_a]:font-semibold
                                [&_a]:text-[#8C1839]
                                [&_a]:underline
                                [&_img]:my-3
                                [&_img]:max-w-full
                                [&_img]:rounded-xl
                                [&_p]:mb-2
                              "
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.message || "") }}
                            />

                            {/* META */}

                            <div
                              className="
                                mt-3
                                flex
                                w-full
                                min-w-0
                                max-w-full
                                flex-wrap
                                items-center
                                gap-x-3
                                gap-y-2
                                text-[9px]
                                text-[#211A18]/35
                              "
                            >
                              {/* TIME */}

                              <span
                                className="
                                  inline-flex
                                  min-w-0
                                  max-w-full
                                  items-center
                                  gap-1
                                "
                              >
                                <Clock3
                                  size={11}
                                  className="
                                    shrink-0
                                  "
                                />

                                <span
                                  className="
                                    min-w-0
                                    max-w-full
                                    break-words

                                    [overflow-wrap:anywhere]
                                  "
                                >
                                  {new Date(
                                    item.createdAt,
                                  ).toLocaleString(
                                    "en-IN",
                                  )}
                                </span>
                              </span>

                              {/* OPEN */}

                              {item.link && (
                                <Link
                                  href={
                                    item.link
                                  }
                                  className="
                                    inline-flex
                                    shrink-0
                                    items-center
                                    gap-1
                                    font-semibold
                                    text-[#8C1839]
                                  "
                                >
                                  Open

                                  <ExternalLink
                                    size={
                                      10
                                    }
                                  />
                                </Link>
                              )}

                              {/* MARK READ */}

                              {!item.isRead && (
                                <button
                                  type="button"
                                  disabled={
                                    busyId ===
                                    item._id
                                  }
                                  onClick={() =>
                                    void markRead(
                                      item._id,
                                    )
                                  }
                                  className="
                                    shrink-0
                                    font-semibold
                                    text-[#8C1839]

                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                  "
                                >
                                  {busyId ===
                                  item._id
                                    ? "Saving..."
                                    : "Mark read"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}