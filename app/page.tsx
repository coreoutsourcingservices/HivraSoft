"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Header from "@/src/components/Header/Header";

import {
  bannerImages,
  favouriteCards,
  everyWomanProducts,
  menWomenProducts,
  styleComfortConfidence,
  findYourFit,
} from "@/src/data/home";


/* =========================================================
   MAIN BANNER SLIDER

   IMPORTANT:
   ALL BANNERS = 1600 x 558 PX
========================================================= */

function BannerSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (bannerImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setActive(
        (current) =>
          (current + 1) % bannerImages.length
      );
    }, 3500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const previous = () => {
    setActive((current) =>
      current === 0
        ? bannerImages.length - 1
        : current - 1
    );
  };

  const next = () => {
    setActive(
      (current) =>
        (current + 1) % bannerImages.length
    );
  };

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#F7F3EF]
      "
      style={{
        aspectRatio: "1600 / 558",
      }}
    >
      {/* BANNERS */}

      {bannerImages.map((slide, index) => (
        <Link
          key={`${slide.image}-${index}`}
          href={slide.redirect || "#"}
          aria-label={slide.alt || `Banner ${index + 1}`}
          className={`
            absolute
            inset-0
            block
            h-full
            w-full
            transition-transform
            duration-1000
            ease-[cubic-bezier(.22,1,.36,1)]

            ${
              active === index
                ? "translate-x-0"
                : index < active
                  ? "-translate-x-full"
                  : "translate-x-full"
            }
          `}
        >
          <img
            src={slide.image}
            alt={slide.alt || `Hivra Soft banner ${index + 1}`}
            className="
              block
              h-full
              w-full
              object-cover
              object-center
            "
          />
        </Link>
      ))}

      {/* PREVIOUS */}

      {bannerImages.length > 1 && (
        <button
          type="button"
          aria-label="Previous banner"
          onClick={previous}
          className="
            absolute
            left-3
            top-1/2
            z-30
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/85
            text-[22px]
            text-[#211A18]
            shadow-lg
            backdrop-blur-md
            transition
            duration-300
            hover:scale-110
            hover:bg-white

            sm:left-5
            sm:h-11
            sm:w-11
            sm:text-2xl
          "
        >
          ‹
        </button>
      )}

      {/* NEXT */}

      {bannerImages.length > 1 && (
        <button
          type="button"
          aria-label="Next banner"
          onClick={next}
          className="
            absolute
            right-3
            top-1/2
            z-30
            flex
            h-9
            w-9
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/85
            text-[22px]
            text-[#211A18]
            shadow-lg
            backdrop-blur-md
            transition
            duration-300
            hover:scale-110
            hover:bg-white

            sm:right-5
            sm:h-11
            sm:w-11
            sm:text-2xl
          "
        >
          ›
        </button>
      )}

      {/* DOTS */}

      {bannerImages.length > 1 && (
        <div
          className="
            absolute
            bottom-2
            left-1/2
            z-30
            flex
            -translate-x-1/2
            items-center
            gap-2
            sm:bottom-4
          "
        >
          {bannerImages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Banner ${index + 1}`}
              onClick={() => setActive(index)}
              className={`
                h-[5px]
                rounded-full
                transition-all
                duration-300

                ${
                  active === index
                    ? "w-8 bg-[#8C1839]"
                    : "w-[5px] bg-white/90"
                }
              `}
            />
          ))}
        </div>
      )}
    </section>
  );
}


/* =========================================================
   FAVOURITE CARD
========================================================= */

function FavouriteCard({
  card,
  delay = 0,
}: { card: (typeof favouriteCards)[number]; delay?: number }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!card?.slides?.length || card.slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive(
        (current) =>
          (current + 1) % card.slides.length
      );
    }, 3800 + delay);

    return () => {
      window.clearInterval(timer);
    };
  }, [card, delay]);

  if (!card?.slides?.length) {
    return null;
  }

  return (
    <div
      data-reveal
      className="
        group
        relative
        h-[480px]
        overflow-hidden
        bg-[#EADFD5]
        md:h-[610px]
        lg:h-[660px]
      "
    >
      {card.slides.map((slide, index) => (
        <Link
          key={`${slide.image}-${index}`}
          href={slide.redirect || "#"}
          className={`
            absolute
            inset-0
            block
            transition-all
            duration-1000
            ease-[cubic-bezier(.22,1,.36,1)]

            ${
              active === index
                ? "translate-x-0 opacity-100"
                : index < active
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
            }
          `}
        >
          <img
            src={slide.image}
            alt={`${card.name} ${index + 1}`}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-[1600ms]
              ease-out
              group-hover:scale-105
            "
          />
        </Link>
      ))}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-10
          bg-gradient-to-t
          from-black/70
          via-black/10
          to-transparent
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-7
          left-7
          z-20
        "
      >
        <p
          className="
            mb-3
            text-[8px]
            uppercase
            tracking-[0.3em]
            text-white/65
          "
        >
          Hivra Soft
        </p>

        <h3
          className="
            text-[30px]
            font-medium
            tracking-[-0.04em]
            text-white
            md:text-[42px]
          "
        >
          {card.name}
        </h3>
      </div>

      <div
        className="
          absolute
          bottom-7
          right-7
          z-30
          flex
          gap-1
        "
      >
        {card.slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`${card.name} slide ${index + 1}`}
            onClick={() => setActive(index)}
            className={`
              h-[3px]
              transition-all
              duration-300

              ${
                active === index
                  ? "w-9 bg-white"
                  : "w-5 bg-white/35"
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
}: { product: (typeof everyWomanProducts)[number] }) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const showSecond = hovered || clicked;

  const productUrl =
    `/product/${product.slug}/`;

  return (
    <article
      data-product-card
      className="
        group
        overflow-hidden
        rounded-[18px]
        border
        border-[#211A18]/10
        bg-white
        shadow-[0_10px_35px_rgba(33,26,24,0.04)]
        transition-all
        duration-500
        hover:-translate-y-2
        hover:shadow-[0_24px_60px_rgba(33,26,24,0.12)]
      "
    >
      {/* PRODUCT IMAGE */}

      <div
        className="
          relative
          aspect-[4/5]
          cursor-pointer
          overflow-hidden
          bg-[#EFE6DC]
        "
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() =>
          setClicked((value) => !value)
        }
      >
        {/* FIRST IMAGE */}

        <img
          src={product.image1}
          alt={product.name}
          className={`
            absolute
            inset-0
            h-full
            w-full
            object-cover
            transition-all
            duration-700
            ease-out

            ${
              showSecond
                ? "scale-105 opacity-0"
                : "scale-100 opacity-100"
            }
          `}
        />

        {/* SECOND IMAGE */}

        <img
          src={product.image2 || product.image1}
          alt={`${product.name} alternate view`}
          className={`
            absolute
            inset-0
            h-full
            w-full
            object-cover
            transition-all
            duration-700
            ease-out

            ${
              showSecond
                ? "scale-100 opacity-100"
                : "scale-105 opacity-0"
            }
          `}
        />

        {/* WISHLIST */}

        <span
          className="
            absolute
            right-3
            top-3
            z-20
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white/90
            text-[18px]
            text-[#8C1839]
            shadow-sm
          "
        >
          ♡
        </span>

        {/* HOVER HINT */}

        <span
          className="
            absolute
            bottom-3
            left-1/2
            z-20
            -translate-x-1/2
            whitespace-nowrap
            rounded-full
            bg-[#211A18]/80
            px-4
            py-2
            text-[7px]
            uppercase
            tracking-[0.15em]
            text-white
            opacity-0
            backdrop-blur-md
            transition-opacity
            duration-300
            group-hover:opacity-100
          "
        >
          Hover / Tap
        </span>
      </div>

      {/* PRODUCT DETAILS */}

      <div className="p-4">
        <p
          className="
            mb-2
            text-[8px]
            uppercase
            tracking-[0.22em]
            text-[#9C765D]
          "
        >
          Hivra Soft
        </p>

        <Link
          href={productUrl}
          className="
            block
            min-h-[44px]
            text-[13px]
            font-medium
            leading-5
            text-[#211A18]
            transition-colors
            duration-300
            hover:text-[#8C1839]
          "
        >
          {product.name}
        </Link>

        <div
          className="
            mt-3
            flex
            items-center
            gap-2
          "
        >
          {/* DISCOUNTED PRICE */}

          <span
            className="
              text-[15px]
              font-bold
              text-[#8C1839]
            "
          >
            ₹{product.discountedPrice}
          </span>

          {/* ACTUAL PRICE */}

          <span
            className="
              text-[11px]
              text-black/35
              line-through
            "
          >
            ₹{product.actualPrice}
          </span>
        </div>

        <Link
          href={productUrl}
          className="
            mt-4
            flex
            w-full
            items-center
            justify-center
            rounded-full
            bg-[#F2E9E2]
            px-4
            py-3
            text-[8px]
            font-semibold
            uppercase
            tracking-[0.17em]
            text-[#211A18]
            transition-all
            duration-300
            hover:bg-[#211A18]
            hover:text-white
          "
        >
          View Product
        </Link>
      </div>
    </article>
  );
}


/* =========================================================
   PRODUCT SECTION
========================================================= */

function ProductSection({
  eyebrow,
  title,
  accent,
  products,
  alternate = false,
}: { eyebrow: string; title: string; accent: string; products: typeof everyWomanProducts; alternate?: boolean }) {
  return (
    <section
      className={`
        px-4
        py-20
        md:px-6
        lg:px-8

        ${
          alternate
            ? "bg-[#F1E9E2]"
            : "bg-[#F7F3EF]"
        }
      `}
    >
      <div
        className="
          mx-auto
          max-w-[1450px]
        "
      >
        {/* TITLE */}

        <div
          data-reveal
          className="
            mb-10
            flex
            flex-col
            gap-5
            border-b
            border-[#211A18]/10
            pb-6
            md:flex-row
            md:items-end
            md:justify-between
          "
        >
          <div>
            <p
              className="
                mb-3
                text-[8px]
                uppercase
                tracking-[0.4em]
                text-[#9C765D]
              "
            >
              {eyebrow}
            </p>

            <h2
              className="
                text-[36px]
                font-medium
                leading-[0.95]
                tracking-[-0.045em]
                md:text-[54px]
              "
            >
              {title}

              <span
                className="
                  font-serif
                  font-normal
                  italic
                  text-[#8C1839]
                "
              >
                {" "}
                {accent}
              </span>
            </h2>
          </div>

          <div
            className="
              h-[3px]
              w-[75px]
              bg-[#8C1839]
            "
          />
        </div>

        {/* PRODUCTS */}

        <div
          className="
            grid
            grid-cols-2
            gap-4
            md:grid-cols-4
          "
        >
          {products.map((product) => (
            <ProductCard
              key={`${product.slug}-${product.name}`}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   STYLE, COMFORT & CONFIDENCE
========================================================= */

function StyleConfidence() {
  return (
    <section
      className="
        bg-[#F7F3EF]
        px-4
        py-20
        md:px-6
        lg:px-8
      "
    >
      <div className="mx-auto max-w-[1450px]">
        <div
          data-reveal
          className="
            mb-10
            border-b
            border-[#211A18]/10
            pb-6
          "
        >
          <p
            className="
              mb-3
              text-[8px]
              uppercase
              tracking-[0.4em]
              text-[#9C765D]
            "
          >
            Shop the mood
          </p>

          <h2
            className="
              text-[38px]
              font-medium
              tracking-[-0.05em]
              md:text-[58px]
            "
          >
            Style, comfort &

            <span
              className="
                font-serif
                font-normal
                italic
                text-[#8C1839]
              "
            >
              {" "}
              confidence.
            </span>
          </h2>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-3
          "
        >
          {styleComfortConfidence.map((item) => (
            <Link
              key={item.name}
              href={item.redirect || "#"}
              data-reveal
              className="
                group
                relative
                aspect-[4/3]
                overflow-hidden
              "
            >
              <img
                src={item.image}
                alt={item.name}
                className="
                  h-full
                  w-full
                  object-cover
                  transition-transform
                  duration-[1200ms]
                  ease-out
                  group-hover:scale-110
                "
              />

              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-t
                  from-black/70
                  via-transparent
                  to-transparent
                "
              />

              <div
                className="
                  absolute
                  bottom-6
                  left-6
                  z-10
                "
              >
                <h3
                  className="
                    text-[27px]
                    text-white
                    md:text-[31px]
                  "
                >
                  {item.name}
                </h3>

                <span
                  className="
                    mt-4
                    inline-flex
                    rounded-full
                    bg-white
                    px-5
                    py-2
                    text-[8px]
                    uppercase
                    tracking-[0.18em]
                    text-[#211A18]
                  "
                >
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   FIND YOUR FIT CARD
========================================================= */

function FitCard({
  card,
  delay = 0,
}: { card: (typeof findYourFit)[number]; delay?: number }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!card?.images?.length || card.images.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive(
        (current) =>
          (current + 1) % card.images.length
      );
    }, 2700 + delay);

    return () => {
      window.clearInterval(timer);
    };
  }, [card, delay]);

  if (!card?.images?.length) {
    return null;
  }

  return (
    <div
      data-fit-card
      className="
        group
        relative
        h-[500px]
        overflow-hidden
        border
        border-white/15
        bg-[#291B18]
        md:h-[570px]
        xl:h-[620px]
      "
    >
      {/* IMAGE SLIDES */}

      {card.images.map((slide, index) => (
        <Link
          key={`${slide.image}-${index}`}
          href={slide.redirect || "#"}
          className={`
            absolute
            inset-0
            block
            transition-all
            duration-1000
            ease-[cubic-bezier(.22,1,.36,1)]

            ${
              active === index
                ? "translate-y-0 opacity-100"
                : index < active
                  ? "-translate-y-full opacity-0"
                  : "translate-y-full opacity-0"
            }
          `}
        >
          <img
            src={slide.image}
            alt={`${card.name} ${index + 1}`}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-[1800ms]
              ease-out
              group-hover:scale-105
            "
          />
        </Link>
      ))}

      {/* OVERLAY */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-10
          bg-gradient-to-t
          from-[#140B09]
          via-transparent
          to-black/5
        "
      />

      {/* COUNTER */}

      <div
        className="
          pointer-events-none
          absolute
          right-5
          top-5
          z-20
          text-[8px]
          uppercase
          tracking-[0.25em]
          text-white/55
        "
      >
        0{active + 1} / 0{card.images.length}
      </div>

      {/* TITLE */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-0
          right-0
          z-20
          p-7
        "
      >
        <p
          className="
            mb-3
            text-[8px]
            uppercase
            tracking-[0.3em]
            text-[#D8BDAE]
          "
        >
          Explore
        </p>

        <div
          className="
            flex
            items-end
            justify-between
          "
        >
          <h3
            className="
              text-[31px]
              font-medium
              tracking-[-0.04em]
              text-white
              md:text-[35px]
            "
          >
            {card.name}
          </h3>

          <span
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-white/30
              text-xl
              text-white
            "
          >
            →
          </span>
        </div>

        {/* PROGRESS */}

        <div
          className="
            mt-6
            flex
            gap-1
          "
        >
          {card.images.map((_, index) => (
            <span
              key={index}
              className={`
                h-[2px]
                flex-1
                transition-colors
                duration-300

                ${
                  active === index
                    ? "bg-white"
                    : "bg-white/25"
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   FIND YOUR FIT
========================================================= */

function FindYourFit() {
  return (
    <section
      id="find-your-fit"
      className="
        overflow-hidden
        bg-[#1D1311]
        px-5
        py-28
        text-[#F7F3EF]
        md:px-8
        md:py-32
      "
    >
      <div className="mx-auto max-w-[1500px]">
        {/* HEADING */}

        <div
          className="
            mb-16
            flex
            flex-col
            gap-8
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div>
            <p
              className="
                mb-5
                text-[8px]
                uppercase
                tracking-[0.5em]
                text-[#C5A997]
              "
            >
              Discover
            </p>

            <h2
              className="
                text-[52px]
                font-medium
                leading-[0.9]
                tracking-[-0.06em]
                md:text-[78px]
                lg:text-[92px]
              "
            >
              Find your

              <span
                className="
                  font-serif
                  font-normal
                  italic
                  text-[#E6D2C5]
                "
              >
                {" "}
                fit.
              </span>
            </h2>
          </div>

          <p
            className="
              max-w-[390px]
              text-[13px]
              leading-7
              text-white/50
            "
          >
            From everyday essentials to fresh styles,
            discover collections designed around comfort,
            confidence and you.
          </p>
        </div>

        {/* CARDS */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {findYourFit.map((card, index) => (
            <FitCard
              key={card.name}
              card={card}
              delay={index * 220}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   HOMEPAGE
========================================================= */

export default function HomePage() {
  const mainRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const main = mainRef.current;

    if (!main) {
      return;
    }

    const ctx = gsap.context(() => {
      /* GENERAL REVEALS */

      const reveals =
        gsap.utils.toArray<HTMLElement>("[data-reveal]");

      reveals.forEach((element) => {
        gsap.fromTo(
          element,
          {
            y: 55,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",

            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          }
        );
      });

      /* PRODUCTS */

      ScrollTrigger.batch(
        "[data-product-card]",
        {
          start: "top 92%",
          once: true,

          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              {
                y: 45,
                opacity: 0,
                scale: 0.985,
              },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.75,
                stagger: 0.08,
                ease: "power3.out",
              }
            );
          },
        }
      );

      /* FIND YOUR FIT */

      const fitCards =
        gsap.utils.toArray("[data-fit-card]");

      if (fitCards.length) {
        gsap.fromTo(
          fitCards,
          {
            y: 100,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 1,
            ease: "power4.out",

            scrollTrigger: {
              trigger: "#find-your-fit",
              start: "top 78%",
              once: true,
            },
          }
        );
      }
    }, main);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <>
      {/* HEADER */}

      <Header />

      <main
        ref={mainRef}
        className="
          min-h-screen
          bg-[#F7F3EF]
          text-[#211A18]
        "
      >
        {/* =================================================
            MAIN BANNER — EXACT 1600:558 RATIO
        ================================================= */}

        <BannerSlider />

        {/* =================================================
            YOUR FAVOURITES
        ================================================= */}

        <section
          className="
            px-5
            pb-10
            pt-20
            text-center
            md:pt-24
          "
        >
          <div data-reveal>
            <p
              className="
                mb-4
                text-[8px]
                uppercase
                tracking-[0.45em]
                text-[#9C765D]
              "
            >
              Curated for you
            </p>

            <h1
              className="
                text-[38px]
                font-medium
                uppercase
                leading-[0.95]
                tracking-[-0.04em]
                md:text-[58px]
                lg:text-[66px]
              "
            >
              Your favourites for a

              <span className="text-[#8C1839]">
                {" "}
                limited time!
              </span>
            </h1>
          </div>
        </section>

        <section
          className="
            px-4
            pb-24
            md:px-6
            lg:px-8
          "
        >
          <div
            className="
              mx-auto
              grid
              max-w-[1450px]
              grid-cols-1
              gap-5
              md:grid-cols-2
            "
          >
            {favouriteCards.map((card, index) => (
              <FavouriteCard
                key={card.name}
                card={card}
                delay={index * 300}
              />
            ))}
          </div>
        </section>

        {/* =================================================
            INNERWEAR ONLINE FOR EVERY WOMAN
        ================================================= */}

        <ProductSection
          eyebrow="Women's essentials"
          title="Innerwear online for"
          accent="every woman."
          products={everyWomanProducts}
        />

        {/* =================================================
            NEW INNERWEAR FOR MEN & WOMEN
        ================================================= */}

        <ProductSection
          eyebrow="Fresh selections"
          title="New innerwear for"
          accent="men & women."
          products={menWomenProducts}
          alternate
        />

        {/* =================================================
            STYLE, COMFORT & CONFIDENCE
        ================================================= */}

        <StyleConfidence />

        {/* =================================================
            FIND YOUR FIT
        ================================================= */}

        <FindYourFit />

        {/* =================================================
            LAST OFFER
        ================================================= */}

        <section
          className="
            flex
            min-h-[65vh]
            items-center
            justify-center
            bg-[#EDE1D7]
            px-6
            py-24
          "
        >
          <div
            data-reveal
            className="
              max-w-[1000px]
              text-center
            "
          >
            <p
              className="
                mb-5
                text-[8px]
                uppercase
                tracking-[0.5em]
                text-[#9C765D]
              "
            >
              Hivra Soft
            </p>

            <h2
              className="
                text-[50px]
                font-medium
                leading-[0.9]
                tracking-[-0.055em]
                md:text-[78px]
                lg:text-[100px]
              "
            >
              More comfort.

              <br />

              <span
                className="
                  font-serif
                  font-normal
                  italic
                  text-[#8C1839]
                "
              >
                More for you.
              </span>
            </h2>

            <div
              className="
                mt-10
                flex
                flex-wrap
                justify-center
                gap-4
              "
            >
              <Link
                href="/bundle-pricing"
                className="
                  rounded-full
                  bg-[#211A18]
                  px-8
                  py-4
                  text-[9px]
                  uppercase
                  tracking-[0.2em]
                  text-white
                  transition
                  hover:bg-[#8C1839]
                "
              >
                Bundle Pricing
              </Link>

              <Link
                href="/buy-3-get-1-free"
                className="
                  rounded-full
                  border
                  border-[#211A18]/30
                  px-8
                  py-4
                  text-[9px]
                  uppercase
                  tracking-[0.2em]
                  transition
                  hover:bg-[#211A18]
                  hover:text-white
                "
              >
                Buy 3 Get 1 Free
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}