"use client";
import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Account from "../Auth/Account";
import {
  apiFetch,
  requestLogin,
} from "@/lib/api";
import {
  useStorefrontCommerce,

} from "@/src/components/Storefront/StorefrontCommerceProvider";



/* =========================================================

   LOGOS



   DESKTOP:

   public/images/logos/hivra-desktop.png.png



   MOBILE:

   public/images/logos/hivramobile.png.png

========================================================= */



const DESKTOP_LOGO_SRC =

  "/images/logos/hivra-desktop.png.png";



const MOBILE_LOGO_SRC =

  "/images/logos/hivramobile.png.png";



/* =========================================================

   TYPES

========================================================= */



type HeaderCategory = {

  id: string;



  name: string;



  slug: string;



  parent:

    | string

    | null;



  ancestors:

    string[];



  level: number;



  isActive: boolean;



  sortOrder: number;



  children:

    HeaderCategory[];

};



type HeaderOffer = {

  _id: string;



  name: string;



  slug: string;



  offerType:

    | "buy_get"

    | "fixed_price_bundle";



  buyQuantity: number;



  getQuantity: number;



  isActive: boolean;

};



type HeaderOfferResponse = {

  success?: boolean;



  offer?:

    HeaderOffer;



  message?: string;

};



type HeaderNavItem =

  | {

      type:

        "category";



      key: string;



      category:

        HeaderCategory;

    }

  | {

      type:

        "offer";



      key: string;



      name: string;



      href: string;

    };



/* =========================================================

   HELPERS

========================================================= */



