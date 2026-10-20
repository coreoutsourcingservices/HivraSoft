"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, ChevronDown, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DIWALI_OFFER_CONFIG as campaign } from "@/lib/diwali-offer-config";
import { getDiwaliProgress, isDiwaliCode, type DiwaliCode } from "@/lib/diwali-offer";
import styles from "./DiwaliOffer.module.css";

type Props = {
  /** Product purchase subtotal, BEFORE GST and delivery. Never cart.total. */
  subtotal: number;
  productIds: string[];
  appliedCode: string;
  paymentMethod?: "online" | "cod";
  onAutoApply?: (code: string) => Promise<void>;
  applying?: boolean;
  compact?: boolean;
};

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function GoldCoin({ small = false }: { small?: boolean }) {
  return <span className={`${styles.coin} ${small ? styles.smallCoin : ""}`} aria-hidden="true"><span>₹</span></span>;
}

function Diya({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 48" fill="none" aria-hidden="true">
      <path d="M23 2c-8 9-9 15-2 21 9-3 11-11 2-21Z" fill="#F6B83E" />
      <path d="M23 11c-4 5-4 8-1 10 4-2 5-5 1-10Z" fill="#FFF7BC" />
      <ellipse cx="22" cy="30" rx="19" ry="5" fill="#F5C453" />
      <path d="M3 30c2 17 36 17 38 0-9 7-29 7-38 0Z" fill="#BE7414" />
      <path d="M8 32c7 6 21 6 28 0" stroke="#FFE58C" strokeWidth="2" />
      <path d="M20 29c0-4 1-6 3-8" stroke="#7F4714" strokeWidth="2" />
    </svg>
  );
}

