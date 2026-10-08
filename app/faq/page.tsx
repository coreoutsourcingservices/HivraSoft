import SupportShell from "@/components/SupportShell";

const faqs = [
  {
    q: "Can I return or exchange lingerie after delivery?",
    a: "No. Due to hygiene and intimate-apparel safety standards, delivered items are not eligible for return or exchange. Damaged, defective or wrong-item claims are handled separately.",
  },
  {
    q: "What should I do if I receive a damaged or wrong item?",
    a: "Email support@hivrasoft.com within 48 hours of delivery with your Order ID, clear photos/video of the issue, and photos of the outer packaging and shipping label.",
  },
  {
    q: "How long does delivery take within India?",
    a: "Domestic orders usually arrive within 3–7 business days after dispatch, depending on your location.",
  },
  {
    q: "When will my order be dispatched?",
    a: "Orders are typically dispatched within 24–48 hours, excluding Sundays and public holidays.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes. Free shipping is available on eligible orders above ₹1,499.",
  },
  {
    q: "How do I track my order?",
    a: "After dispatch, a tracking ID is sent by email or SMS. You can use that ID on our website or the courier partner’s tracking portal.",
  },
  {
    q: "Can I cancel an order?",
    a: "Cancellation is possible within 6 hours of order placement or before dispatch, whichever is earlier. Orders cannot be cancelled after they are handed to the courier.",
  },
  {
    q: "Do you store card or bank details?",
    a: "No. Payment data is handled through secure, PCI-compliant third-party payment gateways.",
  },
  {
    q: "How can I contact Hivrasoft support?",
    a: "Email support@hivrasoft.com and include your Order ID whenever your question relates to an existing order.",
  },
];

export default function FAQPage() {
  return (
    <SupportShell
      eyebrow="Quick Answers"
      title="Frequently Asked Questions"
      description="The most common questions about ordering, delivery, returns, payments and support."
    >
      <div className="space-y-3">
        {faqs.map((item, index) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-slate-200 bg-white open:border-rose-200 open:bg-rose-50/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 font-black text-slate-900">
              <span>
                <span className="mr-3 text-rose-500">{String(index + 1).padStart(2, "0")}</span>
                {item.q}
              </span>
              <span className="text-xl text-rose-500 transition group-open:rotate-45">+</span>
            </summary>
            <p className="px-5 pb-5 pl-12 text-sm leading-7 text-slate-600 sm:text-base">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </SupportShell>
  );
}