function cleanSlug(

  value: unknown,

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



/* =========================================================

   CATEGORY NORMALIZER

========================================================= */



function normalizeCategory(

  value: unknown,

): HeaderCategory | null {

  if (

    !value ||

    typeof value !==

      "object"

  ) {

    return null;

  }



  const raw =

    value as Record<

      string,

      unknown

    >;



  const id =

    String(

      raw.id ||

        raw._id ||

        "",

    ).trim();



  const name =

    String(

      raw.name ||

        "",

    ).trim();



  const slug =

    cleanSlug(

      raw.slug,

    );



  const isActive =

    raw.isActive !==

    false;



  if (

    !id ||

    !name ||

    !slug ||

    !isActive

  ) {

    return null;

  }



  const parent =

    raw.parent ===

      null ||

    raw.parent ===

      undefined ||

    raw.parent ===

      ""

      ? null

      : String(

          raw.parent,

        );



  const ancestors =

    Array.isArray(

      raw.ancestors,

    )

      ? raw.ancestors.map(

          (

            ancestor,

          ) =>

            String(

              ancestor,

            ),

        )

      : [];



  const rawChildren =

    Array.isArray(

      raw.children,

    )

      ? raw.children

      : [];



  const children =

    rawChildren

      .map(

        normalizeCategory,

      )

      .filter(

        (

          child,

        ): child is HeaderCategory =>

          Boolean(

            child,

          ),

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



  return {

    id,



    name,



    slug,



    parent,



    ancestors,



    level:

      Number(

        raw.level ||

          0,

      ),



    isActive,



    sortOrder:

      Number(

        raw.sortOrder ||

          0,

      ),



    children,

  };

}



/* =========================================================

   NORMALIZE TREE RESPONSE

========================================================= */



function normalizeTree(

  response: unknown,

): HeaderCategory[] {

  let rawTree:

    unknown[] = [];



  if (

    Array.isArray(

      response,

    )

  ) {

    rawTree =

      response;

  } else if (

    response &&

    typeof response ===

      "object"

  ) {

    const object =

      response as Record<

        string,

        unknown

      >;



    if (

      Array.isArray(

        object.categories,

      )

    ) {

      rawTree =

        object.categories;

    } else if (

      Array.isArray(

        object.data,

      )

    ) {

      rawTree =

        object.data;

    } else if (

      object.data &&

      typeof object.data ===

        "object"

    ) {

      const data =

        object.data as Record<

          string,

          unknown

        >;



      if (

        Array.isArray(

          data.categories,

        )

      ) {

        rawTree =

          data.categories;

      }

    }

  }



  return rawTree

    .map(

      normalizeCategory,

    )

    .filter(

      (

        category,

      ): category is HeaderCategory =>

        Boolean(

          category,

        ),

    )

    .filter(

      (

        category,

      ) =>

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

}



/* =========================================================

   CATEGORY URL

========================================================= */



function categoryHref(

  slugs: string[],

) {

  const cleaned =

    slugs

      .filter(

        Boolean,

      )

      .map(

        cleanSlug,

      );



  if (

    cleaned.length ===

      1 &&

    (

      cleaned[0] ===

        "new-launch" ||

      cleaned[0] ===

        "new-launches" ||

      cleaned[0] ===

        "new-arrival" ||

      cleaned[0] ===

        "new-arrivals"

    )

  ) {

    return "/new-innerwear-online";

  }



  return `/${cleaned

    .map(

      encodeURIComponent,

    )

    .join("/")}`;

}




/* =========================================================
   HEADER SEARCH TYPES
========================================================= */

type HeaderSearchItem = {
  id: string;
  label: string;
  type: string;
  subtitle: string;
  href: string | null;
};

function toRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getSearchHref(
  item: Record<string, unknown>,
  type: string,
) {
  const directHref =
    String(
      item.href ||
        item.url ||
        item.path ||
        item.redirect ||
        "",
    ).trim();

  if (directHref) {
    return directHref;
  }

  const slug =
    cleanSlug(
      item.slug,
    );

  if (
    type === "category" &&
    slug
  ) {
    return `/${encodeURIComponent(slug)}`;
  }

  return null;
}

function normalizeSearchItems(
  response: unknown,
): HeaderSearchItem[] {
  const collected: Array<{
    value: unknown;
    fallbackType: string;
  }> = [];

  const pushArray = (
    value: unknown,
    fallbackType = "",
  ) => {
    if (!Array.isArray(value)) {
      return;
    }

    value.forEach((entry) => {
      collected.push({
        value: entry,
        fallbackType,
      });
    });
  };

  if (Array.isArray(response)) {
    pushArray(response);
  }

  const root =
    toRecord(response);

  if (root) {
    pushArray(
      root.results,
    );

    pushArray(
      root.suggestions,
    );

    pushArray(
      root.items,
    );

    pushArray(
      root.products,
      "product",
    );

    pushArray(
      root.categories,
      "category",
    );

    pushArray(
      root.blogs,
      "blog",
    );

    if (
      Array.isArray(
        root.data,
      )
    ) {
      pushArray(
        root.data,
      );
    }

    const data =
      toRecord(
        root.data,
      );

    if (data) {
      pushArray(
        data.results,
      );

      pushArray(
        data.suggestions,
      );

      pushArray(
        data.items,
      );

      pushArray(
        data.products,
        "product",
      );

      pushArray(
        data.categories,
        "category",
      );

      pushArray(
        data.blogs,
        "blog",
      );
    }
  }

  const normalized =
    collected
      .map(
        (
          entry,
          index,
        ): HeaderSearchItem | null => {
          if (
            typeof entry.value ===
            "string"
          ) {
            const label =
              entry.value.trim();

            if (!label) {
              return null;
            }

            return {
              id:
                `search-${label}-${index}`,
              label,
              type:
                entry.fallbackType ||
                "suggestion",
              subtitle: "",
              href: null,
            };
          }

          const item =
            toRecord(
              entry.value,
            );

          if (!item) {
            return null;
          }

          const label =
            String(
              item.title ||
                item.name ||
                item.label ||
                item.query ||
                "",
            ).trim();

          if (!label) {
            return null;
          }

          const type =
            String(
              item.type ||
                item.kind ||
                item.searchType ||
                entry.fallbackType ||
                "result",
            )
              .trim()
              .toLowerCase();

          const subtitle =
            String(
              item.subtitle ||
                item.description ||
                item.categoryName ||
                "",
            ).trim();

          const id =
            String(
              item.id ||
                item._id ||
                item.slug ||
                `${type}-${label}-${index}`,
            );

          return {
            id,
            label,
            type,
            subtitle,
            href:
              getSearchHref(
                item,
                type,
              ),
          };
        },
      )
      .filter(
        (
          item,
        ): item is HeaderSearchItem =>
          Boolean(item),
      );

  const unique =
    new Map<
      string,
      HeaderSearchItem
    >();

  normalized.forEach(
    (
      item,
    ) => {
      const key =
        `${item.type}:${item.id}:${item.label}`;

      if (
        !unique.has(
          key,
        )
      ) {
        unique.set(
          key,
          item,
        );
      }
    },
  );

  return Array.from(
    unique.values(),
  ).slice(
    0,
    8,
  );
}

/* =========================================================
   HEADER SEARCH
========================================================= */

function HeaderSearch() {
  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    items,
    setItems,
  ] =
    useState<
      HeaderSearchItem[]
    >([]);

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  useEffect(() => {
    const searchText =
      query.trim();

    if (
      searchText.length <
      2
    ) {
      setItems([]);
      setOpen(false);
      setLoading(false);

      return;
    }

    let cancelled =
      false;

    const timer =
      window.setTimeout(
        async () => {
          setLoading(
            true,
          );

          try {
            const response =
              await apiFetch<unknown>(
                `/api/search/suggestions?q=${encodeURIComponent(
                  searchText,
                )}`,
                {
                  method:
                    "GET",
                },
              );

            if (
              cancelled
            ) {
              return;
            }

            setItems(
              normalizeSearchItems(
                response,
              ),
            );

            setOpen(
              true,
            );
          } catch (
            error
          ) {
            if (
              !cancelled
            ) {
              console.error(
                "HEADER SEARCH SUGGESTIONS ERROR:",
                error,
              );

              setItems(
                [],
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false,
              );
            }
          }
        },
        250,
      );

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timer,
      );
    };
  }, [
    query,
  ]);

  async function runGlobalSearch() {
    const searchText =
      query.trim();

    if (
      !searchText
    ) {
      return;
    }

    setLoading(
      true,
    );

    try {
      const response =
        await apiFetch<unknown>(
          `/api/search/global?q=${encodeURIComponent(
            searchText,
          )}&page=1&limit=8`,
          {
            method:
              "GET",
          },
        );

      setItems(
        normalizeSearchItems(
          response,
        ),
      );

      setOpen(
        true,
      );
    } catch (
      error
    ) {
      console.error(
        "HEADER GLOBAL SEARCH ERROR:",
        error,
      );

      setItems(
        [],
      );

      setOpen(
        true,
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={(
        event,
      ) => {
        event.preventDefault();

        void runGlobalSearch();
      }}
      className="
        relative
        min-w-0
        flex-1
        w-full
      "
    >
      <div
        className="
          flex
          h-[28px]
          w-full
          items-center
          gap-2
          rounded-full
          border
          border-black/15
          bg-white
          px-3
          text-black
          shadow-sm
        "
      >
        <span
          className="
            flex
            shrink-0
            items-center
            justify-center
            text-black/65
          "
        >
          <SearchIcon />
        </span>

        <input
          value={
            query
          }
          onChange={(
            event,
          ) => {
            setQuery(
              event.target.value,
            );
          }}
          onFocus={() => {
            if (
              query.trim().length >=
                2
            ) {
              setOpen(
                true,
              );
            }
          }}
          onBlur={() => {
            window.setTimeout(
              () => {
                setOpen(
                  false,
                );
              },
              140,
            );
          }}
          placeholder="Search..."
          aria-label="Search products, categories and blogs"
          className="
            min-w-0
            flex-1
            bg-transparent
            text-[11px]
            font-medium
            text-black
            outline-none
            placeholder:text-black/45
          "
        />

        {loading ? (
          <span
            className="
              h-3
              w-3
              shrink-0
              animate-spin
              rounded-full
              border
              border-black/25
              border-t-black
            "
          />
        ) : null}
      </div>

      {open ? (
        <div
          className="
            absolute
            right-0
            top-[calc(100%+7px)]
            z-[1600]
            w-full
            min-w-[320px]
            overflow-hidden
            rounded-[12px]
            border
            border-black/10
            bg-white
            text-black
            shadow-[0_20px_50px_rgba(0,0,0,.22)]
          "
        >
          {items.length >
          0 ? (
            <div
              className="
                max-h-[360px]
                overflow-y-auto
                p-2
              "
            >
              {items.map(
                (
                  item,
                ) => {
                  const content = (
                    <>
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
                          {
                            item.label
                          }
                        </p>

                        <div
                          className="
                            mt-1
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-[#F8E9EF]
                              px-2
                              py-0.5
                              text-[8px]
                              font-bold
                              uppercase
                              tracking-[0.08em]
                              text-[#B31345]
                            "
                          >
                            {
                              item.type
                            }
                          </span>

                          {item.subtitle ? (
                            <span
                              className="
                                truncate
                                text-[9px]
                                text-black/50
                              "
                            >
                              {
                                item.subtitle
                              }
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span
                        className="
                          shrink-0
                          text-black/35
                        "
                      >
                        →
                      </span>
                    </>
                  );

                  if (
                    item.href
                  ) {
                    return (
                      <Link
                        key={
                          item.id
                        }
                        href={
                          item.href
                        }
                        className="
                          flex
                          items-center
                          gap-3
                          rounded-[9px]
                          px-3
                          py-2.5
                          transition
                          hover:bg-[#FFF2F6]
                        "
                      >
                        {
                          content
                        }
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onMouseDown={(
                        event,
                      ) => {
                        event.preventDefault();

                        setQuery(
                          item.label,
                        );
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-[9px]
                        px-3
                        py-2.5
                        text-left
                        transition
                        hover:bg-[#FFF2F6]
                      "
                    >
                      {
                        content
                      }
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <div
              className="
                px-4
                py-4
                text-center
                text-[11px]
                text-black/55
              "
            >
              {loading
                ? "Searching..."
                : "No search results found"}
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

/* =========================================================
   RESELLER TICKER
========================================================= */

function ResellerTicker() {
  const content = (
    <div
      className="
        flex
        shrink-0
        items-center
        whitespace-nowrap
      "
    >
      <span
        className="
          px-8
          text-[10px]
          font-bold
          uppercase
          tracking-[0.035em]
          text-white
        "
      >
        ◆ &nbsp; BECOME A HIVRASOFT RESELLER
      </span>

      <span
        className="
          px-8
          text-[10px]
          font-semibold
          text-white
        "
      >
        ◆ &nbsp; Sell India&apos;s Most Comfortable Innerwear — Zero Stock, High Profit
      </span>

      <span
        className="
          px-8
          text-[10px]
          font-bold
          uppercase
          tracking-[0.035em]
          text-white
        "
      >
        ◆ &nbsp; BECOME A HIVRASOFT RESELLER
      </span>

      <span
        className="
          px-8
          text-[10px]
          font-semibold
          text-white
        "
      >
        ◆ &nbsp; Sell India&apos;s Most Comfortable Innerwear — Zero Stock, High Profit
      </span>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes hivraHeaderTicker {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-50%);
            }
          }
        `}
      </style>

      <div
        className="
          hidden
          h-[30px]
          w-full
          overflow-hidden
          bg-[#B31345]
          md:block
        "
      >
        <div
          className="
            flex
            h-full
            w-max
            items-center
            will-change-transform
          "
          style={{
            animation:
              "hivraHeaderTicker 24s linear infinite",
          }}
        >
          {content}
          {content}
        </div>
      </div>
    </>
  );
}

/* =========================================================

   HEADER

========================================================= */



export default function Header() {

  const pathname =

    usePathname();



  const commerce =

    useStorefrontCommerce();



  /* =======================================================

     MOBILE DRAWER

  ======================================================= */



  const [

    mobileOpen,

    setMobileOpen,

  ] =

    useState(

      false,

    );



  /* =======================================================

     CATEGORIES

  ======================================================= */



  const [

    categories,

    setCategories,

  ] =

    useState<

      HeaderCategory[]

    >([]);



  /* =======================================================

     BUY GET OFFER

  ======================================================= */



  const [

    buyGetOffer,

    setBuyGetOffer,

  ] =

    useState<

      HeaderOffer | null

    >(

      null,

    );



  /* =======================================================

     MOBILE EXPANDED

  ======================================================= */



  const [

    expanded,

    setExpanded,

  ] =

    useState<

      Set<string>

    >(

      () =>

        new Set(),

    );



  /* =======================================================

     LOAD HEADER DATA

  ======================================================= */



  useEffect(() => {

    let cancelled =

      false;



    async function loadHeaderData() {

      /* CATEGORIES */



      try {

        const response =

          await apiFetch<unknown>(

            "/api/categories/tree?active=true",

            {

              method:

                "GET",

            },

          );



        if (

          !cancelled

        ) {

          setCategories(

            normalizeTree(

              response,

            ),

          );

        }

      } catch (

        error

      ) {

        console.error(

          "HEADER CATEGORY ERROR:",

          error,

        );



        if (

          !cancelled

        ) {

          setCategories(

            [],

          );

        }

      }



      /* BUY GET */



      try {

        const response =

          await apiFetch<HeaderOfferResponse>(

            "/api/offers/featured/buy-get",

            {

              method:

                "GET",

            },

          );



        if (

          cancelled

        ) {

          return;

        }



        const offer =

          response?.offer;



        if (

          offer &&

          offer.isActive &&

          offer.name &&

          offer.slug

        ) {

          setBuyGetOffer(

            offer,

          );

        } else {

          setBuyGetOffer(

            null,

          );

        }

      } catch {

        if (

          !cancelled

        ) {

          setBuyGetOffer(

            null,

          );

        }

      }

    }



    void loadHeaderData();



    return () => {

      cancelled =

        true;

    };

  }, []);



  /* =======================================================

     LOCK BODY WHEN MOBILE DRAWER OPEN

  ======================================================= */



  useEffect(() => {

    if (

      !mobileOpen

    ) {

      return;

    }



    const previous =

      document.body.style

        .overflow;



    document.body.style.overflow =

      "hidden";



    return () => {

      document.body.style.overflow =

        previous;

    };

  }, [

    mobileOpen,

  ]);



  /* =======================================================

     NAVIGATION



     Categories = admin

     Buy/Get = dynamic

     Fixed price = NOT in header

  ======================================================= */



  const navigationItems =

    useMemo(() => {

      const items:

        HeaderNavItem[] =

        [];



      let offerInserted =

        false;



      categories.forEach(

        (

          category,

        ) => {

          items.push({

            type:

              "category",



            key:

              `category-${category.id}`,



            category,

          });



          const slug =

            cleanSlug(

              category.slug,

            );



          if (

            buyGetOffer &&

            (

              slug ===

                "new-launch" ||

              slug ===

                "new-launches" ||

              slug ===

                "new-arrival" ||

              slug ===

                "new-arrivals"

            )

          ) {

            items.push({

              type:

                "offer",



              key:

                `offer-${buyGetOffer._id}`,



              name:

                buyGetOffer.name,



              href:

                `/${encodeURIComponent(

                  buyGetOffer.slug,

                )}`,

            });



            offerInserted =

              true;

          }

        },

      );



      if (

        buyGetOffer &&

        !offerInserted

      ) {

        items.unshift({

          type:

            "offer",



          key:

            `offer-${buyGetOffer._id}`,



          name:

            buyGetOffer.name,



          href:

            `/${encodeURIComponent(

              buyGetOffer.slug,

            )}`,

        });

      }



      return items;

    }, [

      categories,

      buyGetOffer,

    ]);



  /* =======================================================

     MOBILE CATEGORY TOGGLE

  ======================================================= */



  function toggleExpanded(

    id: string,

  ) {

    setExpanded(

      (

        current,

      ) => {

        const next =

          new Set(

            current,

          );



        if (

          next.has(

            id,

          )

        ) {

          next.delete(

            id,

          );

        } else {

          next.add(

            id,

          );

        }



        return next;

      },

    );

  }



  /* =======================================================

     HIDE ON LANDING

  ======================================================= */



  if (

    pathname ===

    "/landing"

  ) {

    return null;

  }



  return (

    <>

      {/* ===================================================

          STICKY HEADER WRAPPER



          Announcement + main header dono sticky.

      =================================================== */}



      <div

        className="

          sticky

          top-0

          z-[1000]



          w-full

        "

      >

        <ResellerTicker />

        {/* =================================================
            SERVICE BAR

            White background.
            Benefits on left.
            Search + Wishlist + Account + Cart on right.

            Desktop only:
            main mobile/tablet action layout remains unchanged.

            Search uses:
            GET /api/search/suggestions
            GET /api/search/global
        ================================================= */}

        <div
          className="
            hidden
            w-full
            border-b
            border-black/10
            bg-white
            xl:block
          "
        >
          <div
            className="
              mx-auto
              flex
              h-[46px]
              w-full
              max-w-[1600px]
              items-center
              gap-6
              px-5
              2xl:px-7
            "
          >
            {/* BENEFITS */}

            <p
              className="
                flex
                w-[470px]
                shrink-0
                items-center
                whitespace-nowrap
                text-[9px]
                font-medium
                text-black
                2xl:w-[500px]
                2xl:text-[10px]
              "
            >
              <span>
                Free Returns
              </span>

              <span
                className="
                  mx-2
                  text-black/35
                "
              >
                |
              </span>

              <span>
                100% Privacy
              </span>

              <span
                className="
                  mx-2
                  text-black/35
                "
              >
                |
              </span>

              <span>
                Cash On Delivery
              </span>

              <span
                className="
                  mx-2
                  text-black/35
                "
              >
                |
              </span>

              <span>
                Free Shipping*
              </span>
            </p>

            {/* SEARCH + ACTION ICONS */}

            <div
              className="
                flex
                min-w-0
                flex-1
                items-center
                gap-3
              "
            >
              <HeaderSearch />

              {/* WISHLIST */}

              <button
                type="button"
                aria-label="Wishlist"
                onClick={() => {
                  void commerce.openWishlist();
                }}
                className="
                  relative
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-black
                  transition
                  hover:bg-black/5
                  hover:text-[#B31345]
                "
              >
                <HeartIcon />

                {commerce.wishlistCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.wishlistCount
                    }
                  />
                ) : null}
              </button>

              {/* ACCOUNT */}

              <div
                className="
                  flex
                  h-9
                  min-w-[36px]
                  shrink-0
                  items-center
                  justify-center
                  text-black
                  [&_a]:text-black
                  [&_button]:text-black
                  [&_svg]:text-black
                "
              >
                <Account />
              </div>

              {/* CART */}

              <button
                type="button"
                aria-label="Cart"
                onClick={() => {
                  void commerce.openCart();
                }}
                className="
                  relative
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-black
                  transition
                  hover:bg-black/5
                  hover:text-[#B31345]
                "
              >
                <BagIcon />

                {commerce.cartCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.cartCount
                    }
                  />
                ) : null}
              </button>
            </div>
          </div>
        </div>

        {/* =================================================

            MAIN HEADER

        ================================================= */}



        <header

          className="

            w-full



            border-b

            border-black/10



            bg-white



            xl:border-white/10

            xl:bg-black

          "

        >

          <div

            className="

              mx-auto



              flex



              h-[68px]

              w-full

              max-w-[1600px]



              items-center



              px-2



              sm:px-4



              md:h-[74px]

              md:px-6



              xl:h-[88px]

              xl:px-5



              2xl:px-7

            "

          >

            {/* =============================================

                MOBILE MENU BUTTON

            ============================================= */}



            <button

              type="button"

              aria-label="Open menu"

              onClick={() =>

                setMobileOpen(

                  true,

                )

              }

              className="

                flex



                h-11

                w-10



                shrink-0



                items-center

                justify-center



                text-black



                xl:hidden

              "

            >

              <MenuIcon />

            </button>



            {/* =============================================

                LOGO



                Mobile:

                HS icon only



                Desktop:

                Full Hivra Soft logo

            ============================================= */}



            <Link

              href="/"

              aria-label="HivraSoft Home"

              className="

                ml-2



                flex

                shrink-0



                items-center

                justify-center



                sm:ml-3



                xl:ml-0

                xl:mr-0

              "

            >

              {/* MOBILE LOGO */}



              <Image

                src={

                  MOBILE_LOGO_SRC

                }

                alt="Hivra Soft"

                width={

                  160

                }

                height={

                  160

                }

                priority

                className="

                  h-[44px]

                  w-[44px]



                  object-contain



                  sm:h-[48px]

                  sm:w-[48px]



                  xl:hidden

                "

              />



              {/* DESKTOP FULL LOGO */}



              <Image

                src={

                  DESKTOP_LOGO_SRC

                }

                alt="Hivra Soft"

                width={

                  523

                }

                height={

                  210

                }

                priority

                unoptimized

                className="

                  hidden



                  h-auto



                  w-[225px]



                  object-contain



                  xl:block



                  2xl:w-[240px]

                "

              />

            </Link>



            {/* =============================================

                DESKTOP NAVIGATION

            ============================================= */}



            <nav

              className="

                hidden

                h-full



                min-w-0



                items-center

                justify-start



                gap-[16px]



                xl:ml-[140px]

                xl:mr-auto

                xl:flex



                2xl:ml-[160px]

                2xl:gap-[22px]

              "

            >

              {navigationItems.map(

                (

                  item,

                ) => {

                  if (

                    item.type ===

                    "offer"

                  ) {

                    return (

                      <DesktopOfferLink

                        key={

                          item.key

                        }

                        href={

                          item.href

                        }

                      >

                        {

                          item.name

                        }

                      </DesktopOfferLink>

                    );

                  }



                  return (

                    <DesktopCategory

                      key={

                        item.key

                      }

                      root={

                        item.category

                      }

                    />

                  );

                },

              )}

            </nav>



            {/* =============================================

                ACTIONS



                More spacing:

                Wishlist / Account / Cart

            ============================================= */}



            <div

              className="

                ml-auto



                flex

                shrink-0



                items-center



                gap-[7px]



                xl:hidden

              "

            >

              {/* WISHLIST */}



              <button

                type="button"

                aria-label="Wishlist"

                onClick={() => {

                  void commerce.openWishlist();

                }}

                className="

                  relative



                  flex



                  h-10

                  w-10



                  items-center

                  justify-center



                  text-[#8C1839]



                  transition-colors



                  hover:text-[#B31345]



                  xl:h-11

                  xl:w-11



                  xl:text-[#FF7900]



                  xl:hover:text-[#FF9B38]

                "

              >

                <HeartIcon />



                {commerce.wishlistCount >

                  0 ? (

                  <CountBadge

                    count={

                      commerce.wishlistCount

                    }

                  />

                ) : null}

              </button>



              {/* ACCOUNT */}



              <div

                className="

                  hidden



                  md:flex



                  md:items-center

                  md:justify-center



                  xl:min-w-[44px]



                  xl:[&_a]:text-[#FF7900]

                  xl:[&_button]:text-[#FF7900]

                  xl:[&_svg]:text-[#FF7900]

                "

              >

                <Account />

              </div>



              {/* CART */}



              <button

                type="button"

                aria-label="Cart"

                onClick={() => {

                  void commerce.openCart();

                }}

                className="

                  relative



                  flex



                  h-10

                  w-10



                  items-center

                  justify-center



                  text-[#111]



                  transition-colors



                  md:rounded-full

                  md:bg-[#211A18]

                  md:text-white



                  xl:h-11

                  xl:w-11



                  xl:bg-[#211A18]

                  xl:text-white



                  xl:hover:bg-[#332925]

                "

              >

                <BagIcon />



                {commerce.cartCount >

                  0 ? (

                  <CountBadge

                    count={

                      commerce.cartCount

                    }

                  />

                ) : null}

              </button>

            </div>

          </div>

        </header>

      </div>



      {/* ===================================================

          MOBILE DRAWER



          Mobile functionality/design same.

      =================================================== */}



      <div

        className={`

          fixed

          inset-0



          z-[10000]



          xl:hidden



          ${

            mobileOpen

              ? `

                pointer-events-auto

              `

              : `

                pointer-events-none

              `

          }

        `}

      >

        {/* OVERLAY */}



        <button

          type="button"

          aria-label="Close menu"

          onClick={() =>

            setMobileOpen(

              false,

            )

          }

          className={`

            absolute

            inset-0



            bg-black/55



            transition-opacity

            duration-300



            ${

              mobileOpen

                ? `

                  opacity-100

                `

                : `

                  opacity-0

                `

            }

          `}

        />



        {/* DRAWER */}



        <aside

          className={`

            absolute



            bottom-0

            left-0

            top-0



            w-[82vw]

            max-w-[360px]



            overflow-y-auto

            overscroll-contain



            bg-white



            text-black



            shadow-[18px_0_45px_rgba(0,0,0,.25)]



            transition-transform

            duration-300



            ${

              mobileOpen

                ? `

                  translate-x-0

                `

                : `

                  -translate-x-full

                `

            }

          `}

        >

          {/* ===============================================

              ACCOUNT AREA

          =============================================== */}



          <div

            className="

              relative



              border-b

              border-black/10



              px-4

              pb-5

              pt-5

            "

          >

            <button

              type="button"

              aria-label="Close menu"

              onClick={() =>

                setMobileOpen(

                  false,

                )

              }

              className="

                absolute



                right-2

                top-2



                flex



                h-9

                w-9



                items-center

                justify-center



                text-[27px]

              "

            >

              ×

            </button>



            <div

              className="

                flex



                items-center



                gap-3

              "

            >

              <div

                className="

                  flex



                  h-11

                  w-11



                  shrink-0



                  items-center

                  justify-center



                  rounded-full



                  bg-[#48B2C4]



                  text-white

                "

              >

                <UserIcon />

              </div>



              <div

                className="

                  min-w-0

                "

              >

                <p

                  className="

                    truncate



                    text-[16px]

                    font-semibold

                  "

                >

                  Hi Dear

                </p>



                {commerce.isAuthenticated ===

                true ? (

                  <Link

                    href="/account/"

                    onClick={() =>

                      setMobileOpen(

                        false,

                      )

                    }

                    className="

                      mt-1



                      block



                      text-[10px]

                      font-medium



                      text-[#D34A74]



                      underline

                    "

                  >

                    My Account

                  </Link>

                ) : (

                  <button

                    type="button"

                    onClick={() => {

                      setMobileOpen(

                        false,

                      );



                      requestLogin();

                    }}

                    className="

                      mt-1



                      text-[10px]

                      font-medium



                      text-[#D34A74]



                      underline

                    "

                  >

                    Login / Register

                  </button>

                )}

              </div>

            </div>



            {/* QUICK ACTIONS */}



            <div

              className="

                mt-5



                grid

                grid-cols-3



                gap-2

              "

            >

              <MobileActionLink

                href="/search/"

                label="Search"

                onNavigate={() =>

                  setMobileOpen(

                    false,

                  )

                }

              >

                <SearchIcon />

              </MobileActionLink>



              <button

                type="button"

                onClick={() => {

                  setMobileOpen(

                    false,

                  );



                  void commerce.openWishlist();

                }}

                className="

                  flex



                  min-h-[58px]



                  flex-col



                  items-center

                  justify-center



                  gap-1



                  rounded-[10px]



                  bg-[#F8F5F3]

                "

              >

                <HeartIcon />



                <span

                  className="

                    text-[9px]

                    font-medium

                  "

                >

                  Wishlist

                </span>

              </button>



              <button

                type="button"

                onClick={() => {

                  setMobileOpen(

                    false,

                  );



                  void commerce.openCart();

                }}

                className="

                  flex



                  min-h-[58px]



                  flex-col



                  items-center

                  justify-center



                  gap-1



                  rounded-[10px]



                  bg-[#F8F5F3]

                "

              >

                <BagIcon />



                <span

                  className="

                    text-[9px]

                    font-medium

                  "

                >

                  Cart

                </span>

              </button>

            </div>

          </div>



          {/* ===============================================

              CATEGORY TITLE

          =============================================== */}



          <div

            className="

              border-b

              border-black/10



              px-4

              py-4

            "

          >

            <h2

              className="

                text-[16px]

                font-bold

              "

            >

              Categories

            </h2>

          </div>



          {/* ===============================================

              MOBILE NAV

          =============================================== */}



          <div>

            {navigationItems.map(

              (

                item,

              ) => {

                if (

                  item.type ===

                  "offer"

                ) {

                  return (

                    <MobileOfferLink

                      key={

                        item.key

                      }

                      href={

                        item.href

                      }

                      onNavigate={() =>

                        setMobileOpen(

                          false,

                        )

                      }

                    >

                      {

                        item.name

                      }

                    </MobileOfferLink>

                  );

                }



                return (

                  <MobileCategoryBranch

                    key={

                      item.key

                    }

                    node={

                      item.category

                    }

                    parentSlugs={

                      []

                    }

                    depth={

                      0

                    }

                    expanded={

                      expanded

                    }

                    onToggle={

                      toggleExpanded

                    }

                    onNavigate={() =>

                      setMobileOpen(

                        false,

                      )

                    }

                  />

                );

              },

            )}

          </div>

        </aside>

      </div>

    </>

  );

}



/* =========================================================

   DESKTOP CATEGORY

========================================================= */



function DesktopCategory({

  root,

}: {

  root:

    HeaderCategory;

}) {

  const href =

    categoryHref([

      root.slug,

    ]);



  if (

    root.children.length ===

    0

  ) {

    return (

      <DesktopNavLink

        href={

          href

        }

      >

        {root.name}

      </DesktopNavLink>

    );

  }



  return (

    <div

      className="

        group



        relative



        flex

        h-full



        items-center

      "

    >

      <Link

        href={

          href

        }

        className="

          flex

          h-full



          items-center



          gap-1.5



          whitespace-nowrap



          text-[12px]

          font-bold



          tracking-[0.01em]



          text-[#FF7900]



          transition-colors



          hover:text-[#FFAA57]



          2xl:text-[13px]

        "

      >

        {root.name}



        <ChevronDown />

      </Link>



      {/* ===============================================

          DROPDOWN

      =============================================== */}



      <div

        className="

          invisible



          absolute



          left-1/2

          top-full



          z-[1200]



          max-h-[72vh]



          w-[720px]



          -translate-x-1/2

          translate-y-2



          overflow-y-auto



          rounded-b-[14px]



          border

          border-black/10



          bg-white



          opacity-0



          shadow-[0_22px_55px_rgba(0,0,0,.18)]



          transition-all

          duration-200



          group-hover:visible

          group-hover:translate-y-0

          group-hover:opacity-100

        "

      >

        <div

          className="

            grid

            grid-cols-3



            gap-x-8

            gap-y-8



            p-7

          "

        >

          {root.children.map(

            (

              child,

            ) => (

              <DesktopCategoryColumn

                key={

                  child.id

                }

                node={

                  child

                }

                path={[

                  root.slug,

                  child.slug,

                ]}

              />

            ),

          )}

        </div>



        <div

          className="

            border-t

            border-black/10



            px-7

            py-4

          "

        >

          <Link

            href={

              href

            }

            className="

              inline-flex



              items-center



              gap-2



              text-[10px]

              font-bold

              uppercase



              tracking-[0.10em]



              text-[#D91B58]



              hover:underline

            "

          >

            View All{" "}

            {root.name}



            <span>

              →

            </span>

          </Link>

        </div>

      </div>

    </div>

  );

}



/* =========================================================

   DESKTOP CHILD COLUMN

========================================================= */



function DesktopCategoryColumn({

  node,

  path,

}: {

  node:

    HeaderCategory;



  path:

    string[];

}) {

  return (

    <div

      className="

        min-w-0

      "

    >

      <Link

        href={

          categoryHref(

            path,

          )

        }

        className="

          block



          text-[11px]

          font-bold

          uppercase



          tracking-[0.06em]



          text-[#211A18]



          transition



          hover:text-[#D91B58]

        "

      >

        {node.name}

      </Link>



      {node.children.length >

      0 ? (

        <div

          className="

            mt-3



            space-y-2.5

          "

        >

          {node.children.map(

            (

              child,

            ) => (

              <DesktopNestedCategory

                key={

                  child.id

                }

                node={

                  child

                }

                path={[

                  ...path,

                  child.slug,

                ]}

                depth={

                  0

                }

              />

            ),

          )}

        </div>

      ) : null}

    </div>

  );

}



/* =========================================================

   DESKTOP NESTED CATEGORY

========================================================= */



function DesktopNestedCategory({

  node,

  path,

  depth,

}: {

  node:

    HeaderCategory;



  path:

    string[];



  depth:

    number;

}) {

  return (

    <div>

      <Link

        href={

          categoryHref(

            path,

          )

        }

        className="

          block



          text-[11px]

          font-medium



          leading-[1.4]



          text-[#6C6265]



          transition



          hover:text-[#D91B58]

        "

        style={{

          paddingLeft:

            `${depth * 10}px`,

        }}

      >

        {node.name}

      </Link>



      {node.children.length >

      0 ? (

        <div

          className="

            mt-2



            space-y-2

          "

        >

          {node.children.map(

            (

              child,

            ) => (

              <DesktopNestedCategory

                key={

                  child.id

                }

                node={

                  child

                }

                path={[

                  ...path,

                  child.slug,

                ]}

                depth={

                  depth + 1

                }

              />

            ),

          )}

        </div>

      ) : null}

    </div>

  );

}



/* =========================================================

   MOBILE CATEGORY

========================================================= */



function MobileCategoryBranch({

  node,

  parentSlugs,

  depth,

  expanded,

  onToggle,

  onNavigate,

}: {

  node:

    HeaderCategory;



  parentSlugs:

    string[];



  depth:

    number;



  expanded:

    Set<string>;



  onToggle: (

    id: string,

  ) => void;



  onNavigate:

    () => void;

}) {

  const currentSlugs = [

    ...parentSlugs,

    node.slug,

  ];



  const hasChildren =

    node.children.length >

    0;



  const open =

    expanded.has(

      node.id,

    );



  return (

    <div

      className="

        border-b

        border-black/10

      "

    >

      <div

        className="

          flex



          min-h-[47px]



          items-center

        "

      >

        <Link

          href={

            categoryHref(

              currentSlugs,

            )

          }

          onClick={

            onNavigate

          }

          className="

            min-w-0

            flex-1



            py-3

            pr-2



            text-[11px]

            font-medium



            text-black

          "

          style={{

            paddingLeft:

              `${

                14 +

                depth * 13

              }px`,

          }}

        >

          {node.name}

        </Link>



        {hasChildren ? (

          <button

            type="button"

            aria-label={`Open ${node.name}`}

            onClick={() =>

              onToggle(

                node.id,

              )

            }

            className="

              flex



              h-[47px]

              w-11



              shrink-0



              items-center

              justify-center



              text-[18px]

            "

          >

            <span

              className={`

                transition-transform

                duration-200



                ${

                  open

                    ? `

                      rotate-90

                    `

                    : ""

                }

              `}

            >

              ›

            </span>

          </button>

        ) : null}

      </div>



      {hasChildren &&

      open ? (

        <div

          className="

            border-t

            border-[#F2DDE4]



            bg-[#FFF4F7]

          "

        >

          {node.children.map(

            (

              child,

            ) => (

              <MobileCategoryBranch

                key={

                  child.id

                }

                node={

                  child

                }

                parentSlugs={

                  currentSlugs

                }

                depth={

                  depth + 1

                }

                expanded={

                  expanded

                }

                onToggle={

                  onToggle

                }

                onNavigate={

                  onNavigate

                }

              />

            ),

          )}



          <div

            className="

              border-t

              border-[#EFCFD9]



              px-4

              py-3

            "

          >

            <Link

              href={

                categoryHref(

                  currentSlugs,

                )

              }

              onClick={

                onNavigate

              }

              className="

                text-[10px]

                font-bold



                text-[#A31543]



                underline

                underline-offset-2

              "

            >

              View All{" "}

              {node.name}

            </Link>

          </div>

        </div>

      ) : null}

    </div>

  );

}



/* =========================================================

   DESKTOP NORMAL LINK

========================================================= */



function DesktopNavLink({

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

        flex

        h-full



        items-center



        whitespace-nowrap



        text-[12px]

        font-bold



        tracking-[0.01em]



        text-[#FF7900]



        transition-colors



        hover:text-[#FFAA57]



        2xl:text-[13px]

      "

    >

      {children}

    </Link>

  );

}



/* =========================================================

   DESKTOP BUY GET

========================================================= */



function DesktopOfferLink({

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

        flex

        h-full



        items-center



        whitespace-nowrap



        text-[12px]

        font-bold



        tracking-[0.01em]



        text-[#FF7900]



        transition-colors



        hover:text-[#FFAA57]



        2xl:text-[13px]

      "

    >

      {children}

    </Link>

  );

}



/* =========================================================

   MOBILE OFFER

========================================================= */



function MobileOfferLink({

  href,

  children,

  onNavigate,

}: {

  href:

    string;



  children:

    ReactNode;



  onNavigate:

    () => void;

}) {

  return (

    <Link

      href={

        href

      }

      onClick={

        onNavigate

      }

      className="

        flex



        min-h-[48px]



        items-center

        justify-between



        border-b

        border-black/10



        bg-[#211A18]



        px-4

        py-3



        text-[11px]

        font-bold

        uppercase



        tracking-[0.07em]



        text-white

      "

    >

      <span>

        {children}

      </span>



      <span>

        →

      </span>

    </Link>

  );

}



/* =========================================================

   MOBILE QUICK ACTION

========================================================= */



function MobileActionLink({

  href,

  label,

  children,

  onNavigate,

}: {

  href:

    string;



  label:

    string;



  children:

    ReactNode;



  onNavigate:

    () => void;

}) {

  return (

    <Link

      href={

        href

      }

      onClick={

        onNavigate

      }

      className="

        flex



        min-h-[58px]



        flex-col



        items-center

        justify-center



        gap-1



        rounded-[10px]



        bg-[#F8F5F3]



        text-black

      "

    >

      {children}



      <span

        className="

          text-[9px]

          font-medium

        "

      >

        {label}

      </span>

    </Link>

  );

}



/* =========================================================

   COUNT BADGE

========================================================= */



function CountBadge({

  count,

}: {

  count:

    number;

}) {

  return (

    <span

      className="

        absolute



        -right-1

        -top-1



        flex



        h-[17px]

        min-w-[17px]



        items-center

        justify-center



        rounded-full



        bg-[#D91B58]



        px-1



        text-[8px]

        font-bold



        text-white

      "

    >

      {count >

      99

        ? "99+"

        : count}

    </span>

  );

}



/* =========================================================

   ICONS

========================================================= */



function MenuIcon() {

  return (

    <svg

      width="28"

      height="28"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.5"

      strokeLinecap="round"

    >

      <path d="M3 6h18" />

      <path d="M3 12h13" />

      <path d="M3 18h18" />

    </svg>

  );

}



function HeartIcon() {

  return (

    <svg

      width="23"

      height="23"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.7"

      strokeLinecap="round"

      strokeLinejoin="round"

    >

      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />

    </svg>

  );

}



function BagIcon() {

  return (

    <svg

      width="22"

      height="22"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.7"

      strokeLinecap="round"

      strokeLinejoin="round"

    >

      <path d="M5 8h14l-1 13H6L5 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />

    </svg>

  );

}



function UserIcon() {

  return (

    <svg

      width="24"

      height="24"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.5"

      strokeLinecap="round"

    >

      <circle

        cx="12"

        cy="8"

        r="4"

      />



      <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />

    </svg>

  );

}



function SearchIcon() {

  return (

    <svg

      width="22"

      height="22"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.7"

      strokeLinecap="round"

      strokeLinejoin="round"

    >

      <circle

        cx="11"

        cy="11"

        r="7"

      />



      <path d="m20 20-4-4" />

    </svg>

  );

}



function ChevronDown() {

  return (

    <svg

      width="11"

      height="11"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="2"

      strokeLinecap="round"

      strokeLinejoin="round"

    >

      <path d="m6 9 6 6 6-6" />

    </svg>

  );

}