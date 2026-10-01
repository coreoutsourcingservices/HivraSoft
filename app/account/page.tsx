"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Header from "@/src/components/Header/Header";
import AccountSidebar from "./components/AccountSidebar";

/* =========================================================
   API
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* =========================================================
   ACCOUNT API TYPES
========================================================= */

type AccountData = {
  id: string;
  name: string;
  email: string;
  phone: string;

  avatar: {
    url: string;
    publicId: string;
  };

  memberSince: string;
};

type AccountApiResponse = {
  success: boolean;
  message: string;
  account?: AccountData;
};
type AddressType = "home" | "work" | "other";

type AddressData = {
  id: string;
  userId?: string;

  fullName: string;
  phone: string;
  alternatePhone?: string;

  addressLine1: string;
  addressLine2?: string;
  landmark?: string;

  city: string;
  district?: string;
  state: string;
  postalCode: string;

  country: string;
  countryCode?: string;

  addressType: AddressType;

  isDefault: boolean;

  isShippingAddress?: boolean;
  isBillingAddress?: boolean;

  instructions?: string;

  createdAt?: string;
  updatedAt?: string;
};

type AddressesApiResponse = {
  success: boolean;
  message: string;
  count?: number;
  addresses?: AddressData[];
};

/* =========================================================
   STATIC USER / PAGE DATA

   YE DATA REMOVE NAHI KARNA.
   Sidebar, Banner, Orders, Wishlist,
   Cart, Address sab isi se chalenge.
========================================================= */

