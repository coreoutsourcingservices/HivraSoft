const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const LOAD_TIMEOUT_MS = 20_000;

let pendingLoad: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (pendingLoad) return pendingLoad;

  pendingLoad = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT}"]`,
    );
    const script = existing ?? document.createElement("script");
    let settled = false;

    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      // Failed script tags never emit another load event. Remove them so retry
      // can make a fresh request instead of waiting forever on the old tag.
      if (!loaded) script.remove();
      resolve(loaded);
    };
    const onLoad = () => finish(Boolean(window.Razorpay));
    const onError = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), LOAD_TIMEOUT_MS);

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = CHECKOUT_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
  }).finally(() => {
    pendingLoad = null;
  });

  return pendingLoad;
}

export function razorpayFailureMessage(response: unknown): string {
  if (response && typeof response === "object" && "error" in response) {
    const error = response.error;
    if (error && typeof error === "object" && "description" in error) {
      if (typeof error.description === "string" && error.description.trim()) {
        return error.description.trim();
      }
    }
  }
  return "Payment failed. Please try again.";
}
