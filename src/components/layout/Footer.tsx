import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Today's Picks", href: "/dashboard" },
  { label: "Results",       href: "/results"   },
  { label: "Tracker",       href: "/tracker"   },
  { label: "Pricing",       href: "/pricing"   },
  { label: "Privacy",       href: "#"          },
  { label: "Terms",         href: "#"          },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#070a08]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16 py-12">

        {/* Top row: logo + links */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pb-10 border-b border-white/[0.05]">
          <Link href="/" className="flex items-center opacity-80 hover:opacity-100 transition-opacity duration-150 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nav.png" alt="Setpiece" style={{ height: "30px", width: "auto", filter: "brightness(1.8)" }} />
          </Link>

          <nav className="flex flex-wrap gap-x-7 gap-y-3">
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[13px] text-[#93a196] hover:text-[#f2f5f0] transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom: meta */}
        <div className="pt-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <p className="font-mono text-[11.5px] text-[#55c878]/70">
              Free Premier League picks August 21 to September 20. Setpiece Edge launches September 21.
            </p>
            <p className="text-[12px] text-[#76837a] leading-relaxed">
              Picks are for entertainment purposes only. Not financial or betting advice.
              18+ only.{" "}
              <a
                href="https://www.begambleaware.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#a7b3a9] transition-colors"
              >
                BeGambleAware.org
              </a>
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <a
              href="mailto:hello@setpiecepicks.com"
              className="font-mono text-[12px] text-[#93a196] hover:text-[#55c878] transition-colors duration-150"
            >
              hello@setpiecepicks.com
            </a>
            <p className="font-mono text-[11px] text-[#76837a]">
              © {new Date().getFullYear()} Setpiece · The AI Edge
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