export default function DiwaliOffer({ subtotal, productIds, appliedCode, paymentMethod, onAutoApply, applying = false, compact = false }: Props) {
  const [codes, setCodes] = useState<DiwaliCode[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const attempted = useRef("");
  const applyRef = useRef(onAutoApply);
  useEffect(() => { applyRef.current = onAutoApply; }, [onAutoApply]);

  useEffect(() => {
    if (!campaign.enabled) return;
    const controller = new AbortController();
    let loading = false;
    async function load() {
      if (loading) return;
      loading = true;
      try {
        const result = await apiFetch<{ codes?: DiwaliCode[] }>("/api/discounts/active", { signal: controller.signal });
        if (!controller.signal.aborted) setCodes(Array.isArray(result.codes) ? result.codes : []);
      } catch {
        if (!controller.signal.aborted) setCodes([]);
      } finally { loading = false; }
    }
    void load();
    const timer = window.setInterval(() => { void load(); }, campaign.refreshIntervalMs);
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const { matched, target, remaining, percentage } = getDiwaliProgress(codes, subtotal, productIds);
  const normalizedCode = appliedCode.trim().toUpperCase();
  // Regular coupons can replace the internal Diwali code without cancelling
  // the automatic subtotal-based lucky draw eligibility.
  const eligible = Boolean(matched) && paymentMethod !== "cod";
  const autoCode = matched?.code ?? "";
  const autoKey = `${autoCode}:${subtotal}:${normalizedCode}`;

  useEffect(() => {
    if (!autoCode || normalizedCode === autoCode.toUpperCase() || applying || !applyRef.current ||
      (normalizedCode && !isDiwaliCode(normalizedCode)) || attempted.current === autoKey) return;
    attempted.current = autoKey;
    void applyRef.current(autoCode);
  }, [autoCode, applying, normalizedCode, autoKey]);

  // Replay on each new slab / requalification, not every render in a slab.
  const celebrationKey = eligible ? matched?._id || matched?.code : "";
  useEffect(() => {
    if (!celebrationKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop = 0;
    const start = window.setTimeout(() => {
      setCelebrating(true);
      stop = window.setTimeout(() => setCelebrating(false), Math.max(5_000, campaign.celebrationDurationMs));
    }, 0);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
      setCelebrating(false);
    };
  }, [celebrationKey]);

  if (!target) return null;
  const cod = paymentMethod === "cod";
  const message = !matched ? `Add ${rupees(remaining)} more to unlock your Gold Coin chance` : cod ? "Please select Pay Online to avail this offer" : paymentMethod === "online" ? "You are eligible for the offer!" : "Your Gold Coin chance is unlocked!";
  const status = !matched ? `${rupees(remaining)} away` : cod ? "Pay online" : "Unlocked";

  return (
    <section className={`${styles.card} ${compact ? styles.compact : ""}`} aria-label={campaign.title}>
      <div className={styles.largeHeading}>
        <div className={styles.coinArt}><span className={styles.starOne}>✦</span><span className={styles.starTwo}>✧</span><GoldCoin /><Diya className={styles.leftDiya} /><Diya className={styles.rightDiya} /></div>
        <div className={styles.headingCopy}>
          <span className={styles.badge}>{campaign.badge}</span>
          <h3>{campaign.title}</h3>
          <p className={matched ? styles.unlockedMessage : ""} aria-live="polite">{message}</p>
        </div>
      </div>
      <button className={styles.compactHeading} type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
        <GoldCoin small /><span>{campaign.title}</span><span className={styles.status}>{status}</span><ChevronDown size={14} className={expanded ? styles.chevronOpen : ""} />
      </button>
      <div className={`${styles.content} ${!expanded ? styles.collapsed : ""}`}>
        <p className={`${styles.compactMessage} ${matched ? styles.unlockedMessage : ""}`} aria-live="polite">{message}</p>
        <div className={styles.progress} role="progressbar" aria-label="Diwali purchase subtotal progress" aria-valuenow={Math.round(percentage)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${rupees(subtotal)} of ${rupees(target.minAmount)} before GST and delivery`}>
          <span style={{ width: `${percentage}%` }} />
        </div>
        <div className={styles.amounts}><strong>{rupees(subtotal)} / {rupees(target.minAmount)}</strong><span>{matched ? <><Check size={13} /> Slab unlocked</> : `${rupees(remaining)} more to go`}</span></div>
        {matched ? (
          <p className={styles.paymentNote}>{cod ? "Choose UPI, card, net banking or wallet at checkout." : `Complete online payment for a chance to win ${campaign.prize}.`}</p>
        ) : (
          <Link className={styles.shopButton} href={campaign.shopHref}><ShoppingBag size={17} /><span>Shop More</span><ArrowRight size={17} /></Link>
        )}
        <div className={styles.footer}><ShieldCheck size={11} /><span>Online payment only</span><span className={styles.dot}>·</span><span>Valid for a limited time</span></div>
        <p className={styles.finePrint}>Lucky draw prize. Purchase subtotal excludes GST & delivery.</p>
      </div>
      <Diya className={styles.cornerDiya} />
      {celebrating && createPortal(
        <div className={styles.celebration}>
          <div className={styles.celebrationToast} role="status"><GoldCoin small /><div><strong>Diwali offer unlocked!</strong><span>Pay online for your Gold Coin lucky draw chance</span></div><Sparkles size={20} /></div>
          <div aria-hidden="true">
            {Array.from({ length: campaign.coinCount }, (_, index) => (
              <span key={`coin-${index}`} className={styles.rainCoin} style={{ left: `${(index * 37 + 3) % 100}%`, "--delay": `${(index % 12) * 0.14}s`, "--duration": `${1.8 + (index % 5) * 0.17}s`, "--drift": `${((index % 7) - 3) * 22}px` } as CSSProperties}><GoldCoin small /></span>
            ))}
            {Array.from({ length: campaign.confettiCount }, (_, index) => (
              <span key={`burst-${index}`} className={styles.confetti} style={{ left: index % 2 ? "12%" : "88%", "--delay": `${(index % 6) * 0.21}s`, "--burst-x": `${Math.cos(index * 2.4) * 280}px`, "--burst-y": `${-100 - Math.abs(Math.sin(index * 2.4)) * 320}px`, "--confetti-color": ["#DCA62E", "#B31345", "#F3CA67", "#FFF1A6"][index % 4] } as CSSProperties} />
            ))}
          </div>
        </div>, document.body,
      )}
    </section>
  );
}
