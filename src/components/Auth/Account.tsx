"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import LoginModal from "./LoginModal";

/* =========================================================
   TYPES
========================================================= */

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

type AccountProps = {
  mobile?: boolean;
  onBeforeOpen?: () => void;
};

type MeApiResponse = {
  success?: boolean;

  user?: AuthUser;

  account?: AuthUser;

  data?: {
    user?: AuthUser;
  };
};

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   HELPERS
========================================================= */

/**
 * Example:
 *
 * prahlad -> Prahlad
 * PRAHLAD -> Prahlad
 * prahlad kumar -> Prahlad Kumar
 */
function formatUserName(
  name?: string
) {
  if (!name) {
    return "User";
  }

  const cleanName =
    name.trim();

  if (!cleanName) {
    return "User";
  }

  return cleanName
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return "";
      }

      return (
        word
          .charAt(0)
          .toUpperCase() +
        word
          .slice(1)
          .toLowerCase()
      );
    })
    .join(" ");
}

/* =========================================================
   ACCOUNT
========================================================= */

export default function Account({
  mobile = false,
  onBeforeOpen,
}: AccountProps) {
  /* =======================================================
     STATE
  ======================================================= */

  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null
    );

  const [
    loginOpen,
    setLoginOpen,
  ] = useState(false);

  const [
    dropdownOpen,
    setDropdownOpen,
  ] = useState(false);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =======================================================
     LOAD CURRENT LOGGED-IN USER
  ======================================================= */

  const loadCurrentUser =
    useCallback(async () => {
      try {
        setAuthLoading(true);

        const response =
          await fetch(
            `${API_URL}/api/auth/me`,
            {
              method: "GET",

              credentials:
                "include",

              cache:
                "no-store",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!response.ok) {
          setUser(null);

          return;
        }

        const data =
          (await response.json()) as
            MeApiResponse;

        /*
          Different API response shapes
          ko support karega:

          {
            user: {...}
          }

          {
            account: {...}
          }

          {
            data: {
              user: {...}
            }
          }
        */

        const currentUser =
          data.user ||
          data.account ||
          data.data?.user ||
          null;

        if (!currentUser) {
          setUser(null);

          return;
        }

        setUser({
          ...currentUser,

          name:
            formatUserName(
              currentUser.name
            ),
        });
      } catch (error) {
        console.error(
          "LOAD CURRENT USER ERROR:",
          error
        );

        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }, []);

  /* =======================================================
     FIRST LOAD
  ======================================================= */

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  /* =======================================================
     LOGIN SUCCESS EVENT

     IMPORTANT:
     event.detail ko direct user nahi bana rahe.
     Login ke baad API se fresh user load hoga.
  ======================================================= */

  useEffect(() => {
    const handleAuthChanged =
      () => {
        setDropdownOpen(false);

        void loadCurrentUser();
      };

    const handleAuthLogout =
      () => {
        setUser(null);

        setDropdownOpen(
          false
        );

        setLoginOpen(false);
      };

    const handleAuthRequired =
      () => {
        onBeforeOpen?.();
        setDropdownOpen(false);
        setLoginOpen(true);
      };

    window.addEventListener(
      "hivrasoft-auth-changed",
      handleAuthChanged
    );

    window.addEventListener(
      "hivrasoft-auth-logout",
      handleAuthLogout
    );

    window.addEventListener(
      "hivrasoft-auth-required",
      handleAuthRequired
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-auth-changed",
        handleAuthChanged
      );

      window.removeEventListener(
        "hivrasoft-auth-logout",
        handleAuthLogout
      );

      window.removeEventListener(
        "hivrasoft-auth-required",
        handleAuthRequired
      );
    };
  }, [loadCurrentUser, onBeforeOpen]);

  /* =======================================================
     CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }

    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setDropdownOpen(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [dropdownOpen]);

  /* =======================================================
     ACCOUNT CLICK
  ======================================================= */

  const handleAccountClick =
    () => {
      if (authLoading) {
        return;
      }

      /*
        User login nahi hai
      */

      if (!user) {
        onBeforeOpen?.();

        setDropdownOpen(
          false
        );

        setLoginOpen(true);

        return;
      }

      /*
        Logged-in user
      */

      setDropdownOpen(
        (current) =>
          !current
      );
    };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    async () => {
      if (isLoggingOut) {
        return;
      }

      try {
        setIsLoggingOut(true);

        const response =
          await fetch(
            `${API_URL}/api/auth/logout`,
            {
              method: "POST",

              credentials:
                "include",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to logout."
          );
        }

        setUser(null);

        setDropdownOpen(false);

        window.dispatchEvent(
          new Event(
            "hivrasoft-auth-logout"
          )
        );
      } catch (error) {
        console.error(
          "LOGOUT ERROR:",
          error
        );
      } finally {
        setIsLoggingOut(
          false
        );
      }
    };

  /* =======================================================
     USER DISPLAY VALUES
  ======================================================= */

  const displayName =
    formatUserName(
      user?.name
    );

  /*
    Prahlad -> P
    Aman -> A
  */

  const userInitial =
    user
      ? displayName
          .charAt(0)
          .toUpperCase()
      : "U";

  const displayEmail =
    user?.email?.trim() ||
    "";

  const displayPhone =
    user?.phone?.trim() ||
    "";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <div
        ref={wrapperRef}
        data-account-menu
        className={`
          relative

          ${
            mobile
              ? "flex w-full justify-center"
              : ""
          }
        `}
      >
        {/* =============================================
            PROFILE BUTTON
        ============================================== */}

        <button
          type="button"
          onClick={
            handleAccountClick
          }
          disabled={
            authLoading
          }
          aria-label={
            user
              ? `${displayName} Profile`
              : "Login / Account"
          }
          title={
            user
              ? displayName
              : "Login / Account"
          }
          className={`
            flex
            shrink-0
            items-center
            justify-center
            rounded-full

            transition-all
            duration-300

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#8C1839]
            focus-visible:ring-offset-2

            ${
              mobile
                ? "h-12 w-12"
                : "h-11 w-11"
            }

            ${
              user
                ? `
                    bg-[#8C1839]
                    text-white
                    shadow-sm

                    hover:bg-[#211A18]
                  `
                : `
                    text-[#211A18]

                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  `
            }

            disabled:cursor-default
          `}
        >
          {authLoading ? (
            <span
              className="
                h-4
                w-4

                animate-spin

                rounded-full

                border-2
                border-white/30
                border-t-white
              "
            />
          ) : user ? (
            <span
              className="
                text-[15px]
                font-semibold
                uppercase
              "
            >
              {userInitial}
            </span>
          ) : (
            <UserIcon />
          )}
        </button>

        {/* =============================================
            USER DROPDOWN
        ============================================== */}

        {user &&
          dropdownOpen && (
            <div
              className={`
                absolute

                top-[calc(100%+12px)]

                z-[9999]

                w-[290px]

                overflow-hidden

                rounded-[18px]

                border
                border-[#211A18]/10

                bg-[#F9F6F2]

                shadow-[0_24px_60px_rgba(33,26,24,0.20)]

                ${
                  mobile
                    ? "left-1/2 -translate-x-1/2"
                    : "right-0"
                }
              `}
            >
              {/* =========================================
                  USER INFORMATION
              ========================================== */}

              <div
                className="
                  px-5
                  py-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  {/* USER INITIAL */}

                  <div
                    className="
                      flex
                      h-12
                      w-12

                      shrink-0

                      items-center
                      justify-center

                      rounded-full

                      bg-[#8C1839]

                      text-[16px]
                      font-semibold
                      uppercase
                      text-white

                      shadow-sm
                    "
                  >
                    {
                      userInitial
                    }
                  </div>

                  {/* USER NAME / EMAIL */}

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        truncate

                        font-serif

                        text-[17px]
                        font-semibold

                        capitalize

                        text-[#211A18]
                      "
                    >
                      {
                        displayName
                      }
                    </p>

                    {displayEmail && (
                      <p
                        className="
                          mt-1
                          truncate

                          text-[11px]

                          text-[#211A18]/55
                        "
                      >
                        {
                          displayEmail
                        }
                      </p>
                    )}

                    {displayPhone && (
                      <p
                        className="
                          mt-1
                          truncate

                          text-[10px]

                          text-[#211A18]/45
                        "
                      >
                        {
                          displayPhone
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* =========================================
                  MENU
              ========================================== */}

              <div
                className="
                  border-t
                  border-[#211A18]/10
                "
              >
                {/* ACCOUNT */}

                <Link
                  href="/account"
                  onClick={() =>
                    setDropdownOpen(
                      false
                    )
                  }
                  className="
                    block

                    border-b
                    border-[#211A18]/10

                    px-5
                    py-4

                    text-[10px]
                    font-semibold
                    uppercase

                    tracking-[0.13em]

                    text-[#211A18]

                    transition
                    duration-300

                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  "
                >
                  Account
                </Link>

                {/* ORDERS */}

                <Link
                  href="/account/orders"
                  onClick={() =>
                    setDropdownOpen(
                      false
                    )
                  }
                  className="
                    block

                    border-b
                    border-[#211A18]/10

                    px-5
                    py-4

                    text-[10px]
                    font-semibold
                    uppercase

                    tracking-[0.13em]

                    text-[#211A18]

                    transition
                    duration-300

                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  "
                >
                  Orders
                </Link>

                {/* ADDRESSES */}

                <Link
                  href="/account/addresses"
                  onClick={() =>
                    setDropdownOpen(
                      false
                    )
                  }
                  className="
                    block

                    border-b
                    border-[#211A18]/10

                    px-5
                    py-4

                    text-[10px]
                    font-semibold
                    uppercase

                    tracking-[0.13em]

                    text-[#211A18]

                    transition
                    duration-300

                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  "
                >
                  Addresses
                </Link>

                {/* =====================================
                    SIGN OUT
                ====================================== */}

                <div
                  className="
                    p-3
                  "
                >
                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    disabled={
                      isLoggingOut
                    }
                    className="
                      flex

                      h-11
                      w-full

                      items-center
                      justify-center

                      rounded-[11px]

                      text-[10px]
                      font-semibold
                      uppercase

                      tracking-[0.13em]

                      text-[#8C1839]

                      transition
                      duration-300

                      hover:bg-[#8C1839]
                      hover:text-white

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {isLoggingOut
                      ? "Signing out..."
                      : "Sign out"}
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* =============================================
          LOGIN MODAL
      ============================================== */}

      <LoginModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(
            false
          );
        }}
      />
    </>
  );
}

/* =========================================================
   USER ICON
========================================================= */

function UserIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
    </svg>
  );
}