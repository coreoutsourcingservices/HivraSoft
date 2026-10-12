"use client";

import { useEffect, useRef, useState } from "react";

type Props = { title: string; src: string; contentSelector?: string };

/** Keep the storefront footer below the *entire* embedded campaign, including its form. */
export default function AutoHeightCampaignFrame({ title, src, contentSelector }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(6500);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;
    let mutation: MutationObserver | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    let resizeTimer = 0;

    function measure() {
      const doc = iframe?.contentDocument;
      if (!iframe || !doc?.body || !doc.documentElement) return;
      const root = contentSelector ? doc.querySelector<HTMLElement>(contentSelector) : null;
      // The iframe viewport itself affects documentElement.scrollHeight. Measure
      // the actual rendered content bottom instead of using that value alone.
      const contentBottom = root
        ? root.getBoundingClientRect().bottom + (doc.defaultView?.scrollY || 0)
        : Math.max(0, ...Array.from(doc.body.children).map((el) =>
            el.getBoundingClientRect().bottom + (doc.defaultView?.scrollY || 0)
          ));
      const next = Math.ceil(contentBottom + 24);
      if (next > 100) setHeight((old) => Math.abs(old - next) > 3 ? next : old);
    }

    function onLoad() {
      observer?.disconnect();
      mutation?.disconnect();
      const doc = iframe?.contentDocument;
      if (!doc?.body) return;
      measure();
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(measure);
        observer.observe(doc.body);
        const root = contentSelector ? doc.querySelector(contentSelector) : null;
        if (root) observer.observe(root);
      }
      mutation = new MutationObserver(measure);
      mutation.observe(doc.body, { childList: true, subtree: true });
      interval = setInterval(measure, 1200); // fonts/images and responsive changes
    }
    const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(measure, 120); };
    iframe.addEventListener("load", onLoad);
    window.addEventListener("resize", onResize);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      observer?.disconnect(); mutation?.disconnect();
      if (interval) clearInterval(interval);
    };
  }, [src, contentSelector]);

  return <iframe ref={ref} title={title} src={src} scrolling="no" style={{ width: "100%", height, border: 0, display: "block", overflow: "hidden" }} />;
}
