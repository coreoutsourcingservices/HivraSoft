/** Admin-friendly payment labels. A gateway payment cannot be called Failed
 * unless a real payment attempt has failed; COD is unpaid until collected. */
export function adminPaymentStatus(order: Record<string, unknown>) {
  const status = String(order.paymentStatus || "pending").trim().toLowerCase();
  const method = String(order.paymentMethod || "").trim().toLowerCase();
  if (status === "paid" || status === "success" || status === "captured") {
    return { label: "Successful", className: "border-green-200 bg-green-50 text-green-700", hint: "Payment received and confirmed.", canSync: false };
  }
  if (status === "failed") {
    return { label: "Failed", className: "border-red-200 bg-red-50 text-red-700", hint: "Payment attempt failed.", canSync: method === "razorpay" };
  }
  if (status === "refunded") {
    return { label: "Refunded", className: "border-gray-200 bg-gray-50 text-gray-700", hint: "Payment was refunded.", canSync: false };
  }
  if (method === "cod") {
    return { label: "Pay on Delivery", className: "border-amber-200 bg-amber-50 text-amber-800", hint: "COD payment has not been collected yet. Not a failed payment.", canSync: false };
  }
  return { label: "Not Completed", className: "border-amber-200 bg-amber-50 text-amber-800", hint: "Gateway payment is not confirmed. Check Payment verifies with Razorpay.", canSync: method === "razorpay" };
}
