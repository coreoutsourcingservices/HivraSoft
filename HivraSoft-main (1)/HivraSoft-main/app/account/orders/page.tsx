"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Header from "@/src/components/Header/Header";
import AccountSidebar from "../components/AccountSidebar";
import {
  ArrowRight,
  Heart,
  Package,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

/* =========================================================
   WINDOW WIDTH
========================================================= */
function useWindowWidth() {
  const [width, setWidth] = useState(1440);

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return width;
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

/* =========================================================
   PAGE
========================================================= */
export default function OrdersPage() {
  const width = useWindowWidth();

  const isMobile = width <= 760;
  const isSmallMobile = width <= 480;
  const isTablet = width <= 1023;
  const isCompactDesktop = width <= 1180;
  const isMediumDesktop = width <= 1350;

  /*
   * IMPORTANT:
   * Order API abhi backend me available nahi hai.
   * Isliye yahan koi random / fake order data nahi rakha gaya.
   * API ready hone par totalOrders, totalSpend, averageOrder aur
   * order list ko backend response se fill karna hai.
   */
  const totalOrders = 0;
  const totalSpend = 0;
  const averageOrder = 0;

  /* =======================================================
     LAYOUT
  ======================================================= */
  const pageWrapperStyle: CSSProperties = {
    width: "100%",
    minHeight: "calc(100vh - 105px)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#FDFCFB",
    overflowX: "hidden",
  };

  const layoutStyle: CSSProperties = {
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    flex: 1,
    minHeight: 0,
    alignItems: "start",
    ...(isTablet
      ? { display: "block" }
      : {
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr)",
        }),
  };

  const contentStyle: CSSProperties = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: isMobile
      ? "14px 12px 28px"
      : isTablet
        ? "18px 18px 34px"
        : isMediumDesktop
          ? "18px 20px 40px"
          : "20px 28px 45px",
  };

  /* =======================================================
     HERO
  ======================================================= */
  const heroGridStyle: CSSProperties = {
    width: "100%",
    display: "grid",
    gridTemplateColumns: isCompactDesktop
      ? "1fr"
      : "minmax(0, 1.7fr) minmax(330px, 1fr)",
    gap: "18px",
  };

  const heroStyle: CSSProperties = {
    position: "relative",
    minWidth: 0,
    minHeight: isMobile ? "150px" : "165px",
    padding: isMobile ? "22px 20px" : "25px 30px",
    overflow: "hidden",
    borderRadius: "12px",
    boxSizing: "border-box",
    background: `
      radial-gradient(circle at 84% 28%, rgba(255,255,255,.90) 0 7%, rgba(255,255,255,0) 22%),
      radial-gradient(circle at 94% 80%, rgba(223,154,165,.22) 0 7%, rgba(223,154,165,0) 20%),
      linear-gradient(90deg, #FAEDEB 0%, #FBEFED 54%, #F7E4E5 100%)
    `,
  };

  const breadcrumbStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    fontSize: "10px",
    color: "#796E69",
    letterSpacing: "0.5px",
  };

  const heroTitleStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    margin: "14px 0 0",
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: isMobile ? "37px" : "44px",
    lineHeight: 1,
    fontWeight: 400,
    color: "#292321",
  };

  const heroSubtitleStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    margin: "12px 0 0",
    maxWidth: "430px",
    fontSize: "12px",
    lineHeight: 1.55,
    color: "#6E6662",
  };

  const heroQuoteStyle: CSSProperties = {
    position: "absolute",
    zIndex: 2,
    top: "31px",
    right: "18%",
    fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
    fontSize: "18px",
    lineHeight: 1.12,
    color: "#B76572",
    transform: "rotate(-7deg)",
    display: isMediumDesktop ? "none" : "block",
  };

  /* =======================================================
     SUMMARY
  ======================================================= */
  const summaryStyle: CSSProperties = {
    minWidth: 0,
    minHeight: isMobile ? "auto" : "165px",
    padding: isMobile ? "16px" : "20px",
    boxSizing: "border-box",
    border: "1px solid #EEE8E5",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
  };

  const summaryTopStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  };

  const summaryTitleWrapStyle: CSSProperties = {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "13px",
  };

  const summaryIconStyle: CSSProperties = {
    width: "48px",
    height: "48px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    backgroundColor: "#FCEAEA",
    color: "#C86D72",
  };

  const summaryTitleStyle: CSSProperties = {
    fontFamily: "Georgia, serif",
    fontSize: "17px",
    whiteSpace: "nowrap",
    color: "#292321",
  };

  const summaryStatusStyle: CSSProperties = {
    padding: "8px 13px",
    borderRadius: "8px",
    backgroundColor: "#F9F5F3",
    color: "#8B7773",
    fontSize: "9px",
    whiteSpace: "nowrap",
  };

  const summaryStatsStyle: CSSProperties = {
    marginTop: "22px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  };

  const summaryStatStyle: CSSProperties = {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 8px",
  };

  const summaryValueStyle: CSSProperties = {
    fontFamily: "Georgia, serif",
    fontSize: isMobile ? "15px" : "18px",
    whiteSpace: "nowrap",
    color: "#292321",
  };

  const summaryLabelStyle: CSSProperties = {
    marginTop: "6px",
    fontSize: isMobile ? "8px" : "9px",
    color: "#918986",
    textAlign: "center",
    whiteSpace: isSmallMobile ? "normal" : "nowrap",
  };

  /* =======================================================
     EMPTY STATE
  ======================================================= */
  const emptySectionStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    minHeight: isMobile ? "450px" : "500px",
    marginTop: "18px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: isMobile ? "34px 18px" : "48px 30px",
    border: "1px solid #EEE7E4",
    borderRadius: "12px",
    background: "linear-gradient(180deg, #FFFFFF 0%, #FFFCFB 100%)",
  };

  const emptyContentStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "620px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const emptyArtworkStyle: CSSProperties = {
    position: "relative",
    width: isMobile ? "190px" : "225px",
    height: isMobile ? "165px" : "190px",
    marginBottom: isMobile ? "8px" : "12px",
  };

  const glowStyle: CSSProperties = {
    position: "absolute",
    width: isMobile ? "135px" : "156px",
    height: isMobile ? "135px" : "156px",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -47%)",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(248,202,205,.50) 0%, rgba(248,202,205,.17) 46%, rgba(248,202,205,0) 72%)",
  };

  const packageCardStyle: CSSProperties = {
    position: "absolute",
    width: isMobile ? "105px" : "122px",
    height: isMobile ? "92px" : "108px",
    left: "50%",
    top: "53%",
    transform: "translate(-50%, -50%) rotate(-3deg)",
    display: "grid",
    placeItems: "center",
    borderRadius: "16px",
    border: "1px solid #F0C6CA",
    background: "linear-gradient(145deg, #F8D6D8 0%, #EFAEB6 100%)",
    boxShadow: "0 18px 38px rgba(157, 51, 72, 0.14)",
    color: "#A6163D",
  };

  const tapeStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: "50%",
    width: "26px",
    height: "100%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(255,255,255,0.32)",
  };

  const bubbleStyle: CSSProperties = {
    position: "absolute",
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 9px 24px rgba(176, 64, 82, 0.13)",
    color: "#D85B70",
  };

  const emptyTitleStyle: CSSProperties = {
    margin: 0,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: isMobile ? "27px" : "32px",
    lineHeight: 1.15,
    fontWeight: 400,
    color: "#2E2725",
  };

  const emptyTextStyle: CSSProperties = {
    maxWidth: "430px",
    margin: "12px auto 0",
    fontSize: isMobile ? "12px" : "13px",
    lineHeight: 1.7,
    color: "#7C7470",
  };

  const startShoppingStyle: CSSProperties = {
    minWidth: isSmallMobile ? "100%" : "230px",
    minHeight: "46px",
    marginTop: "24px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "0 22px",
    boxSizing: "border-box",
    border: "1px solid #A90D3B",
    borderRadius: "8px",
    background: "linear-gradient(180deg, #B90C42 0%, #A70939 100%)",
    boxShadow: "0 10px 24px rgba(169, 9, 57, 0.18)",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: 600,
    textDecoration: "none",
  };

  const helperRowStyle: CSSProperties = {
    marginTop: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: isMobile ? "13px" : "20px",
    flexWrap: "wrap",
  };

  const helperItemStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: "#9A8B87",
    fontSize: "10px",
  };

  /* =======================================================
     FOOTER
  ======================================================= */
  const footerStyle: CSSProperties = {
    width: "100%",
    minHeight: "72px",
    marginTop: "auto",
    borderTop: "1px solid #EEE8E5",
    backgroundColor: "#FFFFFF",
    display: isSmallMobile
      ? "none"
      : "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : isCompactDesktop
        ? "repeat(4, minmax(0, 1fr))"
        : "repeat(5, minmax(0, 1fr))",
  };

  const benefitStyle: CSSProperties = {
    minWidth: 0,
    minHeight: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "13px",
    padding: "12px 20px",
    boxSizing: "border-box",
    borderRight: "1px solid #EEE8E5",
    color: "#4F4643",
  };

  const benefitTitleStyle: CSSProperties = {
    display: "block",
    fontFamily: "Georgia, serif",
    fontSize: "10px",
    fontWeight: 400,
    color: "#292321",
  };

  const benefitTextStyle: CSSProperties = {
    display: "block",
    marginTop: "4px",
    fontSize: "8px",
    color: "#A19995",
  };

  const quoteBenefitStyle: CSSProperties = {
    display: isCompactDesktop ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
    fontSize: "19px",
    color: "#765F5B",
  };

  return (
    <>
      <Header />

      <div style={pageWrapperStyle}>
        <main style={layoutStyle}>
          <AccountSidebar />

          <section style={contentStyle}>
            <div style={heroGridStyle}>
              <section style={heroStyle}>
                <div style={breadcrumbStyle}>
                  MY ACCOUNT &gt; Orders
                </div>

                <h1 style={heroTitleStyle}>
                  My Orders
                </h1>

                <p style={heroSubtitleStyle}>
                  Track, manage and relive your favorite finds.
                  Your shopping journey will appear here.
                </p>

                <div style={heroQuoteStyle}>
                  Good
                  <br />
                  Things
                  <br />
                  Take
                  <br />
                  Style ♡
                </div>
              </section>

              <section style={summaryStyle}>
                <div style={summaryTopStyle}>
                  <div style={summaryTitleWrapStyle}>
                    <div style={summaryIconStyle}>
                      <Package size={23} strokeWidth={1.5} />
                    </div>

                    <span style={summaryTitleStyle}>
                      Order Summary
                    </span>
                  </div>

                  <span style={summaryStatusStyle}>
                    No orders yet
                  </span>
                </div>

                <div style={summaryStatsStyle}>
                  <div
                    style={{
                      ...summaryStatStyle,
                      borderRight: "1px solid #ECE7E4",
                    }}
                  >
                    <strong style={summaryValueStyle}>
                      {totalOrders}
                    </strong>
                    <span style={summaryLabelStyle}>
                      Total Orders
                    </span>
                  </div>

                  <div
                    style={{
                      ...summaryStatStyle,
                      borderRight: "1px solid #ECE7E4",
                    }}
                  >
                    <strong style={summaryValueStyle}>
                      {formatPrice(totalSpend)}
                    </strong>
                    <span style={summaryLabelStyle}>
                      Total Spend
                    </span>
                  </div>

                  <div style={summaryStatStyle}>
                    <strong style={summaryValueStyle}>
                      {formatPrice(averageOrder)}
                    </strong>
                    <span style={summaryLabelStyle}>
                      Average Order
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* EMPTY ORDER UI */}
            <section style={emptySectionStyle}>
              <div
                style={{
                  position: "absolute",
                  width: isMobile ? "140px" : "220px",
                  height: isMobile ? "140px" : "220px",
                  left: isMobile ? "-70px" : "-95px",
                  bottom: isMobile ? "-58px" : "-100px",
                  borderRadius: "50%",
                  background: "rgba(244, 214, 210, 0.22)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  width: isMobile ? "115px" : "190px",
                  height: isMobile ? "115px" : "190px",
                  right: isMobile ? "-56px" : "-82px",
                  top: isMobile ? "-45px" : "-80px",
                  borderRadius: "50%",
                  background: "rgba(244, 214, 210, 0.18)",
                }}
              />

              <div style={emptyContentStyle}>
                <div style={emptyArtworkStyle}>
                  <div style={glowStyle} />

                  <div
                    style={{
                      ...bubbleStyle,
                      left: isMobile ? "5px" : "8px",
                      top: isMobile ? "20px" : "24px",
                    }}
                  >
                    <Heart size={19} strokeWidth={1.7} />
                  </div>

                  <div
                    style={{
                      ...bubbleStyle,
                      right: isMobile ? "4px" : "6px",
                      top: isMobile ? "4px" : "10px",
                      width: "34px",
                      height: "34px",
                    }}
                  >
                    <Sparkles size={16} strokeWidth={1.7} />
                  </div>

                  <div style={packageCardStyle}>
                    <div style={tapeStyle} />
                    <Package
                      size={isMobile ? 54 : 62}
                      strokeWidth={1.25}
                    />
                  </div>
                </div>

                <h2 style={emptyTitleStyle}>
                  No orders yet
                </h2>

                <p style={emptyTextStyle}>
                  You haven&apos;t placed any orders yet. Once you
                  shop, your ordered products and delivery status
                  will appear here automatically.
                </p>

                <Link href="/" style={startShoppingStyle}>
                  <ShoppingBag size={17} strokeWidth={1.8} />
                  Start Shopping
                  <ArrowRight size={16} strokeWidth={1.8} />
                </Link>

                <div style={helperRowStyle}>
                  <span style={helperItemStyle}>
                    <ShieldCheck size={14} strokeWidth={1.7} />
                    Secure checkout
                  </span>

                  <span style={helperItemStyle}>
                    <Truck size={14} strokeWidth={1.7} />
                    Easy tracking
                  </span>

                  <span style={helperItemStyle}>
                    <RefreshCcw size={14} strokeWidth={1.7} />
                    Easy returns
                  </span>
                </div>
              </div>
            </section>
          </section>
        </main>

        <footer style={footerStyle}>
          <div style={benefitStyle}>
            <Truck size={25} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Free Shipping
              </strong>
              <span style={benefitTextStyle}>
                on orders above ₹1,499
              </span>
            </div>
          </div>

          <div style={benefitStyle}>
            <RefreshCcw size={24} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Easy Returns
              </strong>
              <span style={benefitTextStyle}>
                Hassle free within 7 days
              </span>
            </div>
          </div>

          <div style={benefitStyle}>
            <ShieldCheck size={25} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Secure Payments
              </strong>
              <span style={benefitTextStyle}>
                Safe and trusted
              </span>
            </div>
          </div>

          <div style={benefitStyle}>
            <Sparkles size={24} strokeWidth={1.4} />
            <div>
              <strong style={benefitTitleStyle}>
                Thoughtfully Made
              </strong>
              <span style={benefitTextStyle}>
                For a kinder tomorrow
              </span>
            </div>
          </div>

          <div style={quoteBenefitStyle}>
            Style a kinder tomorrow ♡
          </div>
        </footer>
      </div>
    </>
  );
}
