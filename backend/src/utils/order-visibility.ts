/**
 * Razorpay checkout creates an Order before the customer has paid.
 * Keep unpaid/failed online attempts out of placed orders and sales reporting.
 * COD remains placed even though its paymentStatus is pending collection.
 * A refunded online payment was originally successful, so its order stays visible.
 */
export const PLACED_ORDER_FILTER = {
  $or: [
    { paymentMethod: "cod" },
    { paymentStatus: { $in: ["paid", "refunded"] } },
  ],
};

/** Online payment attempts only; never mix COD into the payment queue. */
export function paymentAttemptFilter(state: "failed" | "processing") {
  return {
    paymentMethod: { $nin: ["cod", ""] },
    paymentStatus: state === "failed" ? "failed" : "pending",
    ...(state === "processing" ? { status: { $nin: ["cancelled", "canceled"] } } : {}),
  };
}
