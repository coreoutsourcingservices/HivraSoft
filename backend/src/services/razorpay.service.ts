import crypto from "crypto";

const API_BASE = "https://api.razorpay.com/v1";

function credentials() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return { keyId, keySecret };
}

function basicAuth(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export type RazorpayOrderResponse = {
  id: string;
  entity?: string;
  amount: number;
  amount_paid?: number;
  amount_due?: number;
  currency: string;
  receipt?: string;
  status?: string;
};

export async function createRazorpayGatewayOrder(input: {
  amountInRupees: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const { keyId, keySecret } = credentials();
  const amount = Math.round(Number(input.amountInRupees || 0) * 100);
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw new Error("Razorpay amount must be at least INR 1.00.");
  }

  const response = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(keyId, keySecret),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: String(input.receipt || "").slice(0, 40),
      notes: input.notes || {},
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok || !payload?.id) {
    const message = String(payload?.error?.description || payload?.error?.reason || "Unable to create Razorpay order.");
    throw new Error(message);
  }

  return { gatewayOrder: payload as RazorpayOrderResponse, keyId };
}

export function verifyRazorpayPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { keySecret } = credentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  const actual = String(input.razorpaySignature || "").trim();
  if (!actual || actual.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string) {
  const secret = String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = String(signature || "").trim();
  if (!actual || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
