/** Match the Failed / Not Completed payment labels without treating unpaid COD as a failed checkout. */
export function adminPaymentIssueFilter() {
  return {
    $or: [
      { status: "failed" },
      { paymentStatus: "failed" },
      {
        paymentMethod: { $ne: "cod" },
        paymentStatus: { $nin: ["paid", "success", "captured", "refunded"] },
      },
    ],
  };
}
