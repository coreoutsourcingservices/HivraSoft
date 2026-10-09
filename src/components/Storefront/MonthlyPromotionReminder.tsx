"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  ApiError,
  apiFetch,
  requestLogin,
} from "@/lib/api";

/* =========================================================
   TYPES
========================================================= */

type SaveResponse = {
  success?: boolean;
  message?: string;
};

type CalendarDay = {
  date: Date;
  currentMonth: boolean;
};

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/* =========================================================
   HELPERS
========================================================= */

function dateKey(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const now =
    new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
}

function sameDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

/* =========================================================
   CALENDAR
========================================================= */

function buildCalendar(
  viewDate: Date,
): CalendarDay[] {
  const year =
    viewDate.getFullYear();

  const month =
    viewDate.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1,
    );

  const startOffset =
    firstDay.getDay();

  const gridStart =
    new Date(
      year,
      month,
      1 - startOffset,
    );

  const days:
    CalendarDay[] = [];

  for (
    let index = 0;
    index < 42;
    index += 1
  ) {
    const date =
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() +
          index,
      );

    days.push({
      date,

      currentMonth:
        date.getMonth() ===
          month &&
        date.getFullYear() ===
          year,
    });
  }

  return days;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function MonthlyPromotionReminder() {
  const pathname =
    usePathname();

  /* =======================================================
     HIDE REMINDER ON ACCOUNT / CART / PAYMENT PAGES
  ======================================================= */

  const hideReminder =
    pathname === "/account" ||
    pathname.startsWith(
      "/account/",
    ) ||
    pathname === "/cart" ||
    pathname.startsWith(
      "/cart/",
    ) ||
    pathname === "/wishlist" ||
    pathname.startsWith(
      "/wishlist/",
    ) ||
    pathname === "/checkout" ||
    pathname.startsWith(
      "/checkout/",
    ) ||
    pathname === "/payment" ||
    pathname.startsWith(
      "/payment/",
    ) ||
    pathname === "/thanks" ||
    pathname.startsWith(
      "/thanks/",
    );

  /* =======================================================
     STATE
  ======================================================= */

  const [
    open,
    setOpen,
  ] =
    useState(
      false,
    );

  const [
    viewDate,
    setViewDate,
  ] =
    useState(
      () =>
        new Date(),
    );

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<
      Date | null
    >(
      null,
    );

  const [
    authenticated,
    setAuthenticated,
  ] =
    useState<
      boolean | null
    >(
      null,
    );

  const [
    checkingLogin,
    setCheckingLogin,
  ] =
    useState(
      false,
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      "",
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    saved,
    setSaved,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  /* =======================================================
     CALENDAR DATA
  ======================================================= */

  const calendarDays =
    useMemo(
      () =>
        buildCalendar(
          viewDate,
        ),
      [
        viewDate,
      ],
    );

  const today =
    useMemo(
      () =>
        startOfToday(),
      [],
    );

  const currentMonth =
    useMemo(
      () =>
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ),
      [
        today,
      ],
    );

  const currentViewMonth =
    useMemo(
      () =>
        new Date(
          viewDate.getFullYear(),
          viewDate.getMonth(),
          1,
        ),
      [
        viewDate,
      ],
    );

  const canGoPreviousMonth =
    currentViewMonth >
    currentMonth;

  /* =======================================================
     LOGIN CHECK
  ======================================================= */

  const checkLogin =
    useCallback(
      async () => {
        setCheckingLogin(
          true,
        );

        try {
          await apiFetch(
            "/api/auth/me",
            {
              method:
                "GET",
            },
          );

          setAuthenticated(
            true,
          );

          return true;
        } catch {
          setAuthenticated(
            false,
          );

          return false;
        } finally {
          setCheckingLogin(
            false,
          );
        }
      },
      [],
    );

  /* =======================================================
     AUTH CHANGE
  ======================================================= */

  useEffect(() => {
    const handleAuthChanged =
      async () => {
        const loggedIn =
          await checkLogin();

        if (
          loggedIn &&
          selectedDate
        ) {
          setError(
            "",
          );
        }
      };

    window.addEventListener(
      "hivrasoft-auth-changed",
      handleAuthChanged,
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-auth-changed",
        handleAuthChanged,
      );
    };
  }, [
    checkLogin,
    selectedDate,
  ]);

  /* =======================================================
     CLOSE IF USER GOES TO HIDDEN PAGE
  ======================================================= */

  useEffect(() => {
    if (
      hideReminder
    ) {
      setOpen(
        false,
      );
    }
  }, [
    hideReminder,
  ]);

  /* =======================================================
     OPEN
  ======================================================= */

  function handleOpen() {
    setOpen(
      true,
    );

    setSaved(
      false,
    );

    setError(
      "",
    );
  }

  /* =======================================================
     CLOSE
  ======================================================= */

  function handleClose() {
    if (
      saving
    ) {
      return;
    }

    setOpen(
      false,
    );

    setError(
      "",
    );
  }

  /* =======================================================
     PREVIOUS MONTH
  ======================================================= */

  function previousMonth() {
    if (
      !canGoPreviousMonth
    ) {
      return;
    }

    setViewDate(
      (
        current,
      ) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1,
        ),
    );
  }

  /* =======================================================
     NEXT MONTH
  ======================================================= */

  function nextMonth() {
    setViewDate(
      (
        current,
      ) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1,
        ),
    );
  }

  /* =======================================================
     DATE SELECT
  ======================================================= */

  async function handleDateSelect(
    date: Date,
  ) {
    const normalized =
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

    if (
      normalized <
      today
    ) {
      return;
    }

    setSelectedDate(
      normalized,
    );

    setSaved(
      false,
    );

    setError(
      "",
    );

    const loggedIn =
      await checkLogin();

    if (
      !loggedIn
    ) {
      requestLogin();
    }
  }

  /* =======================================================
     SAVE REMINDER
  ======================================================= */

  async function saveReminder() {
    if (
      !selectedDate
    ) {
      setError(
        "Please select a date.",
      );

      return;
    }

    const cleanMessage =
      message.trim();

    if (
      !cleanMessage
    ) {
      setError(
        "Please write your message.",
      );

      return;
    }

    const loggedIn =
      await checkLogin();

    if (
      !loggedIn
    ) {
      requestLogin();

      return;
    }

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      await apiFetch<SaveResponse>(
        "/api/notifications/my-promotions",
        {
          method:
            "POST",

          body: {
            date:
              dateKey(
                selectedDate,
              ),

            message: [
              {
                id:
                  1,

                text:
                  cleanMessage,
              },
            ],
          },
        },
      );

      setSaved(
        true,
      );

      window.setTimeout(
        () => {
          setOpen(
            false,
          );

          setSaved(
            false,
          );

          setSelectedDate(
            null,
          );

          setMessage(
            "",
          );

          setAuthenticated(
            null,
          );

          setError(
            "",
          );
        },
        1800,
      );
    } catch (
      saveError
    ) {
      if (
        saveError instanceof
          ApiError &&
        (
          saveError.status ===
            401 ||
          saveError.status ===
            403
        )
      ) {
        setAuthenticated(
          false,
        );

        requestLogin();

        return;
      }

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save reminder.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  /* =======================================================
     SELECTED DATE LABEL
  ======================================================= */

  const selectedDateLabel =
    selectedDate
      ? selectedDate.toLocaleDateString(
          "en-IN",
          {
            day:
              "2-digit",

            month:
              "short",

            year:
              "numeric",
          },
        )
      : "";

  /* =======================================================
     HIDDEN ROUTES
  ======================================================= */

  if (
    hideReminder
  ) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =================================================
          FLOATING CALENDAR BUTTON

          CHATBOT KE UPAR
      ================================================= */}

      <button
        type="button"
        aria-label="Set monthly reminder"
        onClick={
          handleOpen
        }
        className="
          fixed

          bottom-[175px]
          right-4

          z-[9970]

          flex

          h-[46px]
          w-[46px]

          cursor-pointer

          items-center
          justify-center

          rounded-full

          border
          border-[#F2ADC1]

          bg-white

          text-[#D41455]

          shadow-[0_8px_25px_rgba(133,28,63,.20)]

          transition-all
          duration-200

          hover:scale-105
          hover:bg-[#FFF4F7]

          active:scale-95

          sm:bottom-[185px]
          sm:right-5

          lg:bottom-[190px]
          lg:right-7
        "
      >
        <CalendarIcon />
      </button>

      {/* =================================================
          COMPACT REMINDER PANEL

          CHATBOT + CALENDAR BUTTON KE UPAR
      ================================================= */}

      {open ? (
        <div
          className="
            fixed

            bottom-[230px]
            right-3

            z-[10010]

            w-[calc(100vw-24px)]
            max-w-[310px]

            overflow-hidden

            rounded-[16px]

            border
            border-[#F0D5DD]

            bg-white

            shadow-[0_18px_55px_rgba(54,19,31,.20)]

            sm:bottom-[240px]
            sm:right-5
            sm:max-w-[320px]

            lg:bottom-[245px]
            lg:right-7
          "
        >
          {/* =============================================
              HEADER
          ============================================= */}

          <div
            className="
              flex

              items-center
              justify-between

              border-b
              border-[#F2E3E7]

              px-3.5
              py-2.5
            "
          >
            <div
              className="
                flex

                items-center

                gap-2
              "
            >
              <span
                className="
                  flex

                  h-7
                  w-7

                  items-center
                  justify-center

                  rounded-full

                  bg-[#FFF0F4]

                  text-[#D41455]
                "
              >
                <CalendarSmallIcon />
              </span>

              <div>
                <p
                  className="
                    text-[11px]

                    font-bold

                    text-[#251B1E]
                  "
                >
                  Set a Reminder
                </p>

                <p
                  className="
                    text-[7px]

                    text-black/40
                  "
                >
                  Monthly promotion reminder
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close reminder"
              onClick={
                handleClose
              }
              className="
                flex

                h-7
                w-7

                cursor-pointer

                items-center
                justify-center

                rounded-full

                border-0

                bg-[#F8F5F5]

                text-[16px]

                text-black/40

                hover:bg-[#F3EAEC]
                hover:text-black
              "
            >
              ×
            </button>
          </div>

          {/* =============================================
              SUCCESS
          ============================================= */}

          {saved ? (
            <div
              className="
                px-4
                py-6

                text-center
              "
            >
              <div
                className="
                  mx-auto

                  flex

                  h-[48px]
                  w-[48px]

                  items-center
                  justify-center

                  rounded-full

                  bg-[#DFF7E7]

                  text-[22px]

                  font-bold

                  text-[#159447]
                "
              >
                ✓
              </div>

              <h3
                className="
                  mt-3

                  text-[15px]

                  font-bold

                  text-[#211A1C]
                "
              >
                Reminder Saved!
              </h3>

              <p
                className="
                  mt-1.5

                  text-[9px]

                  text-black/45
                "
              >
                Your reminder has been saved.
              </p>

              <div
                className="
                  mt-3

                  rounded-[10px]

                  bg-[#FFF5F7]

                  px-3
                  py-2.5

                  text-left
                "
              >
                <span
                  className="
                    text-[8px]

                    text-black/40
                  "
                >
                  Reminder Date
                </span>

                <p
                  className="
                    mt-0.5

                    text-[10px]

                    font-bold

                    text-[#B81449]
                  "
                >
                  {
                    selectedDateLabel
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ===========================================
                  CALENDAR
              =========================================== */}

              <div
                className="
                  px-3.5
                  pb-3
                  pt-2.5
                "
              >
                <div
                  className="
                    flex

                    items-center
                    justify-between
                  "
                >
                  <p
                    className="
                      text-[8px]

                      font-semibold

                      text-[#5E5255]
                    "
                  >
                    Select Date
                  </p>

                  <div
                    className="
                      flex

                      items-center

                      gap-1
                    "
                  >
                    <button
                      type="button"
                      aria-label="Previous month"
                      disabled={
                        !canGoPreviousMonth
                      }
                      onClick={
                        previousMonth
                      }
                      className="
                        flex

                        h-6
                        w-6

                        items-center
                        justify-center

                        rounded-full

                        text-[15px]

                        text-black/50

                        transition

                        hover:bg-[#FFF1F5]
                        hover:text-[#C4144D]

                        disabled:cursor-not-allowed
                        disabled:text-black/15
                      "
                    >
                      ‹
                    </button>

                    <span
                      className="
                        min-w-[82px]

                        text-center

                        text-[8px]

                        font-bold

                        text-[#241D1F]
                      "
                    >
                      {
                        MONTHS[
                          viewDate.getMonth()
                        ]
                      }{" "}
                      {
                        viewDate.getFullYear()
                      }
                    </span>

                    <button
                      type="button"
                      aria-label="Next month"
                      onClick={
                        nextMonth
                      }
                      className="
                        flex

                        h-6
                        w-6

                        cursor-pointer

                        items-center
                        justify-center

                        rounded-full

                        text-[15px]

                        text-black/50

                        transition

                        hover:bg-[#FFF1F5]
                        hover:text-[#C4144D]
                      "
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* =========================================
                    WEEK DAYS
                ========================================= */}

                <div
                  className="
                    mt-2

                    grid

                    grid-cols-7

                    gap-[2px]
                  "
                >
                  {WEEK_DAYS.map(
                    (
                      day,
                    ) => (
                      <div
                        key={
                          day
                        }
                        className="
                          py-1

                          text-center

                          text-[6px]

                          font-semibold

                          text-black/35
                        "
                      >
                        {
                          day
                        }
                      </div>
                    ),
                  )}

                  {/* =======================================
                      DATES
                  ======================================= */}

                  {calendarDays.map(
                    (
                      item,
                    ) => {
                      const normalizedDate =
                        new Date(
                          item.date.getFullYear(),
                          item.date.getMonth(),
                          item.date.getDate(),
                        );

                      const isPast =
                        normalizedDate <
                        today;

                      const isSelected =
                        selectedDate
                          ? sameDay(
                              item.date,
                              selectedDate,
                            )
                          : false;

                      const isToday =
                        sameDay(
                          item.date,
                          today,
                        );

                      const selectable =
                        item.currentMonth &&
                        !isPast;

                      return (
                        <button
                          key={
                            dateKey(
                              item.date,
                            )
                          }
                          type="button"
                          disabled={
                            !selectable
                          }
                          onClick={() =>
                            void handleDateSelect(
                              item.date,
                            )
                          }
                          className={`
                            mx-auto

                            flex

                            h-[26px]
                            w-[26px]

                            items-center
                            justify-center

                            rounded-full

                            text-[8px]

                            font-semibold

                            transition-all

                            ${
                              !item.currentMonth
                                ? `
                                  cursor-default
                                  text-transparent
                                `
                                : ""
                            }

                            ${
                              item.currentMonth &&
                              isPast
                                ? `
                                  cursor-not-allowed
                                  text-[#D7D1D3]
                                `
                                : ""
                            }

                            ${
                              item.currentMonth &&
                              !isPast &&
                              !isSelected
                                ? `
                                  cursor-pointer
                                  text-[#171214]

                                  hover:bg-[#FFF0F4]
                                  hover:text-[#C4144D]
                                `
                                : ""
                            }

                            ${
                              isToday &&
                              !isSelected
                                ? `
                                  border
                                  border-[#DA648A]

                                  font-bold

                                  text-[#B81449]
                                `
                                : ""
                            }

                            ${
                              isSelected
                                ? `
                                  bg-[#D41455]

                                  font-bold

                                  text-white

                                  shadow-[0_4px_12px_rgba(212,20,85,.28)]
                                `
                                : ""
                            }
                          `}
                        >
                          {
                            item.date.getDate()
                          }
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* ===========================================
                  SELECTED DATE
              =========================================== */}

              {selectedDate ? (
                <div
                  className="
                    border-t
                    border-[#F2E3E7]

                    px-3.5
                    py-3
                  "
                >
                  <div
                    className="
                      flex

                      items-center
                      justify-between

                      rounded-[8px]

                      bg-[#FFF5F7]

                      px-2.5
                      py-2
                    "
                  >
                    <span
                      className="
                        text-[7px]

                        text-black/40
                      "
                    >
                      Selected Date
                    </span>

                    <strong
                      className="
                        text-[8px]

                        text-[#B81449]
                      "
                    >
                      {
                        selectedDateLabel
                      }
                    </strong>
                  </div>

                  {/* =======================================
                      CHECK LOGIN
                  ======================================= */}

                  {checkingLogin ? (
                    <div
                      className="
                        mt-2.5

                        rounded-[8px]

                        bg-[#FAF7F8]

                        px-3
                        py-2.5

                        text-[8px]

                        text-black/45
                      "
                    >
                      Checking login...
                    </div>
                  ) : null}

                  {/* =======================================
                      GUEST
                  ======================================= */}

                  {!checkingLogin &&
                  authenticated ===
                    false ? (
                    <div
                      className="
                        mt-2.5

                        rounded-[10px]

                        border
                        border-[#F2CAD7]

                        bg-[#FFF6F8]

                        p-3
                      "
                    >
                      <div
                        className="
                          flex

                          items-center

                          gap-2
                        "
                      >
                        <span
                          className="
                            flex

                            h-7
                            w-7

                            shrink-0

                            items-center
                            justify-center

                            rounded-full

                            bg-[#FADDE7]

                            text-[#C91650]
                          "
                        >
                          <LockIcon />
                        </span>

                        <div>
                          <p
                            className="
                              text-[9px]

                              font-bold

                              text-[#33272B]
                            "
                          >
                            Login Required
                          </p>

                          <p
                            className="
                              mt-0.5

                              text-[7px]

                              text-black/45
                            "
                          >
                            Login to save your reminder.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          requestLogin
                        }
                        className="
                          mt-2.5

                          h-8
                          w-full

                          cursor-pointer

                          rounded-[7px]

                          border-0

                          bg-[#D41455]

                          text-[8px]

                          font-bold

                          text-white

                          hover:bg-[#B51147]
                        "
                      >
                        Login to Continue
                      </button>
                    </div>
                  ) : null}

                  {/* =======================================
                      MESSAGE
                  ======================================= */}

                  {!checkingLogin &&
                  authenticated ===
                    true ? (
                    <>
                      <label
                        className="
                          mt-2.5

                          block

                          text-[8px]

                          font-bold

                          text-[#46393C]
                        "
                      >
                        Your Message
                      </label>

                      <div
                        className="
                          relative

                          mt-1.5
                        "
                      >
                        <textarea
                          value={
                            message
                          }
                          onChange={(
                            event,
                          ) => {
                            setMessage(
                              event.target.value,
                            );

                            if (
                              error
                            ) {
                              setError(
                                "",
                              );
                            }
                          }}
                          maxLength={
                            250
                          }
                          rows={
                            3
                          }
                          placeholder="Write your reminder message..."
                          className="
                            block

                            min-h-[70px]
                            w-full

                            resize-none

                            rounded-[9px]

                            border
                            border-[#E6D9DC]

                            bg-white

                            px-2.5
                            pb-5
                            pt-2.5

                            text-[8px]

                            leading-4

                            text-[#302529]

                            outline-none

                            placeholder:text-black/25

                            focus:border-[#DC6D91]

                            focus:ring-2
                            focus:ring-[#F9DDE6]
                          "
                        />

                        <span
                          className="
                            absolute

                            bottom-1.5
                            right-2.5

                            text-[6px]

                            text-black/25
                          "
                        >
                          {
                            message.length
                          }
                          /250
                        </span>
                      </div>

                      {error ? (
                        <p
                          className="
                            mt-1.5

                            text-[7px]

                            font-medium

                            text-[#D13242]
                          "
                        >
                          {
                            error
                          }
                        </p>
                      ) : null}

                      <button
                        type="button"
                        disabled={
                          saving ||
                          !message.trim()
                        }
                        onClick={() =>
                          void saveReminder()
                        }
                        className="
                          mt-2.5

                          flex

                          h-9
                          w-full

                          cursor-pointer

                          items-center
                          justify-center

                          gap-1.5

                          rounded-[8px]

                          border-0

                          bg-[#D41455]

                          text-[8px]

                          font-bold

                          text-white

                          shadow-[0_5px_15px_rgba(212,20,85,.18)]

                          transition

                          hover:bg-[#B51147]

                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        <CalendarSmallIcon />

                        {saving
                          ? "Saving..."
                          : "Save Reminder"}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : (
                <div
                  className="
                    border-t
                    border-[#F2E3E7]

                    px-3
                    py-2.5
                  "
                >
                  <p
                    className="
                      text-center

                      text-[7px]

                      text-black/35
                    "
                  >
                    Select a future date to continue.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

/* =========================================================
   CALENDAR ICON
========================================================= */

function CalendarIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
      />

      <path d="M8 3v4" />

      <path d="M16 3v4" />

      <path d="M3 10h18" />

      <path d="M8 14h.01" />

      <path d="M12 14h.01" />

      <path d="M16 14h.01" />

      <path d="M8 18h.01" />

      <path d="M12 18h.01" />
    </svg>
  );
}

/* =========================================================
   SMALL CALENDAR ICON
========================================================= */

function CalendarSmallIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
      />

      <path d="M8 3v4" />

      <path d="M16 3v4" />

      <path d="M3 10h18" />
    </svg>
  );
}

/* =========================================================
   LOCK ICON
========================================================= */

function LockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}