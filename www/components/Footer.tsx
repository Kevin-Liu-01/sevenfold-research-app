import Image from "next/image";
import Link from "next/link";
import Container from "./Container";

const footerGroups = [
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com" },
      { label: "Twitter", href: "https://twitter.com" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Discord", href: "https://discord.com" },
      { label: "Email Founder", href: "mailto:athan@sevenfold.so" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="py-14 text-sm text-zinc-500">
      <Container>
        <div className="flex flex-col gap-10 pt-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="lg:w-1/2">
            <Image
              src="/logo-sq.svg"
              alt="Sevenfold"
              width={48}
              height={48}
              className="mb-4"
            />
            <p className="pt-2 text-lg font-semibold text-[var(--fg)]">Sevenfold</p>
            <p className="mt-1 text-sm text-zinc-600">Pushing the scientific frontier.</p>
          </div>
          <div className="grid gap-6 text-right sm:grid-cols-3 lg:w-1/2">
            {footerGroups.map((group) => (
              <div key={group.title} className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--fg)]">
                  {group.title}
                </p>
                <div className="space-y-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="block text-sm text-zinc-600 transition hover:text-[var(--fg)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-200/70 pt-6 text-xs text-zinc-500">
          © {year} Sevenfold. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
