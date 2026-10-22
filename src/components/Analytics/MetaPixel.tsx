
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { META_PIXEL_ID, META_PIXEL_ENABLED, flushMetaEvents, trackMetaEvent } from "@/lib/meta-pixel";

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

const VALID_PIXEL_ID = /^\d{10,20}$/.test(META_PIXEL_ID);

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

    trackMetaEvent("PageView");
  }, [pathname]);

  useEffect(() => {
    const onContact = (event: MouseEvent) => {
      const target = event.target;
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link) return;
      const url = new URL(link.getAttribute("href") || "", window.location.href);
      const channel = url.protocol === "tel:" ? "phone" : url.protocol === "mailto:" ? "email" : ["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname) ? "whatsapp" : null;
      if (channel) trackMetaEvent("Contact", { content_name: channel });
    };
    document.addEventListener("click", onContact);
    return () => document.removeEventListener("click", onContact);
  }, []);

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
        onReady={flushMetaEvents}
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

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
