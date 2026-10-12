import SupportShell from "@/src/components/SupportShell";

export default function PrivacyPage() {
  return (
    <SupportShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="Hivrasoft.com · Effective Date: 13 February 2026"
    >
      <div className="space-y-8">
        <div className="rounded-3xl bg-slate-950 p-6 text-sm leading-7 text-slate-300 sm:p-8 sm:text-base">
          At Hivrasoft, available at <strong className="text-white">www.hivrasoft.com</strong>,
          we prioritise the privacy of our visitors. This Privacy Policy explains
          the types of information collected and recorded by Hivrasoft and how we use it.
        </div>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-500">
            Information We Collect
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-black text-slate-950">Personal Information</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Name, email address, phone number, and shipping or billing address.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-black text-slate-950">Payment Details</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                We do not store your card or bank details. Payments are processed
                through secure, PCI-compliant third-party gateways.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-black text-slate-950">Log Files</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                We may collect technical data such as IP address, browser type
                and timestamps to improve user experience.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-rose-100 bg-rose-50/60 p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-950">How We Use Your Information</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 sm:text-base">
            <li>To process and deliver your orders.</li>
            <li>To communicate order updates, newsletters or promotional offers.</li>
            <li>To help prevent fraudulent transactions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-950">Data Protection</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            We use SSL encryption to help ensure your data is transmitted
            securely. We do not sell or rent your personal information to third parties.
          </p>
        </section>
      </div>
    </SupportShell>
  );
}
