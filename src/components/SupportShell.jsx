import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import Header from "@/src/components/Header/Header";

/**
 * Shared public support-page layout.
 *
 * Kept at components/SupportShell.tsx because existing routes import it as
 * `@/components/SupportShell` (the @ alias points at the project root).
 * The props are intentionally flexible to work with existing support pages.
 */
export type SupportShellProps = {
  title?: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  label?: ReactNode;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  actions?: ReactNode;
  sidebar?: ReactNode | boolean;
  aside?: ReactNode;
  className?: string;
  children?: ReactNode;
  [extraProp: string]: unknown;
};

const supportLinks = [
  { href: "/faq", text: "FAQs" },
  { href: "/shipping", text: "Shipping" },
  { href: "/returns", text: "Returns & Exchanges" },
  { href: "/terms", text: "Terms & Conditions" },
  { href: "/contact", text: "Contact Us" },
];

export function SupportShell({
  title,
  description,
  subtitle,
  eyebrow,
  label,
  icon,
  actions,
  sidebar,
  aside,
  className = "",
  children,
}: SupportShellProps) {
  const IconComponent =
    typeof icon === "function" ? icon : null;
  const visibleIcon: ReactNode =
    IconComponent ? <IconComponent className="h-5 w-5" /> : (icon as ReactNode);
  const showSidebar = sidebar !== false;
  const sideContent = aside ?? (typeof sidebar === "boolean" ? null : sidebar);

  return (
    <>
      <Header />
      <main className={`min-h-screen bg-[#F8F5F2] px-4 py-8 text-[#211A18] sm:px-6 md:py-14 ${className}`}>
        <div className="mx-auto w-full max-w-[1160px]">
          <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-[11px] text-[#211A18]/55">
            <Link href="/" className="hover:text-[#8C1839]">Home</Link>
            <span aria-hidden="true">/</span>
            <span>Customer Support</span>
          </nav>

          {(title || description || subtitle || eyebrow || label || icon || actions) && (
            <header className="mb-8 rounded-[24px] border border-[#211A18]/10 bg-white px-5 py-8 shadow-sm sm:px-8 md:py-10">
              {(eyebrow || label) && (
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#A51D45]">
                  {eyebrow || label}
                </p>
              )}
              <div className="flex flex-wrap items-start gap-4">
                {visibleIcon && (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F5] text-[#8C1839]">
                    {visibleIcon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {title && <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>}
                  {(description || subtitle) && (
                    <p className="mt-3 max-w-3xl text-[13px] leading-7 text-[#211A18]/65">{description || subtitle}</p>
                  )}
                </div>
                {actions}
              </div>
            </header>
          )}

          <div className={showSidebar ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_245px]" : ""}>
            <div className="min-w-0 rounded-[24px] border border-[#211A18]/10 bg-white p-5 shadow-sm sm:p-8">
              {children}
            </div>
            {showSidebar && (
              <aside className="min-w-0 self-start rounded-[24px] border border-[#211A18]/10 bg-white p-5 shadow-sm sm:p-6">
                {sideContent ?? (
                  <>
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#211A18]">Customer Support</h2>
                    <nav aria-label="Support pages" className="space-y-1">
                      {supportLinks.map(({ href, text }) => (
                        <Link key={href} href={href} className="block rounded-lg px-3 py-2.5 text-[12px] text-[#211A18]/75 transition-colors hover:bg-[#FFF1F5] hover:text-[#8C1839]">
                          {text}
                        </Link>
                      ))}
                    </nav>
                  </>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default SupportShell;
