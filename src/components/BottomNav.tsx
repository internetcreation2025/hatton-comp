"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Games", match: (p: string) => p === "/" },
  { href: "/new", label: "New", match: (p: string) => p === "/new" },
  { href: "/past", label: "Calendar", match: (p: string) => p === "/past" },
  { href: "/me", label: "Settings", match: (p: string) => p === "/me" },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: active ? "var(--accent)" : "var(--text-muted)",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "Games")
    return (
      <svg {...common}>
        <rect x="3" y="4.5" width="18" height="16" rx="3" />
        <path d="M3 9.5h18M8 3v3M16 3v3" />
      </svg>
    );
  if (name === "New")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8.5v7M8.5 12h7" />
      </svg>
    );
  if (name === "Calendar")
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <circle cx="8.5" cy="14" r="1" fill={common.stroke} stroke="none" />
        <circle cx="15.5" cy="14" r="1" fill={common.stroke} stroke="none" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 border-t border-line bg-surface/95 px-2 pt-1.5 backdrop-blur">
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 rounded-lg py-1.5"
              >
                <Icon name={tab.label} active={active} />
                <span
                  className={`text-[11px] font-medium ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
