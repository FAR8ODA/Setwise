import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Setwise — harmonic mixing intelligence",
  description:
    "A SQL-first engine for building harmonically compatible DJ sets. Recursive CTEs, window functions, and exclusion constraints doing real work.",
};

const NAV_LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/build", label: "Set builder" },
  { href: "/queries", label: "Query gallery" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* App Router serves fonts from the root layout head directly;
            eslint-plugin-next's no-page-custom-font rule is a Pages Router
            holdover and doesn't apply here. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-line">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2.5">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9.5"
                    stroke="var(--color-amber)"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"
                    stroke="var(--color-teal)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="2.5" fill="var(--color-amber)" />
                </svg>
                <span className="text-lg font-semibold tracking-tight">
                  Setwise
                </span>
              </Link>
              <nav className="flex items-center gap-6 text-sm text-paper-dim">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-paper"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line">
            <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-paper-dim">
              Setwise is a portfolio project by Farbod Alikhanzadeh, built to
              put real PostgreSQL to work. MIT licensed.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
