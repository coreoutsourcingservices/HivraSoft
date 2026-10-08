"use client";

import {
  useEffect,
  type Dispatch,
  type InputHTMLAttributes,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  BriefcaseBusiness,
  Check,
  Home,
  MapPin,
  Navigation,
  Phone,
  UserRound,
  X,
} from "lucide-react";

import type {
  CheckoutAddress,
  CheckoutAddressType,
} from "@/lib/checkout";

/* =========================================================
   TYPES
========================================================= */

type AddressFormValue =
  Omit<
    CheckoutAddress,
    "id"
  >;

type Props = {
  value:
    AddressFormValue;

  onChange:
    Dispatch<
      SetStateAction<
        AddressFormValue
      >
    >;

  saving: boolean;

  error?: string;

  onSave:
    () => void;

  onClose:
    () => void;
};

/* =========================================================
   MAIN ADDRESS MODAL
========================================================= */

export default function AddressModal({
  value,
  onChange,
  saving,
  error = "",
  onSave,
  onClose,
}: Props) {
  /* =======================================================
     LOCK BODY SCROLL
  ======================================================= */

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, []);

  /* =======================================================
     ESC CLOSE
  ======================================================= */

  useEffect(() => {
    const handleKeyDown = (
      event:
        KeyboardEvent
    ) => {
      if (
        event.key ===
          "Escape" &&
        !saving
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    onClose,
    saving,
  ]);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  const updateField = <
    K extends keyof AddressFormValue,
  >(
    key: K,
    next:
      AddressFormValue[K]
  ) => {
    onChange(
      (
        current
      ) => ({
        ...current,

        [key]:
          next,
      })
    );
  };

  /* =======================================================
     CHANGE ADDRESS TYPE
  ======================================================= */

  const changeAddressType = (
    type:
      CheckoutAddressType
  ) => {
    onChange(
      (
        current
      ) => ({
        ...current,

        addressType:
          type,
      })
    );
  };

  return (
    <div
      className="
        fixed

        inset-x-0
        bottom-0
        top-[68px]

        z-[200]

        flex
        items-end
        justify-center

        bg-[#17100E]/45

        backdrop-blur-[4px]

        sm:top-[72px]
        sm:items-center
        sm:p-4

        md:p-5

        lg:top-[76px]
        lg:p-6

        xl:p-7
      "
    >
      {/* =================================================
          BACKDROP
      ================================================= */}

      <button
        type="button"
        aria-label="Close address modal"
        onClick={() => {
          if (!saving) {
            onClose();
          }
        }}
        className="
          absolute
          inset-0

          cursor-default
        "
      />

      {/* =================================================
          MODAL
      ================================================= */}

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Add delivery address"
        className="
          relative
          z-10

          flex

          h-full
          w-full

          flex-col

          overflow-hidden

          rounded-t-[26px]

          border
          border-white/60

          bg-[#FFFCFB]

          shadow-[0_-15px_60px_rgba(20,10,8,.18)]

          sm:h-auto
          sm:max-h-[calc(100dvh-108px)]
          sm:max-w-[760px]
          sm:rounded-[26px]

          md:max-w-[820px]

          lg:max-h-[calc(100dvh-118px)]
          lg:max-w-[880px]

          xl:max-w-[920px]

          2xl:max-w-[960px]
        "
      >
        {/* =================================================
            TOP ACCENT
        ================================================= */}

        <div
          className="
            h-[4px]
            w-full

            shrink-0

            bg-gradient-to-r
            from-[#8E0E35]
            via-[#B31345]
            to-[#E98BA7]
          "
        />

        {/* =================================================
            HEADER
        ================================================= */}

        <header
          className="
            sticky
            top-0

            z-30

            shrink-0

            border-b
            border-[#EFE1DD]

            bg-[#FFFCFB]/95

            px-4
            py-4

            backdrop-blur-xl

            sm:px-6
            sm:py-4

            md:px-7

            lg:px-8
          "
        >
          <div
            className="
              flex

              items-start
              justify-between

              gap-4
            "
          >
            {/* LEFT */}

            <div
              className="
                flex

                min-w-0

                items-start

                gap-3
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

                  rounded-[13px]

                  bg-[#FBECEF]

                  text-[#B31345]

                  sm:h-11
                  sm:w-11
                "
              >
                <MapPin
                  className="
                    h-[18px]
                    w-[18px]

                    sm:h-5
                    sm:w-5
                  "
                />
              </div>

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    text-[7px]
                    font-bold

                    uppercase

                    tracking-[0.22em]

                    text-[#B31345]

                    sm:text-[8px]
                  "
                >
                  Delivery Address
                </p>

                <h2
                  className="
                    mt-1

                    text-[20px]
                    font-semibold

                    tracking-[-0.035em]

                    text-[#211817]

                    sm:text-[24px]

                    lg:text-[27px]
                  "
                >
                  Add New Address
                </h2>

                <p
                  className="
                    mt-1

                    max-w-[520px]

                    text-[9px]
                    leading-4

                    text-black/45

                    sm:text-[10px]
                    sm:leading-5
                  "
                >
                  Add the address where
                  you want your order
                  delivered.
                </p>
              </div>
            </div>

            {/* CLOSE */}

            <button
              type="button"
              aria-label="Close"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="
                flex
                h-9
                w-9

                shrink-0

                cursor-pointer

                items-center
                justify-center

                rounded-full

                border
                border-black/[0.07]

                bg-white

                text-black/55

                shadow-sm

                transition

                hover:border-[#B31345]/20
                hover:bg-[#FDF1F4]
                hover:text-[#B31345]

                disabled:cursor-not-allowed
                disabled:opacity-40

                sm:h-10
                sm:w-10
              "
            >
              <X
                className="
                  h-[17px]
                  w-[17px]
                "
              />
            </button>
          </div>
        </header>

        {/* =================================================
            SCROLLABLE BODY
        ================================================= */}

        <div
          className="
            min-h-0
            flex-1

            overflow-y-auto

            overscroll-contain

            scroll-smooth

            px-4
            py-4

            sm:px-6
            sm:py-5

            md:px-7

            lg:px-8
          "
        >
          {/* =================================================
              ADDRESS TYPE
          ================================================= */}

          <FormSection
            title="Address Type"
            description="Choose where this address belongs."
          >
            <div
              className="
                grid
                grid-cols-3

                gap-2

                sm:flex
                sm:flex-wrap
              "
            >
              <AddressTypeButton
                active={
                  value.addressType ===
                  "home"
                }
                label="Home"
                icon={
                  <Home />
                }
                onClick={() =>
                  changeAddressType(
                    "home"
                  )
                }
              />

              <AddressTypeButton
                active={
                  value.addressType ===
                  "work"
                }
                label="Office"
                icon={
                  <BriefcaseBusiness />
                }
                onClick={() =>
                  changeAddressType(
                    "work"
                  )
                }
              />

              <AddressTypeButton
                active={
                  value.addressType ===
                  "other"
                }
                label="Other"
                icon={
                  <Navigation />
                }
                onClick={() =>
                  changeAddressType(
                    "other"
                  )
                }
              />
            </div>
          </FormSection>

          {/* =================================================
              CONTACT DETAILS
          ================================================= */}

          <FormSection
            title="Contact Details"
            description="We'll use these details for delivery updates."
          >
            <div
              className="
                grid

                gap-4

                md:grid-cols-2
              "
            >
              <FormInput
                label="Full Name"
                required
                icon={
                  <UserRound />
                }
                placeholder="Enter full name"
                autoComplete="name"
                value={
                  value.name
                }
                onChange={(
                  next
                ) =>
                  updateField(
                    "name",
                    next
                  )
                }
              />

              <FormInput
                label="Phone Number"
                required
                icon={
                  <Phone />
                }
                placeholder="10 digit mobile number"
                inputMode="tel"
                autoComplete="tel"
                maxLength={10}
                value={
                  value.phone
                }
                onChange={(
                  next
                ) =>
                  updateField(
                    "phone",
                    next.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />

              <FormInput
                label="Alternate Phone"
                icon={
                  <Phone />
                }
                placeholder="Optional alternate number"
                inputMode="tel"
                maxLength={10}
                value={
                  value.alternatePhone ||
                  ""
                }
                onChange={(
                  next
                ) =>
                  updateField(
                    "alternatePhone",
                    next.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />

              {value.addressType ===
                "home" && (
                <FormInput
                  label="House / Flat No."
                  placeholder="House or flat number"
                  value={
                    value.homeNumber ||
                    ""
                  }
                  onChange={(
                    next
                  ) =>
                    updateField(
                      "homeNumber",
                      next
                    )
                  }
                />
              )}

              {value.addressType ===
                "work" && (
                <FormInput
                  label="Office / Unit No."
                  placeholder="Office or unit number"
                  value={
                    value.officeNumber ||
                    ""
                  }
                  onChange={(
                    next
                  ) =>
                    updateField(
                      "officeNumber",
                      next
                    )
                  }
                />
              )}
            </div>
          </FormSection>

          {/* =================================================
              ADDRESS DETAILS
          ================================================= */}

          <FormSection
            title="Address Details"
            description="Enter complete location details for smooth delivery."
          >
            <div
              className="
                grid

                gap-4

                md:grid-cols-2
              "
            >
              <div
                className="
                  md:col-span-2
                "
              >
                <FormInput
                  label="Address"
                  required
                  icon={
                    <MapPin />
                  }
                  placeholder="House no., building, street"
                  autoComplete="street-address"
                  value={
                    value.addressLine1
                  }
                  onChange={(
                    next
                  ) =>
                    updateField(
                      "addressLine1",
                      next
                    )
                  }
                />
              </div>

              <div
                className="
                  md:col-span-2
                "
              >
                <FormInput
                  label="Address Line 2"
                  placeholder="Apartment, locality or area"
                  value={
                    value.addressLine2 ||
                    ""
                  }
                  onChange={(
                    next
                  ) =>
                    updateField(
                      "addressLine2",
                      next
                    )
                  }
                />
              </div>

              <div
                className="
                  md:col-span-2
                "
              >
                <FormInput
                  label="Landmark / Area"
                  placeholder="Nearby landmark or area"
                  value={
                    value.landmark ||
                    ""
                  }
                  onChange={(
                    next
                  ) =>
                    updateField(
                      "landmark",
                      next
                    )
                  }
                />
              </div>

              <FormInput
                label="City"
                required
                placeholder="City"
                autoComplete="address-level2"
                value={
                  value.city
                }
                onChange={(
                  next
                ) =>
                  updateField(
                    "city",
                    next
                  )
                }
              />

              <FormInput
                label="District"
                placeholder="District"
                value={
                  value.district
                }
                onChange={(
                  next
                ) =>
                  updateField(
                    "district",
                    next
                  )
                }
              />

              <FormInput
                label="State"
                required
                placeholder="State"
                autoComplete="address-level1"
                value={
                  value.state
                }
                onChange={(
                  next
                ) =>
                  updateField(
                    "state",
                    next
                  )
                }
              />

              <FormInput
                label="Pincode"
                required
                placeholder="6 digit pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={
                  value.postalCode
                }
                onChange={(
                  next
                ) =>
                  updateField(
                    "postalCode",
                    next.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />
            </div>
          </FormSection>

          {/* =================================================
              DELIVERY PREFERENCES
          ================================================= */}

          <FormSection
            title="Delivery Preferences"
            description="Optional instructions for the delivery partner."
          >
            <FormInput
              label="Delivery Instructions"
              placeholder="Example: Call before arriving"
              value={
                value.instructions ||
                ""
              }
              onChange={(
                next
              ) =>
                updateField(
                  "instructions",
                  next
                )
              }
            />

            {/* DEFAULT ADDRESS */}

            <button
              type="button"
              onClick={() =>
                updateField(
                  "isDefault",
                  !value.isDefault
                )
              }
              className={`
                mt-4

                flex
                w-full

                cursor-pointer

                items-center

                gap-3

                rounded-[15px]

                border

                px-4
                py-3

                text-left

                transition

                ${
                  value.isDefault
                    ? `
                      border-[#B31345]/25

                      bg-[#FDF0F4]
                    `
                    : `
                      border-[#E9DEDA]

                      bg-[#FAF7F5]

                      hover:border-[#D8C4BE]
                    `
                }
              `}
            >
              <span
                className={`
                  flex
                  h-5
                  w-5

                  shrink-0

                  items-center
                  justify-center

                  rounded-[6px]

                  border

                  transition

                  ${
                    value.isDefault
                      ? `
                        border-[#B31345]

                        bg-[#B31345]

                        text-white
                      `
                      : `
                        border-black/15

                        bg-white

                        text-transparent
                      `
                  }
                `}
              >
                <Check
                  className="
                    h-3.5
                    w-3.5
                  "
                />
              </span>

              <span
                className="
                  min-w-0
                "
              >
                <span
                  className="
                    block

                    text-[10px]
                    font-semibold

                    text-[#251B19]
                  "
                >
                  Set as my default
                  delivery address
                </span>

                <span
                  className="
                    mt-0.5

                    block

                    text-[8px]

                    leading-4

                    text-black/40
                  "
                >
                  This address will be
                  selected automatically
                  next time.
                </span>
              </span>
            </button>
          </FormSection>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mt-4

                rounded-[13px]

                border
                border-red-100

                bg-red-50

                px-4
                py-3

                text-[9px]
                font-medium

                leading-5

                text-red-700
              "
            >
              {error}
            </div>
          )}

          {/* EXTRA SPACE */}

          <div
            className="
              h-3
            "
          />
        </div>

        {/* =================================================
            STICKY FOOTER
        ================================================= */}

        <footer
          className="
            sticky
            bottom-0

            z-30

            shrink-0

            border-t
            border-[#EFE2DE]

            bg-[#FFFCFB]/95

            px-4

            pb-[max(12px,env(safe-area-inset-bottom))]
            pt-3

            backdrop-blur-xl

            sm:px-6
            sm:pb-4

            md:px-7

            lg:px-8
          "
        >
          <div
            className="
              flex

              items-center

              gap-2.5

              sm:gap-3
            "
          >
            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="
                h-[46px]

                shrink-0

                cursor-pointer

                rounded-full

                border
                border-black/10

                bg-white

                px-4

                text-[8px]
                font-bold

                uppercase

                tracking-[0.08em]

                text-black/55

                transition

                hover:bg-[#F7F2F0]

                disabled:cursor-not-allowed
                disabled:opacity-40

                sm:px-6
                sm:text-[9px]
              "
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onSave
              }
              className="
                flex

                h-[46px]

                min-w-0
                flex-1

                cursor-pointer

                items-center
                justify-center

                rounded-full

                bg-[#B31345]

                px-4

                text-[8px]
                font-bold

                uppercase

                tracking-[0.08em]

                text-white

                shadow-[0_10px_30px_rgba(179,19,69,.22)]

                transition

                hover:bg-[#97103A]

                active:scale-[0.995]

                disabled:cursor-not-allowed
                disabled:opacity-50

                sm:h-[48px]
                sm:text-[9px]
              "
            >
              {saving
                ? "Saving Address..."
                : "Save Delivery Address"}
            </button>
          </div>

          <p
            className="
              mt-2

              hidden

              text-center

              text-[7px]

              text-black/25

              sm:block
            "
          >
            Your delivery details
            are securely saved to
            your account.
          </p>
        </footer>
      </section>
    </div>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  title,
  description,
  children,
}: {
  title: string;

  description?: string;

  children:
    ReactNode;
}) {
  return (
    <section
      className="
        border-b
        border-[#F0E7E3]

        py-5

        first:pt-0

        last:border-b-0

        sm:py-6
      "
    >
      <div
        className="
          mb-4
        "
      >
        <h3
          className="
            text-[12px]
            font-semibold

            tracking-[-0.015em]

            text-[#261C19]

            sm:text-[13px]
          "
        >
          {title}
        </h3>

        {description && (
          <p
            className="
              mt-1

              text-[8px]
              leading-4

              text-black/38

              sm:text-[9px]
            "
          >
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   ADDRESS TYPE BUTTON
========================================================= */

function AddressTypeButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;

  label: string;

  icon:
    ReactNode;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        flex

        min-w-0

        cursor-pointer

        items-center
        justify-center

        gap-1.5

        rounded-full

        border

        px-3
        py-2.5

        text-[8px]
        font-semibold

        transition-all

        sm:px-4
        sm:text-[9px]

        ${
          active
            ? `
              border-[#B31345]

              bg-[#B31345]

              text-white

              shadow-[0_6px_18px_rgba(179,19,69,.18)]
            `
            : `
              border-[#E6DAD6]

              bg-white

              text-black/55

              hover:border-[#B31345]/30
              hover:bg-[#FDF5F7]
              hover:text-[#B31345]
            `
        }
      `}
    >
      <span
        className="
          [&>svg]:h-3.5
          [&>svg]:w-3.5
        "
      >
        {icon}
      </span>

      <span
        className="
          truncate
        "
      >
        {label}
      </span>
    </button>
  );
}

/* =========================================================
   FORM INPUT
========================================================= */

function FormInput({
  label,
  required = false,
  icon,
  placeholder,
  value,
  onChange,
  inputMode,
  autoComplete,
  maxLength,
}: {
  label: string;

  required?: boolean;

  icon?:
    ReactNode;

  placeholder: string;

  value: string;

  onChange:
    (
      value: string
    ) => void;

  inputMode?:
    InputHTMLAttributes<HTMLInputElement>["inputMode"];

  autoComplete?: string;

  maxLength?: number;
}) {
  return (
    <label
      className="
        block
        min-w-0
      "
    >
      <span
        className="
          mb-1.5

          block

          text-[8px]
          font-semibold

          tracking-[0.01em]

          text-[#443734]
        "
      >
        {label}

        {required && (
          <span
            className="
              ml-1

              text-[#B31345]
            "
          >
            *
          </span>
        )}
      </span>

      <div
        className="
          group

          relative
        "
      >
        {icon && (
          <span
            className="
              pointer-events-none

              absolute
              left-3.5
              top-1/2

              -translate-y-1/2

              text-black/28

              transition

              group-focus-within:text-[#B31345]

              [&>svg]:h-4
              [&>svg]:w-4
            "
          >
            {icon}
          </span>
        )}

        <input
          type="text"
          value={
            value
          }
          placeholder={
            placeholder
          }
          inputMode={
            inputMode
          }
          autoComplete={
            autoComplete
          }
          maxLength={
            maxLength
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          className={`
            h-[46px]
            w-full

            rounded-[13px]

            border
            border-[#E5DAD6]

            bg-white

            pr-4

            text-[9px]

            text-[#211817]

            outline-none

            transition-all

            placeholder:text-black/25

            hover:border-[#D7C3BD]

            focus:border-[#B31345]/55

            focus:ring-4
            focus:ring-[#B31345]/[0.05]

            sm:h-[48px]
            sm:text-[10px]

            ${
              icon
                ? "pl-10"
                : "pl-4"
            }
          `}
        />
      </div>
    </label>
  );
}