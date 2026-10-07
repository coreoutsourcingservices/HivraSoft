"use client";

import {
  FormEvent,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   NEWSLETTER FORM
========================================================= */

export default function NewsletterForm() {
  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  function handleSubscribe(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !email.trim()
    ) {
      return;
    }

    /*
     * Later yaha newsletter API
     * connect kar sakte ho.
     */

    setSuccess(
      true,
    );

    setEmail("");
  }

  return (
    <>
      {/* ===================================================
          FORM
      =================================================== */}

      <form
        onSubmit={
          handleSubscribe
        }
        className="
          mx-auto
          mt-5

          flex
          max-w-[540px]
          items-center

          rounded-full

          border
          border-[#E4AEB8]

          bg-white/95

          p-1

          shadow-[0_7px_22px_rgba(130,52,68,0.08)]
        "
      >
        <span
          className="
            ml-4
            flex
            shrink-0

            text-[#C23B58]
          "
        >
          <MailIcon />
        </span>

        <input
          type="email"
          required
          value={
            email
          }
          onChange={(
            event,
          ) =>
            setEmail(
              event.target.value,
            )
          }
          placeholder="Enter your email address"
          className="
            h-10
            min-w-0
            flex-1

            bg-transparent

            px-3

            text-[10px]
            text-[#352A2C]

            outline-none

            placeholder:text-black/35

            sm:h-11
            sm:text-[11px]
          "
        />

        <button
          type="submit"
          className="
            h-10
            shrink-0

            rounded-full

            bg-[#D74E69]

            px-5

            text-[9px]
            font-semibold

            text-white

            hover:bg-[#C33F5B]

            sm:h-11
            sm:px-8
            sm:text-[10px]
          "
        >
          Subscribe

          <span
            className="
              ml-2
            "
          >
            →
          </span>
        </button>
      </form>

      {/* ===================================================
          FEATURES
      =================================================== */}

      <div
        className="
          mx-auto
          mt-5

          grid
          max-w-[520px]
          grid-cols-3

          divide-x
          divide-[#DFBFC4]

          text-[7px]
          font-medium
          text-[#574D4F]

          sm:text-[8px]
        "
      >
        <MiniFeature
          icon={
            <TagIcon />
          }
        >
          Exclusive Offers
        </MiniFeature>

        <MiniFeature
          icon={
            <BellIcon />
          }
        >
          New Launch Alerts
        </MiniFeature>

        <MiniFeature
          icon={
            <GiftIcon />
          }
        >
          Style Tips & More
        </MiniFeature>
      </div>

      {success ? (
        <p
          className="
            mt-3

            text-[9px]
            font-medium

            text-[#AD304C]
          "
        >
          Thanks for joining
          Hivra Soft!
        </p>
      ) : null}
    </>
  );
}

/* =========================================================
   MINI FEATURE
========================================================= */

function MiniFeature({
  icon,
  children,
}: {
  icon:
    ReactNode;

  children:
    ReactNode;
}) {
  return (
    <div
      className="
        flex
        min-w-0
        items-center
        justify-center

        gap-1.5

        px-1
      "
    >
      <span
        className="
          shrink-0

          text-[#C13A57]
        "
      >
        {icon}
      </span>

      <span>
        {children}
      </span>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13 11 22 2 13V2h11Z" />

      <circle
        cx="7"
        cy="7"
        r="1.5"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

      <path d="M10 21h4" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="8"
        width="18"
        height="13"
      />

      <path d="M12 8v13" />

      <path d="M3 12h18" />

      <path d="M7.5 8C5 8 5 4 7.5 4 10 4 12 8 12 8Z" />

      <path d="M16.5 8C19 8 19 4 16.5 4 14 4 12 8 12 8Z" />
    </svg>
  );
}