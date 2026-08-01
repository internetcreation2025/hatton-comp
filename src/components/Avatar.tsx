/** The coloured initials circle used everywhere a person appears. */

const PALETTE: Record<string, string> = {
  sky: "#3b9ae1",
  emerald: "#22a06b",
  amber: "#d99420",
  rose: "#dc5b78",
  violet: "#7c62d6",
  teal: "#1f9c9c",
  orange: "#e0762e",
  cyan: "#2196b4",
  slate: "#6b7694",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name,
  colour = "slate",
  size = 36,
  dimmed = false,
}: {
  name: string;
  colour?: string;
  size?: number;
  dimmed?: boolean;
}) {
  const background = PALETTE[colour] ?? PALETTE.slate;

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background,
        fontSize: Math.round(size * 0.36),
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      {initials(name)}
    </span>
  );
}
