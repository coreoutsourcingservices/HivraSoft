
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/* =========================================================
   HIVRASOFT META PIXEL

   Existing Meta Pixel reuse.

   WordPress website:
   hivrasoft.com

   New Next.js website:
   hivrasoft.zyovra.com

   Future:
   hivrasoft.com

   IMPORTANT:
   Do not create a second Meta Pixel.
========================================================= */

const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

const META_PIXEL_ENABLED =
  process.env.NEXT_PUBLIC_META_PIXEL_ENABLED === "true";

/* =========================================================
   VALIDATE PIXEL ID
========================================================= */

const VALID_PIXEL_ID =
  /^\d{10,20}$/.test(META_PIXEL_ID);

/* =========================================================
   META PIXEL WINDOW TYPE
========================================================= */

type MetaPixelFunction = (
  action: string,
  eventName: string,
  parameters?: Record<string, unknown>
) => void;

type MetaPixelWindow = Window & {
  fbq?: MetaPixelFunction;
};

/* =========================================================
   NEXT.JS CLIENT ROUTE TRACKING

   Initial PageView is sent by the Pixel base script.

   When Next.js changes pathname without a full reload,
   send another PageView.

   Avoid duplicate initial PageView.
========================================================= */

function MetaPixelRouteTracker() {
  const pathname = usePathname();

  const previousPathname =
    useRef<string | null>(pathname);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;

    const metaWindow =
      window as MetaPixelWindow;

    if (typeof metaWindow.fbq === "function") {
      metaWindow.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}

/* =========================================================
   MAIN META PIXEL COMPONENT
========================================================= */

export default function MetaPixel() {
  if (!META_PIXEL_ENABLED || !VALID_PIXEL_ID) {
    return null;
  }

  return (
    <>
      {/* ===================================================
          META PIXEL BASE SCRIPT

          Initializes existing Pixel.

          Sends initial PageView once.

          Loaded after hydration.
      =================================================== */}

      <Script
        id="hivrasoft-meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s) {
              if(f.fbq) return;

              n=f.fbq=function() {
                n.callMethod
                  ? n.callMethod.apply(n,arguments)
                  : n.queue.push(arguments);
              };

              if(!f._fbq) f._fbq=n;

              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];

              t=b.createElement(e);
              t.async=!0;
              t.src=v;

              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s);

            }(
              window,
              document,
              'script',
              'https://connect.facebook.net/en_US/fbevents.js'
            );

            fbq('init', '${META_PIXEL_ID}');

            fbq('track', 'PageView');
          `,
        }}
      />

      {/* ===================================================
          CLIENT-SIDE PAGEVIEW TRACKING
      =================================================== */}

      <MetaPixelRouteTracker />
    </>
  );
}
