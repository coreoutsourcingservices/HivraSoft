import SupportShell from "@/components/SupportShell";

const Section = ({ number, title, children }) => (
  <section className="border-b border-slate-100 py-7 first:pt-0 last:border-b-0 last:pb-0">
    <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-500">
      Section {number}
    </p>
    <h2 className="mt-2 text-xl font-black text-slate-950">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
      {children}
    </div>
  </section>
);

export default function TermsPage() {
  return (
    <SupportShell
      eyebrow="Legal"
      title="Terms & Conditions"
      description="Effective Date: 12 February 2026"
    >
      <div className="mb-8 rounded-3xl border border-rose-100 bg-rose-50/70 p-5 text-sm leading-7 text-slate-700 sm:p-6 sm:text-base">
        These Terms & Conditions govern your use of Hivrasoft.com, including our
        website, products and services. By browsing our platform, creating an
        account or completing a purchase, you acknowledge that you have read,
        understood and agreed to comply with these terms. If you do not accept
        them, please discontinue using the website.
      </div>

      <Section number="1" title="General Terms">
        <p>
          By accessing Hivrasoft.com, you agree to be bound by these terms. We
          reserve the right to refuse service to anyone for any reason at any time.
        </p>
      </Section>

      <Section number="2" title="Accuracy of Information">
        <p>
          While we strive for accuracy, information such as prices, descriptions
          or stock availability may occasionally contain errors. We reserve the
          right to correct errors and update information without prior notice.
        </p>
      </Section>

      <Section number="3" title="Pricing & Payments">
        <p>Prices are subject to change without notice.</p>
        <p>
          <strong className="text-slate-900">For Indian orders:</strong> prices
          are inclusive of GST, where applicable.
        </p>
        <p>
          <strong className="text-slate-900">For International orders:</strong>{" "}
          customs duties or local taxes are the responsibility of the customer.
        </p>
      </Section>

      <Section number="4" title="Prohibited Uses">
        <p>
          Users may not use the site for unlawful purposes, infringe our
          intellectual property rights, or upload malicious software, code or viruses.
        </p>
      </Section>

      <Section number="5" title="Limitation of Liability">
        <p>
          Hivrasoft shall not be liable for indirect, incidental or consequential
          damages resulting from the use of our products, to the extent permitted by law.
        </p>
      </Section>
    </SupportShell>
  );
}