const user = {
  name: "Prahlad",

  email: "prahlad0227@gmail.com",

  phone: "+91 98765 43210",

  memberSince: "Sep 2026",

  photo:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85",

  /* WELCOME BANNER */

  welcomeBanner:
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=85",

  /* SIDEBAR BANNER */

  sidebarBanner:
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85",

  /* ADDRESS */

  /* ORDER */

  recentOrder: {
    id: "ORD-1001",

    name: "Linen Blend Kurta Set",

    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=80",

    size: "M",

    quantity: 1,

    price: 2499,

    status: "Delivered",

    date: "12 Sep 2026",
  },

  /* WISHLIST */

  wishlist: [
    {
      id: 1,

      name: "Floral Midi Dress",

      price: 2199,

      image:
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=500&q=80",
    },

    {
      id: 2,

      name: "Textured Shoulder Bag",

      price: 1799,

      image:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80",
    },
  ],

  /* CART */

  cart: {
    itemCount: 2,

    subtotal: 3998,

    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=500&q=80",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function capitalizeName(name: string) {
  const value = name.trim();

  if (!value) {
    return "User";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPhone(phone: string) {
  if (!phone) {
    return "-";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    const number = digits.slice(2);

    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }

  return phone;
}

function formatMemberSince(date: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getInitial(name: string) {
  return name?.trim().charAt(0).toUpperCase() || "U";
}

/* =========================================================
   ACCOUNT PAGE
========================================================= */

export default function AccountPage() {
  const router = useRouter();

  /* =======================================================
     API ACCOUNT DATA

     SIRF ACCOUNT CARD KE LIYE
  ======================================================= */

  const [account, setAccount] = useState<AccountData | null>(null);

  const [accountLoading, setAccountLoading] = useState(true);

  const [accountError, setAccountError] = useState("");

  const [showLoginMessage, setShowLoginMessage] = useState(false);
  /* =======================================================
   ADDRESS API DATA
======================================================= */

  const [defaultAddress, setDefaultAddress] = useState<AddressData | null>(
    null,
  );

  const [addressLoading, setAddressLoading] = useState(true);

  const [addressError, setAddressError] = useState("");

  /* =======================================================
     FETCH ACCOUNT
  ======================================================= */

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const loadAccount = async () => {
      try {
        setAccountLoading(true);
        setAccountError("");

        const response = await fetch(`${API_URL}/api/auth/account`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        /* NOT LOGGED IN */

        if (response.status === 401) {
          setAccount(null);
          setShowLoginMessage(true);
          setAccountLoading(false);

          redirectTimer = setTimeout(() => {
            router.replace("/");
          }, 1000);

          return;
        }

        const data = (await response.json()) as AccountApiResponse;

        if (!response.ok || !data.success || !data.account) {
          throw new Error(data.message || "Unable to load account.");
        }

        setAccount(data.account);
      } catch (error) {
        console.error("ACCOUNT API ERROR:", error);

        setAccountError(
          error instanceof Error ? error.message : "Unable to load account.",
        );
      } finally {
        setAccountLoading(false);
      }
    };

    void loadAccount();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [router]);

  /* =======================================================
   FETCH DEFAULT ADDRESS
======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadDefaultAddress = async () => {
      try {
        setAddressLoading(true);
        setAddressError("");

        const response = await fetch(`${API_URL}/api/address/`, {
          method: "GET",

          credentials: "include",

          cache: "no-store",

          headers: {
            Accept: "application/json",
          },
        });

        const data = (await response.json()) as AddressesApiResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load address.");
        }

        const addresses = Array.isArray(data.addresses) ? data.addresses : [];

        /*
          Default address find karo.
          Agar kisi reason se default
          nahi mila to first address.
        */

        const selectedAddress =
          addresses.find((address) => address.isDefault === true) || null;

        setDefaultAddress(selectedAddress);

        setDefaultAddress(selectedAddress);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("ADDRESS API ERROR:", error);

        setDefaultAddress(null);

        setAddressError(
          error instanceof Error ? error.message : "Unable to load address.",
        );
      } finally {
        if (!cancelled) {
          setAddressLoading(false);
        }
      }
    };

    void loadDefaultAddress();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     ACCOUNT CARD VALUES FROM API
  ======================================================= */

  const accountName = account ? capitalizeName(account.name) : "";

  const accountEmail = account?.email || "";

  const accountPhone = account ? formatPhone(account.phone) : "";
  const accountMemberSince = account
    ? formatMemberSince(account.memberSince)
    : "";

  const accountInitial = account ? getInitial(account.name) : "U";

  const accountAvatar = account?.avatar?.url?.trim() || "";

  /* =======================================================
   DEFAULT ADDRESS DISPLAY VALUES
======================================================= */

  const defaultAddressLine1 = defaultAddress
    ? [
        defaultAddress.addressLine1,
        defaultAddress.addressLine2,
        defaultAddress.landmark,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const defaultAddressLine2 = defaultAddress
    ? [
        defaultAddress.city,
        defaultAddress.postalCode,
        defaultAddress.state,
        defaultAddress.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const defaultAddressPhone = defaultAddress
    ? formatPhone(defaultAddress.phone)
    : "";

  const defaultAddressType = defaultAddress
    ? defaultAddress.addressType.charAt(0).toUpperCase() +
      defaultAddress.addressType.slice(1)
    : "";

  return (
    <>
      <Header />
      <main
        className="
        min-h-screen
        bg-[#FCFAF8]
        text-[#211A18]
      "
      >
        {/* ===================================================
          LOGIN REQUIRED TOAST
      =================================================== */}

        {showLoginMessage && (
          <div
            className="
            fixed
            right-5
            top-5
            z-[9999]
            flex
            min-w-[260px]
            items-center
            gap-3
            rounded-[14px]
            border
            border-[#8C1839]/15
            bg-white
            px-5
            py-4
            shadow-[0_20px_60px_rgba(33,26,24,0.20)]
          "
          >
            <div
              className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#F8E1E2]
              text-[18px]
              font-bold
              text-[#8C1839]
            "
            >
              !
            </div>

            <div>
              <p
                className="
                text-[13px]
                font-semibold
              "
              >
                Please login
              </p>

              <p
                className="
                mt-1
                text-[10px]
                text-[#211A18]/55
              "
              >
                Redirecting to home...
              </p>
            </div>
          </div>
        )}

        <div
          className="
          mx-auto
          flex
          max-w-[1600px]
        "
        >
          {/* =================================================
            LEFT SIDEBAR

            STATIC USER DATA
        ================================================= */}

          <AccountSidebar />
          {/* =================================================
            RIGHT CONTENT
        ================================================= */}

          <section
            className="
            min-w-0
            flex-1
            p-4
            md:p-6
            lg:p-7
          "
          >
            {/* =================================================
              WELCOME BANNER

              STATIC DATA
          ================================================= */}

            <div
              className="
              relative
              min-h-[280px]
              overflow-hidden
              rounded-[22px]
              bg-[#F7E6E1]
            "
            >
              {/* IMAGE */}

              <div
                className="
                absolute
                inset-y-0
                right-0
                hidden
                w-[48%]
                md:block
              "
              >
                <Image
                  src={user.welcomeBanner}
                  alt="Hivra Soft lifestyle"
                  fill
                  priority
                  sizes="(min-width: 1280px) 600px, 45vw"
                  className="
                  object-cover
                  object-center
                "
                />

                <div
                  className="
                  absolute
                  inset-0
                  bg-gradient-to-r
                  from-[#F7E6E1]
                  via-[#F7E6E1]/35
                  to-transparent
                "
                />
              </div>

              {/* TEXT */}

              <div
                className="
                relative
                z-10
                flex
                min-h-[280px]
                items-center
                px-7
                py-10
                md:px-12
                xl:px-14
              "
              >
                <div
                  className="
                  max-w-[720px]
                  md:max-w-[58%]
                "
                >
                  <p
                    className="
                    mb-5
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-[0.38em]
                    text-[#211A18]/50
                  "
                  >
                    My Account
                  </p>

                  <h1
                    className="
                    font-serif
                    text-[42px]
                    leading-[1.05]
                    tracking-[-0.02em]
                    md:text-[54px]
                    xl:text-[64px]
                  "
                  >
                    Welcome back,{" "}
                    {accountLoading ? "..." : accountName || "there"}{" "}
                    <span
                      className="
                      font-normal
                      text-[#B94A62]
                    "
                    >
                      ♡
                    </span>
                  </h1>

                  <p
                    className="
                    mt-6
                    text-[15px]
                    leading-7
                    text-[#211A18]/65
                    md:text-[16px]
                  "
                  >
                    So glad to have you here. Let&apos;s make today stylish!
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
              FIRST ROW
          ================================================= */}

            <div
              className="
              mt-5
              grid
              gap-4
              xl:grid-cols-3
            "
            >
              <AccountProfileCard
                account={account}
                loading={accountLoading}
                error={accountError}
              />

              <DashboardCard>
                <CardHeader
                  icon="◇"
                  title="Orders"
                  subtitle="Track, return or buy again"
                  action="View All"
                  href="/account/orders"
                />

                <div
                  className="
                  mt-5
                  rounded-[14px]
                  bg-[#F8F5F2]
                  p-4
                "
                >
                  <div
                    className="
                    mb-3
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                  >
                    <span
                      className="
                      text-[13px]
                      font-semibold
                    "
                    >
                      Recent Order
                    </span>

                    <span
                      className="
                      rounded-full
                      bg-[#DDF0DF]
                      px-3
                      py-1
                      text-[10px]
                      font-medium
                      text-[#31703A]
                    "
                    >
                      {user.recentOrder.status}
                    </span>
                  </div>

                  <div
                    className="
                    flex
                    gap-4
                  "
                  >
                    <div
                      className="
                      relative
                      h-[76px]
                      w-[68px]
                      shrink-0
                      overflow-hidden
                      rounded-[10px]
                      bg-[#E9DFD8]
                    "
                    >
                      <Image
                        src={user.recentOrder.image}
                        alt={user.recentOrder.name}
                        fill
                        sizes="68px"
                        className="
                        object-cover
                      "
                      />
                    </div>

                    <div
                      className="
                      min-w-0
                      flex-1
                    "
                    >
                      <p
                        className="
                        truncate
                        text-[13px]
                        font-medium
                      "
                      >
                        {user.recentOrder.name}
                      </p>

                      <p
                        className="
                        mt-1
                        text-[11px]
                        text-[#211A18]/50
                      "
                      >
                        Size {user.recentOrder.size} | Qty{" "}
                        {user.recentOrder.quantity}
                      </p>

                      <div
                        className="
                        mt-3
                        flex
                        items-center
                        justify-between
                      "
                      >
                        <span
                          className="
                          text-[14px]
                          font-bold
                        "
                        >
                          ₹{user.recentOrder.price.toLocaleString("en-IN")}
                        </span>

                        <span
                          className="
                          text-[10px]
                          text-[#211A18]/50
                        "
                        >
                          {user.recentOrder.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* ===============================================
                WISHLIST

                STATIC DATA
            =============================================== */}

              <DashboardCard>
                <CardHeader
                  icon="♡"
                  title="Wishlist"
                  subtitle="Your saved favorites"
                  action="View All"
                  href="/wishlist"
                />

                <div
                  className="
                  mt-5
                  grid
                  grid-cols-2
                  gap-3
                "
                >
                  {user.wishlist.map((item) => (
                    <Link
                      href="/wishlist"
                      key={item.id}
                      className="
                        group
                        min-w-0
                      "
                    >
                      <div
                        className="
                          relative
                          aspect-[1.35/1]
                          overflow-hidden
                          rounded-[11px]
                          bg-[#F3ECE7]
                        "
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="220px"
                          className="
                            object-cover
                            transition
                            duration-300
                            group-hover:scale-105
                          "
                        />

                        <span
                          className="
                            absolute
                            right-2
                            top-2
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-[#C75C70]
                            shadow-sm
                          "
                        >
                          ♥
                        </span>
                      </div>

                      <p
                        className="
                          mt-2
                          text-[12px]
                          font-semibold
                        "
                      >
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>

                      <p
                        className="
                          truncate
                          text-[10px]
                          text-[#211A18]/60
                        "
                      >
                        {item.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </DashboardCard>
            </div>

            {/* =================================================
              SECOND ROW
          ================================================= */}

            <div
              className="
              mt-4
              grid
              gap-4
              xl:grid-cols-[1fr_1.1fr_0.6fr]
            "
            >
              {/* ===============================================
                CART

                STATIC DATA
            =============================================== */}

              <DashboardCard>
                <CardHeader
                  icon="♧"
                  title="Cart"
                  subtitle="Items ready for checkout"
                  action="View Cart"
                  href="/cart"
                />

                <div
                  className="
                  mt-5
                  flex
                  gap-4
                "
                >
                  <div
                    className="
                    relative
                    h-[72px]
                    w-[88px]
                    shrink-0
                    overflow-hidden
                    rounded-[10px]
                    bg-[#EFE7E1]
                  "
                  >
                    <Image
                      src={user.cart.image}
                      alt="Cart product"
                      fill
                      sizes="88px"
                      className="
                      object-cover
                    "
                    />
                  </div>

                  <div>
                    <p
                      className="
                      text-[13px]
                    "
                    >
                      {user.cart.itemCount} items in your cart
                    </p>

                    <p
                      className="
                      mt-2
                      text-[11px]
                      text-[#211A18]/50
                    "
                    >
                      Subtotal
                    </p>

                    <p
                      className="
                      text-[15px]
                      font-bold
                    "
                    >
                      ₹{user.cart.subtotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="
                  mt-4
                  flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-3
                  rounded-[10px]
                  bg-[#D97887]
                  text-[12px]
                  font-medium
                  text-white
                  transition
                  duration-300
                  hover:bg-[#8C1839]
                "
                >
                  Proceed to Checkout
                  <span>→</span>
                </Link>
              </DashboardCard>

              {/* ===============================================
                ADDRESS

                STATIC DATA
            =============================================== */}

              {/* ===============================================
  DEFAULT ADDRESS
=============================================== */}

              <DashboardCard>
                <CardHeader
                  icon="⌖"
                  title="Addresses"
                  subtitle="Manage your delivery addresses"
                  action="Add"
                  href="/account/addresses"
                />

                {addressLoading ? (
                  <div className="mt-5 rounded-[14px] bg-[#F8F5F2] p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="h-5 w-[80px] rounded-full bg-[#E9DFD8]" />
                      <div className="h-4 w-[140px] rounded bg-[#E9DFD8]" />
                      <div className="h-3 w-full rounded bg-[#E9DFD8]" />
                      <div className="h-3 w-[70%] rounded bg-[#E9DFD8]" />
                    </div>
                  </div>
                ) : addressError ? (
                  <div className="mt-5 rounded-[14px] border border-red-100 bg-red-50 p-5">
                    <p className="text-[11px] text-red-700">{addressError}</p>
                  </div>
                ) : defaultAddress ? (
                  <div className="mt-5 rounded-[14px] bg-[#F8F5F2] p-5">
                    <div className="flex items-start gap-4">
                      {/* ICON */}
                      <span className="mt-1 text-[22px]">
                        {defaultAddress.addressType === "home"
                          ? "⌂"
                          : defaultAddress.addressType === "work"
                            ? "▣"
                            : "⌖"}
                      </span>

                      <div className="min-w-0 flex-1">
                        {/* BADGES */}
                        <div className="flex items-center gap-2">
                          <span
                            className="
                inline-flex
                rounded-full
                bg-[#F7DEE1]
                px-3
                py-1
                text-[10px]
                font-medium
                text-[#B04B5C]
              "
                          >
                            Default
                          </span>

                          <span
                            className="
                inline-flex
                rounded-full
                bg-white
                px-3
                py-1
                text-[10px]
                font-medium
                text-[#211A18]/60
              "
                          >
                            {defaultAddressType}
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold">
                              {defaultAddress.fullName}
                            </p>

                            <p
                              className="
                  mt-1
                  text-[11px]
                  leading-5
                  text-[#211A18]/60
                "
                            >
                              {defaultAddressLine1}

                              {defaultAddressLine1 && <br />}

                              {defaultAddressLine2}

                              {defaultAddressLine2 && <br />}

                              {defaultAddressPhone}
                            </p>
                          </div>

                          <Link
                            href="/account/addresses"
                            className="
                shrink-0
                text-[11px]
                font-medium
                text-[#B04B5C]
                hover:underline
              "
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="
        mt-5
        rounded-[14px]
        border
        border-dashed
        border-[#211A18]/15
        bg-[#F8F5F2]
        p-5
      "
                  >
                    <p className="text-[12px] font-semibold">
                      No saved address
                    </p>

                    <p className="mt-1 text-[10px] text-[#211A18]/50">
                      Add an address for faster checkout.
                    </p>

                    <Link
                      href="/account/addresses"
                      className="
          mt-4
          flex
          h-10
          items-center
          justify-center
          rounded-[9px]
          bg-[#D97887]
          text-[11px]
          font-medium
          text-white
          hover:bg-[#8C1839]
        "
                    >
                      Add Address
                    </Link>
                  </div>
                )}
              </DashboardCard>
              {/* ===============================================
                QUOTE
            =============================================== */}

              <div
                className="
                relative
                flex
                min-h-[250px]
                flex-col
                items-center
                justify-center
                overflow-hidden
                rounded-[16px]
                bg-gradient-to-br
                from-[#F6E2DE]
                to-[#F2E9E3]
                p-6
                text-center
              "
              >
                <p
                  className="
                  font-serif
                  text-[29px]
                  italic
                  leading-tight
                "
                >
                  Same girl...
                  <br />
                  bigger dreams
                </p>

                <span
                  className="
                  mt-3
                  text-[25px]
                  text-[#8C1839]
                "
                >
                  ♡
                </span>

                <p
                  className="
                  mt-6
                  font-serif
                  text-[19px]
                "
                >
                  Hivra Soft
                </p>

                <p
                  className="
                  mt-1
                  text-[7px]
                  uppercase
                  tracking-[0.35em]
                  text-[#211A18]/50
                "
                >
                  Fashion lives in kindness
                </p>
              </div>
            </div>

            {/* =================================================
              MOBILE LINKS
          ================================================= */}

            <div
              className="
              mt-5
              grid
              grid-cols-2
              gap-3
              lg:hidden
            "
            >
              <MobileAccountLink href="/orders">Orders</MobileAccountLink>

              <MobileAccountLink href="/wishlist">Wishlist</MobileAccountLink>

              <MobileAccountLink href="/account/addresses">
                Addresses
              </MobileAccountLink>

              <MobileAccountLink href="/account/settings">
                Settings
              </MobileAccountLink>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   ACCOUNT LOADING
========================================================= */

function AccountLoading() {
  return (
    <div
      className="
        mt-7
        space-y-5
      "
    >
      <LoadingRow />

      <LoadingRow />

      <LoadingRow />
    </div>
  );
}

function LoadingRow() {
  return (
    <div
      className="
        flex
        items-center
        gap-4
      "
    >
      <div
        className="
          h-5
          w-5
          animate-pulse
          rounded-full
          bg-[#EFE6E1]
        "
      />

      <div
        className="
          h-4
          w-[170px]
          animate-pulse
          rounded
          bg-[#EFE6E1]
        "
      />
    </div>
  );
}

/* =========================================================
   DASHBOARD CARD
========================================================= */

function AccountProfileCard({
  account,
  loading,
  error,
}: {
  account: AccountData | null;
  loading: boolean;
  error: string;
}) {
  const name = account ? capitalizeName(account.name) : "";

  return (
    <DashboardCard>
      <CardHeader
        icon="👤"
        title="Account"
        subtitle="Manage your personal information"
        action="Edit"
        href="/account/settings"
      />

      {loading ? (
        <div className="mt-5 space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-[#EFE6E1]" />
          <div className="h-4 w-full rounded bg-[#EFE6E1]" />
          <div className="h-4 w-2/3 rounded bg-[#EFE6E1]" />
        </div>
      ) : error ? (
        <p className="mt-5 text-[11px] text-red-600">{error}</p>
      ) : account ? (
        <div className="mt-5 space-y-3">
          <InfoRow icon="👤">{name}</InfoRow>
          <InfoRow icon="✉">{account.email}</InfoRow>
          <InfoRow icon="☎">{formatPhone(account.phone)}</InfoRow>
        </div>
      ) : (
        <p className="mt-5 text-[11px] text-[#211A18]/55">
          Please login to view your account.
        </p>
      )}
    </DashboardCard>
  );
}

function DashboardCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        rounded-[16px]
        border
        border-[#211A18]/10
        bg-white
        p-5
        shadow-[0_4px_20px_rgba(33,26,24,0.03)]
      "
    >
      {children}
    </div>
  );
}

/* =========================================================
   CARD HEADER
========================================================= */

function CardHeader({
  icon,
  title,
  subtitle,
  action,
  href,
}: {
  icon: string;
  title: string;
  subtitle: string;
  action: string;
  href: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-3
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-4
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#F8E1E2]
            text-[25px]
            text-[#8C1839]
          "
        >
          {icon}
        </div>

        <div
          className="
            min-w-0
          "
        >
          <h2
            className="
              font-serif
              text-[23px]
              leading-none
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-2
              text-[11px]
              text-[#211A18]/50
            "
          >
            {subtitle}
          </p>
        </div>
      </div>

      <Link
        href={href}
        className="
          shrink-0
          rounded-[10px]
          bg-[#F6F1ED]
          px-4
          py-3
          text-[10px]
          font-medium
          transition
          duration-300
          hover:bg-[#EFE3DC]
          hover:text-[#8C1839]
        "
      >
        {action}
      </Link>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
      "
    >
      <span
        className="
          w-6
          text-center
          text-[20px]
        "
      >
        {icon}
      </span>

      <p
        className="
          truncate
          text-[13px]
        "
      >
        {children}
      </p>
    </div>
  );
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

function SidebarLink({
  href,
  children,
  icon,
  active = false,
}: {
  href: string;
  children: ReactNode;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
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
            ? "bg-[#F5DFDE] font-semibold text-[#211A18]"
            : "hover:bg-[#F8F3EF] hover:text-[#8C1839]"
        }
      `}
    >
      <span
        className="
          w-6
          text-center
          text-[20px]
        "
      >
        {icon}
      </span>

      {children}
    </Link>
  );
}

/* =========================================================
   MOBILE LINK
========================================================= */

function MobileAccountLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        rounded-[12px]
        border
        border-[#211A18]/10
        bg-white
        px-4
        py-4
        text-center
        text-[12px]
        font-semibold
        transition
        duration-300
        hover:border-[#8C1839]
        hover:text-[#8C1839]
      "
    >
      {children}
    </Link>
  );
}
