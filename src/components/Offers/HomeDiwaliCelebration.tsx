"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { DIWALI_OFFER_CONFIG as campaign } from "@/lib/diwali-offer-config";
import styles from "./HomeDiwaliCelebration.module.css";

// One finite celebration alongside the existing homepage welcome popup.
// Staggered particle lifetimes all end before the overlay is removed.
export default function HomeDiwaliCelebration({ ready = false }: { ready?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready || !campaign.enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let started = false;
    let start = 0;
    let finish = 0;
    // The root homepage loader sits at z-index 99999 and can outlast this
    // whole celebration. Wait for its existing greeting nodes to unmount.
    function startWhenVisible() {
      if (started || document.visibilityState !== "visible" || document.querySelector("[data-loader-greeting]")) return;
      started = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", startWhenVisible);
      start = window.requestAnimationFrame(() => {
        setVisible(true);
        finish = window.setTimeout(() => setVisible(false), campaign.homepageCelebrationDurationMs + campaign.homepageFadeOutDurationMs);
      });
    }
    const observer = new MutationObserver(startWhenVisible);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", startWhenVisible);
    startWhenVisible();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", startWhenVisible);
      window.cancelAnimationFrame(start);
      window.clearTimeout(finish);
    };
  }, [ready]);

  if (!visible) return null;
  const seconds = campaign.homepageCelebrationDurationMs / 1000;
  const fadeSeconds = campaign.homepageFadeOutDurationMs / 1000;

  return createPortal(
    <div className={styles.overlay} data-home-diwali-celebration aria-hidden="true">
      {Array.from({ length: campaign.homepageCoinCount }, (_, index) => (
        <span key={`coin-${index}`} className={styles.coin} style={{
          left: `${(index * 37 + 3) % 100}%`,
          "--delay": `${seconds * index / Math.max(1, campaign.homepageCoinCount - 1)}s`,
          "--duration": `${fadeSeconds * (.7 + (index % 7) * .05)}s`,
          "--drift": `${((index % 7) - 3) * 24}px`,
        } as CSSProperties}>
          <span className={styles.face}>₹</span>
        </span>
      ))}
      {Array.from({ length: campaign.homepageBurstCount }, (_, index) => (
        <span key={`burst-${index}`} className={`${styles.burst} ${index % 3 === 0 ? styles.spark : ""}`} style={{
          left: index % 2 ? "16%" : "84%",
          top: `${35 + (index % 3) * 15}%`,
          "--delay": `${seconds * index / Math.max(1, campaign.homepageBurstCount - 1)}s`,
          "--duration": `${fadeSeconds * (.65 + (index % 6) * .06)}s`,
          "--burst-x": `${Math.cos(index * 2.4) * (130 + (index % 4) * 35)}px`,
          "--burst-y": `${Math.sin(index * 2.4) * 180 + 45}px`,
          "--color": ["#F9D46A", "#E5A92D", "#FFF5BB", "#B31345"][index % 4],
        } as CSSProperties} />
      ))}
    </div>, document.body,
  );
}
