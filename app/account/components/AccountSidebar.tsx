"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

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
  message: string;
  account?: AccountData;
};

/* =========================================================
   SIDEBAR BANNER
========================================================= */

const SIDEBAR_BANNER =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85";

/* =========================================================
   LINKS
========================================================= */

const sidebarLinks = [
  {
    label: "My Account",
    href: "/account",
    icon: "⌂",
  },
  {
    label: "Orders",
    href: "/account/orders",
    icon: "□",
  },
  {
    label: "Wishlist",
    href: "/account/wishlist",
    icon: "♡",
  },
  {
    label: "Addresses",
    href: "/account/addresses",
    icon: "⌖",
  },
  {
    label: "Card",
    href: "/account/card",
    icon: "▣",
  },
  {
    label: "Account Settings",
    href: "/account/settings",
    icon: "⚙",
  },
  {
    label: "Notifications",
    href: "/account/notifications",
    icon: "♢",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function capitalizeName(name: string) {
  const value = name?.trim();

  if (!value) {
    return "User";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function getInitial(name: string) {
  return (
    name?.trim().charAt(0).toUpperCase() ||
    "U"
  );
}

function formatMemberSince(date: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    /*
      Agar backend already:
      "Sep 2026"
      jaisa formatted value bhej raha hai
      to wahi dikha do.
    */
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AccountSidebar() {
  const pathname = usePathname();

  /* =======================================================
     STATE
  ======================================================= */

  const [account, setAccount] =
    useState<AccountData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH ACCOUNT FROM BACKEND
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadAccount = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/auth/account`,
          {
            method: "GET",

            /*
              Cookie backend ko bhejne ke liye
              bahut important hai.
            */
            credentials: "include",

            cache: "no-store",

            headers: {
              Accept: "application/json",
            },
          }
        );

        /* ===============================================
           USER NOT LOGGED IN
        =============================================== */

        if (response.status === 401) {
          if (mounted) {
            setAccount(null);
            setError("");
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
              "Unable to load account."
          );
        }

        if (mounted) {
          setAccount(data.account);
        }
      } catch (error) {
        console.error(
          "SIDEBAR ACCOUNT API ERROR:",
          error
        );

        if (mounted) {
          setAccount(null);

          setError(
            error instanceof Error
              ? error.message
              : "Unable to load account."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadAccount();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     VALUES FROM API
  ======================================================= */

  const accountName = account
    ? capitalizeName(account.name)
    : "";

  const accountInitial = account
    ? getInitial(account.name)
    : "U";

  const accountAvatar =
    account?.avatar?.url?.trim() || "";

  const accountMemberSince = account
    ? formatMemberSince(
        account.memberSince
      )
    : "";

  /* =======================================================
     ACTIVE MENU
  ======================================================= */

  const checkActive = (
    href: string
  ) => {
    /*
      /account sirf account dashboard
      par active hoga.
    */

    if (href === "/account") {
      return pathname === "/account";
    }

    /*
      /account/orders/123 par bhi
      Orders active rahega.
    */

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <aside
      className="
        hidden
        w-[280px]
        shrink-0
        border-r
        border-[#211A18]/10
        bg-white
        px-5
        py-8
        lg:block
      "
    >
      {/* ===================================================
          PROFILE
      =================================================== */}

      <div
        className="
          mb-8
          flex
          items-center
          gap-4
        "
      >
        {/* AVATAR */}

        <div
          className="
            relative
            flex
            h-[68px]
            w-[68px]
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-full
            bg-[#8C1839]
            text-[24px]
            font-semibold
            uppercase
            text-white
          "
        >
          {loading ? (
            <div
              className="
                h-full
                w-full
                animate-pulse
                bg-[#EFE6E1]
              "
            />
          ) : accountAvatar ? (
            <img
              src={accountAvatar}
              alt={
                accountName ||
                "Profile"
              }
              className="
                h-full
                w-full
                object-cover
              "
            />
          ) : (
            <span>
              {accountInitial}
            </span>
          )}
        </div>

        {/* ===============================================
            USER DETAILS
        =============================================== */}

        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <div
                className="
                  h-6
                  w-[110px]
                  animate-pulse
                  rounded
                  bg-[#EFE6E1]
                "
              />

              <div
                className="
                  mt-2
                  h-3
                  w-[130px]
                  animate-pulse
                  rounded
                  bg-[#EFE6E1]
                "
              />
            </>
          ) : account ? (
            <>
              <h2
                className="
                  truncate
                  font-serif
                  text-[20px]
                  font-medium
                "
              >
                {accountName}
              </h2>

              {accountMemberSince && (
                <p
                  className="
                    mt-1
                    truncate
                    text-[12px]
                    text-[#A66D63]
                  "
                >
                  Member since{" "}
                  {
                    accountMemberSince
                  }
                </p>
              )}
            </>
          ) : (
            <>
              <h2
                className="
                  truncate
                  font-serif
                  text-[20px]
                  font-medium
                "
              >
                User
              </h2>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-[#211A18]/45
                "
              >
                Please login
              </p>
            </>
          )}
        </div>
      </div>

      {/* ===================================================
          OPTIONAL ERROR
      =================================================== */}

      {!loading &&
        error &&
        !account && (
          <div
            className="
              mb-5
              rounded-[10px]
              bg-red-50
              px-3
              py-2
              text-[10px]
              leading-4
              text-red-600
            "
          >
            {error}
          </div>
        )}

      {/* ===================================================
          MENU
      =================================================== */}

      <nav className="space-y-2">
        {sidebarLinks.map(
          (item) => {
            const active =
              checkActive(
                item.href
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  h-12
                  items-center
                  gap-4
                  rounded-[10px]
                  px-4
                  text-[13px]
                  transition
                  duration-300

                  ${
                    active
                      ? `
                        bg-[#F5DFDE]
                        font-semibold
                        text-[#211A18]
                      `
                      : `
                        hover:bg-[#F8F3EF]
                        hover:text-[#8C1839]
                      `
                  }
                `}
              >
                <span
                  className="
                    w-6
                    shrink-0
                    text-center
                    text-[20px]
                  "
                >
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </Link>
            );
          }
        )}
      </nav>

      {/* ===================================================
          BOTTOM PROMO
      =================================================== */}

      <div
        className="
          relative
          mt-10
          min-h-[300px]
          overflow-hidden
          rounded-[18px]
          bg-[#F7E7E1]
        "
      >
        {/* IMAGE */}

        <img
          src={SIDEBAR_BANNER}
          alt="Hivra Soft fashion"
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            object-center
          "
        />

        {/* OVERLAY */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-[#F8E8E2]/95
            via-[#F8E8E2]/75
            to-[#F5E0D9]/40
          "
        />

        {/* CONTENT */}

        <div
          className="
            relative
            z-10
            flex
            min-h-[300px]
            flex-col
            justify-between
            px-6
            py-8
          "
        >
          <div>
            <p
              className="
                font-serif
                text-[31px]
                italic
                leading-[1.12]
              "
            >
              A kinder,
              <br />
              brighter you
            </p>

            <span
              className="
                mt-2
                block
                text-[32px]
                text-[#8C1839]
              "
            >
              ♡
            </span>
          </div>

          <p
            className="
              max-w-[150px]
              text-[12px]
              leading-5
              text-[#211A18]/70
            "
          >
            Fashion for a softer,
            <br />
            happier tomorrow.
          </p>
        </div>
      </div>
    </aside>
  );
}