import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  legal: [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ],
  social: [
    {
      href: "https://www.linkedin.com/company/sevenfoldinc",
      label: "LinkedIn",
      external: true,
    },
    { href: "#", label: "Twitter" },
  ],
  support: [
    { href: "#", label: "Discord" },
    {
      href: "mailto:athan@sevenfold.so",
      label: "Email Founder",
      highlight: true,
    },
  ],
};

export const Footer = () => {
  return (
    <footer
      className="border-t border-gray-200 bg-background py-12"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="mx-auto px-12" style={{ maxWidth: 'var(--max-width-screen)' }}>
        <div className="mb-8 flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex-shrink-0">
            <Link href="/" aria-label="Homepage">
              <Image
                src="/branding/logo-sq.svg"
                alt="Sevenfold"
                width={60}
                height={60}
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 text-left sm:grid-cols-3 sm:gap-12 sm:text-right">
            <div>
              <h3 className="mb-4 font-dmsans text-sm font-semibold text-gray-900">
                Legal
              </h3>
              <ul className="space-y-3 text-sm" role="list">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-dmsans text-sm font-semibold text-gray-900">
                Social
              </h3>
              <ul className="space-y-3 text-sm" role="list">
                {FOOTER_LINKS.social.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-gray-600 transition-colors hover:text-gray-900"
                      {...(link.external && {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-dmsans text-sm font-semibold text-gray-900">
                Support
              </h3>
              <ul className="space-y-3 text-sm" role="list">
                {FOOTER_LINKS.support.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={
                        link.highlight
                          ? "font-semibold text-orange-600 transition-colors hover:text-orange-500"
                          : "text-gray-600 transition-colors hover:text-gray-900"
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">© 2025 Sevenfold Inc.</p>
        </div>
      </div>
    </footer>
  );
};
