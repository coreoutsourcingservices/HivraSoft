import Image from "next/image";
import Link from "next/link";

import NewsletterForm from "./NewsletterForm";

import {
  getActiveCategoryTree,
  type StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type FooterLink = {
  id: string;
  name: string;
  href: string;
};

/* =========================================================
   CUSTOMER SUPPORT
========================================================= */

const CUSTOMER_SUPPORT = [
  {
    name: "Help Center",
    href: "/help",
  },
  {
    name: "Size Guide",
    href: "/size-guide",
  },
  {
    name: "Returns & Exchanges",
    href: "/returns",
  },
  {
    name: "Shipping Information",
    href: "/shipping",
  },
  {
    name: "Track Your Order",
    href: "/account/orders",
  },
  {
    name: "Payment Methods",
    href: "/payment-methods",
  },
  {
    name: "FAQ",
    href: "/faq",
  },
  {
    name: "Contact Us",
    href: "/contact",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function cleanSlug(
  value: string,
) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase()
    .replace(
      /^\/+|\/+$/g,
      "",
    );
}

function categoryHref(
  slugs: string[],
) {
  return `/${slugs
    .filter(Boolean)
    .map(
      encodeURIComponent,
    )
    .join("/")}`;
}

/* =========================================================
   COLLECT SUBCATEGORIES
========================================================= */

function collectSubCategoryLinks(
  root: StorefrontCategoryNode,
): FooterLink[] {
  const links:
    FooterLink[] = [];

  function walk(
    node: StorefrontCategoryNode,
    parentSlugs: string[],
  ) {
    const currentPath = [
      ...parentSlugs,
      node.slug,
    ];

    links.push({
      id:
        node.id,

      name:
        node.name,

      href:
        categoryHref(
          currentPath,
        ),
    });

    node.children.forEach(
      (
        child,
      ) => {
        walk(
          child,
          currentPath,
        );
      },
    );
  }

  root.children.forEach(
    (
      child,
    ) => {
      walk(
        child,
        [
          root.slug,
        ],
      );
    },
  );

  return links;
}

/* =========================================================
   FOOTER
========================================================= */

export default async function Footer() {
  /* =======================================================
     SERVER SIDE CATEGORY FETCH
  ======================================================= */

  const categoryTree =
    await getActiveCategoryTree();

  /* =======================================================
     ACTIVE ROOT CATEGORIES
  ======================================================= */

  const categories =
    categoryTree
      .filter(
        (
          category,
        ) =>
          category.isActive &&
          category.parent ===
            null,
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.sortOrder -
            second.sortOrder ||
          first.name.localeCompare(
            second.name,
          ),
      );

  /* =======================================================
     MORE CATEGORY
  ======================================================= */

  const moreCategory =
    categories.find(
      (
        category,
      ) =>
        cleanSlug(
          category.slug,
        ) ===
        "more",
    ) ||
    null;

  /* =======================================================
     QUICK LINKS
  ======================================================= */

  const quickLinks:
    FooterLink[] =
    [];

  categories.forEach(
    (
      category,
    ) => {
      if (
        cleanSlug(
          category.slug,
        ) ===
        "more"
      ) {
        return;
      }

      quickLinks.push({
        id:
          category.id,

        name:
          category.name,

        href:
          categoryHref([
            category.slug,
          ]),
      });
    },
  );

  if (
    moreCategory
  ) {
    moreCategory.children.forEach(
      (
        child,
      ) => {
        quickLinks.push({
          id:
            `more-${child.id}`,

          name:
            child.name,

          href:
            categoryHref([
              moreCategory.slug,
              child.slug,
            ]),
        });
      },
    );
  }

  /* =======================================================
     SHOP CATEGORIES
  ======================================================= */

  const allShopLinks:
    FooterLink[] =
    [];

  categories.forEach(
    (
      root,
    ) => {
      if (
        cleanSlug(
          root.slug,
        ) ===
        "more"
      ) {
        return;
      }

      allShopLinks.push(
        ...collectSubCategoryLinks(
          root,
        ),
      );
    },
  );

  /* =======================================================
     REMOVE DUPLICATES
  ======================================================= */

  const uniqueShopLinks =
    new Map<
      string,
      FooterLink
    >();

  allShopLinks.forEach(
    (
      link,
    ) => {
      if (
        !uniqueShopLinks.has(
          link.href,
        )
      ) {
        uniqueShopLinks.set(
          link.href,
          link,
        );
      }
    },
  );

  const shopCategories =
    Array.from(
      uniqueShopLinks.values(),
    );

  return (
    <footer
      className="
        w-full

        overflow-hidden

        bg-[#FFFDFC]

        text-[#302527]
      "
    >
      {/* ===================================================
          NEWSLETTER HERO
      =================================================== */}

      <section
        className="
          relative

          w-full

          overflow-hidden

          border-t
          border-[#F2D7DA]

          bg-[#FBE9E6]
        "
      >
        {/* BACKGROUND */}

        <div
          className="
            absolute
            inset-0
          "
        >
          <Image
            src="/images/footer/footer-newsletter.png"
            alt=""
            fill
            sizes="100vw"
            className="
              object-cover
              object-center
            "
          />

          <div
            className="
              absolute

              inset-y-0
              left-1/2

              w-[65%]

              -translate-x-1/2

              bg-gradient-to-r

              from-transparent

              via-[#FFF8F5]/80

              to-transparent

              max-md:w-full

              max-md:via-[#FFF8F5]/88
            "
          />
        </div>

        {/* CONTENT */}

        <div
          className="
            relative
            z-10

            mx-auto

            flex

            min-h-[350px]

            max-w-[1600px]

            items-center
            justify-center

            px-4
            py-7

            sm:min-h-[370px]
            sm:px-6

            lg:min-h-[390px]
            lg:px-8
          "
        >
          <div
            className="
              w-full

              max-w-[610px]

              text-center
            "
          >
            <p
              className="
                text-[8px]

                font-semibold

                uppercase

                tracking-[0.38em]

                text-[#B84058]

                sm:text-[9px]
              "
            >
              Stay In The Loop
            </p>

            <h2
              className="
                mt-3

                font-serif

                text-[26px]

                leading-[1.06]

                tracking-[-0.03em]

                text-[#2B2224]

                sm:text-[34px]

                md:text-[39px]

                lg:text-[43px]
              "
            >
              Special Offers,
              New Launches

              <br />

              & More Goodness!
            </h2>

            <p
              className="
                mx-auto

                mt-4

                max-w-[485px]

                text-[10px]

                leading-5

                text-[#675D5F]

                sm:text-[12px]
              "
            >
              Subscribe to get exclusive
              offers, style updates and
              feel-good fashion stories
              from Hivra Soft.
            </p>

            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* ===================================================
          MAIN FOOTER
      =================================================== */}

      <section
        className="
          border-t

          border-[#F1D9DC]

          bg-[#FFFDFC]

          px-4
          py-8

          sm:px-6
          sm:py-9

          lg:px-8
          lg:py-10
        "
      >
        <div
          className="
            mx-auto

            grid

            w-full

            max-w-[1500px]

            gap-x-8
            gap-y-10

            sm:grid-cols-2

            lg:grid-cols-[1.15fr_.85fr_1.5fr_1fr_1fr]
          "
        >
          {/* =================================================
              BRAND
          ================================================= */}

          <div
            className="
              min-w-0

              text-center

              sm:col-span-2

              lg:col-span-1

              lg:text-left
            "
          >
            {/* LOGO */}

            <Link
              href="/"
              className="
                flex

                w-full

                justify-center

                lg:w-auto

                lg:justify-start
              "
            >
              <Image
                src="/images/logos/hivra-desktop.png.png"
                alt="HivraSoft"
                width={230}
                height={62}
                className="
                  h-auto

                  w-[190px]

                  sm:w-[205px]

                  lg:w-[185px]
                "
              />
            </Link>

            {/* TAGLINE */}

            <p
              className="
                mt-5

                text-[8px]

                font-bold

                uppercase

                tracking-[0.30em]

                text-[#A52C47]
              "
            >
              Fashion Lives In Kindness
            </p>

            {/* DESCRIPTION */}

            <p
              className="
                mx-auto

                mt-4

                max-w-[320px]

                text-[11px]

                leading-6

                text-[#65595B]

                lg:mx-0
              "
            >
              Hivra Soft brings you
              comfortable, stylish and
              confidence-boosting
              innerwear and apparel for
              every you. Because feeling
              good is always in fashion.
            </p>

            {/* SOCIAL ICONS */}

            <div
              className="
                mt-5

                flex

                flex-wrap

                justify-center

                gap-2.5

                lg:justify-start
              "
            >
              <SocialLink
                href="https://www.instagram.com/hivrasoft/"
                label="Instagram"
              >
                IG
              </SocialLink>

              <SocialLink
                href="https://www.facebook.com/hivrasoft/"
                label="Facebook"
              >
                f
              </SocialLink>

              <SocialLink
                href="https://www.youtube.com/@HivraSoft"
                label="YouTube"
              >
                ▶
              </SocialLink>

              <SocialLink
                href="https://in.pinterest.com/HivraSoft/"
                label="Pinterest"
              >
                P
              </SocialLink>
            </div>
          </div>

          {/* =================================================
              QUICK LINKS
          ================================================= */}

          <DynamicFooterColumn
            title="Quick Links"
            links={[
              ...quickLinks.filter(
                (
                  link,
                ) =>
                  link.href !==
                  "/blog",
              ),

              {
                id:
                  "footer-blog",

                name:
                  "Blog",

                href:
                  "/blog",
              },
            ]}
          />

          {/* =================================================
              SHOP CATEGORIES
          ================================================= */}

          <DynamicFooterColumn
            title="Shop Categories"
            links={
              shopCategories
            }
            columns={2}
          />

          {/* =================================================
              MOBILE ONLY

              LEFT:
              CUSTOMER SUPPORT

              RIGHT:
              CONTACT US
          ================================================= */}

          <div
            className="
              w-full

              min-w-0
              max-w-full

              sm:col-span-2

              lg:hidden
            "
          >
            <div
              className="
                grid

                w-full

                min-w-0

                grid-cols-[minmax(0,1fr)_minmax(0,1fr)]

                gap-x-3

                min-[390px]:gap-x-5

                sm:gap-x-8
              "
            >
              {/* =============================================
                  LEFT - CUSTOMER SUPPORT
              ============================================= */}

              <div
                className="
                  min-w-0
                "
              >
                <FooterTitle>
                  Customer Support
                </FooterTitle>

                <ul
                  className="
                    mt-5

                    flex

                    min-w-0

                    flex-col

                    gap-2.5
                  "
                >
                  {CUSTOMER_SUPPORT.map(
                    (
                      link,
                    ) => (
                      <li
                        key={`mobile-support-${link.name}`}
                        className="
                          min-w-0
                        "
                      >
                        <Link
                          href={
                            link.href
                          }
                          className="
                            block

                            min-w-0

                            break-words

                            text-[8.5px]

                            leading-[1.55]

                            text-[#655A5C]

                            transition

                            hover:text-[#B32E4D]

                            hover:underline

                            hover:underline-offset-2

                            min-[390px]:text-[9.5px]

                            sm:text-[11px]
                          "
                        >
                          {
                            link.name
                          }
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* =============================================
                  RIGHT - CONTACT US
              ============================================= */}

              <div
                className="
                  min-w-0
                "
              >
                <FooterTitle>
                  Contact Us
                </FooterTitle>

                <div
                  className="
                    mt-5

                    flex

                    min-w-0

                    flex-col

                    gap-4
                  "
                >
                  {/* CALL */}

                  <MobileContactItem
                    icon={
                      <PhoneIcon />
                    }
                  >
                    <strong>
                      Call Us:-
                    </strong>

                    <a
                      href="tel:+919420980536"
                      className="
                        break-words

                        font-semibold
                      "
                    >
                      +91 9420980536
                    </a>
                  </MobileContactItem>

                  {/* EMAIL */}

                  <MobileContactItem
                    icon={
                      <MailIcon />
                    }
                  >
                    <strong>
                      Email:-
                    </strong>

                    <a
                      href="mailto:support@hivrasoft.com"
                      className="
                        break-all

                        font-semibold
                      "
                    >
                      support@hivrasoft.com
                    </a>
                  </MobileContactItem>

                  {/* ADDRESS */}

                  <MobileContactItem
                    icon={
                      <LocationIcon />
                    }
                  >
                    <strong>
                      Address:-
                    </strong>

                    <span
                      className="
                        break-words
                      "
                    >
                      E 2, Sector 63,
                      Noida, Uttar
                      Pradesh, 201301
                    </span>
                  </MobileContactItem>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              DESKTOP CUSTOMER SUPPORT
          ================================================= */}

          <div
            className="
              hidden

              min-w-0

              lg:block
            "
          >
            <StaticFooterColumn
              title="Customer Support"
              links={
                CUSTOMER_SUPPORT
              }
            />
          </div>

          {/* =================================================
              DESKTOP CONTACT
          ================================================= */}

          <div
            className="
              hidden

              min-w-0

              lg:block
            "
          >
            <FooterTitle>
              Contact Us
            </FooterTitle>

            <div
              className="
                mt-5

                space-y-5
              "
            >
              <ContactItem
                icon={
                  <PhoneIcon />
                }
              >
                <strong>
                  Call Us:-
                </strong>

                <a
                  href="tel:+919420980536"
                  className="
                    font-semibold
                  "
                >
                  +91 9420980536
                </a>
              </ContactItem>

              <ContactItem
                icon={
                  <MailIcon />
                }
              >
                <strong>
                  Email:-
                </strong>

                <a
                  href="mailto:support@hivrasoft.com"
                  className="
                    break-all

                    font-semibold
                  "
                >
                  support@hivrasoft.com
                </a>
              </ContactItem>

              <ContactItem
                icon={
                  <LocationIcon />
                }
              >
                <strong>
                  Address:-
                </strong>

                <span
                  className="
                    break-words
                  "
                >
                  E 2, Sector 63,
                  Noida, Uttar Pradesh,
                  201301
                </span>
              </ContactItem>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          BENEFITS
      =================================================== */}

      <section
        className="
          border-y

          border-[#EFD4D7]

          bg-[#FFF6F3]

          px-4
          py-5

          sm:px-6

          lg:px-8
        "
      >
        <div
          className="
            mx-auto

            grid

            max-w-[1450px]

            grid-cols-2

            gap-x-3
            gap-y-6

            md:grid-cols-4
          "
        >
          <Benefit
            icon={
              <TruckIcon />
            }
            title="Free Shipping"
            subtitle="On all orders"
          />

          <Benefit
            icon={
              <PackageIcon />
            }
            title="Cash On Delivery"
            subtitle="Available"
          />

          <Benefit
            icon={
              <RefreshIcon />
            }
            title="Easy Returns"
            subtitle="Within 7 Days"
          />

          <Benefit
            icon={
              <ShieldIcon />
            }
            title="100% Secure"
            subtitle="Payments"
          />
        </div>
      </section>

      {/* ===================================================
          BOTTOM BAR
      =================================================== */}

      <section
        className="
          bg-gradient-to-r

          from-[#C8818C]

          via-[#D39AA1]

          to-[#C8818C]

          px-4
          py-4

          text-white

          sm:px-6

          lg:px-8
        "
      >
        <div
          className="
            mx-auto

            flex

            max-w-[1450px]

            flex-col

            items-center
            justify-between

            gap-3

            text-center

            lg:flex-row

            lg:text-left
          "
        >
          <p
            className="
              text-[8px]

              text-white/95

              sm:text-[9px]
            "
          >
            © 2026 Hivra Soft.
            All rights reserved.
          </p>

          <div
            className="
              flex

              flex-wrap

              justify-center

              gap-x-4
              gap-y-2
            "
          >
            <BottomLink
              href="/privacy-policy"
            >
              Privacy Policy
            </BottomLink>

            <BottomLink
              href="/terms-and-conditions"
            >
              Terms & Conditions
            </BottomLink>

            <BottomLink
              href="/returns"
            >
              Return Policy
            </BottomLink>

            <BottomLink
              href="/shipping"
            >
              Shipping Policy
            </BottomLink>

            <BottomLink
              href="/sitemap"
            >
              Sitemap
            </BottomLink>
          </div>

          <p
            className="
              text-[8px]

              text-white/95

              sm:text-[9px]
            "
          >
            Made with ♡ for a
            kinder, more confident
            you.
          </p>
        </div>
      </section>
    </footer>
  );
}

/* =========================================================
   DYNAMIC COLUMN
========================================================= */

function DynamicFooterColumn({
  title,
  links,
  columns = 1,
}: {
  title:
    string;

  links:
    FooterLink[];

  columns?:
    1 | 2;
}) {
  return (
    <div
      className="
        min-w-0
      "
    >
      <FooterTitle>
        {title}
      </FooterTitle>

      {links.length >
      0 ? (
        <ul
          className={`
            mt-5

            ${
              columns ===
              2
                ? `
                  grid

                  grid-cols-2

                  gap-x-5
                  gap-y-2.5

                  xl:gap-x-7
                `
                : `
                  flex

                  flex-col

                  gap-2.5
                `
            }
          `}
        >
          {links.map(
            (
              link,
            ) => (
              <li
                key={`${title}-${link.id}`}
                className="
                  min-w-0
                "
              >
                <Link
                  href={
                    link.href
                  }
                  className="
                    block

                    min-h-[18px]

                    break-words

                    text-[10px]

                    leading-[1.5]

                    text-[#655A5C]

                    hover:text-[#B32E4D]

                    hover:underline

                    hover:underline-offset-2

                    sm:text-[11px]

                    lg:text-[10px]

                    xl:text-[11px]
                  "
                >
                  {
                    link.name
                  }
                </Link>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p
          className="
            mt-5

            text-[10px]

            text-black/35
          "
        >
          No categories available.
        </p>
      )}
    </div>
  );
}

/* =========================================================
   STATIC COLUMN
========================================================= */

function StaticFooterColumn({
  title,
  links,
}: {
  title:
    string;

  links: {
    name:
      string;

    href:
      string;
  }[];
}) {
  return (
    <div
      className="
        min-w-0
      "
    >
      <FooterTitle>
        {title}
      </FooterTitle>

      <ul
        className="
          mt-5

          flex

          flex-col

          gap-2.5
        "
      >
        {links.map(
          (
            link,
          ) => (
            <li
              key={`${title}-${link.name}`}
            >
              <Link
                href={
                  link.href
                }
                className="
                  block

                  min-h-[18px]

                  text-[10px]

                  leading-[1.5]

                  text-[#655A5C]

                  hover:text-[#B32E4D]

                  hover:underline

                  hover:underline-offset-2

                  sm:text-[11px]

                  xl:text-[12px]
                "
              >
                {
                  link.name
                }
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

/* =========================================================
   FOOTER TITLE
========================================================= */

function FooterTitle({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <>
      <h3
        className="
          text-[9px]

          font-bold

          uppercase

          tracking-[0.14em]

          text-[#A62B47]

          min-[390px]:text-[10px]

          sm:text-[11px]
        "
      >
        {children}
      </h3>

      <span
        className="
          mt-2

          block

          h-[2px]

          w-8

          bg-[#DF5E76]
        "
      />
    </>
  );
}

/* =========================================================
   SOCIAL
========================================================= */

function SocialLink({
  href,
  label,
  children,
}: {
  href:
    string;

  label:
    string;

  children:
    ReactNode;
}) {
  return (
    <a
      href={
        href
      }
      aria-label={
        label
      }
      target="_blank"
      rel="noopener noreferrer"
      className="
        grid

        h-9
        w-9

        place-items-center

        rounded-full

        bg-[#FBE5E5]

        text-[12px]

        font-bold

        text-[#B52C4A]

        transition

        hover:bg-[#B52C4A]

        hover:text-white
      "
    >
      {children}
    </a>
  );
}

/* =========================================================
   MOBILE CONTACT

   Mobile me compact rakha hai
   taaki right column screen se bahar na nikle.
========================================================= */

function MobileContactItem({
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

        w-full

        min-w-0

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

          bg-[#FCE3E4]

          text-[#C23B57]
        "
      >
        {icon}
      </span>

      <div
        className="
          flex

          min-w-0

          flex-1

          flex-col

          text-[8px]

          leading-[1.55]

          text-[#4D4143]

          min-[390px]:text-[9px]

          sm:text-[10px]
        "
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   DESKTOP CONTACT
========================================================= */

function ContactItem({
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

        w-full

        min-w-0

        gap-3
      "
    >
      <span
        className="
          flex

          h-8
          w-8

          shrink-0

          items-center
          justify-center

          rounded-full

          bg-[#FCE3E4]

          text-[#C23B57]
        "
      >
        {icon}
      </span>

      <div
        className="
          flex

          min-w-0

          flex-1

          flex-col

          text-[10px]

          leading-5

          text-[#4D4143]
        "
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   BENEFIT
========================================================= */

function Benefit({
  icon,
  title,
  subtitle,
}: {
  icon:
    ReactNode;

  title:
    string;

  subtitle:
    string;
}) {
  return (
    <div
      className="
        flex

        items-center
        justify-center

        gap-3

        md:border-r

        md:border-[#ECCED2]

        md:last:border-r-0
      "
    >
      <span
        className="
          flex

          h-10
          w-10

          shrink-0

          items-center
          justify-center

          rounded-full

          bg-[#FBE0E1]

          text-[#C33A56]
        "
      >
        {icon}
      </span>

      <div>
        <p
          className="
            text-[10px]

            font-semibold

            sm:text-[11px]
          "
        >
          {title}
        </p>

        <p
          className="
            mt-0.5

            text-[8px]

            text-black/50

            sm:text-[9px]
          "
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   BOTTOM LINK
========================================================= */

function BottomLink({
  href,
  children,
}: {
  href:
    string;

  children:
    ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      className="
        text-[8px]

        text-white/95

        hover:underline

        sm:text-[9px]
      "
    >
      {children}
    </Link>
  );
}

/* =========================================================
   ICONS
========================================================= */

function MailIcon() {
  return (
    <svg
      width="17"
      height="17"
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
        height="14"
        rx="2"
      />

      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z" />
    </svg>
  );
}

function TruckIcon() {
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
      <path d="M3 5h11v11H3Z" />

      <path d="M14 9h4l3 3v4h-7Z" />

      <circle
        cx="7"
        cy="18"
        r="2"
      />

      <circle
        cx="18"
        cy="18"
        r="2"
      />
    </svg>
  );
}

function PackageIcon() {
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
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />

      <path d="m3 7 9 5 9-5" />

      <path d="M3 7v10l9 5 9-5V7" />

      <path d="M12 12v10" />
    </svg>
  );
}

function RefreshIcon() {
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
      <path d="M20 6v5h-5" />

      <path d="M4 18v-5h5" />

      <path d="M6 9a7 7 0 0 1 12-3l2 5" />

      <path d="M18 15a7 7 0 0 1-12 3l-2-5" />
    </svg>
  );
}

function ShieldIcon() {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />

      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}