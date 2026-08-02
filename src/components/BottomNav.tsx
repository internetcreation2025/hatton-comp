"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Games", match: (p: string) => p === "/" },
  { href: "/new", label: "New", match: (p: string) => p === "/new" },
  { href: "/past", label: "Calendar", match: (p: string) => p === "/past" },
  { href: "/players", label: "Players", match: (p: string) => p === "/players" },
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
  if (name === "Players")
    return (
      <svg {...common}>
        <circle cx="9" cy="8.5" r="3.2" />
        <path d="M2.5 19.5c0-3.3 2.9-5 6.5-5s6.5 1.7 6.5 5" />
        <path d="M16.5 6.2a3.2 3.2 0 0 1 0 6M18 14.9c2.1.5 3.5 1.9 3.5 4.6" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 z-20 border-t border-line bg-surface/95 px-1 pt-1.5 backdrop-blur">
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
                  className={`text-[10px] font-medium ${
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
