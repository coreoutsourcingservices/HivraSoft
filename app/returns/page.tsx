import SupportShell from "@/components/SupportShell";

const Section = ({ number, title, children }) => (
  <section className="border-b border-slate-100 py-7 first:pt-0 last:border-b-0 last:pb-0">
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-black text-rose-600">
        {number}
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <div className="mt-3 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
          {children}
        </div>
      </div>
    </div>
  </section>
);

export default function ReturnsPage() {
  return (
    <SupportShell
      eyebrow="Returns, Refunds & Cancellations"
      title="Return & Refund Policy"
      description="Our policy is designed around strict hygiene and quality standards for intimate apparel."
    >
      <Section number="1" title="No Return & No Exchange Policy">
        <p>
          Due to the intimate nature and hygiene standards of our products, all
          sales are final. Once a product has been delivered, we do not accept
          returns or exchanges for:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Bras & Panties",
            "Bodysuits & Teddies",
            "Shapewear & Lingerie Sets",
            "Any other intimate apparel",
          ].map((item) => (
            <li key={item} className="rounded-2xl bg-rose-50/70 px-4 py-3 font-semibold text-slate-700">
              ✓ {item}
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <strong>Why this policy?</strong> To ensure every customer receives
          100% fresh, unopened and hygienic merchandise. We never resell items
          that have been handled or delivered to another customer.
        </div>
      </Section>

      <Section number="2" title="Damaged, Defective, or Wrong Items">
        <p>
          If you receive an item that is physically damaged, defective or
          different from what you ordered, we will review the issue and make it right.
        </p>
        <p>
          <strong className="text-slate-900">Reporting Window:</strong> Report
          the issue within <strong className="text-slate-900">48 hours of delivery</strong>.
        </p>
        <p>
          Email <a className="font-bold text-rose-600" href="mailto:support@hivrasoft.com">support@hivrasoft.com</a> with:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Clear photos or video showing the defect.</li>
          <li>Photos of the outer packaging and shipping label.</li>
          <li>Your Order ID and quantity of affected items.</li>
        </ul>
        <p className="rounded-2xl bg-slate-50 p-4">
          Claims made after 48 hours of delivery will not be entertained as per
          our internal security and logistics protocols.
        </p>
      </Section>

      <Section number="3" title="Refund & Replacement Process">
        <p>Once our quality team verifies the claim, you may be offered:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-slate-900">Replacement:</strong> A fresh piece of the same product, subject to availability.</li>
          <li><strong className="text-slate-900">Refund:</strong> If the product is out of stock, we will initiate a refund.</li>
          <li><strong className="text-slate-900">Prepaid Orders:</strong> Refunds are credited to the original payment method within 5–7 business days.</li>
          <li><strong className="text-slate-900">COD Orders:</strong> Refunds are processed via bank transfer or store credit. Bank details may be requested securely.</li>
          <li><strong className="text-slate-900">Shipping Costs:</strong> Original shipping charges are non-refundable unless the error was from our end.</li>
        </ul>
      </Section>

      <Section number="4" title="Cancellation Policy">
        <ul className="list-disc space-y-2 pl-5">
          <li>Orders can only be cancelled before dispatch.</li>
          <li>To cancel, contact <a className="font-bold text-rose-600" href="mailto:support@hivrasoft.com">support@hivrasoft.com</a> immediately.</li>
          <li><strong className="text-slate-900">Before Dispatch:</strong> Cancel within 6 hours of order placement or before shipment, whichever is earlier, for a full refund.</li>
          <li><strong className="text-slate-900">After Dispatch:</strong> Once handed over to the courier partner, the order cannot be cancelled.</li>
        </ul>
      </Section>

      <Section number="5" title="Customer Agreement">
        <p>
          By placing an order on <strong className="text-slate-900">www.hivrasoft.com</strong>,
          you confirm that you have read, understood and agreed to this Return &
          Refund Policy.
        </p>
        <p>
          <strong className="text-slate-900">Email:</strong>{" "}
          <a className="font-bold text-rose-600" href="mailto:support@hivrasoft.com">support@hivrasoft.com</a>
          <br />
          <strong className="text-slate-900">Website:</strong>{" "}
          <a className="font-bold text-rose-600" href="https://hivrasoft.com">hivrasoft.com</a>
        </p>
      </Section>
    </SupportShell>
  );
}
