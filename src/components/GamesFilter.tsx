import Link from "next/link";

/**
 * All / Mine. A plain pair of links rather than a control with state — the
 * server does the filtering, so this survives a refresh and can be shared.
 */
export default function GamesFilter({
  active,
  mineCount,
}: {
  active: "all" | "mine";
  mineCount: number;
}) {
  const options = [
    { key: "all" as const, href: "/", label: "All games" },
    { key: "mine" as const, href: "/?show=mine", label: `Mine (${mineCount})` },
  ];

  return (
    <div className="mb-4 flex gap-2">
      {options.map((option) => {
        const on = active === option.key;
        return (
          <Link
            key={option.key}
            href={option.href}
            aria-current={on ? "page" : undefined}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-center text-[14px] font-semibold ${
              on
                ? "border-accent bg-accent text-accent-ink"
                : "border-line bg-surface text-muted"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
