import SupportShell from "@/components/SupportShell";
import type { ReactNode } from "react";

type InfoCardProps = {
  title: string;
  children: ReactNode;
};
const InfoCard = ({ title, children }: InfoCardProps) => (

  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
    <h2 className="text-lg font-black text-slate-950">{title}</h2>
    <div className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{children}</div>
  </div>
);

export default function ShippingPage() {
  return (
    <SupportShell
      eyebrow="Delivery"
      title="Shipping & Delivery Policy"
      description="We deliver every Hivrasoft order with care, confidentiality and efficiency."
    >
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-8">
        <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          As a premium online destination for luxury lingerie in India, Hivrasoft
          recognises that customers expect high-quality products together with
          dependable and private delivery. This policy explains how shipments
          are handled from order placement to doorstep delivery.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Shipping Destinations">
          We ship across India and to select international locations.
        </InfoCard>

        <InfoCard title="Order Processing">
          Orders are typically dispatched within <strong className="text-slate-900">24–48 hours</strong>,
          excluding Sundays and public holidays.
        </InfoCard>

        <InfoCard title="Domestic Delivery — India">
          Delivery usually takes <strong className="text-slate-900">3–7 business days</strong>,
          depending on the location. Metro cities may receive orders faster.
        </InfoCard>

        <InfoCard title="International Delivery">
          International delivery usually takes <strong className="text-slate-900">7–15 business days</strong>,
          depending on customs clearance and destination.
        </InfoCard>

        <InfoCard title="Shipping Charges">
          Shipping charges are calculated at checkout based on order weight and destination.
        </InfoCard>

        <InfoCard title="Free Shipping">
          Enjoy free shipping on eligible orders above{" "}
          <strong className="text-rose-600">₹1,499</strong>.
        </InfoCard>

        <InfoCard title="Order Tracking">
          Once your order is shipped, you will receive a tracking ID via email
          or SMS. You can track the shipment on our website or the courier partner’s portal.
        </InfoCard>

        <InfoCard title="Undelivered Packages">
          If a shipment is returned because of an incorrect address or customer
          unavailability, a re-shipping fee may apply for the next delivery attempt.
        </InfoCard>
      </div>
    </SupportShell>
  );
}
