"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  Bell,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Package,
  ShoppingBag,
} from "lucide-react";

/* =========================================================
   API
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(
  /\/$/,
  "",
);

/* =========================================================
   TYPES
========================================================= */

type AccountData = {
  id: string;

  name: string;

  email: string;

  phone: string;

  avatar?: {
    url: string;

    publicId?: string;
  } | null;

  memberSince: string;
};

type AccountApiResponse = {
  success: boolean;

  message?: string;

  account?: AccountData;
};

/* =========================================================
   LINKS
========================================================= */

const sidebarLinks = [
  {
    label:
      "My Account",

    href:
      "/account",

    icon:
      Home,
  },

  {
    label:
      "Orders",

    href:
      "/account/orders",

    icon:
      Package,
  },

  {
    label:
      "Wishlist",

    href:
      "/wishlist",

    icon:
      Heart,
  },

  {
    label:
      "Addresses",

    href:
      "/account/addresses",

    icon:
      MapPin,
  },

  {
    label:
      "Cart",

    href:
      "/cart",

    icon:
      ShoppingBag,
  },

  {
    label:
      "Notifications",

    href:
      "/account/notifications",

    icon:
      Bell,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function capitalizeName(
  name: string,
) {
  const value =
    String(
      name || "",
    ).trim();

  if (!value) {
    return "User";
  }

  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
}

function getInitial(
  name: string,
) {
  return (
    String(
      name || "",
    )
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "U"
  );
}

function formatMemberSince(
  value: string,
) {
  if (!value) {
    return "";
  }

  const parsed =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month:
        "short",

      year:
        "numeric",
    },
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AccountSidebar() {
  const pathname =
    usePathname();

  const [
    account,
    setAccount,
  ] =
    useState<AccountData | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  const [
    stickyTop,
    setStickyTop,
  ] =
    useState(
      0,
    );

  const mobileMenuRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =======================================================
     LOAD ACCOUNT
  ======================================================= */

  useEffect(() => {
    let mounted =
      true;

    async function loadAccount() {
      try {
        setLoading(
          true,
        );

        setError(
          "",
        );

        const response =
          await fetch(
            `${API_URL}/api/auth/account`,
            {
              method:
                "GET",

              credentials:
                "include",

              cache:
                "no-store",

              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        if (
          response.status ===
          401
        ) {
          if (
            mounted
          ) {
            setAccount(
              null,
            );

            setError(
              "",
            );
          }

          return;
        }

        const data =
          (await response.json()) as AccountApiResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.account
        ) {
          throw new Error(
            data.message ||
              "Unable to load account.",
          );
        }

        if (
          mounted
        ) {
          setAccount(
            data.account,
          );
        }
      } catch (
        loadError
      ) {
        console.error(
          "ACCOUNT SIDEBAR ERROR:",
          loadError,
        );

        if (
          mounted
        ) {
          setAccount(
            null,
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load account.",
          );
        }
      } finally {
        if (
          mounted
        ) {
          setLoading(
            false,
          );
        }
      }
    }

    void loadAccount();

    return () => {
      mounted =
        false;
    };
  }, []);

  /* =======================================================
     STICKY TOP

     Same behavior as your old sidebar.

     Header fixed/sticky:
     sidebar header ke neeche chipkega.

     Header normal:
     viewport top = 0.
  ======================================================= */

  const updateStickyTop =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const header =
        document.querySelector(
          "header",
        );

      if (
        !header
      ) {
        setStickyTop(
          0,
        );

        return;
      }

      const styles =
        window.getComputedStyle(
          header,
        );

      if (
        styles.position ===
          "fixed" ||
        styles.position ===
          "sticky"
      ) {
        const height =
          Math.ceil(
            header
              .getBoundingClientRect()
              .height,
          );

        setStickyTop(
          height,
        );

        return;
      }

      setStickyTop(
        0,
      );
    }, []);

  useEffect(() => {
    updateStickyTop();

    window.addEventListener(
      "resize",
      updateStickyTop,
    );

    const timeout =
      window.setTimeout(
        updateStickyTop,
        150,
      );

    const header =
      document.querySelector(
        "header",
      );

    let observer:
      | ResizeObserver
      | undefined;

    if (
      header &&
      typeof ResizeObserver !==
        "undefined"
    ) {
      observer =
        new ResizeObserver(
          () => {
            updateStickyTop();
          },
        );

      observer.observe(
        header,
      );
    }

    return () => {
      window.removeEventListener(
        "resize",
        updateStickyTop,
      );

      window.clearTimeout(
        timeout,
      );

      observer?.disconnect();
    };
  }, [
    updateStickyTop,
  ]);

  /* =======================================================
     MOBILE MENU ARROW
  ======================================================= */

  const scrollMobileMenuRight =
    useCallback(() => {
      const menu =
        mobileMenuRef.current;

      if (
        !menu
      ) {
        return;
      }

      const reachedEnd =
        menu.scrollLeft +
          menu.clientWidth >=
        menu.scrollWidth -
          10;

      if (
        reachedEnd
      ) {
        menu.scrollTo({
          left:
            0,

          behavior:
            "smooth",
        });

        return;
      }

      menu.scrollBy({
        left:
          170,

        behavior:
          "smooth",
      });
    }, []);

  /* =======================================================
     VALUES
  ======================================================= */

  const accountName =
    account
      ? capitalizeName(
          account.name,
        )
      : "User";

  const accountInitial =
    account
      ? getInitial(
          account.name,
        )
      : "U";

  const accountAvatar =
    account?.avatar?.url?.trim() ||
    "";

  const memberSince =
    account
      ? formatMemberSince(
          account.memberSince,
        )
      : "";

  const accountEmail =
    account?.email?.trim() ||
    "";

  function checkActive(
    href: string,
  ) {
    if (
      href ===
      "/account"
    ) {
      return (
        pathname ===
        "/account"
      );
    }

    return (
      pathname ===
        href ||
      pathname.startsWith(
        `${href}/`,
      )
    );
  }

  /* =======================================================
     RENDER

     Sticky ROOT same as before.
  ======================================================= */

  return (
    <div
      style={
        {
          top:
            `${stickyTop}px`,

          "--account-sticky-top":
            `${stickyTop}px`,
        } as CSSProperties
      }
      className="
        sticky

        z-[70]

        w-full

        shrink-0

        self-start

        lg:z-40

        lg:h-[calc(100dvh-var(--account-sticky-top))]

        lg:w-[275px]
      "
    >
      {/* ===================================================
          MOBILE

          CLEAN WHITE VERSION
      =================================================== */}

      <section
        className="
          w-full

          border-b
          border-black/[0.08]

          bg-white/95

          text-[#211A18]

          shadow-[0_5px_18px_rgba(33,26,24,0.07)]

          backdrop-blur-xl

          lg:hidden
        "
      >
        {/* PROFILE */}

        <div
          className="
            flex

            items-center

            gap-3

            border-b
            border-black/[0.06]

            px-3

            py-2.5
          "
        >
          {/* AVATAR */}

          <div
            className="
              flex

              h-10
              w-10

              shrink-0

              items-center
              justify-center

              overflow-hidden

              rounded-full

              border
              border-[#E7C7D0]

              bg-[#F9E4EA]

              text-[13px]
              font-bold
              uppercase

              text-[#B31345]
            "
          >
            {loading ? (
              <div
                className="
                  h-full
                  w-full

                  animate-pulse

                  bg-[#F4D5DE]
                "
              />
            ) : accountAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  accountAvatar
                }
                alt={
                  accountName
                }
                className="
                  h-full
                  w-full

                  object-cover
                "
              />
            ) : (
              accountInitial
            )}
          </div>

          {/* INFO */}

          <div
            className="
              min-w-0

              flex-1
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
              {loading
                ? "Loading..."
                : accountName}
            </p>

            {accountEmail ? (
              <p
                className="
                  mt-0.5

                  truncate

                  text-[8px]

                  text-[#211A18]/50
                "
              >
                {accountEmail}
              </p>
            ) : memberSince ? (
              <p
                className="
                  mt-0.5

                  text-[8px]

                  text-[#B31345]/70
                "
              >
                Member since{" "}
                {
                  memberSince
                }
              </p>
            ) : (
              <p
                className="
                  mt-0.5

                  text-[8px]

                  text-[#211A18]/45
                "
              >
                My Account
              </p>
            )}
          </div>
        </div>

        {/* =================================================
            MOBILE MENU
        ================================================= */}

        <div
          className="
            relative

            w-full
          "
        >
          <div
            ref={
              mobileMenuRef
            }
            className="
              w-full

              overflow-x-auto

              pr-12

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden
            "
          >
            <nav
              className="
                flex

                min-w-max

                items-center

                gap-1.5

                px-2

                py-2
              "
            >
              {sidebarLinks.map(
                (
                  item,
                ) => {
                  const active =
                    checkActive(
                      item.href,
                    );

                  const Icon =
                    item.icon;

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      className={`
                        flex

                        h-9

                        min-w-max

                        items-center
                        justify-center

                        gap-1.5

                        rounded-[9px]

                        px-3

                        text-[8px]
                        font-semibold

                        no-underline

                        transition-all
                        duration-200

                        ${
                          active
                            ? `
                              bg-[#F9E3E9]

                              text-[#B31345]

                              shadow-[inset_0_0_0_1px_rgba(179,19,69,0.08)]
                            `
                            : `
                              bg-[#F8F6F5]

                              text-[#4C4542]

                              hover:bg-[#F4ECE9]

                              hover:text-[#B31345]
                            `
                        }
                      `}
                    >
                      <Icon
                        size={
                          12
                        }
                        strokeWidth={
                          1.8
                        }
                      />

                      <span>
                        {
                          item.label
                        }
                      </span>
                    </Link>
                  );
                },
              )}
            </nav>
          </div>

          {/* RIGHT ARROW */}

          <div
            className="
              pointer-events-none

              absolute

              inset-y-0

              right-0

              z-20

              flex

              w-12

              items-center
              justify-end

              bg-gradient-to-l

              from-white

              via-white/95

              to-transparent

              pr-1.5
            "
          >
            <button
              type="button"
              aria-label="Scroll account menu right"
              onClick={
                scrollMobileMenuRight
              }
              className="
                pointer-events-auto

                flex

                h-8
                w-8

                items-center
                justify-center

                rounded-full

                border
                border-black/10

                bg-white

                text-[#B31345]

                shadow-[0_4px_12px_rgba(33,26,24,0.10)]

                transition

                hover:bg-[#F9E3E9]

                active:scale-95
              "
            >
              <ChevronRight
                size={
                  16
                }
                strokeWidth={
                  2
                }
              />
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          DESKTOP

          OPTION 1
          CLEAN WHITE SIDEBAR
      =================================================== */}

      <aside
        className="
          hidden

          h-full

          w-[275px]

          overflow-y-auto

          border-r
          border-black/[0.07]

          bg-white

          px-4

          py-5

          text-[#211A18]

          shadow-[5px_0_24px_rgba(33,26,24,0.035)]

          lg:block

          [scrollbar-width:none]

          [&::-webkit-scrollbar]:hidden
        "
      >
        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <div
          className="
            mb-5

            rounded-[16px]

            border
            border-black/[0.06]

            bg-[#FCFAF9]

            p-4
          "
        >
          <div
            className="
              flex

              items-center

              gap-3.5
            "
          >
            {/* AVATAR */}

            <div
              className="
                flex

                h-[56px]
                w-[56px]

                shrink-0

                items-center
                justify-center

                overflow-hidden

                rounded-full

                border
                border-[#E5C2CC]

                bg-[#F8DEE5]

                text-[18px]
                font-bold
                uppercase

                text-[#B31345]
              "
            >
              {loading ? (
                <div
                  className="
                    h-full
                    w-full

                    animate-pulse

                    bg-[#F3D5DD]
                  "
                />
              ) : accountAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    accountAvatar
                  }
                  alt={
                    accountName
                  }
                  className="
                    h-full
                    w-full

                    object-cover
                  "
                />
              ) : (
                accountInitial
              )}
            </div>

            {/* NAME */}

            <div
              className="
                min-w-0

                flex-1
              "
            >
              <h2
                className="
                  truncate

                  text-[15px]
                  font-semibold

                  text-[#211A18]
                "
              >
                {loading
                  ? "Loading..."
                  : accountName}
              </h2>

              {accountEmail ? (
                <p
                  className="
                    mt-1

                    truncate

                    text-[9px]

                    text-[#211A18]/50
                  "
                >
                  {
                    accountEmail
                  }
                </p>
              ) : null}

              {memberSince ? (
                <p
                  className="
                    mt-1

                    text-[9px]

                    text-[#B31345]/65
                  "
                >
                  Member since{" "}
                  {
                    memberSince
                  }
                </p>
              ) : null}

              {!loading &&
              !account ? (
                <p
                  className="
                    mt-1

                    text-[9px]

                    text-[#211A18]/45
                  "
                >
                  Please login
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading &&
        error &&
        !account ? (
          <div
            className="
              mb-4

              rounded-[10px]

              border
              border-red-100

              bg-red-50

              px-3

              py-2.5

              text-[9px]

              text-red-600
            "
          >
            {error}
          </div>
        ) : null}

        {/* =================================================
            LABEL
        ================================================= */}

        <p
          className="
            mb-2

            px-2

            text-[8px]
            font-bold
            uppercase

            tracking-[0.18em]

            text-[#211A18]/35
          "
        >
          Account
        </p>

        {/* =================================================
            DESKTOP MENU
        ================================================= */}

        <nav
          className="
            space-y-1.5
          "
        >
          {sidebarLinks.map(
            (
              item,
            ) => {
              const active =
                checkActive(
                  item.href,
                );

              const Icon =
                item.icon;

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={`
                    group

                    flex

                    h-[46px]

                    items-center

                    gap-3

                    rounded-[11px]

                    px-3

                    text-[12px]

                    no-underline

                    transition-all
                    duration-200

                    ${
                      active
                        ? `
                          bg-[#F9E3E9]

                          font-semibold

                          text-[#B31345]
                        `
                        : `
                          font-medium

                          text-[#3D3734]

                          hover:bg-[#F8F4F2]

                          hover:text-[#B31345]
                        `
                    }
                  `}
                >
                  {/* ICON */}

                  <span
                    className={`
                      flex

                      h-8
                      w-8

                      shrink-0

                      items-center
                      justify-center

                      rounded-[9px]

                      transition-all
                      duration-200

                      ${
                        active
                          ? `
                            bg-white

                            text-[#B31345]

                            shadow-[0_3px_10px_rgba(179,19,69,0.08)]
                          `
                          : `
                            bg-[#F7F4F2]

                            text-[#5E5652]

                            group-hover:bg-white

                            group-hover:text-[#B31345]
                          `
                      }
                    `}
                  >
                    <Icon
                      size={
                        16
                      }
                      strokeWidth={
                        1.7
                      }
                    />
                  </span>

                  {/* TEXT */}

                  <span
                    className="
                      flex-1
                    "
                  >
                    {
                      item.label
                    }
                  </span>

                  {/* ACTIVE DOT */}

                  {active ? (
                    <span
                      className="
                        h-1.5
                        w-1.5

                        rounded-full

                        bg-[#B31345]
                      "
                    />
                  ) : null}
                </Link>
              );
            },
          )}
        </nav>

        {/* =================================================
            BOTTOM DIVIDER
        ================================================= */}

        <div
          className="
            mt-6

            border-t
            border-black/[0.06]

            pt-4
          "
        >
          <div
            className="
              rounded-[12px]

              bg-[#FAF7F5]

              px-3

              py-3
            "
          >
            <p
              className="
                text-[9px]
                font-semibold

                text-[#211A18]
              "
            >
              Hivra Soft Account
            </p>

            <p
              className="
                mt-1

                text-[8px]
                leading-4

                text-[#211A18]/45
              "
            >
              Manage your
              orders, wishlist,
              addresses and
              notifications.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}